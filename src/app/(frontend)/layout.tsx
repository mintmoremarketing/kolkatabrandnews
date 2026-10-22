import type { Metadata } from 'next'
import Script from 'next/script'
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
  // Returning visitors on / skip the welcome screen; hide it before React loads so it doesn't flash.
  const skipWelcome = `try{if(location.pathname==='/'&&sessionStorage.getItem('kbn-entered'))document.documentElement.dataset.kbnEntered='1'}catch(e){}`
  return <html lang="en" suppressHydrationWarning><body>
    <Script id="kbn-skip-welcome" strategy="beforeInteractive">{skipWelcome}</Script>
    <ArchiveShell {...content}>{children}</ArchiveShell>
  </body></html>
}
