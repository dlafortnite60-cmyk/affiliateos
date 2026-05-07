import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AffiliateOS — Performance Marketing Dashboard',
  description: 'Track offers, funnels, creatives, and campaign metrics in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0d1117] text-gray-200 antialiased">{children}</body>
    </html>
  )
}
