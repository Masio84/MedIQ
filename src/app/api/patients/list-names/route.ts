import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ success: false, error: 'Ids Invalidos' }, { status: 400 });
    }

    const { user, profile } = auth as any;
    const supabase = await createClient();

    let query = supabase
      .from('patients')
      .select('id, name')
      .in('id', ids)
      .eq('clinic_id', profile.clinic_id);

    if (profile.role === 'doctor') {
      query = query.eq('doctor_id', user.id);
    } else if (profile.role === 'assistant') {
      query = query.eq('doctor_id', profile.doctor_id);
    }

    const { data: patients, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: patients });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
