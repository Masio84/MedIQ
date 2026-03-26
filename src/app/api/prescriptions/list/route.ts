import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, clinic_id, doctor_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    // Seguridad estricta
    if (profile.role !== 'doctor') {
      return NextResponse.json({ error: 'Solo los doctores pueden ver su archivo de recetas' }, { status: 403 });
    }

    let query = supabase
      .from('prescriptions')
      .select(`
        id,
        folio,
        template_snapshot,
        content_snapshot,
        created_at,
        patients!prescriptions_patient_id_fkey(
          id,
          name,
          last_name
        )
      `)
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
