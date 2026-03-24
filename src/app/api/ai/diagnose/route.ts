import { NextResponse } from 'next/server';
import { requireFeature } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Cargar perfil para obtener clinic_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', user.id)
      .single();

    const clinicId = profile?.clinic_id;
    if (!clinicId) return NextResponse.json({ error: 'Clínica no vinculada' }, { status: 400 });

    // Validar permiso del Feature Flag
    await requireFeature(clinicId, 'ai_diagnosis');

    const { symptoms, weight, blood_pressure, temperature, age, medical_history } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar ANTHROPIC_API_KEY en .env.local' }, { status: 500 });
    }

    if (!symptoms || symptoms.length === 0) {
      return NextResponse.json({ error: 'Se requieren síntomas para sugerir diagnóstico' }, { status: 400 });
    }

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      temperature: 0.1,
      system: `Eres un asistente de medicina clínica. Se te proporcionan datos y síntomas de un paciente.
Tu tarea es sugerir de 3 a 5 diagnósticos médicos con sus correspondientes códigos CIE-10 corregidos.
La respuesta DEBE ser únicamente un array JSON válido (sin bloque markdown \`\`\`, sin texto antes ni después) con esta estructura:
[
  {
    "codigo": "Código CIE-10",
    "descripcion": "Nombre oficial de la afección",
    "probabilidad": "alta" o "media" o "baja",
    "razon": "Explicación breve de por qué los síntomas coinciden"
  }
]`,
      messages: [
        {
          role: 'user',
          content: `
            Datos del Paciente:
            Edad: ${age || 'Desconocida'}
            Historial Médico: ${medical_history || 'Sin historial relevante'}
            
            Signos Vitales:
            Peso: ${weight ? weight + ' kg' : 'N/A'}
            Presión Arterial: ${blood_pressure || 'N/A'}
            Temperatura: ${temperature ? temperature + ' °C' : 'N/A'}
            
            Síntomas reportados:
            ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}

            Genera sugerencias diagnósticas con código CIE-10 formateadas EXACTAMENTE como el array JSON solicitado. No incluyas texto explicativo antes ni después.
          `
        }
      ]
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error en la API de Anthropic');
    }

    const textResponse = data.content?.[0]?.text || '[]';
    try {
      const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const suggestions = JSON.parse(cleanJson);
      return NextResponse.json({ suggestions });
    } catch (parseError) {
      return NextResponse.json({ error: 'Formato de respuesta incorrecto de la IA', raw: textResponse }, { status: 500 });
    }

  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
