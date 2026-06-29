import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Bell, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { requireAdmin } from '@/lib/auth'
import AdminSidebar from '@/components/layout/AdminSidebar'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => requireAdmin(),
  component: AdminLayout,
})

function AdminLayout() {
  const [initials, setInitials] = useState('–')
  const pathname = useRouterState({ select: s => s.location.pathname })
  const hideSecondBar = pathname.startsWith('/admin/settings')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? ''
      const name = data.user?.user_metadata?.full_name as string | undefined
      if (name) {
        const parts = name.trim().split(' ')
        setInitials((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? ''))
      } else {
        setInitials((email[0] ?? '').toUpperCase())
      }
    })
  }, [])

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-12 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 bg-white">
          <div id="layout-breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0" />
          <div className="flex items-center gap-1 shrink-0">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <Link to="/admin/settings" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="w-4 h-4" />
            </Link>
            <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-semibold ml-1 uppercase">
              {initials}
            </div>
          </div>
        </div>
        {/* Second bar */}
        {!hideSecondBar && (
          <div className="h-12 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 bg-white">
            <div id="layout-sb-left" className="flex items-center gap-2" />
            <div id="layout-sb-right" className="flex items-center gap-2" />
          </div>
        )}
        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
