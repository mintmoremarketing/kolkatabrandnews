'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import gsap from 'gsap'
import { buildGallery } from '@/lib/gallery'
import type { Article, MediaItem, SiteSettings } from '@/lib/types'
import { Gallery } from './Gallery'
import { ArchiveIndex } from './ArchiveIndex'
import { SoundPlayer } from './SoundPlayer'
import { ArticleView } from './ArticleView'
import { ArchiveContext, type ArchiveContextValue, type PhotoRect, type PhotoTransition } from './ArchiveContext'

export function ArchiveShell({ articles, settings, preview, children }: { articles: Article[]; settings: SiteSettings; preview: boolean; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const items = useMemo(() => buildGallery(articles), [articles])
  const isArticle = pathname.startsWith('/articles/')
  const isAbout = pathname === '/about'
  const isIndex = pathname === '/articles'
  const mode = pathname === '/surf' ? 'surf' : 'timeline'
  const [returnTo, setReturnTo] = useState('/')
  const [selected, setSelected] = useState<ArchiveContextValue['selected']>(null)
  const [dismissed, setDismissed] = useState(false)
  const pendingSlug = useRef<string | null>(null)
  const collectionTransitioning = useRef(false)
  const [photoTransition, setPhotoTransition] = useState<PhotoTransition | null>(null)
  const [collectionOpening, setCollectionOpening] = useState(false)
  const [entered, setEntered] = useState(true)
  const [ready, setReady] = useState(false)
  const [soundRequested, setSoundRequested] = useState(false)
  const [year, setYear] = useState(settings.year)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const refresh = () => router.refresh()
    window.addEventListener('focus', refresh)
    if (!preview) return () => window.removeEventListener('focus', refresh)
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin &&
        (event.source === window.parent || event.source === window.opener) &&
        event.data?.type === 'payload-document-event') refresh()
    }
    window.addEventListener('message', onMessage)
    const ready = { type: 'payload-live-preview', ready: true }
    if (window.parent !== window) window.parent.postMessage(ready, window.location.origin)
    window.opener?.postMessage(ready, window.location.origin)
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('message', onMessage) }
  }, [router, preview])

  useLayoutEffect(() => {
    if (pathname === '/' && !sessionStorage.getItem('kbn-entered') && !preview) setEntered(false)
  }, [])
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(media.matches)
    const change = () => setReduced(media.matches)
    media.addEventListener('change', change)
    const timer = setTimeout(() => setReady(true), 850)
    return () => { clearTimeout(timer); media.removeEventListener('change', change) }
  }, [])
  useEffect(() => {
    const preloaders = articles.flatMap(article => {
      const media = article.gallery[0]
      if (!media || media.type === 'video') return []
      const image = new Image()
      image.decoding = 'sync'
      image.src = media.src
      image.decode().catch(() => {})
      return [image]
    })
    return () => { preloaders.forEach(image => { image.src = '' }) }
  }, [articles])
  useEffect(() => { if (!isArticle && ['/','/surf','/articles'].includes(pathname)) setReturnTo(pathname) }, [pathname, isArticle])
  useEffect(() => {
    const routeSlug = isArticle ? decodeURIComponent(pathname.slice('/articles/'.length)) : null
    if (!routeSlug) {
      pendingSlug.current = null
      setSelected(null)
      setDismissed(false)
      return
    }
    if (pendingSlug.current === routeSlug) {
      pendingSlug.current = null
      return
    }
    const routeArticle = articles.find(article => article.slug === routeSlug)
    if (routeArticle?.gallery[0]) setSelected({ slug: routeSlug, media: routeArticle.gallery[0] })
  }, [pathname, isArticle, articles])
  // about page uses light theme — no dark-page class needed
  useEffect(() => {
    if (!photoTransition) return
    const timer = setTimeout(() => setPhotoTransition(null), 1800)
    return () => clearTimeout(timer)
  }, [photoTransition])

  const openArticle = useCallback((article: Article, media: MediaItem, element?: HTMLElement | null) => {
    const fromArticle = pathname.startsWith('/articles/')
    const fromSurf = pathname === '/surf'
    const currentSlug = selected?.slug || (fromArticle ? decodeURIComponent(pathname.slice('/articles/'.length)) : null)
    const currentIndex = currentSlug ? articles.findIndex(item => item.slug === currentSlug) : -1
    const targetIndex = articles.findIndex(item => item.slug === article.slug)
    const distance = currentIndex >= 0 && targetIndex >= 0 ? (targetIndex - currentIndex + articles.length) % articles.length : 1
    const direction: -1 | 1 = distance > 0 && distance <= articles.length / 2 ? 1 : -1
    const sources: Record<string, PhotoRect> = {}
    if (fromArticle && currentIndex === targetIndex) return
    if (!reduced && innerWidth > 760 && targetIndex >= 0) {
      if (fromArticle && currentIndex >= 0) {
        const oldStrip = [
          { article: articles[(currentIndex - 1 + articles.length) % articles.length], selector: '.article-previous' },
          { article: articles[currentIndex], selector: '.article-hero' },
          { article: articles[(currentIndex + 1) % articles.length], selector: '.article-next' },
        ]
        for (const item of oldStrip) {
          const node = document.querySelector<HTMLElement>(item.selector)
          if (!node) continue
          const isAdjacent = item.selector.includes('previous') || item.selector.includes('next')
          const refNode = isAdjacent ? (node.querySelector<HTMLElement>('img, video') ?? node) : node
          const rect = refNode.getBoundingClientRect()
          // Strip any mid-animation GSAP offset so sources always reflect natural CSS positions
          const gx = (gsap.getProperty(node, 'x') as number) || 0
          const gy = (gsap.getProperty(node, 'y') as number) || 0
          const gxp = (gsap.getProperty(node, 'xPercent') as number) || 0
          const naturalLeft = rect.left - gx - (gxp / 100 * node.offsetWidth)
          const naturalTop = rect.top - gy
          sources[item.article.slug] = { left: naturalLeft, top: naturalTop, width: rect.width, height: rect.height }
        }
        // Clone the outgoing adjacent card and animate it off-screen so the exit looks like a carousel slide
        const exitImgNode = document.querySelector<HTMLElement>(
          direction === 1 ? '.article-previous img, .article-previous video' : '.article-next img, .article-next video'
        )
        if (exitImgNode) {
          const rect = exitImgNode.getBoundingClientRect()
          const clone = exitImgNode.cloneNode(true) as HTMLElement
          const cs = window.getComputedStyle(exitImgNode)
          clone.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;z-index:1000;pointer-events:none;margin:0;object-fit:${cs.objectFit||'cover'};border-radius:${cs.borderRadius};display:block;`
          document.body.appendChild(clone)
          const exitX = direction === 1 ? -rect.left - rect.width - 60 : innerWidth - rect.left + 60
          gsap.to(clone, { x: exitX, duration: 0.85, ease: 'expo.inOut', onComplete: () => clone.remove() })
        }
      } else {
        const related = [
          articles[(targetIndex - 1 + articles.length) % articles.length],
          article,
          articles[(targetIndex + 1) % articles.length],
        ]
        for (const relatedArticle of related) {
          const candidates = Array.from(document.querySelectorAll<HTMLElement>(`a[href="/articles/${relatedArticle.slug}"]`))
          const candidate = candidates.find(node => {
            const rect = node.getBoundingClientRect()
            return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth
          })
          const mediaNode = candidate?.querySelector<HTMLElement>('.index-media, .card-media') || candidate
          if (!mediaNode) continue
          const rect = mediaNode.getBoundingClientRect()
          sources[relatedArticle.slug] = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
        }
        if (element) {
          const rect = element.getBoundingClientRect()
          sources[article.slug] = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
        }
      }
    }
    const commitCollectionOpen = () => {
      setPhotoTransition({ id: Date.now(), origin: fromArticle ? 'article' : 'collection', targetSlug: article.slug, sources: fromSurf ? {} : sources, direction })
      pendingSlug.current = article.slug
      setDismissed(false)
      setSelected({ slug: article.slug, media })
      router.push(`/articles/${article.slug}`, { scroll: false })
    }

    if (fromSurf && !fromArticle && !reduced && innerWidth > 760) {
      if (collectionTransitioning.current) return
      collectionTransitioning.current = true
      setCollectionOpening(true)
      const clickedRect = element?.getBoundingClientRect()
      requestAnimationFrame(() => {
        const visibleCards = Array.from(document.querySelectorAll<HTMLElement>('.surf .gallery-card')).filter(card => {
          const rect = card.getBoundingClientRect()
          return rect.right > -rect.width && rect.left < innerWidth + rect.width
        })
        const clickedCenter = clickedRect ? clickedRect.left + clickedRect.width / 2 : innerWidth / 2
        const lift = gsap.timeline({
          onComplete: () => {
            commitCollectionOpen()
            collectionTransitioning.current = false
            window.setTimeout(() => setCollectionOpening(false), 950)
          },
        })
        lift.to(visibleCards, {
          y: index => {
            const rect = visibleCards[index].getBoundingClientRect()
            return `-=${rect.bottom + rect.height + 50}`
          },
          x: index => {
            const center = visibleCards[index].getBoundingClientRect().left + visibleCards[index].getBoundingClientRect().width / 2
            return `${center < clickedCenter ? '-=' : '+='}${Math.abs(center - clickedCenter) * .08}`
          },
          rotateZ: index => visibleCards[index].getBoundingClientRect().left < clickedCenter ? -4 : 4,
          duration: .58,
          stagger: { each: .008, from: 'center' },
          ease: 'power3.in',
        }, 0)
      })
      return
    }

    commitCollectionOpen()
  }, [articles, pathname, reduced, router, selected?.slug])
  const finishPhotoTransition = useCallback(() => setPhotoTransition(null), [])
  const closeArticle = useCallback(() => { setPhotoTransition(null); setDismissed(true); setSelected(null); router.push(returnTo, { scroll: false }) }, [returnTo, router])
  const enter = (sound: boolean) => {
    sessionStorage.setItem('kbn-entered', '1')
    setSoundRequested(sound)
    if (reduced) setEntered(true)
    else gsap.to('.entry-screen', { yPercent: -100, duration: 1, ease: 'expo.inOut', onComplete: () => setEntered(true) })
  }

  const routeSlug = isArticle ? decodeURIComponent(pathname.slice('/articles/'.length)) : null
  const shownSlug = selected?.slug || routeSlug
  const articleIndex = shownSlug ? articles.findIndex(article => article.slug === shownSlug) : -1
  const shownArticle = articleIndex >= 0 ? articles[articleIndex] : null
  const articleVisible = !dismissed && Boolean(shownArticle)
  const adjacentArticle = (step: -1 | 1) => {
    if (articleIndex < 0 || articles.length < 2) return shownArticle
    for (let offset = 1; offset < articles.length; offset++) {
      const candidate = articles[(articleIndex + step * offset + articles.length) % articles.length]
      if (candidate?.gallery[0]) return candidate
    }
    return shownArticle
  }
  const previousArticle = adjacentArticle(-1)
  const nextArticle = adjacentArticle(1)
  const shownMedia = shownArticle && selected?.slug === shownArticle.slug ? selected.media : shownArticle?.gallery[0]

  return <ArchiveContext.Provider value={{ settings, articles, items, returnTo, openArticle, closeArticle, selected, photoTransition, finishPhotoTransition }}>
    <div className={`archive-app ${articleVisible ? 'article-open' : ''} ${collectionOpening ? 'collection-opening' : ''}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header" aria-hidden={articleVisible || !entered} inert={articleVisible || !entered}>
        <div className="site-header-left">
          <Link href="/" scroll={false} className="site-logo-link" aria-label="Kolkata Brand News — home">
            <img src="/kbn-logo.webp" alt="KBN" className="site-logo" />
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
          {[['/','Timeline'],['/surf','Surf'],['/articles','Index'],['/about','About']].map(([href,label], i) =>
            <Link href={href} key={href} scroll={false} className={pathname === href ? 'active' : ''} aria-current={pathname === href ? 'page' : undefined}>{label}{i < 3 ? ',' : ''}</Link>)}
          </nav>
        </div>
        <SoundPlayer tracks={settings.playlist} requested={soundRequested} />
      </header>
      <div className={`masthead ${pathname !== '/' ? 'compact' : ''} masthead-hidden`} aria-label={`${settings.brand} ${settings.title}`}>
        <div className="masthead-expanded"><div>{settings.brand}</div><div>{settings.title}</div><div>({settings.abbreviation}/{year})</div></div>
        <div className="masthead-compact"><div>({settings.abbreviation})</div><div>{settings.abbreviation}/{year}</div></div>
      </div>
      <main id="main">
        <div className={`gallery-layer ${articleVisible || isAbout || isIndex || !['/','/surf'].includes(pathname) ? 'layer-hidden' : ''}`} inert={articleVisible || isAbout || isIndex || !entered}>
          <Gallery items={items} mode={mode} active={entered && !articleVisible && !isAbout && !isIndex && !collectionOpening} onYear={setYear} reduced={reduced} />
        </div>
        {isIndex && <ArchiveIndex />}
        {children}
        {articleVisible && shownArticle && shownMedia && previousArticle && nextArticle && <ArticleView article={shownArticle} heroMedia={shownMedia}
          previous={previousArticle}
          next={nextArticle} />}
      </main>
      {!articleVisible && <nav className="mobile-nav" aria-label="Mobile navigation" inert={!entered}>
        {[['/','Timeline'],['/surf','Surf'],['/articles','Index'],['/about','About']].map(([href,label]) =>
          <Link href={href} key={href} scroll={false} className={pathname === href ? 'active' : ''} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}
      </nav>}
      {preview && <a className="preview-banner" href="/exit-preview">Draft preview · Exit ↗</a>}
      {!entered && <div className="entry-screen" role="dialog" aria-modal="true" aria-label="Welcome to Kolkata Brand News">
        {articles[0]?.gallery[0] && <div className="entry-photo" aria-hidden="true"><img src={articles[0].gallery[0].src} alt="" /></div>}
        <div className="entry-panel">
          <div className="entry-head label"><span>{ready ? 'LOADED' : 'LOADING THE ARCHIVE…'}</span><span>22°34′N 88°22′E / EST. {settings.year}</span></div>
          <h1 className="entry-title"><span>Kolkata</span><span><em>Brand</em> News</span></h1>
          <div className="entry-inventory label">{Array.from(new Map(items.map(i => [`${i.year}-${i.month}`, i])).values()).slice(0, 6).map(i => <div key={`${i.year}-${i.month}`}><span>{i.month.toUpperCase()} {i.year}</span><p>ARTICLES ({articles.filter(a => a.date.slice(0,7) === i.article.date.slice(0,7)).length})<br />INSPIRATION<br />WORK & CULTURE</p></div>)}</div>
          <div className="entry-foot">
            <span className="entry-bottom label">A LIVING ARCHIVE / {String(articles.length).padStart(2,'0')} STORIES</span>
            <div className="entry-actions"><button disabled={!ready} onClick={() => enter(true)}>Enter with sound <span>↗</span></button><button className="entry-without" disabled={!ready} onClick={() => enter(false)}>…or without</button></div>
          </div>
        </div>
      </div>}
    </div>
  </ArchiveContext.Provider>
}
