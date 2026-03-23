import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // 1. Validar Sesión y Rol 'admin'
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role, clinic_id').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores de clínica pueden realizar esta acción.' }, { status: 403 });
  }

  try {
    const { name, email, role, clinic_id } = await request.json();

    if (!email || !role || !clinic_id) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (email, rol, clinic_id)' }, { status: 400 });
    }

    // El admin solo puede invitar a su PROPIA clínica
    if (clinic_id !== profile.clinic_id) {
      return NextResponse.json({ error: 'No tienes permisos para invitar a otra clínica' }, { status: 403 });
    }

    // 2. Enviar Invitación via Supabase Auth Admin
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
       redirectTo: `${new URL(request.url).origin}/login`, // o setup-password
       data: { 
          name, 
          role, 
          clinic_id 
       }
    });

    if (inviteError) throw inviteError;

    // 3. Crear el Perfil en Base de Datos (opcional si hay trigger, pero forzamos por seguridad)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
          id: inviteData.user.id,
          name,
          role,
          clinic_id,
          is_active: true
      }]);
      
    if (profileError && profileError.code !== '23505') { // Ignoramos si el trigger ya lo creó (duplicate)
        // Rollback opcional: podemos borrar el usuario si falla, por ahora solo reportamos
        console.error('Error insertando perfil de invitado:', profileError);
    }

    return NextResponse.json({ success: true, user: inviteData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al invitar usuario' }, { status: 500 });
  }
}
