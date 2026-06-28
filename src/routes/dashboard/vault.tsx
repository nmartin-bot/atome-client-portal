import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/vault')({
  component: VaultPage,
})

function VaultPage() {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">Credentials</h1>
      <p className="text-sm text-gray-500 mt-2">À construire en SESSION 6.</p>
    </div>
  )
}
