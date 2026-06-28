import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/lib/auth'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = Route.useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient()
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (!code) {
        setError('Lien de connexion invalide ou expiré.')
        return
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error || !data.session) {
        setError('Ce lien a expiré. Demandez un nouveau lien de connexion.')
        return
      }

      const admin = await isAdmin(data.session.user.id)
      navigate({ to: admin ? '/admin' : '/dashboard' })
    }

    handleCallback()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center space-y-3">
          <p className="text-red-600 font-medium">{error}</p>
          <a href="/login" className="text-sm text-blue-600 hover:underline">
            Retour à la connexion
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Connexion en cours...</p>
    </div>
  )
}
