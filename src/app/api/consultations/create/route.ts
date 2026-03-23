import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  // Only doctors and admins can create consultations
  const auth = await authorizeUser(['admin', 'doctor']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { patient_id, doctor_id, ...consultationData } = await request.json();

    if (!patient_id) {
      return NextResponse.json({ error: 'Falta campo patient_id' }, { status: 400 });
    }

    const { user, profile } = auth as any;
    
    // Enforce doctor_id from authentication context to prevent spoofing
    const finalDoctorId = profile.role === 'doctor' ? user.id : doctor_id;

    if (!finalDoctorId) {
      return NextResponse.json({ error: 'Falta campo doctor_id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('consultations')
      .insert([{
        patient_id,
        doctor_id: finalDoctorId,
        ...consultationData
      }])
      .select();

    if (error) throw error;

    // Incrementar consumo de consultas (Silencioso)
    try {
        const { incrementUsage } = await import('@/lib/usage');
        const clinicId = (auth as any).profile?.clinic_id;
        if (clinicId) {
            await incrementUsage(clinicId, 'consultations_count');
        }
    } catch (e) {
        console.error('Error en incrementUsage:', e);
    }

    return NextResponse.json({ success: true, message: 'Consulta creada correctamente', data: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear consulta' }, { status: 500 });
  }
}
