import { NextResponse } from 'next/server';
import { requireFeature } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { getDynamicPrompt } from '@/lib/ai-prompts';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', user.id)
      .single();

    const clinicId = profile?.clinic_id;
    if (!clinicId) return NextResponse.json({ success: false, error: 'Clínica no vinculada' }, { status: 400 });

    await requireFeature(clinicId, 'ai_trends');

    const { date_from, date_to, doctor_id } = await request.json();
    if (!date_from || !date_to) {
        return NextResponse.json({ success: false, error: 'Faltan parámetros date_from o date_to' }, { status: 400 });
    }

    const startTs = `${date_from} 00:00:00`;
    const endTs = `${date_to} 23:59:59`;

    // ... (query logic remains same)
    let diagnosesQuery = supabase
      .from('consultations')
      .select('diagnosis, patient_id')
      .eq('clinic_id', clinicId)
      .gte('created_at', startTs)
      .lte('created_at', endTs);

    if (doctor_id) diagnosesQuery = diagnosesQuery.eq('doctor_id', doctor_id);

    let apptQuery = supabase
      .from('appointments')
      .select('status')
      .eq('clinic_id', clinicId)
      .gte('date', date_from)
      .lte('date', date_to);

    if (doctor_id) apptQuery = apptQuery.eq('doctor_id', doctor_id);

    const [diagnosesRes, apptRes] = await Promise.all([
        diagnosesQuery,
        apptQuery
    ]);

    const diagnosisCounts: Record<string, number> = {};
    const patientCounts: Record<string, number> = {};

    diagnosesRes.data?.forEach(c => {
        if (c.diagnosis) {
            diagnosisCounts[c.diagnosis] = (diagnosisCounts[c.diagnosis] || 0) + 1;
        }
        if (c.patient_id) {
            patientCounts[c.patient_id] = (patientCounts[c.patient_id] || 0) + 1;
        }
    });

    const top5Diagnoses = Object.entries(diagnosisCounts)
       .map(([diagnosis, freq]) => ({ diagnosis, freq }))
       .sort((a, b) => b.freq - a.freq)
       .slice(0, 5);

    const totalConsults = diagnosesRes.data?.length || 0;
    const days = Math.max(1, (new Date(date_to).getTime() - new Date(date_from).getTime()) / (1000 * 60 * 60 * 24) + 1);
    const avgConsultsPerDay = (totalConsults / days).toFixed(2);

    const completedAppts = apptRes.data?.filter(a => a.status === 'completed').length || 0;
    const totalAppts = apptRes.data?.length || 0;
    const complianceRate = totalAppts > 0 ? ((completedAppts / totalAppts) * 100).toFixed(1) : 'N/A';

    const chronicPatientsCount = Object.values(patientCounts).filter(c => c >= 3).length;

    const statsContext = `
    --- ESTADÍSTICAS OPERATIVAS ---
    Periodo: ${date_from} al ${date_to}
    Médico filtrado: ${doctor_id || 'Todos'}

    1. TOP 5 DIAGNÓSTICOS:
    ${JSON.stringify(top5Diagnoses, null, 2)}

    2. CONSULTAS:
    Total: ${totalConsults}
    Promedio por día: ${avgConsultsPerDay}

    3. PACIENTES CRÓNICOS (3+ visitas en periodo):
    Total listados: ${chronicPatientsCount}

    4. CITAS (AGENDA):
    Total agendadas en periodo: ${totalAppts}
    Completadas: ${completedAppts}
    Tasa de asistencia/cumplimiento: ${complianceRate}%
    `;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('API Key de Anthropic no configurada');

    // Obtener prompt dinámico
    const systemPrompt = await getDynamicPrompt('trend_analysis', user.id, `Eres un analista clínico de apoyo para consultorios médicos en México. Recibirás estadísticas operativas reales de una clínica. Genera un reporte ejecutivo en español con estas secciones exactas en formato JSON:
{
  "summary": "string (2-3 oraciones resumen ejecutivo)",
  "trends": [{ "diagnosis": "string", "frequency": 1, "note": "string" }],
  "alerts": [{ "message": "string", "severity": "high" | "medium" }],
  "recommendations": [{ "action": "string", "priority": "alta" | "media" | "baja" }]
}
Responde ÚNICAMENTE con el JSON, sin texto adicional, sin bloques de código markdown. No inventes datos que no estén en el contexto proporcionado.`);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1000,
            temperature: 0.3,
            system: systemPrompt,
            messages: [{ role: 'user', content: `Analiza los siguientes datos operativos: ${statsContext}` }]
        })
    });

    const anthropicData = await res.json();
    if (!res.ok) throw new Error(anthropicData.error?.message || 'Error AI Anthropic');

    const aiResponse = anthropicData.content?.[0]?.text?.trim() || '{}';

    try {
        const report = JSON.parse(aiResponse);
        return NextResponse.json({ success: true, report });
    } catch (e) {
        console.error('Error parseando JSON de AI:', aiResponse);
        return NextResponse.json({ success: false, error: 'La respuesta de la IA vino mal formada. Intente de nuevo.' }, { status: 500 });
    }

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
