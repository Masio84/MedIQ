import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ success: false, error: 'Ids Invalidos' }, { status: 400 });
    }

    const { data: patients, error } = await supabaseAdmin
      .from('patients')
      .select('id, name')
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ success: true, data: patients });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
