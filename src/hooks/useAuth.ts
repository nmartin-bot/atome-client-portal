import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types'

export function useAuth() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [clientProfile, setClientProfile] = useState<Client | null>(null)
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
        else { setClientProfile(null); setIsAdmin(false); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const [{ data: client }, { data: admin }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', userId).maybeSingle(),
      supabase.from('admins').select('id').eq('id', userId).maybeSingle(),
    ])
    setClientProfile(client)
    setIsAdmin(admin !== null)
    setLoading(false)
  }

  async function signInWithMagicLink(email: string) {
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return { user, clientProfile, isAdmin, loading, signInWithMagicLink, signOut }
}
