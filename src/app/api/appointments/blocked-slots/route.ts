import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const auth = await authorizeUser(['doctor', 'assistant', 'admin']);
    if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    if (!date_from || !date_to) {
      return NextResponse.json({ success: false, error: 'Fechas requeridas' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role, clinic_id, doctor_id').eq('id', user!.id).single();

    let targetDoctor = user!.id;
    if (profile?.role === 'assistant' && profile?.doctor_id) targetDoctor = profile.doctor_id;

    const { data, error } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('doctor_id', targetDoctor)
      .gte('date', date_from).lte('date', date_to);

    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
