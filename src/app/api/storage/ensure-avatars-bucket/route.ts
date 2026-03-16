import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authorizeUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  // Verify Authenticated User (requires any role)
  const auth = await authorizeUser(['admin', 'doctor', 'assistant']);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // 1. Attempt to create the 'avatars' bucket using service role client
    const { error: createError } = await supabaseAdmin.storage.createBucket('avatars', {
      public: true, // Allow public fetching node lookups
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 2 * 1024 * 1024 // 2 MB file limit size
    });

    // 2. Ignore error if bucket already exists
    if (createError && !createError.message.toLowerCase().includes('already exists')) {
      throw createError;
    }

    return NextResponse.json({ success: true, message: 'Bucket asegurado exitosamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
