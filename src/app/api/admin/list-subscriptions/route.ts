import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  const auth = await authorizeUser(['admin']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
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
