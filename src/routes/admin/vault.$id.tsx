import { createFileRoute } from '@tanstack/react-router'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'

export const Route = createFileRoute('/admin/vault/$id')({
  component: AdminVaultDetailPage,
})

function AdminVaultDetailPage() {
  const { id } = Route.useParams()

  return (
    <div className="h-full flex flex-col">
      <PageHeader pathItems={[{ label: 'Clients', href: '/admin' }, { label: 'Vault' }]} />
      <div className="flex-1 overflow-y-auto">
        <EmptyState
          title="Vault credentials"
          description={`Les credentials déchiffrés du projet ${id} seront construits ici (session 6).`}
          variant="cards"
        />
      </div>
    </div>
  )
}
