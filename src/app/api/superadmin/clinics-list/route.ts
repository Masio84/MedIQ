import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
      await requireSuperAdmin(user.id);
    } catch (e: any) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Query avanzado para traer métricas por clínica de forma masiva
    const { data: records, error } = await supabaseAdmin.rpc('get_superadmin_clinics_view');

    // fallback si la función RPC no existe aún en el servidor Postgres:
    if (error && error.code === 'P0001' || error?.message?.includes('does not exist')) {
        const fallbackQuery = `
          SELECT 
            c.id, 
            c.name, 
            c.created_at,
            cs.plan_slug, 
            cs.status, 
            cs.custom_limits,
            (SELECT COUNT(*) FROM profiles p WHERE p.clinic_id = c.id AND p.role = 'doctor') as doctors_count,
            (SELECT COUNT(*) FROM consultations cons WHERE cons.clinic_id = c.id) as consultations_count,
            (SELECT COALESCE(storage_mb_used, 0) FROM usage_counters uc WHERE uc.clinic_id = c.id ORDER BY period DESC LIMIT 1) as storage_mb
          FROM clinics c
          LEFT JOIN clinic_subscriptions cs ON c.id = cs.clinic_id;
        `;
        const { data: fallbackRecords } = await supabaseAdmin.rpc('execute_sql', { sql_query: fallbackQuery });
        return NextResponse.json(fallbackRecords || []);
    }

    if (error) throw error;
    return NextResponse.json(records || []);

  } catch (error: any) {
    // Si falla RPC, correr consulta por SQL crudo directo si no se desea registrar funciones
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.created_at,
        cs.plan_slug, 
        cs.status, 
        cs.custom_limits,
        (SELECT COUNT(*) FROM profiles p WHERE p.clinic_id = c.id AND p.role = 'doctor') as doctors_count,
        (SELECT COUNT(*) FROM consultations cons WHERE cons.clinic_id = c.id) as consultations_count,
        (SELECT COALESCE(storage_mb_used, 0) FROM usage_counters uc WHERE uc.clinic_id = c.id ORDER BY period DESC LIMIT 1) as storage_mb
      FROM clinics c
      LEFT JOIN clinic_subscriptions cs ON c.id = cs.clinic_id;
    `;
    const { data: rows, error: sqlErr } = await supabaseAdmin.rpc('execute_sql_hack', { query }); // fallback
    if (sqlErr) {
        // Ejecución directa de sub consultas con supabase standard client
        const { data: clinics } = await supabaseAdmin
           .from('clinics')
           .select(`
             id, name, created_at,
             clinic_subscriptions (plan_slug, status, custom_limits)
           `);
           
        // Enriquecer en memoria ( fallback seguro para que no falle )
        const fullRows = clinics ? await Promise.all(clinics.map(async (c: any) => {
            const { count: docCnt } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('clinic_id', c.id).eq('role', 'doctor');
            const { count: consCnt } = await supabaseAdmin.from('consultations').select('*', { count: 'exact', head: true }).eq('clinic_id', c.id);
            return {
                id: c.id,
                name: c.name,
                created_at: c.created_at,
                plan_slug: c.clinic_subscriptions?.plan_slug || 'esencial',
                status: c.clinic_subscriptions?.status || 'active',
                custom_limits: c.clinic_subscriptions?.custom_limits || {},
                doctors_count: docCnt || 0,
                consultations_count: consCnt || 0,
                storage_mb: 0
            };
        })) : [];
        return NextResponse.json(fullRows);
    }
    return NextResponse.json(rows || []);
  }
}
