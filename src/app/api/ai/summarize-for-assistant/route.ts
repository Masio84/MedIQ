import { NextResponse } from 'next/server';
import { authorizeUser } from '@/lib/auth-helpers';
import { getDynamicPrompt } from '@/lib/ai-prompts';

const rateLimitMap = new Map<string, { count: number; reset: number }>();

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth as any;
  const key = user.id;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (entry && now < entry.reset) {
    if (entry.count >= 20) {
      return NextResponse.json(
        { error: 'Límite de resúmenes alcanzado. Intenta en una hora.' }, 
        { status: 429 }
      );
    }
    entry.count++;
  } else {
    rateLimitMap.set(key, { count: 1, reset: now + 3600000 });
  }

  try {
    const { diagnosis, symptoms, notes } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key no configurada' }, { status: 500 });
    }

    // Obtener prompt dinámico
    const systemPrompt = await getDynamicPrompt('assistant_summary', user.id, `Tu tarea es actuar como un gestor de citas administrativo. Sugiere una nota corta (máximo 4 palabras) para agendar la siguiente cita. 
Debe ser entendible por personal de recepción (asistencia), y NO debe revelar datos médicos sensibles que expongan la privacidad del paciente (ej: no uses nombres de enfermedades graves o detalles íntimos).

Ejemplos de salidas válidas:
- Cita de control
- Revisión de analgésicos
- Entrega de resultados
- Curación de heridas
- Seguimiento general

Devuelve ÚNICAMENTE las palabras de la nota sugerida, sin comillas, sin introducciones ni saludos.`);

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { 
          role: 'user', 
          content: `Considere el siguiente diagnóstico Médico y notas:
DIAGNÓSTICO: ${diagnosis || 'No especificado'}
SÍNTOMAS: ${symptoms || 'No especificado'}
NOTAS: ${notes || 'No especificado'}` 
        }
      ]
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const anthropicData = await res.json();
    if (res.status !== 200) throw new Error(anthropicData.error?.message || 'Error AI Anthropic');

    let summary = anthropicData.content?.[0]?.text?.trim() || 'Cita de control';
    summary = summary.replace(/^"|"$/g, ''); // Quitar comillas si las puso

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
