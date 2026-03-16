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
    const { user, profile } = auth as any;
    let query = supabaseAdmin
      .from('patients')
      .select('id, name, last_name')
      .or(`name.ilike.%${q}%,last_name.ilike.%${q}%`);
    
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
