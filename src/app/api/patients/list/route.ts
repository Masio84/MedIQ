import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  const auth = await authorizeUser(['admin', 'doctor', 'assistant', 'superadmin']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { user, profile } = auth as any;
    const columns =
      profile.role === 'assistant'
        ? 'id,name,last_name,birthdate,phone,email,address,created_at,doctor_id,clinic_id'
        : '*';

    let query = supabaseAdmin.from('patients').select(columns).order('name');

    if (profile.role === 'doctor') {
      query = query.eq('doctor_id', user.id);
    } else if (profile.role === 'assistant' && profile.doctor_id) {
      query = query.eq('doctor_id', profile.doctor_id);
    } else if (profile.clinic_id) {
      query = query.eq('clinic_id', profile.clinic_id);
    }

    const { data: patients, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: patients });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al listar pacientes' }, { status: 500 });
  }
}
