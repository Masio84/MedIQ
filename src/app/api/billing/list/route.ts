import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data: billings, error } = await supabaseAdmin
      .from('billing')
      .select(`
        id,
        normal_fee,
        discount,
        extra_charge,
        paid,
        created_at,
        patient_id,
        patients ( name ),
        consultations ( patients ( name ) )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process names securely on the backend
    const formattedData = billings?.map((b: any) => {
      let patientName = 'N/A';
      
      const directName = b.patients ? (Array.isArray(b.patients) ? b.patients[0]?.name : b.patients?.name) : null;
      if (directName) {
        patientName = directName;
      } else {
        const nested = b.consultations ? (Array.isArray(b.consultations) ? b.consultations[0] : b.consultations) : null;
        const nestedPatient = nested?.patients;
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
        patientName
      };
    }) || [];

    return NextResponse.json({ success: true, data: formattedData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
