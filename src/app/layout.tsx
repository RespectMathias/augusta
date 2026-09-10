import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Augusta | Inventory workspace',
  description: 'Prepare and approve marketplace listings from inventory.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
