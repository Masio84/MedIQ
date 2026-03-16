import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta campo id' }, { status: 400 });
    }

    const { user, profile } = auth as any;
    let query = supabaseAdmin.from('patients').update(updateData).eq('id', id);

    if (profile.role === 'doctor') {
      query = query.eq('doctor_id', user.id);
    } else if (profile.role === 'assistant') {
      if (!profile.doctor_id) {
        return NextResponse.json({ error: 'Asistente no vinculado a un doctor' }, { status: 400 });
      }
      query = query.eq('doctor_id', profile.doctor_id);
    }
    // Admins have wildcard (no doctor_id filter)

    const { data: updated, error } = await query.select();

    if (error) throw error;
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Paciente no encontrado o sin permisos para modificar' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Paciente actualizado correctamente', data: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar paciente' }, { status: 500 });
  }
}
