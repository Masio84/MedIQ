import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  const auth = await authorizeUser(['admin']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Parámetros start y end son requeridos' }, { status: 400 });
  }

  try {
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('*, patients(name), profiles:doctor_id(name)')
      .gte('date', start)
      .lte('date', end)
      .order('time', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: appointments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al listar citas' }, { status: 500 });
  }
}
