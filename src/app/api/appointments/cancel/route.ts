import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function DELETE(request: Request) {
  try {
    const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
    if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const supabase = await createClient();
    const body = await request.json();
    const { id, reason } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere ID' }, { status: 400 });
    }

    const updateData: any = { status: 'cancelled' };
    if (reason) updateData.notes = `MOTIVO CANCELACIÓN: ${reason}`; 

    const { error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
