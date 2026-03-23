import { NextResponse } from 'next/server';
import { requireFeature } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', user.id)
      .single();

    const clinicId = profile?.clinic_id;
    if (!clinicId) return NextResponse.json({ success: false, error: 'Clínica no vinculada' }, { status: 400 });

    await requireFeature(clinicId, 'ai_followup');

    const { diagnosis, treatment, symptoms } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key no configurada' }, { status: 500 });
    }

    const prompt = `Considere el diagnóstico médico y tratamiento:
DIAGNÓSTICO: ${diagnosis || 'No especificado'}
TRATAMIENTO: ${treatment || 'No especificado'}
SÍNTOMAS: ${symptoms || 'No especificado'}

Tu tarea es sugerir una indicación de seguimiento O próxima cita para el médico. 
Debe ser muy directa y breve. Ej: "Cita en 7 días para revisión", "Cita en 1 mes con estudios de sangre", "Urgencia si presenta fiebre".

Devuelve ÚNICAMENTE la indicación sugerida, sin comillas, sin introducciones ni saludos.`;

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      temperature: 0.2,
      messages: [
        { role: 'user', content: prompt }
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

    let follow_up = anthropicData.content?.[0]?.text?.trim() || '';
    follow_up = follow_up.replace(/^"|"$/g, ''); 

    return NextResponse.json({ success: true, follow_up });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
