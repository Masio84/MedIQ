import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin, checkUsage, getClinicPlan } from '@/lib/permissions';
import { syncStaticCounts } from '@/lib/usage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinic_id');

  if (!clinicId) return NextResponse.json({ error: 'Falta clinic_id' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
     const { data: profile } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', user.id)
       .single();

     const isSuperAdmin = profile?.is_superadmin === true;
     const belongsToClinic = profile?.clinic_id === clinicId;

     if (!isSuperAdmin && !belongsToClinic) {
         return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
     }

     // 1. Sincronizar counts estáticos antes de leer
     await syncStaticCounts(clinicId);

     // 2. Calcular porcentajes y límites agregados
     const resources = ['max_doctors', 'max_assistants', 'max_patients', 'max_consultations_mo', 'storage_mb'];
     const percentages: Record<string, any> = {};
     const usage: Record<string, any> = {};

     for (const key of resources) {
         const check = await checkUsage(clinicId, key);
         percentages[key] = check.percentage;
         usage[key] = check.current;
     }

     const plan = await getClinicPlan(clinicId);

     return NextResponse.json({
         usage,
         limits: plan.limits,
         percentages
     });
  } catch (err: any) {
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
