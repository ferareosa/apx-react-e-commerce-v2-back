import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }

  if (!cachedClient) {
    console.log('[supabase] service role key prefix', env.supabaseServiceRoleKey.slice(0, 6));
    cachedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return cachedClient;
}
