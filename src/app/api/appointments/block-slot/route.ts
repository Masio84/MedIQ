import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const auth = await authorizeUser(['doctor']);
    if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { date, start_time, end_time, reason, is_full_day, recurring } = body;

    if (!date || !start_time || !end_time) {
      return NextResponse.json({ success: false, error: 'Fechas y horas obligatorias' }, { status: 400 });
    }

    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user!.id).single();

    const block = {
      doctor_id: user!.id,
      date, start_time, end_time, reason, is_full_day, recurring,
      clinic_id: profile?.clinic_id
    };

    const { data, error } = await supabase.from('blocked_slots').insert([block]).select().single();

    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
