import { NextResponse } from 'next/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(req: Request) {
  const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { query, gender, age } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar ANTHROPIC_API_KEY' }, { status: 500 });
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ codes: [] });
    }

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      temperature: 0,
      system: `Eres un buscador de códigos CIE-10 (ICD-10) clínico.
Se te proporciona una consulta (nombre o código parcial), el género y edad del paciente.
Tu tarea es devolver hasta 10 códigos CIE-10 que coincidan con la búsqueda pero que sean CLÍNICAMENTE VÁLIDOS para ese perfil.

REGLAS:
- Si el paciente es hombre, excluye códigos de obstetricia, ginecología y mamas (si aplica solo a mujeres).
- Si el paciente es mujer, excluye códigos de próstata y testículos.
- Si el paciente es menor de 18 años, prioriza o limita a códigos de pediatría y neonatología si la patología lo sugiere.
- Si el paciente es mayor de 60 años, incluye códigos pertinentes a su edad.

Responde ÚNICAMENTE con un array JSON de objetos: [{ "code": "CÓDIGO", "description": "DESCRIPCIÓN EN ESPAÑOL" }]`,
      messages: [
        {
          role: 'user',
          content: `Búsqueda: "${query}"
Perfil: Género ${gender || 'Desconocido'}, Edad ${age || 'Desconocida'}`
        }
      ]
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    try {
      const content = result.content[0].text;
      const codes = JSON.parse(content.replace(/```json|```/g, '').trim());
      return NextResponse.json({ codes });
    } catch (parseError) {
      console.error('Error parsing AI search response:', parseError);
      return NextResponse.json({ error: 'Error al procesar búsqueda AI' }, { status: 500 });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
