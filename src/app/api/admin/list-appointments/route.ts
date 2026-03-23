import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    await requireSuperAdmin(user.id);
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
  const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Parámetros start y end son requeridos' }, { status: 400 });
    }

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
