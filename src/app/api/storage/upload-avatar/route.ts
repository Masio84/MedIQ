import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  // 1. Verify Authorization
  const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth as any;

  try {
    // 2. Ensure programmatic 'avatars' bucket stands
    const { error: bucketError } = await supabaseAdmin.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (bucketError && !bucketError.message.toLowerCase().includes('already exists')) {
      throw bucketError;
    }

    // 3. Parse input form data file bytes from standard reads
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado ningún archivo.' }, { status: 400 });
    }

    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const maxBytes = 2 * 1024 * 1024; // 2MB

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido.' }, { status: 400 });
    }

    if (typeof file.size === 'number' && file.size > maxBytes) {
      return NextResponse.json({ error: 'Archivo demasiado grande (máx 2MB).' }, { status: 400 });
    }

    const extByType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const fileExt = extByType[file.type] ?? 'bin';
    const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    // 4. Perform upload with Service Role to override client Policy blocks
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 5. Build and fetch Public url referencing the object paths
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, publicUrl: publicUrlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en el servidor al subir la foto.' }, { status: 500 });
  }
}
