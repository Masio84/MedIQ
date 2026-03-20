import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { symptoms, weight, blood_pressure, temperature, age, medical_history } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar ANTHROPIC_API_KEY en .env.local' }, { status: 500 });
    }

    if (!symptoms || symptoms.length === 0) {
      return NextResponse.json({ error: 'Se requieren síntomas para sugerir diagnóstico' }, { status: 400 });
    }

    const payload = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.3,
      system: "Eres un asistente médico experto. Se te proporcionarán los datos de un paciente (constantes vitales, edad, historial clínico) y sus síntomas actuales. Tu única tarea es sugerir un diagnóstico principal muy conciso y directo (o un par si hay mucha incertidumbre). No incluyas advertencias, notas preámbulo, ni explicaciones largas. Sólo da el diagnóstico o sugerencia diagnóstica clara de la manera más profesional posible, como un médico lo anotaría en un expediente.",
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

            Por favor, dime el diagnóstico más probable basado estrictamente en esta información.
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
    return NextResponse.json({ diagnosis: textResponse.trim() });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
