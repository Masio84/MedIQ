import { createClient } from '@/lib/supabase/server';

export const getProfile = async (userId: string) => {
  const supabase = await createClient();
  return supabase.from('profiles').select('*').eq('id', userId).single();
};
