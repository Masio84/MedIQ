import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const auth = await authorizeUser(['doctor', 'assistant']);
    if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role, doctor_id').eq('id', user!.id).single();

    const targetDoctor = profile?.role === 'assistant' ? profile.doctor_id : user!.id;

    if (!targetDoctor) return NextResponse.json({ success: false, error: 'No se encontró doctor asociado' }, { status: 404 });

    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients(name, phone, email)')
      .eq('doctor_id', targetDoctor)
      .eq('status', 'waiting_list')
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
