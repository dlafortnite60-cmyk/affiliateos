import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/ui/index'
import { OfferForm } from '@/components/forms/OfferForm'

export default function NewOfferPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader title="New Offer" description="Add a new affiliate offer to track" />
        <div className="p-6 max-w-3xl">
          <div className="card p-6"><OfferForm /></div>
        </div>
      </main>
    </div>
  )
}
