import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  const auth = await authorizeUser(['admin']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data: clinics, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ success: true, data: clinics });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al listar clínicas' }, { status: 500 });
  }
}
