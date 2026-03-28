import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function DELETE(request: Request) {
  try {
    const auth = await authorizeUser(['doctor']);
    if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });

    const { error } = await supabase.from('blocked_slots').delete().eq('id', id).eq('doctor_id', user!.id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
