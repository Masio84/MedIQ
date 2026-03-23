import { NextResponse } from 'next/server';
import { requireSuperAdmin, invalidateClinicCache } from '@/lib/permissions';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
     // Verificar si es superadmin
     await requireSuperAdmin(user.id);

     const { clinic_id, plan_slug, status } = await request.json();

     if (!clinic_id) return NextResponse.json({ error: 'Falta clinic_id' }, { status: 400 });

     const updatePayload: Record<string, any> = {};
     if (plan_slug !== undefined) updatePayload.plan_slug = plan_slug;
     if (status !== undefined) updatePayload.status = status;

     const { error } = await supabaseAdmin
       .from('clinic_subscriptions')
       .update(updatePayload)
       .eq('clinic_id', clinic_id);

     if (error) throw error;

     // Invalida el caché en el servidor para quePermissions lea los nuevos datos
     invalidateClinicCache(clinic_id);

     return NextResponse.json({ success: true });
  } catch (err: any) {
     const status = err.status || 500;
     return NextResponse.json({ error: err.message || 'Error al actualizar suscripción' }, { status });
  }
}
