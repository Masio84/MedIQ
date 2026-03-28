import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await authorizeUser(['admin']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { name, email, password, role, clinic_id } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const { user, profile } = auth as any;
    let isSuperAdmin = false;
    try {
      const { requireSuperAdmin } = await import('@/lib/permissions');
      await requireSuperAdmin(user.id);
      isSuperAdmin = true;
    } catch (e) {}

    const targetClinicId = isSuperAdmin ? clinic_id : profile.clinic_id;

    if (!targetClinicId) {
      return NextResponse.json({ error: 'Falta clinic_id asociado' }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, clinic_id: targetClinicId },
    });

    if (authError) throw authError;

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear usuario' }, { status: 500 });
  }
}
