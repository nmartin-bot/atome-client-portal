import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types'

export function useAuth() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Client | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setIsAdmin(false); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const [{ data: client }, { data: admin }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', userId).maybeSingle(),
      supabase.from('admins').select('id').eq('id', userId).maybeSingle(),
    ])
    setProfile(client)
    setIsAdmin(admin !== null)
    setLoading(false)
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return { user, profile, isAdmin, loading, signOut }
}
