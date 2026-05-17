import { Dashboard } from "@/components/Dashboard"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Dashboard />
      </div>
    </div>
  )
}
