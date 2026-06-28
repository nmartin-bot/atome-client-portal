import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { createClient } from '@/lib/supabase/client'
import ClientSidebar from '@/components/layout/ClientSidebar'

// Layout de l'espace client — wrappe toutes les routes /dashboard/*
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <ClientSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
