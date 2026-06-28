import { Link } from '@tanstack/react-router'
import { Atom, Users } from 'lucide-react'

// Sidebar admin minimale — sera détaillée en SESSION 9
export default function AdminSidebar() {
  return (
    <aside className="w-[200px] shrink-0 border-r border-black/[0.06] bg-[#FAFAFA] flex flex-col">
      <div className="px-4 py-5">
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-sm">Atome</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">Admin</p>
      </div>

      <nav className="flex-1 px-2 space-y-1 text-sm">
        <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white">
          <Users className="w-4 h-4" /> Clients
        </Link>
      </nav>
    </aside>
  )
}
