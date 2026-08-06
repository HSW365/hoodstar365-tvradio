import { createClient } from '@supabase/supabase-js'

// Public, RLS-protected. Anon can read live videos and insert submissions only.
const SUPABASE_URL = 'https://gdniwfnumybttxkmujkw.supabase.co'
const SUPABASE_KEY = 'sb_publishable_E5GatIJVe9uFgTH3bkdjiA_LAxBGIXD'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
