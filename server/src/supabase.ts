
import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

// Service-role client: bypasses Row Level Security, so it must only ever run on the server.
// null when Supabase is not configured (the API then runs on local sample data).
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
