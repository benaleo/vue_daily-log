import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
    storage: isBrowser ? window.localStorage : undefined,
    flowType: 'pkce',
  },
});

// Create a single instance of the Supabase admin client

// Export the clients
export { supabase };

// This ensures we only have one instance of the clients
declare global {
  interface Window {
    __SUPABASE_CLIENT__: typeof supabase | undefined;
  }
}

// Store the clients on the window object in development
if (import.meta.env.DEV && isBrowser) {
  if (!window.__SUPABASE_CLIENT__) {
    window.__SUPABASE_CLIENT__ = supabase;
  }
}
