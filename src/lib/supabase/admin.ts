import { createClient } from '@supabase/supabase-js'

// Note: This client uses the service role key and should ONLY be used in server-side environments
// (e.g., API routes, Server Actions, or Server Components) where admin privileges are required.
// NEVER expose this client to the browser.
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_build',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)
