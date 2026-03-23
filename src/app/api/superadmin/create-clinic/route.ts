import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';

export async function POST(req: Request) {
  try {
    const { clinic_name, city, plan_slug, admin_name, email } = await req.json();

    // 1. Validar sesión y SuperAdmin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
      await requireSuperAdmin(user.id);
    } catch (e: any) {
      return NextResponse.json({ error: 'Acceso denegado: Se requieren permisos de SuperAdmin' }, { status: 403 });
    }

    if (!clinic_name || !email || !admin_name || !plan_slug) {
      return NextResponse.json({ error: 'Faltan campos obligatorios para dar de alta la clínica' }, { status: 400 });
    }

    // 2. Crear clínica
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .insert([{ 
        name: clinic_name, 
        address: city || 'Ciudad no especificada' 
      }])
      .select()
      .single();

    if (clinicError) throw new Error('Error al crear clínica: ' + clinicError.message);

    // 3. Invitar Admin por email
    const { data: invite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        name: admin_name,
        clinic_id: clinic.id,
      }
    });

    if (inviteError) {
      // Rollback manual si falla la invitación (para evitar clínicas huérfanas)
      await supabaseAdmin.from('clinics').delete().eq('id', clinic.id);
      throw new Error('Error al invitar usuario: ' + inviteError.message);
    }

    // 4. Crear Perfil en profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: invite.user.id,
        clinic_id: clinic.id,
        role: 'admin',
        name: admin_name
      }]);

    if (profileError) throw new Error('Error al crear perfil administrativo: ' + profileError.message);

    // 5. Crear Suscripción en clinic_subscriptions
    const { error: subError } = await supabaseAdmin
      .from('clinic_subscriptions')
      .insert([{
        clinic_id: clinic.id,
        plan_slug: plan_slug,
        status: 'active'
      }]);

    if (subError) throw new Error('Error al inicializar suscripción: ' + subError.message);

    return NextResponse.json({ success: true, clinic_id: clinic.id });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
