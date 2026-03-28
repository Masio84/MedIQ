import { NextResponse } from 'next/server';
import { authorizeUser } from '@/lib/auth-helpers';

const rateLimitMap = new Map<string, { count: number; reset: number }>();

export async function POST(req: Request) {
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
    const { consultations, appointments } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar ANTHROPIC_API_KEY en .env.local' }, { status: 500 });
    }

    const payload = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      temperature: 0.3,
      system: "Eres un médico especialista. Se te proporcionará el expediente digital histórico de un paciente (consultas, diagnósticos, asistencias). Tu tarea es redactar un resumen clínico ejecutivo muy intuitivo, moderno y profesional. Destaca problemas crónicos, tendencias de signos vitales (si aplica), y conclusiones preventivas. No uses intros ni advertencias preámbulos. Redacta en formato Markdown directo.",
      messages: [
        {
          role: 'user',
          content: `
             Expediente Histórico del Paciente:
             
             Consultas Previas:
             ${JSON.stringify(consultations)}
             
             Citas en Agenda:
             ${JSON.stringify(appointments)}

             Genera el resumen clínico ejecutivo en Markdown.
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
    if (!response.ok) throw new Error(data.error?.message || 'Error Anthropic API');
    
    return NextResponse.json({ summary: data.content?.[0]?.text || '' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
