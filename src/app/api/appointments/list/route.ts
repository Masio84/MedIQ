import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
    if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const status = searchParams.get('status');
    const view = searchParams.get('view');

    if (!date_from || !date_to) {
      return NextResponse.json({ success: false, error: 'Fechas requeridas' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Asistente checks appointments for the clinic/doctor they are linked to. Doctor checks own.
    // Auth guard already validates basic access, but we filter dynamically here.
    const { data: profile } = await supabase.from('profiles').select('role, clinic_id, doctor_id').eq('id', user!.id).single();
    
    let query = supabase
      .from('appointments')
      .select('*, patients(name, phone, email)');

    if (profile?.role === 'assistant' && profile.doctor_id) {
       query = query.eq('doctor_id', profile.doctor_id);
    } else if (profile?.role === 'doctor') {
       query = query.eq('doctor_id', user!.id);
    } else if (profile?.role === 'admin' && profile.clinic_id) {
       query = query.eq('clinic_id', profile.clinic_id);
    }

    query = query.gte('date', date_from).lte('date', date_to);

    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
