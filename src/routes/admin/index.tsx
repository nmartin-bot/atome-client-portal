import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: AdminIndexPage,
})

function AdminIndexPage() {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">Dashboard admin — liste clients</h1>
      <p className="text-sm text-gray-500 mt-2">À construire en SESSION 9.</p>
    </div>
  )
}
