import { redirect } from '@tanstack/react-router'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types'

// Déconnecte l'utilisateur courant
export async function signOut() {
  const supabase = createClient()
  return supabase.auth.signOut()
}

// Retourne la session courante (ou null)
export async function getSession() {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Vérifie si l'utilisateur est admin (table admins)
export async function isAdmin(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('admins')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  return data !== null
}

// Retourne le profil client (table clients)
export async function getClientProfile(userId: string): Promise<Client | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return data
}

// Guard de route : redirige vers /login si pas de session
export async function requireAuth() {
  const session = await getSession()
  if (!session) throw redirect({ to: '/login' })
  return session
}

// Guard de route : redirige vers /dashboard si pas admin
export async function requireAdmin() {
  const session = await requireAuth()
  const admin = await isAdmin(session.user.id)
  if (!admin) throw redirect({ to: '/dashboard' })
  return session
}
