import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/tokens')({
  component: TokensPage,
})

function TokensPage() {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">Tokens & abonnement</h1>
      <p className="text-sm text-gray-500 mt-2">À construire en SESSION 7.</p>
    </div>
  )
}
