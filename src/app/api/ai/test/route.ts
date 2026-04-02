import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Solo superadmins pueden usar este probador de fuerza bruta
    try {
      await requireSuperAdmin(user.id);
    } catch (e) {
      return NextResponse.json({ error: 'Solo SuperAdmin puede probar prompts dinámicos' }, { status: 403 });
    }

    const { prompt_text, input_data } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta configurar ANTHROPIC_API_KEY' }, { status: 500 });
    }

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      temperature: 0.1,
      system: prompt_text,
      messages: [
        {
          role: 'user',
          content: input_data || 'Prueba de prompt con datos vacíos.'
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

    return NextResponse.json({ 
      result: data.content?.[0]?.text || '',
      usage: data.usage
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
