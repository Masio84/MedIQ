import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta campo obligatorio id' }, { status: 400 });
    }

    // Verificar si el usuario a borrar es de la misma clínica
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
      return NextResponse.json({ error: 'No autorizado para borrar usuarios de otra clínica' }, { status: 403 });
    }

    // 1. Delete user profile automatically referenced will also be deleted if CASCADE ON
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;

    // 2. Delete auth user via Service Role
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) throw authError;

    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al eliminar usuario' }, { status: 500 });
  }
}
