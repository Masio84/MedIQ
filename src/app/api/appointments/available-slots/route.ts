import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctor_id = searchParams.get('doctor_id');
    const date = searchParams.get('date');

    if (!doctor_id || !date) {
      return NextResponse.json({ success: false, error: 'Se requiere doctor_id y date' }, { status: 400 });
    }

    const { data: schedule } = await supabaseAdmin.from('doctor_schedule').select('*').eq('doctor_id', doctor_id).single();
    if (!schedule) return NextResponse.json({ success: false, error: 'Horario no configurado' }, { status: 404 });

    const jsDate = new Date(date + 'T00:00:00');
    const dow = jsDate.getDay(); // 0 Dom, 1 Lun...
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const prefix = dayMap[dow];

    const active = schedule[`${prefix}_active`];
    if (!active) return NextResponse.json({ success: true, data: [] });

    const start_timeStr: string = schedule[`${prefix}_start`];
    const end_timeStr: string = schedule[`${prefix}_end`];
    if (!start_timeStr || !end_timeStr) return NextResponse.json({ success: true, data: [] });

    const intervalMinutes = schedule.slot_interval_minutes || 30;

    const parseMinutes = (timeString: string) => {
        const [h, m] = timeString.split(':').map(Number);
        return h * 60 + m;
    };

    const startMins = parseMinutes(start_timeStr);
    const endMins = parseMinutes(end_timeStr);

    const formatMins = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = Math.floor(mins % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const possibleSlots: {time: string, available: boolean}[] = [];
    for (let current = startMins; current < endMins; current += intervalMinutes) {
        possibleSlots.push({ time: formatMins(current), available: true });
    }

    // subtract appointments
    const { data: appts } = await supabaseAdmin.from('appointments')
        .select('start_time, end_time')
        .eq('doctor_id', doctor_id)
        .eq('date', date)
        .neq('status', 'cancelled');
    
    // subtract blocks
    const { data: blocks } = await supabaseAdmin.from('blocked_slots')
        .select('start_time, end_time')
        .eq('doctor_id', doctor_id)
        .eq('date', date);

    possibleSlots.forEach(slot => {
        const slotEnd = parseMinutes(slot.time) + intervalMinutes;
        const slotStart = parseMinutes(slot.time);
        
        const isBlockedByAppt = appts?.some(a => {
            const aStart = parseMinutes(a.start_time);
            const aEnd = parseMinutes(a.end_time);
            return (slotStart < aEnd && slotEnd > aStart);
        });

        const isBlockedBySlot = blocks?.some(b => {
             const bStart = parseMinutes(b.start_time);
             const bEnd = parseMinutes(b.end_time);
             return (slotStart < bEnd && slotEnd > bStart);
        });

        if (isBlockedByAppt || isBlockedBySlot) slot.available = false;
    });

    return NextResponse.json({ success: true, data: possibleSlots });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
