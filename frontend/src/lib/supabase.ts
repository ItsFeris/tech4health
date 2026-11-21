/** Supabase client for login + realtime. DHIA ONLY. Null in mock mode or when keys are missing. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'

export const supabase: SupabaseClient | null = !useMocks && url && anonKey ? createClient(url, anonKey) : null
