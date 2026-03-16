import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function authenticateAndAuthorize(
  req: NextRequest,
  allowedRoles: ('admin' | 'doctor' | 'assistant')[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }),
      user: null,
      role: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role)) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
      user,
      role: profile?.role || null,
      profile,
    };
  }

  return { error: null, user, role: profile.role, profile };
}
