import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

let client: ReturnType<typeof createSupabaseClient<Database>> | undefined

// Flow "implicit" plutôt que PKCE : les jetons arrivent dans le fragment d'URL
// (#access_token=...), jamais vus par les scanners de liens des messageries
// d'entreprise — qui sinon consomment le lien (magic link / reset password)
// avant l'ouverture réelle par l'utilisateur.
export function createClient() {
  if (client) return client
  client = createSupabaseClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'implicit',
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
      },
    },
  )
  return client
}
