import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const testConnection = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    return NextResponse.json({
      success: true,
      debug: {
        url_exists: !!url,
        key_exists: !!key,
        key_length: key ? key.length : 0,
        key_snippet: key ? `${key.substring(0, 5)}...${key.substring(key.length - 5)}` : 'none',
      },
      connection_test: {
        error: testConnection.error ? testConnection.error.message : null,
        has_data: !!testConnection.data,
        data_count: testConnection.data ? testConnection.data.length : 0
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
