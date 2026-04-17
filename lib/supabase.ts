import { createClient } from '@supabase/supabase-js';

// The '!' tells TypeScript these variables will definitely exist 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This creates the single connection instance used by your whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);