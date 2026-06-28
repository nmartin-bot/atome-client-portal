import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/vault/$id')({
  component: AdminVaultDetailPage,
})

function AdminVaultDetailPage() {
  const { id } = Route.useParams()
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">Vault admin — projet {id}</h1>
      <p className="text-sm text-gray-500 mt-2">À construire en SESSION 6.</p>
    </div>
  )
}
