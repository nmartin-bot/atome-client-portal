import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Atom } from 'lucide-react'
import { sendMagicLink } from '@/lib/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await sendMagicLink(email)
    if (error) setError('Une erreur est survenue. Vérifiez votre email.')
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2">
          <Atom className="w-10 h-10 text-blue-600" />
          <h1 className="text-lg font-semibold">Atome · Espace client</h1>
        </div>

        {sent ? (
          <div className="text-center space-y-2 py-8">
            <p className="font-medium">Vérifiez votre boîte email</p>
            <p className="text-sm text-gray-500">
              Un lien de connexion vient de vous être envoyé.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Recevoir mon lien de connexion'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
