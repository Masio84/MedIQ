import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await request.json();
    const { user, profile } = auth as any;

    let doctorId = profile.role === 'doctor' ? user.id : null;
    if (profile.role === 'assistant') {
      doctorId = profile.doctor_id; // Assign linked doctor
    } else if (profile.role === 'admin') {
      doctorId = data.doctor_id; // Admin can specify
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'No se puede asociar un doctor a este paciente' }, { status: 400 });
    }

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert([{
        doctor_id: doctorId,
        name: data.name,
        birthdate: data.birthdate || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        allergies: data.allergies || null,
        medical_history: data.medical_history || null,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: patient });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear paciente' }, { status: 500 });
  }
}
