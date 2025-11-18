// This is a singleton module that will only be instantiated once
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Use a module pattern to ensure single instance
const createSupabaseClient = (() => {
  let client: SupabaseClient | null = null;
  let adminClient: SupabaseClient | null = null;
  
  const isBrowser = typeof window !== 'undefined';
  
  return {
    getClient() {
      if (!client) {
        client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storageKey: 'sb-auth-token',
            storage: isBrowser ? window.localStorage : undefined,
            flowType: 'pkce',
          },
        });
      }
      return client;
    },
    
   
  };
})();

// Export the clients
export const supabase = createSupabaseClient.getClient();

// Export a function to get a fresh client if needed (use with caution)
export const getNewClient = () => createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
  },
});
