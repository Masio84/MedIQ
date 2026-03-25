import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';

// GET all clinics and their active subscriptions
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
      await requireSuperAdmin(user.id);
    } catch (e) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Fetch clinics
    const { data: clinics, error: clinicsError } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .order('created_at', { ascending: false });

    if (clinicsError) throw clinicsError;

    // Fetch subscriptions
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('clinic_subscriptions')
      .select('*');

    if (subsError) throw subsError;

    // Fetch user counts per clinic
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('clinic_id, id');

    if (profilesError) throw profilesError;

    const mergedData = clinics.map(clinic => {
      const sub = subscriptions.find(s => s.clinic_id === clinic.id);
      const userCount = profiles.filter(p => p.clinic_id === clinic.id).length;
      return {
        ...clinic,
        subscription: sub || null,
        userCount
      };
    });

    return NextResponse.json({ success: true, clinics: mergedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update clinic (edit info) or suspend subscription
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
      await requireSuperAdmin(user.id);
    } catch (e) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id, name, address, status, plan_slug } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de clínica requerido' }, { status: 400 });
    }

    // Update clinic base info if provided
    if (name !== undefined || address !== undefined) {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;

      const { error: clinicError } = await supabaseAdmin
        .from('clinics')
        .update(updates)
        .eq('id', id);

      if (clinicError) throw clinicError;
    }

    // Update subscription info if provided
    if (status !== undefined || plan_slug !== undefined) {
      const subUpdates: any = {};
      if (status !== undefined) subUpdates.status = status;
      if (plan_slug !== undefined) subUpdates.plan_slug = plan_slug;

      const { error: subError } = await supabaseAdmin
        .from('clinic_subscriptions')
        .update(subUpdates)
        .eq('clinic_id', id);

      if (subError) throw subError;
    }

    return NextResponse.json({ success: true, message: 'Clínica actualizada' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
