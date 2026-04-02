import { NextResponse } from 'next/server';
import { requireFeature } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { getDynamicPrompt } from '@/lib/ai-prompts';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', user.id)
      .single();

    const clinicId = profile?.clinic_id;
    if (clinicId) {
      await requireFeature(clinicId, 'ai_diagnosis');
    }

    const { symptoms, diagnosis, weight, blood_pressure, temperature, age, medical_history } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar ANTHROPIC_API_KEY en .env.local' }, { status: 500 });
    }

    if (!diagnosis) {
      return NextResponse.json({ error: 'Se requiere un diagnóstico para sugerir tratamiento' }, { status: 400 });
    }

    // Obtener prompt dinámico para tratamiento
    const systemPrompt = await getDynamicPrompt('treatment_suggestion', user.id, "Eres un asistente médico experto. Debes proponer un tratamiento médico basado en el diagnóstico proporcionado, los síntomas y las constantes vitales del paciente. Actúas apoyando a un médico licenciado. Tu respuesta debe ser una lista de recomendaciones de medicamentos, especificando claramente el nombre del medicamento, la presentación, la dosis, la periodicidad (cada cuántas horas) y la duración del tratamiento. Formatea la respuesta de manera muy limpia, estructurada, usando viñetas o listas. NO agregues introducciones ni notas de advertencia moral, da la receta médica directa.");

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      temperature: 0.1,
      system: systemPrompt,
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
            
            Síntomas: ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms || 'N/A'}
            Diagnóstico principal: ${diagnosis}

            Dame el esquema de tratamiento recomendado (medicamentos, dosis, frecuencia, duración).
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

    const textResponse = data.content?.[0]?.text || '';
    return NextResponse.json({ treatment: textResponse.trim() });

  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
