import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/brief')({
  component: BriefPage,
})

function BriefPage() {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">Brief métier</h1>
      <p className="text-sm text-gray-500 mt-2">À construire en SESSION 5.</p>
    </div>
  )
}
