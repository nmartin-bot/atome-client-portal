import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndexPage,
})

function DashboardIndexPage() {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">Vue d'ensemble</h1>
      <p className="text-sm text-gray-500 mt-2">À construire en SESSION 3.</p>
    </div>
  )
}
