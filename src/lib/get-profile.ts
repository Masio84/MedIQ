import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  return supabase.from('profiles').select('*').eq('id', userId).single();
});
