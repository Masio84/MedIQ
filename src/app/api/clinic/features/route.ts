import { NextResponse } from 'next/server';
import { getClinicPlan } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clinic_id = searchParams.get('clinic_id');

  if (!clinic_id) {
    return NextResponse.json({ error: 'Falta clinic_id' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
     const plan = await getClinicPlan(clinic_id);

     // 2. Fetch all flags in system to compute upgrade_hints
     const { data: allFlags } = await supabase
       .from('feature_flags')
       .select('feature_key, plan_slug, enabled');

     const hints: Record<string, string> = {};
     
     if (allFlags) {
        // Orden de menor a mayor precio
        const planOrder = ['esencial', 'consultorio', 'enterprise'];

        allFlags.forEach(f => {
            if (!f.enabled) return;
            // Si ya hay un hint de menor escala asignado, lo preservamos
            const currentHint = hints[f.feature_key];
            const currentIndex = planOrder.indexOf(currentHint || '');
            const newIndex = planOrder.indexOf(f.plan_slug);

            if (newIndex !== -1 && (currentIndex === -1 || newIndex < currentIndex)) {
                hints[f.feature_key] = f.plan_slug;
            }
        });
     }

     const result: Record<string, any> = {};

     if (plan?.features) {
         Object.keys(plan.features).forEach(key => {
             const isEnabled = plan.features[key];
             result[key] = {
                 enabled: isEnabled,
                 upgrade_hint: isEnabled ? undefined : (hints[key] ? hints[key].charAt(0).toUpperCase() + hints[key].slice(1) : 'Enterprise')
             };
         });
     }

     return NextResponse.json(result);
  } catch (err: any) {
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
