import { createFileRoute, redirect } from '@tanstack/react-router'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/lib/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const supabase = createClient()

    // Le flow "implicit" place les jetons dans le fragment d'URL (#access_token=...)
    // — par exemple après confirmation d'inscription — et detectSessionInUrl les
    // traite de façon asynchrone. On attend qu'elle se résolve avant de conclure
    // qu'il n'y a pas de session, pour éviter un renvoi prématuré vers /login.
    let session = (await supabase.auth.getSession()).data.session
    const hasTokenInUrl = typeof window !== 'undefined' && window.location.hash.includes('access_token')

    if (!session && hasTokenInUrl) {
      session = await new Promise(resolve => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
          subscription.unsubscribe()
          resolve(s)
        })
        setTimeout(() => { subscription.unsubscribe(); resolve(null) }, 4000)
      })
    }

    if (!session) {
      throw redirect({ to: '/login' })
    }

    const admin = await isAdmin(session.user.id)
    throw redirect({ to: admin ? '/admin' : '/dashboard' })
  },
  component: () => null,
})
