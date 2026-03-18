import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin', 'doctor']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id, ...rawUpdateData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta campo id' }, { status: 400 });
    }

    const allowedFields = new Set([
      'symptoms',
      'diagnosis',
      'treatment',
      'weight',
      'temperature',
      'blood_pressure',
      'notes',
    ]);

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawUpdateData ?? {})) {
      if (allowedFields.has(key)) updateData[key] = value;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos permitidos para actualizar' }, { status: 400 });
    }

    const { user, profile } = auth as any;
    let query = supabaseAdmin.from('consultations').update(updateData).eq('id', id);

    if (profile.role === 'doctor') {
      query = query.eq('doctor_id', user.id);
    } // Admins can update any Consultation

    const { data: updated, error } = await query.select();

    if (error) throw error;
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Consulta no encontrada o sin permisos para modificar' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Consulta actualizada correctamente', data: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar consulta' }, { status: 500 });
  }
}
