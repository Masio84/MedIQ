import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Basic memory rate limiting
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = 20;
const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anon';
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, timestamp: now };
    
    if (now - record.timestamp > RATE_LIMIT_WINDOW) {
      record.count = 1;
      record.timestamp = now;
    } else {
      record.count++;
      if (record.count > MAX_REQUESTS) {
        return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
      }
    }
    rateLimitMap.set(ip, record);

    const body = await request.json();
    const { doctor_id, date, start_time, patient_name, patient_phone, patient_email, reason } = body;

    if (!doctor_id || !date || !start_time || !patient_name || !patient_phone || !reason) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Get default duration from schedule
    const { data: schedule } = await supabaseAdmin.from('doctor_schedule').select('default_duration_minutes').eq('doctor_id', doctor_id).single();
    const duration = schedule?.default_duration_minutes || 30;

    const [hours, minutes] = start_time.split(':').map(Number);
    const endDate = new Date(0, 0, 0, hours, minutes + Number(duration));
    const end_time = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

    // Overlap validation
    // 1. Existing Appointments
    const { data: existingAppts } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctor_id)
      .eq('date', date)
      .neq('status', 'cancelled')
      .lt('start_time', end_time)
      .gt('end_time', start_time);

    if (existingAppts && existingAppts.length > 0) {
      return NextResponse.json({ success: false, error: 'Lo sentimos, este horario acaba de ser ocupado' }, { status: 409 });
    }

    // 2. Blocked Slots
    const { data: blockedSlots } = await supabaseAdmin
      .from('blocked_slots')
      .select('id')
      .eq('doctor_id', doctor_id)
      .eq('date', date)
      .lt('start_time', end_time)
      .gt('end_time', start_time);

    if (blockedSlots && blockedSlots.length > 0) {
        return NextResponse.json({ success: false, error: 'Horario bloqueado' }, { status: 409 });
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('clinic_id').eq('doctor_id', doctor_id).limit(1).single();

    const appointment = {
      doctor_id, patient_name, patient_phone, patient_email,
      date, start_time, end_time, duration_minutes: duration, reason,
      appointment_type: 'consultation', status: 'scheduled', booked_by: 'patient',
      clinic_id: profile?.clinic_id
    };

    const { data, error } = await supabaseAdmin.from('appointments').insert([appointment]).select('id, public_token').single();

    if (error) throw error;

    return NextResponse.json({ success: true, appointment_id: data.id, confirmation_token: data.public_token });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
