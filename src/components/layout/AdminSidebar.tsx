import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import {
  Users, Settings, LogOut,
  User, MoreHorizontal, Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

type NavItem =
  | { type: 'section'; label: string }
  | { type: 'link'; to: string; icon: React.ElementType; label: string }

const NAV: NavItem[] = [
  { type: 'section', label: 'Modules' },
  { type: 'link', to: '/admin', icon: Users, label: 'Clients' },
  { type: 'section', label: 'Système' },
  { type: 'link', to: '/admin/settings', icon: Settings, label: 'Paramètres' },
]

interface SearchResult {
  id: string
  label: string
  sub?: string
}

function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(0)
  const modalInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true) }
      if (e.key === 'Escape') close()
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)) }
      if (e.key === 'Enter' && results[focused]) go(results[focused])
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, results, focused])

  useEffect(() => {
    if (open) { setTimeout(() => modalInputRef.current?.focus(), 10) }
    else { setQuery(''); setResults([]) }
  }, [open])

  useEffect(() => {
    setFocused(0)
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const q = query.trim()
      const { data: clients } = await supabase
        .from('clients')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(8)
      setResults(
        (clients ?? []).map(c => ({ id: c.id, label: c.full_name || c.email, sub: c.email }))
      )
      setLoading(false)
    }, 180)
    return () => clearTimeout(timer)
  }, [query])

  function close() { setOpen(false) }

  function go(r: SearchResult) {
    navigate({ to: '/admin/clients/$id', params: { id: r.id } })
    close()
  }

  return (
    <>
      {/* Trigger dans la sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="mx-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors w-[calc(100%-24px)] text-left"
      >
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="flex-1 text-sm text-gray-400">Rechercher...</span>
        <kbd className="text-[10px] text-gray-300 font-mono shrink-0 border border-gray-200 rounded px-1">⌘K</kbd>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={close}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div
            className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-[0_8px_48px_rgba(0,0,0,0.16)] border border-gray-100 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={modalInputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un client..."
                className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              {loading && <span className="text-xs text-gray-300">…</span>}
              <button onClick={close} className="text-xs text-gray-300 border border-gray-200 rounded px-1.5 py-0.5 font-mono hover:bg-gray-50">Esc</button>
            </div>

            {/* Résultats */}
            <div className="max-h-[420px] overflow-y-auto">
              {query && !loading && results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-gray-400">Aucun résultat pour <span className="font-medium text-gray-600">« {query} »</span></p>
                </div>
              )}
              {!query && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-400">Tapez pour rechercher un client</p>
                </div>
              )}
              {results.length > 0 && (
                <div className="py-1.5">
                  {results.map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => go(r)}
                      onMouseEnter={() => setFocused(i)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        focused === i ? 'bg-gray-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                        {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                      </div>
                      <span className="text-xs text-gray-300 shrink-0">Client</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-3">
              <span className="text-[10px] text-gray-300 flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1 font-mono">↑↓</kbd> naviguer</span>
              <span className="text-[10px] text-gray-300 flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1 font-mono">↵</kbd> ouvrir</span>
              <span className="text-[10px] text-gray-300 flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1 font-mono">Esc</kbd> fermer</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminSidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    navigate({ to: '/login' })
  }

  function isActive(to: string) {
    if (to === '/admin') return pathname === '/admin'
    return pathname === to || pathname.startsWith(to + '/')
  }

  const displayName = user?.email?.split('@')[0] || 'Admin'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="w-60 flex flex-col h-full bg-white border-r border-gray-100 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-gray-100 shrink-0">
        <img src="/logo-atome.svg" alt="Atome" className="w-4 h-4" />
        <span className="font-semibold text-sm text-gray-900">Atome</span>
      </div>

      {/* Recherche globale */}
      <div className="h-12 shrink-0 border-b border-gray-100 flex items-center">
        <GlobalSearch />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV.map((item, i) => {
          if (item.type === 'section') {
            return (
              <p key={i} className="px-2 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 first:pt-2">
                {item.label}
              </p>
            )
          }

          const active = isActive(item.to)
          return (
            <Link key={item.to} to={item.to}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="relative px-2 py-3 border-t border-gray-100" ref={menuRef}>
        {showUserMenu && (
          <div className="absolute bottom-full left-2 right-2 mb-1 bg-white rounded-xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden z-50">
            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="font-medium text-xs text-gray-900">{displayName}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{user?.email}</p>
            </div>
            <div className="py-1">
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Profil
              </button>
              <Link to="/admin/settings"
                className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50"
                onClick={() => setShowUserMenu(false)}>
                <Settings className="w-4 h-4 text-gray-400" />
                Paramètres
              </Link>
            </div>
            <div className="border-t border-gray-100 py-1">
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-red-500 hover:bg-red-50">
                <LogOut className="w-3.5 h-3.5" />
                Se déconnecter
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => setShowUserMenu(v => !v)}>
          <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-900 truncate leading-tight">{displayName}</p>
            <p className="text-[11px] text-gray-400 leading-tight">Admin Atome</p>
          </div>
          <MoreHorizontal className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </div>
      </div>
    </aside>
  )
}
