// lib/supabase/client.ts
// Browser client — stores session in cookies so the middleware can read it
import { createBrowserClient } from "@supabase/ssr"

export function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}
