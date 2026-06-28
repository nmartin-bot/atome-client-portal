import { createFileRoute, redirect } from '@tanstack/react-router'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/lib/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) throw redirect({ to: '/login' })

    const admin = await isAdmin(session.user.id)
    throw redirect({ to: admin ? '/admin' : '/dashboard' })
  },
  component: () => null,
})
