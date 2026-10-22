'use client'
import { useState } from 'react'
import { useArchive } from './ArchiveContext'
import { safeExternalUrl } from '@/lib/gallery'
export function Footer() {
  const { settings } = useArchive()
  const [credits, setCredits] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  async function contact() {
    try { await navigator.clipboard.writeText(settings.contactEmail); setCopied(true); setTimeout(() => setCopied(false), 2200) }
    catch { setCopyFailed(true) }
  }
  return <footer className="site-footer">
    <span>©{settings.brand}/{settings.year}</span>
    <div className="footer-action"><button onClick={() => { setCredits(!credits); setCopyFailed(false) }} aria-expanded={credits}>Site credits</button>
      {credits && <div className="footer-popover">{settings.credits.map(c => <a key={c.name} href={safeExternalUrl(c.url)} target="_blank" rel="noreferrer"><span className="label">{c.label}</span>{c.name} ↗</a>)}</div>}
    </div>
    <a href={safeExternalUrl(settings.studioUrl)} target="_blank" rel="noreferrer">{settings.brand} Studio ↗</a>
    <div className="footer-action"><button onClick={contact}>{copied ? 'Copied!' : 'Contact us'}</button>{copyFailed && <div className="footer-popover"><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></div>}</div>
    <span className="sr-only" role="status">{copied ? 'Email address copied to clipboard' : ''}</span>
  </footer>
}
