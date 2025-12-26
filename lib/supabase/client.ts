import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  
  // Check if credentials are properly configured
  if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    console.warn('⚠️ Supabase is not configured. Please add your credentials to .env.local');
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      // Disable automatic refresh attempts in the browser to avoid
      // noisy "Invalid Refresh Token" errors when no refresh token exists.
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'civic-op-auth',
    },
  });
}
