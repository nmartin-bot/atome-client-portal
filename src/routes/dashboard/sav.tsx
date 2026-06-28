import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/sav')({
  component: SavPage,
})

function SavPage() {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">SAV</h1>
      <p className="text-sm text-gray-500 mt-2">À construire en SESSION 8.</p>
    </div>
  )
}
