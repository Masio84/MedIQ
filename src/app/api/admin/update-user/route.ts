import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id, name, role } = await request.json();

    if (!id || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Verificar si el usuario a actualizar es de la misma clínica
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('clinic_id')
      .eq('id', id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { user, profile } = auth as any;
    let isSuperAdmin = false;
    try {
      const { requireSuperAdmin } = await import('@/lib/permissions');
      await requireSuperAdmin(user.id);
      isSuperAdmin = true;
    } catch (e) {}

    if (!isSuperAdmin && targetProfile.clinic_id !== profile.clinic_id) {
      return NextResponse.json({ error: 'No autorizado para actualizar usuarios de otra clínica' }, { status: 403 });
    }

    // 1. Update Auth user metadata via Service Role
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { name, role },
    });

    if (authError) throw authError;

    // 2. Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ name, role })
      .eq('id', id);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}
