import { createClient } from '@supabase/supabase-js';

// Supabase project credentials
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://myntjfzjfyzyqnlmwsrd.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_zadsiLQH25QzuMShWBvyww_Kcy3eIhF';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('your-anon-key') &&
    !supabaseAnonKey.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
