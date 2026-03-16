import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await request.json();

    if (!id) {
       return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        last_payment_date: new Date().toISOString(),
        pending_payment: 0
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Pago validado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al validar pago' }, { status: 500 });
  }
}
