import type { Metadata } from 'next'
import { getContent } from '@/lib/content'
import { ArchiveShell } from '@/components/ArchiveShell'
import './style.css'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: { default: 'KOLKATA BRAND NEWS', template: '%s — KBN' },
  description: 'A living archive of brands, stories, and visual culture emerging from Kolkata.',
  icons: { icon: '/icon.svg' },
}
export default async function Layout({ children }: { children: React.ReactNode }) {
  const content = await getContent()
  return <html lang="en"><body><ArchiveShell {...content}>{children}</ArchiveShell></body></html>
}
