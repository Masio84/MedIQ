import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin', 'doctor']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta campo id' }, { status: 400 });
    }

    const { user, profile } = auth as any;
    let query = supabaseAdmin.from('consultations').delete().eq('id', id);

    if (profile.role === 'doctor') {
      query = query.eq('doctor_id', user.id);
    } // Admins can delete any Consultation

    const { data: deleted, error } = await query.select();

    if (error) throw error;
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Consulta no encontrada o sin permisos para eliminar' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Consulta eliminada correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al eliminar consulta' }, { status: 500 });
  }
}
