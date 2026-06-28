import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/documents')({
  component: DocumentsPage,
})

function DocumentsPage() {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">Documents</h1>
      <p className="text-sm text-gray-500 mt-2">À construire en SESSION 4.</p>
    </div>
  )
}
