import { createClient } from '@supabase/supabase-js'

// ─── Collez ici vos informations Supabase ─────────────────────────────────────
const SUPABASE_URL      = 'https://ceasscncqkjelbbttydr.supabase.co'  // ← remplacez
const SUPABASE_ANON_KEY = 'sb_publishable_Grt4XkLk5hUoaGBV3Bhsgg_JnZve-BK'                    // ← remplacez
// ─────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)