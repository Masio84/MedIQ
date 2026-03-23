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
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*, clinics(name)')
      .order('started_at');

    const mapped = subscriptions?.map((s: any) => ({
       ...s,
       clinic_name: s.clinics?.name || 'Clínica'
    })) || [];

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al listar suscripciones' }, { status: 500 });
  }
}
