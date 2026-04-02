import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
      await requireSuperAdmin(user.id);
    } catch (e) {
      return NextResponse.json({ error: 'Prohibido: Solo SuperAdmin' }, { status: 403 });
    }

    const adminClient = createServiceClient();

    // Consultar metadatos vía RPC
    const { data, error } = await adminClient.rpc('get_rls_metadata');

    if (error) {
      throw error;
    }

    return NextResponse.json(data || { tables: [], policies: [] });

  } catch (error: any) {
    console.error('RLS Metadata Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
