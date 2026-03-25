import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { user, profile } = auth as any;
    const supabase = await createClient();

    const { data: billings, error } = await supabase
      .from('billing')
      .select(`
        id,
        normal_fee,
        discount,
        extra_charge,
        paid,
        created_at,
        patient_id,
        patients!billing_patient_id_fkey(name),
        consultations ( id, doctor_id, patients!consultations_patient_id_fkey(name) )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = billings?.map((b: any) => {
      const consultation = b.consultations ? (Array.isArray(b.consultations) ? b.consultations[0] : b.consultations) : null;
      const consultationDoctorId = consultation?.doctor_id;

      // Filtrar facturas de otros doctores para Asistentes y Doctores
      if (profile.role === 'assistant' && profile.doctor_id && consultationDoctorId !== profile.doctor_id) {
         return null;
      }
      if (profile.role === 'doctor' && consultationDoctorId !== user.id) {
         return null;
      }

      let patientName = 'N/A';
      const directName = b.patients ? (Array.isArray(b.patients) ? b.patients[0]?.name : b.patients?.name) : null;
      if (directName) {
        patientName = directName;
      } else {
        const nestedPatient = consultation?.patients;
        const nestedName = nestedPatient ? (Array.isArray(nestedPatient) ? nestedPatient[0]?.name : nestedPatient?.name) : null;
        if (nestedName) patientName = nestedName;
      }

      return {
        id: b.id,
        normal_fee: b.normal_fee,
        discount: b.discount,
        extra_charge: b.extra_charge,
        paid: b.paid,
        created_at: b.created_at,
        patient_id: b.patient_id,
        patientName,
        consultation // para uso posterior si se requiriera
      };
    }).filter(Boolean) || [];

    return NextResponse.json({ success: true, data: formattedData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
