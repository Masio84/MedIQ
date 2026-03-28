import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';
import { requireFeature } from '@/lib/permissions';

export async function POST(request: Request) {
  try {
    const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
    if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role, clinic_id, doctor_id').eq('id', user!.id).single();

    if (profile?.clinic_id) {
        await requireFeature(profile.clinic_id, 'ai_followup');
    }

    const body = await request.json();
    const {
      patient_id, patient_name, patient_phone, patient_email,
      date, start_time, duration_minutes = 30, reason, notes,
      appointment_type = 'consultation', status = 'scheduled',
      weight, blood_pressure, temperature
    } = body;

    const sanitizeNumeric = (value: any) => {
      if (value === '' || value === undefined || value === null) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    let targetDoctorId = body.doctor_id || user!.id;
    if (profile?.role === 'assistant' && profile?.doctor_id) targetDoctorId = profile.doctor_id;

    if (!date || !start_time || (!patient_id && !patient_name)) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Determine end_time
    const [hours, minutes] = start_time.split(':').map(Number);
    const endDate = new Date(0, 0, 0, hours, minutes + Number(duration_minutes));
    const end_time = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

    // Overlap validation
    // 1. Existing Appointments
    const { data: existingAppts } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', targetDoctorId)
      .eq('date', date)
      .neq('status', 'cancelled')
      .lt('start_time', end_time)
      .gt('end_time', start_time);

    if (existingAppts && existingAppts.length > 0) {
      return NextResponse.json({ success: false, error: 'Ya existe una cita en este horario' }, { status: 409 });
    }

    // 2. Blocked Slots
    const { data: blockedSlots } = await supabase
      .from('blocked_slots')
      .select('id, is_full_day')
      .eq('doctor_id', targetDoctorId)
      .eq('date', date)
      .lt('start_time', end_time)
      .gt('end_time', start_time);

    if (blockedSlots && blockedSlots.length > 0) {
        return NextResponse.json({ success: false, error: 'El horario está bloqueado' }, { status: 409 });
    }

    // Insert
    const booked_by = profile?.role === 'admin' ? 'assistant' : (profile?.role || 'doctor');

    const appointment = {
      doctor_id: targetDoctorId,
      patient_id, patient_name, patient_phone, patient_email,
      date, start_time, end_time, duration_minutes, reason, notes,
      appointment_type, status, booked_by,
      clinic_id: profile?.clinic_id,
      weight: sanitizeNumeric(weight),
      temperature: sanitizeNumeric(temperature),
      blood_pressure: blood_pressure?.trim() || null
    };

    const { data, error } = await supabase.from('appointments').insert([appointment]).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
