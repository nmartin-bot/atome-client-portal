import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/lib/auth'
import AdminSidebar from '@/components/layout/AdminSidebar'

// Layout admin — wrappe toutes les routes /admin/*, accès restreint
export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })

    const admin = await isAdmin(session.user.id)
    if (!admin) throw redirect({ to: '/dashboard' })
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
