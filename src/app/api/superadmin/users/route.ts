import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';

// GET all users
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

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        is_superadmin,
        clinics(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, users: profiles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST invite new user
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
      await requireSuperAdmin(user.id);
    } catch (e) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { name, email, role, clinic_id, create_new_space, plan_slug, new_clinic_name } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (nombre, email)' }, { status: 400 });
    }

    let finalClinicId = clinic_id;

    if (create_new_space) {
      if (!plan_slug || !new_clinic_name) {
        return NextResponse.json({ error: 'Faltan el slug del plan o el nombre para el nuevo espacio' }, { status: 400 });
      }

      // 1. Crear nueva clínica
      const { data: clinic, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .insert([{ 
          name: new_clinic_name, 
          address: 'Espacio Privado Vía Invitación' 
        }])
        .select()
        .single();

      if (clinicError) throw new Error('Error al autogenerar la clínica: ' + clinicError.message);
      finalClinicId = clinic.id;

      // 2. Asignarle la suscripción
      const { error: subError } = await supabaseAdmin
        .from('clinic_subscriptions')
        .insert([{
          clinic_id: finalClinicId,
          plan_slug: plan_slug,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }]);

      if (subError) {
        // Rollback
        await supabaseAdmin.from('clinics').delete().eq('id', finalClinicId);
        throw new Error('Error al inicializar suscripción automática: ' + subError.message);
      }
    } else {
      // Flujo preexistente, requiere clinic_id y role explícitos
      if (!role || !clinic_id) {
        return NextResponse.json({ error: 'Faltan rol o ID de clínica (flujo unirse)' }, { status: 400 });
      }
    }

    // 3. Invitar Admin por email (Para el nuevo espacio usará el role enviado desde UI, tipicamente admin)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${new URL(req.url).origin}/auth/set-password`,
      data: { name, role, clinic_id: finalClinicId }
    });

    if (inviteError) {
      if (create_new_space && finalClinicId) {
        await supabaseAdmin.from('clinics').delete().eq('id', finalClinicId);
      }
      throw new Error('Error enviando invitación: ' + inviteError.message);
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: inviteData.user.id,
        name,
        role: role,
        clinic_id: finalClinicId,
        is_active: true
      }]);

    if (profileError && profileError.code !== '23505') {
      console.error('Error insertando perfil de invitado:', profileError);
    }

    return NextResponse.json({ success: true, user: inviteData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH update user (edit info or soft delete)
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

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Never update password or sensitive auth data here, only profile data
    const allowedUpdates = ['name', 'role', 'clinic_id', 'is_active'];
    const safeUpdates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, user: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
