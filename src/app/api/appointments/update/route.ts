import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUser } from '@/lib/auth-helpers';

export async function PATCH(request: Request) {
  try {
    const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
    if ('error' in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const supabase = await createClient();
    const body = await request.json();
    const { id, date, start_time, duration_minutes, status, reason, notes, appointment_type } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere ID de cita' }, { status: 400 });
    }

    // If date or time changes, re-validate
    if (date || start_time || duration_minutes) {
        const { data: currentAppt } = await supabase.from('appointments').select('doctor_id, date, start_time, end_time, duration_minutes').eq('id', id).single();
        if (!currentAppt) return NextResponse.json({ success: false, error: 'Cita no encontrada' }, { status: 404 });
        
        const newDate = date || currentAppt.date;
        const newStart = start_time || currentAppt.start_time;
        const newDur = duration_minutes || currentAppt.duration_minutes;
        
        const [hours, minutes] = newStart.split(':').map(Number);
        const endDate = new Date(0, 0, 0, hours, minutes + Number(newDur));
        const newEnd = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

        // Check appointments
        const { data: existingAppts } = await supabase
            .from('appointments')
            .select('id')
            .eq('doctor_id', currentAppt.doctor_id)
            .eq('date', newDate)
            .neq('id', id)
            .neq('status', 'cancelled')
            .lt('start_time', newEnd)
            .gt('end_time', newStart);

        if (existingAppts && existingAppts.length > 0) return NextResponse.json({ success: false, error: 'Conflicto de horario con otra cita' }, { status: 409 });

        // Check blocked slots
        const { data: blockedSlots } = await supabase
            .from('blocked_slots')
            .select('id')
            .eq('doctor_id', currentAppt.doctor_id)
            .eq('date', newDate)
            .lt('start_time', newEnd)
            .gt('end_time', newStart);

        if (blockedSlots && blockedSlots.length > 0) return NextResponse.json({ success: false, error: 'Horario bloqueado' }, { status: 409 });
        
        body.end_time = newEnd;
    }

    const { error } = await supabase
      .from('appointments')
      .update(body)
      .eq('id', id)
      .eq('clinic_id', (auth as any).profile?.clinic_id); // Filtro clinic_id explícito

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
