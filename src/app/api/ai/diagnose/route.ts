import { NextResponse } from 'next/server';
import { requireFeature } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { getDynamicPrompt } from '@/lib/ai-prompts';

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
    if (clinicId) {
      // Validar permiso del Feature Flag
      await requireFeature(clinicId, 'ai_diagnosis');
    }

    const { symptoms, weight, blood_pressure, temperature, age, gender, medical_history } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar ANTHROPIC_API_KEY en .env.local' }, { status: 500 });
    }

    if (!symptoms || symptoms.length === 0) {
      return NextResponse.json({ error: 'Se requieren síntomas para sugerir diagnóstico' }, { status: 400 });
    }

    const fallbackSystemPrompt = `Eres un asistente de medicina clínica experto. Se te proporcionan datos y síntomas de un paciente.
Tu tarea es sugerir de 3 a 5 diagnósticos médicos con sus correspondientes códigos CIE-10 corregidos.

DEBES APLICAR LAS SIGUIENTES REGLAS CLÍNICAS:
1. VALIDACIÓN DE GÉNERO: Solo sugiere códigos CIE-10 que apliquen al género del paciente (${gender || 'Desconocido'}). Por ejemplo, no sugieras patología prostática en mujeres ni patología obstétrica/ginecológica en hombres.
2. VALIDACIÓN DE EDAD: 
   - Si es menor de 18 años, prioriza diagnósticos y códigos de PEDIATRÍA.
   - Si es mayor de 60 años, prioriza diagnósticos y códigos de GERIATRÍA y enfermedades crónico-degenerativas.
3. PRECISIÓN CIE-10: Asegúrate de que los códigos sean válidos y precisos según el catálogo internacional.

La respuesta DEBE ser únicamente un array JSON válido (sin bloque markdown \`\`\`, sin texto antes ni después) con esta estructura:
[
  {
    "codigo": "Código CIE-10",
    "descripcion": "Nombre oficial de la afección",
    "probabilidad": "alta" o "media" o "baja",
    "razon": "Explicación breve de por qué los síntomas coinciden considerando el perfil demográfico"
  }
]`;

    const systemPrompt = await getDynamicPrompt('diagnose', user.id, fallbackSystemPrompt);

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `
            Perfil del Paciente:
            Edad: ${age || 'Desconocida'}
            Género: ${gender || 'Desconocido'}
            Historial Médico: ${medical_history || 'Sin historial relevante'}
            
            Signos Vitales:
            Peso: ${weight ? weight + ' kg' : 'N/A'}
            Presión Arterial: ${blood_pressure || 'N/A'}
            Temperatura: ${temperature ? temperature + ' °C' : 'N/A'}
            
            Síntomas reportados:
            ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}

            Genera sugerencias diagnósticas con código CIE-10 que cumplan estrictamente con las validaciones de género y edad solicitadas.
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
