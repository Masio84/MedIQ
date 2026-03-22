import { createClient } from './supabase/server';
import { NextResponse } from 'next/server';

export async function authorizeUser(allowedRoles: string[]) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'No autenticado', status: 401 };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, doctor_id, clinic_id')
    .eq('id', user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: 'Acceso prohibido para este rol', status: 403 };
  }

  return { user, profile };
}
