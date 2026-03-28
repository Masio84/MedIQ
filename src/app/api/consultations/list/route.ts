import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const auth = await authorizeUser(['admin', 'doctor', 'assistant', 'superadmin']);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, profile } = auth as any;
    let query = supabaseAdmin
      .from('consultations')
      .select(`
        *,
        patients!consultations_patient_id_fkey(name, phone)
      `)
      .order('created_at', { ascending: false });

    if (profile.role === 'doctor') {
      query = query.eq('doctor_id', user.id);
    } else if (profile.role === 'assistant') {
      if (!profile.doctor_id) {
        return NextResponse.json({ error: 'Asistente no vinculado a un doctor' }, { status: 400 });
      }
      query = query.eq('doctor_id', profile.doctor_id);
    } // Admins get all

    const { data: consultations, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: consultations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al listar consultas' }, { status: 500 });
  }
}
