'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { Article, MediaItem } from '@/lib/types'
import { safeExternalUrl } from '@/lib/gallery'
import { useArchive } from './ArchiveContext'
import { Media } from './Media'

function RichText({ node }: { node: any }): React.ReactNode {
  if (!node) return null
  if (node.type === 'text') {
    let text: React.ReactNode = node.text
    if (node.format & 1) text = <strong>{text}</strong>
    if (node.format & 2) text = <em>{text}</em>
    if (node.format & 8) text = <u>{text}</u>
    return text
  }
  const children = node.children?.map((child: any, i: number) => <RichText key={i} node={child} />)
  if (node.type === 'paragraph') return <p>{children}</p>
  if (node.type === 'heading') { const Tag = (['h2','h3','h4'].includes(node.tag) ? node.tag : 'h2') as 'h2'; return <Tag>{children}</Tag> }
  if (node.type === 'list') return node.listType === 'number' ? <ol>{children}</ol> : <ul>{children}</ul>
  if (node.type === 'listitem') return <li>{children}</li>
  if (node.type === 'quote') return <blockquote>{children}</blockquote>
  if (node.type === 'linebreak') return <br />
  if (node.type === 'link' || node.type === 'autolink') return <a href={safeExternalUrl(node.fields?.url || node.url)} target={node.fields?.newTab ? '_blank' : undefined} rel="noreferrer">{children}</a>
  return <>{children}</>
}
function ArticleFigure({ media, caption, number }: { media: MediaItem | null; caption?: string; number: number }) {
  if (!media) return null
  return <figure className="article-figure"><Media media={media} /><figcaption className="label"><span>{String(number).padStart(2,'0')}</span><span>{caption || media.caption}</span></figcaption></figure>
}
export function ArticleView({ article, heroMedia, previous, next }: { article: Article; heroMedia: MediaItem; previous: Article; next: Article }) {
  const { closeArticle, openArticle, photoTransition, finishPhotoTransition, returnTo } = useArchive()
  const hero = useRef<HTMLDivElement>(null)
  const previousCard = useRef<HTMLAnchorElement>(null)
  const nextCard = useRef<HTMLAnchorElement>(null)
  const gallery = useRef<HTMLDivElement>(null)
  const floatingClose = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [enteredViaSwitch, setEnteredViaSwitch] = useState(false)
  const media = heroMedia
  const month = new Date(article.date).toLocaleString('en', { month: 'long', timeZone: 'UTC' })
  useLayoutEffect(() => {
    if (!photoTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishPhotoTransition()
      return
    }
    const isArticleSwitch = photoTransition.origin === 'article'
    if (isArticleSwitch && photoTransition.targetSlug !== article.slug) return
    if (isArticleSwitch) setEnteredViaSwitch(true)

    const targets = [
      { slug: previous.slug, element: previousCard.current },
      { slug: article.slug, element: hero.current },
      { slug: next.slug, element: nextCard.current },
    ]
    const animations: gsap.core.Tween[] = []

    // Measure natural slot positions and sizes for carousel (elements are at rest after clearGsap in cleanup)
    const d = photoTransition.direction
    const prevElBCR = previousCard.current?.getBoundingClientRect()
    const heroBCR = hero.current?.getBoundingClientRect()
    const nextElBCR = nextCard.current?.getBoundingClientRect()
    const carouselPrevLeft = prevElBCR?.left ?? 0
    const carouselHeroLeft = heroBCR?.left ?? 0
    const carouselNextLeft = nextElBCR?.left ?? 0
    const prevElW = prevElBCR?.width ?? 0
    const heroElW = heroBCR?.width ?? 0
    const nextElW = nextElBCR?.width ?? 0

    targets.forEach(({ slug, element }, index) => {
      if (!element) return
      const isAdjacent = element === previousCard.current || element === nextCard.current
      const refEl = isAdjacent ? (element.querySelector<HTMLElement>('img, video') ?? element) : element
      const destination = refEl.getBoundingClientRect()
      const source = photoTransition.sources[slug]
      if (isArticleSwitch) {
        // Carousel slide: each element moves one slot in the navigation direction,
        // scaling between adjacent-card size and hero size as it crosses the center.
        // transformOrigin:'left center' keeps left edges aligned with slot positions.
        const sf = (a: number, b: number) => (a > 0 && b > 0 ? a / b : 1)
        if (element === previousCard.current) {
          if (d === 1) animations.push(gsap.fromTo(element,
            { x: carouselHeroLeft - carouselPrevLeft, scale: sf(heroElW, prevElW), transformOrigin: 'left center' },
            { x: 0, scale: 1, duration: 0.9, ease: 'expo.inOut' }))
          else animations.push(gsap.fromTo(element, { xPercent: -100 }, { xPercent: 0, duration: 1, ease: 'expo.inOut' }))
        } else if (element === hero.current) {
          if (d === 1) animations.push(gsap.fromTo(element,
            { x: carouselNextLeft - carouselHeroLeft, scale: sf(nextElW, heroElW), transformOrigin: 'left center' },
            { x: 0, scale: 1, duration: 0.9, ease: 'expo.inOut' }))
          else animations.push(gsap.fromTo(element,
            { x: carouselPrevLeft - carouselHeroLeft, scale: sf(prevElW, heroElW), transformOrigin: 'left center' },
            { x: 0, scale: 1, duration: 0.9, ease: 'expo.inOut' }))
        } else {
          if (d === 1) animations.push(gsap.fromTo(element, { xPercent: 100 }, { xPercent: 0, duration: 1, ease: 'expo.inOut' }))
          else animations.push(gsap.fromTo(element,
            { x: carouselHeroLeft - carouselNextLeft, scale: sf(heroElW, nextElW), transformOrigin: 'left center' },
            { x: 0, scale: 1, duration: 0.9, ease: 'expo.inOut' }))
        }
      } else if (source) {
        animations.push(gsap.fromTo(element, {
          x: source.left - destination.left,
          y: source.top - destination.top,
          scale: source.width / Math.max(1, destination.width),
          transformOrigin: 'top left',
        }, { x: 0, y: 0, scale: 1, duration: 1, ease: 'expo.inOut', delay: index * .035 }))
      } else {
        animations.push(gsap.fromTo(element,
          { y: innerHeight - destination.top + 40, scale: .9, transformOrigin: 'center' },
          { y: 0, scale: 1, duration: 1.15, ease: 'expo.out', delay: .25 + index * .035 }))
      }
    })

    const heroCaption = gallery.current?.querySelector<HTMLElement>('.article-hero-caption')
    const heroNumber = gallery.current?.querySelector<HTMLElement>('.article-hero-number')

    const clearGsap = () => {
      const els = [previousCard.current, hero.current, nextCard.current, heroCaption, heroNumber].filter(Boolean) as HTMLElement[]
      gsap.set(els, { clearProps: 'x,y,xPercent,yPercent,scale,transformOrigin,opacity' })
    }

    if (isArticleSwitch) {
      // Slide caption and number with the hero photo
      const heroX = d === 1 ? carouselNextLeft - carouselHeroLeft : carouselPrevLeft - carouselHeroLeft
      if (heroCaption) animations.push(gsap.fromTo(heroCaption, { x: heroX, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'expo.inOut' }))
      if (heroNumber) animations.push(gsap.fromTo(heroNumber, { x: heroX, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'expo.inOut' }))

      const container = content.current
      if (!container) { finishPhotoTransition(); return () => { animations.forEach(a => a.kill()); clearGsap() } }
      const meta = container.querySelector('.article-meta')
      const titleWords = container.querySelectorAll('h1 > span')
      const blocks = container.querySelectorAll('.article-block-reveal')
      gsap.set(container, { opacity: 1 })
      const reveal = gsap.timeline({ onComplete: finishPhotoTransition })
      if (meta) reveal.fromTo(meta, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }, 0)
      if (titleWords.length) reveal.fromTo(titleWords, { opacity: 0, yPercent: 112 }, { opacity: 1, yPercent: 0, duration: .68, stagger: .035, ease: 'power3.out' }, .04)
      if (blocks.length) reveal.fromTo(blocks, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .62, stagger: .055, ease: 'power3.out' }, .2)
      return () => { animations.forEach(a => a.kill()); reveal.kill(); clearGsap() }
    }

    const done = window.setTimeout(finishPhotoTransition, 1250)
    return () => { window.clearTimeout(done); animations.forEach(a => a.kill()); clearGsap() }
  }, [article.slug, previous.slug, next.slug, photoTransition?.id, finishPhotoTransition])
  useEffect(() => {
    if (panel.current) panel.current.scrollTop = 0
    if (gallery.current) gallery.current.style.setProperty('--article-progress', '0')
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeArticle() }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [article.slug, closeArticle])
  const close = (event: React.MouseEvent) => {
    event.preventDefault()
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) closeArticle()
    else gsap.to(panel.current, { opacity: 0, x: 35, duration: .28, onComplete: closeArticle })
  }
  const syncSides = () => {
    if (!panel.current || !gallery.current) return
    const max = Math.max(1, panel.current.scrollHeight - panel.current.clientHeight)
    gallery.current.style.setProperty('--article-progress', String(panel.current.scrollTop / max))
  }
  const hideClose = () => {
    if (floatingClose.current) floatingClose.current.dataset.visible = 'false'
  }
  useEffect(() => {
    const trackClose = (event: PointerEvent) => {
      const area = gallery.current
      const label = floatingClose.current
      if (!area || !label || event.pointerType === 'touch') return
      const bounds = area.getBoundingClientRect()
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom
      const overPhoto = event.target instanceof Element && (event.target.closest('.article-adjacent') !== null || event.target.closest('.article-hero-wrap') !== null)
      if (!inside || overPhoto) {
        label.dataset.visible = 'false'
        return
      }
      label.style.left = `${event.clientX - bounds.left}px`
      label.style.top = `${event.clientY - bounds.top}px`
      label.dataset.visible = 'true'
    }
    window.addEventListener('pointermove', trackClose, { passive: true })
    window.addEventListener('blur', hideClose)
    return () => {
      window.removeEventListener('pointermove', trackClose)
      window.removeEventListener('blur', hideClose)
    }
  }, [])
  const adjacent = (a: Article, className: string, label: string, ref: React.RefObject<HTMLAnchorElement | null>) => a.gallery[0] ? <a ref={ref} href={`/articles/${a.slug}`} className={className} aria-label={`${label}: ${a.title}`} onClick={e => { e.preventDefault(); openArticle(a, a.gallery[0], e.currentTarget) }}><Media media={a.gallery[0]} eager /></a> : null
  let figureNumber = 0
  const switchingArticle = photoTransition?.origin === 'article'
  return <article className={`article-view${switchingArticle ? ' article-switch' : ''}${enteredViaSwitch ? ' article-no-entry' : ''}`}>
    <div className="article-gallery" ref={gallery} onPointerLeave={hideClose}>
      <a className="article-gallery-close" href={returnTo} onClick={close} aria-label="Close article" />
      <span className="article-floating-close" ref={floatingClose} data-visible="false" aria-hidden="true">Close</span>
{adjacent(previous,'article-adjacent article-previous','Previous article',previousCard)}
      {media && <div className="article-hero-wrap"><span className="label article-hero-number">{String(article.order + 1).padStart(2,'0')}</span><div className="article-hero" ref={hero} style={{ aspectRatio: `${media.width}/${media.height}` }}><Media media={media} eager /></div><span className="label article-hero-caption">{article.category} ({month})</span></div>}
      {adjacent(next,'article-adjacent article-next','Next article',nextCard)}
    </div>
    <div className="article-panel" ref={panel} onScroll={syncSides}>
      <div className="article-toolbar"><a href={returnTo} onClick={close}>Close</a>{safeExternalUrl(article.sourceUrl) && <a href={safeExternalUrl(article.sourceUrl)} target="_blank" rel="noreferrer">Source ↗</a>}</div>
      <div className="article-content" ref={content}>
        <div className="article-meta label"><span style={{ background: article.color }}>{article.category}</span><span>({month})</span></div>
        <div className="article-title-mask"><h1 aria-label={article.title}>{article.title.split(/\s+/).map((word, index) =>
          <span key={`${word}-${index}`} aria-hidden="true" style={{ animationDelay: `${.6 + index * .035}s` }}>{word}</span>)}</h1></div>
        <div className="article-body">{article.body.map((block, i) => {
          let content: React.ReactNode = null
          if (block.blockType === 'text') content = <RichText node={block.content?.root} />
          if (block.blockType === 'image') content = <ArticleFigure media={block.media} caption={block.caption} number={++figureNumber} />
          if (block.blockType === 'pair') content = <div className="article-pair"><ArticleFigure media={block.left} number={++figureNumber} /><ArticleFigure media={block.right} number={++figureNumber} /></div>
          if (block.blockType === 'embed') {
            let allowed = false
            try { const u = new URL(block.url); allowed = u.protocol === 'https:' && ['www.youtube.com','www.youtube-nocookie.com','player.vimeo.com'].includes(u.hostname) && /^\/(embed|video)\//.test(u.pathname) } catch {}
            content = allowed ? <iframe src={block.url} title={block.title || article.title} className="article-embed" loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : null
          }
          return content ? <div className="article-block-reveal" key={i} style={{ animationDelay: `${.82 + Math.min(i, 6) * .065}s` }}>{content}</div> : null
        })}</div>
        <a className="article-end label" href={`/articles/${next.slug}`} onClick={e => { e.preventDefault(); if (next.gallery[0]) openArticle(next,next.gallery[0]) }}>NEXT IN THE ARCHIVE <span>↗</span><strong>{next.title}</strong></a>
      </div>
    </div>
    <nav className="article-mobile-nav" aria-label="Article navigation">
      <a href={`/articles/${previous.slug}`} aria-label="Previous article" onClick={e => { e.preventDefault(); if (previous.gallery[0]) openArticle(previous,previous.gallery[0]) }}>←</a>
      <a href={returnTo} onClick={close}>Close</a>
      {safeExternalUrl(article.sourceUrl) && <a href={safeExternalUrl(article.sourceUrl)} target="_blank" rel="noreferrer">Source</a>}
      <a href={`/articles/${next.slug}`} aria-label="Next article" onClick={e => { e.preventDefault(); if (next.gallery[0]) openArticle(next,next.gallery[0]) }}>→</a>
    </nav>
  </article>
}
