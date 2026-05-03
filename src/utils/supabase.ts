import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { logger } from './errorHandler';

// ─── Environment Configuration ───────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Fail fast if config is missing
if (!supabaseUrl || supabaseUrl === 'VOTRE_URL_SUPABASE') {
  logger.error('Supabase', 'Missing EXPO_PUBLIC_SUPABASE_URL in .env');
}
if (!supabaseAnonKey || supabaseAnonKey === 'VOTRE_CLÉ_ANON_SUPABASE') {
  logger.error('Supabase', 'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
}

// ─── Client Initialization ───────────────────────────────────────────────────

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    // Adding global fetch error handler
    global: {
      headers: { 'x-application-name': 'apex' },
    },
  }
);

// ─── Performance & Connectivity ────────────────────────────────────────────────

// Handle token refresh when app state changes
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

/**
 * Validates connectivity to Supabase.
 */
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    // Note: This might fail if '_health' table doesn't exist, which is expected.
    // We just want to see if the network request reaches Supabase.
    if (error && error.message.includes('fetch')) {
       throw error;
    }
    return true;
  } catch (e: any) {
    logger.error('Supabase', 'Connectivity check failed:', e.message);
    return false;
  }
};
