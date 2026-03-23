import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id, ...rawUpdateData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta campo id' }, { status: 400 });
    }

    const allowedFields = new Set([
      'name',
      'last_name',
      'birthdate',
      'phone',
      'email',
      'address',
      'allergies',
      'medical_history',
    ]);

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawUpdateData ?? {})) {
      if (allowedFields.has(key)) updateData[key] = value;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos permitidos para actualizar' }, { status: 400 });
    }

    const { user, profile } = auth as any;
    const supabase = await createClient();

    let query = supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .eq('clinic_id', profile.clinic_id);

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
