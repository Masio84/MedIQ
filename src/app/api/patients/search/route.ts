import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) return NextResponse.json({ success: true, data: [] });

  try {
    const cleaned = q
      .trim()
      .slice(0, 64)
      // allow letters/numbers/spaces/common name punctuation; block commas/parentheses to reduce PostgREST filter injection
      .replace(/[^\p{L}\p{N}\s'’-]/gu, '');

    if (!cleaned) return NextResponse.json({ success: true, data: [] });

    const { user, profile } = auth as any;
    let query = supabaseAdmin
      .from('patients')
      .select('id, name, last_name')
      .or(`name.ilike.%${cleaned}%,last_name.ilike.%${cleaned}%`);
    
    if (profile.role === 'doctor') {
      query = query.eq('doctor_id', user.id);
    } else if (profile.role === 'assistant') {
      if (!profile.doctor_id) return NextResponse.json({ error: 'Asistente no vinculado a un doctor' }, { status: 400 });
      query = query.eq('doctor_id', profile.doctor_id);
    }

    const { data: results, error } = await query.limit(10);
    if (error) throw error;

    return NextResponse.json({ success: true, data: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al buscar' }, { status: 500 });
  }
}
