'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { GalleryItem } from '@/lib/types'
import { damp, wrap } from '@/lib/gallery'
import { useArchive } from './ArchiveContext'
import { Media } from './Media'

type Props = { items: GalleryItem[]; mode: 'timeline' | 'surf'; active: boolean; reduced: boolean; onYear: (year: string) => void }
export function Gallery({ items, mode, active, reduced, onYear }: Props) {
  // Reverse so oldest article is leftmost — scroll right to reach newer content
  const ordered = useMemo(() => [...items].reverse(), [items])
  const { openArticle } = useArchive()
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const cards = useRef<(HTMLAnchorElement | null)[]>([])
  const position = useRef({ current: 0, target: 0 })
  const modeRef = useRef(mode)
  const [hovered, setHovered] = useState<number | null>(null)
  const hoveredRef = useRef<number | null>(null)
  const hoverProgress = useRef<number[]>([])
  const openedByPointer = useRef(false)
  const drag = useRef({ active: false, start: 0, previous: 0, moved: false, speed: 0, ruler: false })
  const hoverX = useRef(-1000)
  const lastHoverX = useRef(-1000)
  const hoverAmt = useRef(0)
  const scrollAmt = useRef(0)
  const ruler = useRef<HTMLDivElement>(null)
  const rulerPxToPos = useRef(1 / .34)
  const geometry = useRef({ width: 1440, height: 900, timelineCard: 270, timelineGap: 19, timelineStride: 289, surfCard: 192, surfStride: 80 })
  const modeBlend = useRef(mode === 'surf' ? 1 : 0)
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { hoveredRef.current = hovered }, [hovered])

  useEffect(() => {
    if (!root.current || !ordered.length) return
    const resize = () => {
      const w = innerWidth, h = innerHeight, mobile = w <= 760
      const timelineCard = mobile ? Math.min(200, w * .625) : w * .18733
      const timelineGap = mobile ? 12 : w * .01333
      geometry.current = {
        width: w,
        height: h,
        timelineCard,
        timelineGap,
        timelineStride: timelineCard + timelineGap,
        // The reference uses a much narrower card and a denser step in Surf.
        // At 320px these resolve to 164px cards moving in 53px increments.
        surfCard: mobile ? w * .5128 : w * .13333,
        surfStride: mobile ? w / 6 : w / 18,
      }
      const c = canvas.current
      if (c) { const dpr = Math.min(devicePixelRatio, 2); c.width = w * dpr; c.height = 94 * dpr; c.style.width = `${w}px`; c.style.height = '94px' }
    }
    resize()
    window.addEventListener('resize', resize)

    const groups: { start: number; count: number; month: string; year: string }[] = []
    ordered.forEach((it, i) => {
      const last = groups[groups.length - 1]
      if (last && last.month === it.month && last.year === it.year) last.count++
      else groups.push({ start: i, count: 1, month: it.month, year: it.year })
    })

    // Centre the newest card from the current month on first load
    const now = new Date()
    const todayYear = String(now.getFullYear())
    const todayMonth = now.toLocaleString('en-US', { month: 'long' }).toLowerCase()
    let startIdx = ordered.findLastIndex(item => item.year === todayYear && item.month.toLowerCase() === todayMonth)
    if (startIdx < 0) startIdx = ordered.length - 1
    {
      const g = geometry.current
      position.current.current = startIdx * g.timelineStride - (g.width / 2 - g.timelineCard / 2 - g.timelineGap)
      position.current.target = position.current.current
    }

    let frame = 0, last = performance.now(), lastYear = '', previousIndex = -1
    const render = (now: number) => {
      const dt = (now - last) / 1000; last = now
      if (active) {
        const p = position.current, g = geometry.current
        const old = p.current
        p.current = reduced ? p.target : damp(p.current, p.target, dt, drag.current.active ? 20 : 8)
        if (Math.abs(p.target - p.current) < .01) p.current = p.target
        const velocity = (p.current - old) / Math.max(dt * 60, .1)
        modeBlend.current = reduced ? (modeRef.current === 'surf' ? 1 : 0) : damp(modeBlend.current, modeRef.current === 'surf' ? 1 : 0, dt, 6)
        const blend = modeBlend.current
        const card = g.timelineCard * (1 - blend) + g.surfCard * blend
        const spacing = g.timelineStride * (1 - blend) + g.surfStride * blend
        const units = p.current / g.timelineStride
        const total = ordered.length * spacing
        cards.current.forEach((element, index) => {
          if (!element) return
          const media = ordered[index]
          const offset = wrap(index * spacing - units * spacing + spacing, total) - spacing
          const timelineX = offset + g.timelineGap
          const x = timelineX * (1 - blend) + offset * blend
          const height = Math.min(card * media.height / Math.max(media.width, 1), g.height * (blend > .5 ? .57 : .57))
          const timelineY = g.height * (g.width <= 760 ? .42 : .50) - height / 2
          const progress = Math.max(0, Math.min(1, x / Math.max(g.width, 1)))
          const eased = progress * progress * (3 - 2 * progress)
          const surfY = g.height * .67 - height + g.height * (.076 - .315 * eased)
          const idle = Math.sin(now * .00115 + index * .72) * (g.width <= 760 ? 3.5 : 5.5)
            + Math.sin(now * .00047 + index * 1.31) * 1.8
          const y = timelineY * (1 - blend) + (surfY + idle) * blend
          const surfRotate = -84 + Math.min(14, Math.max(0, (x / Math.max(g.width, 1)) * 25))
          const isHover = hoveredRef.current === index
          const hover = hoverProgress.current[index] = reduced ? (isHover ? 1 : 0) : damp(hoverProgress.current[index] || 0, isHover ? 1 : 0, dt, 9)
          // Change the card's existing angle, rather than rotating a flattened
          // child inside an edge-on parent. -42 opens the face without flipping it.
          const rotate = blend * (surfRotate + (-42 - surfRotate) * hover) + Math.max(-12, Math.min(12, -velocity * .28)) * (1 - blend)
          element.style.width = `${card}px`; element.style.height = `${height}px`
          element.style.transform = `translate3d(${x}px,${y - height * .12 * hover * blend}px,0) perspective(1000px) rotateY(${rotate}deg) rotateZ(${-6 * hover * blend}deg)`
          element.style.zIndex = isHover ? '100' : String(index + 1)
          const visible = x > -card * 1.5 && x < g.width + card
          element.style.visibility = visible ? 'visible' : 'hidden'
          element.tabIndex = visible ? 0 : -1
        })
        const activeIndex = wrap(Math.round(units + (g.width / 2 - card / 2) / spacing), ordered.length)
        const item = ordered[activeIndex]
        if (item && item.year !== lastYear) { lastYear = item.year; onYear(lastYear) }
        if (activeIndex !== previousIndex) { previousIndex = activeIndex; setAnnouncement(`${activeIndex + 1} of ${ordered.length}. ${item?.article.title}`) }
        const moving = Math.abs(p.target - p.current) > 1.5
        const near = hoverX.current > -500
        if (near) lastHoverX.current = hoverX.current
        scrollAmt.current = reduced ? (moving ? 1 : 0) : damp(scrollAmt.current, moving ? 1 : 0, dt, moving ? 10 : 3)
        hoverAmt.current = reduced ? (near ? 1 : 0) : damp(hoverAmt.current, near ? 1 : 0, dt, near ? 10 : 5)
        drawRuler(p.current, g.width, g.timelineStride, g.timelineCard, g.timelineGap)
      }
      frame = requestAnimationFrame(render)
    }
    // Every month gets the same ruler width regardless of how many cards it holds;
    // the ruler maps card position piecewise-linearly within each month.
    const drawRuler = (pos: number, width: number, stride: number, card: number, gap: number) => {
      const c = canvas.current, ctx = c?.getContext('2d'); if (!c || !ctx) return
      const dpr = Math.min(devicePixelRatio, 2)
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,94)
      const monthWidth = Math.max(150, width / 5.5)
      const total = groups.length * monthWidth
      const u = wrap((pos + width / 2 - card / 2 - gap) / stride, ordered.length)
      const gi = Math.max(0, groups.findLastIndex(gr => gr.start <= u))
      const cur = groups[gi]
      const rulerPos = gi * monthWidth + Math.min(1, (u - cur.start) / cur.count) * monthWidth
      rulerPxToPos.current = cur.count * stride / monthWidth
      const tickStep = 11
      // One wave only: it follows the mouse when it's near the ruler, sits on the
      // centre while scrolling, and flattens out when neither is happening.
      const wave = (d: number) => Math.pow(Math.max(0, 1 - Math.abs(d) / 70), 2)
      const hoverAmount = hoverAmt.current, scrollAmount = scrollAmt.current * (1 - hoverAmount)
      for (let x = wrap(width / 2 - rulerPos, tickStep); x < width; x += tickStep) {
        const k = Math.max(hoverAmount * wave(x - lastHoverX.current), scrollAmount * wave(x - width / 2))
        const shade = Math.round(200 - 177 * k)
        ctx.strokeStyle = `rgb(${shade},${shade},${shade})`; ctx.lineWidth = .6 + k * k * .8
        ctx.beginPath(); ctx.moveTo(x,50); ctx.lineTo(x,50 - (11 + k * 30)); ctx.stroke()
      }
      ctx.textAlign = 'center'
      groups.forEach((gr, i) => {
        const isNewYear = i === 0 || groups[i-1].year !== gr.year
        for (let xx = wrap(i * monthWidth - rulerPos + width / 2, total) - total; xx < width + 60; xx += total) {
          if (xx < -60) continue
          ctx.fillStyle = '#222'; ctx.font = '11px LookbackMono, monospace'
          ctx.fillText(gr.month.toUpperCase(), xx, 72)
          if (isNewYear) {
            ctx.fillStyle = '#999'; ctx.font = 'bold 10px LookbackMono, monospace'
            ctx.fillText(gr.year, xx, 87)
          }
        }
      })
    }
    frame = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [ordered, active, reduced, onYear])

  useEffect(() => {
    const element = root.current
    if (!element || !active) return
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      event.preventDefault()
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      const multiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? innerHeight : 1
      position.current.target += delta * multiplier * (modeRef.current === 'surf' ? 2.1 : 1.1)
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [active])

  const pointerDown = (event: React.PointerEvent, ruler = false) => {
    if (event.button !== 0) return
    drag.current = { active: true, start: event.clientX, previous: event.clientX, moved: false, speed: 0, ruler }
  }
  const pointerMove = (event: React.PointerEvent) => {
    const rulerTop = ruler.current?.getBoundingClientRect().top ?? innerHeight
    hoverX.current = event.clientY >= rulerTop - 30 ? event.clientX : -1000
    const d = drag.current
    if (!d.active) return
    const delta = d.previous - event.clientX
    d.moved ||= Math.abs(event.clientX - d.start) > 5
    if (d.moved && !event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
    d.previous = event.clientX; d.speed = delta
    position.current.target += delta * (d.ruler ? rulerPxToPos.current : mode === 'surf' ? 3 : 1)
  }
  const pointerUp = (event: React.PointerEvent) => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    if (d.moved && !reduced) position.current.target += d.speed * (d.ruler ? 8 : 6)
    if (!d.moved && d.ruler) position.current.target += (event.clientX - innerWidth / 2) * rulerPxToPos.current
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const keyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); position.current.target += geometry.current.timelineStride * (event.key === 'ArrowRight' ? 1 : -1) }
    if (event.key === 'Home') { event.preventDefault(); position.current.target = 0 }
    if (event.key === 'End') { event.preventDefault(); position.current.target = (ordered.length - 1) * geometry.current.timelineStride }
  }
  if (!ordered.length) return <div className="empty-archive"><span className="label">THE ARCHIVE IS OPEN</span><h1>A little space<br />for what&apos;s next.</h1><p>New stories will appear here.</p></div>
  return <div ref={root} className={`gallery ${mode}`} onKeyDown={keyDown} aria-label={`${mode === 'surf' ? 'Surf' : 'Timeline'} gallery`}>
    <div className="gallery-drag-surface" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onPointerLeave={() => { hoverX.current = -1000 }}>
      {ordered.map((item, index) => <a ref={el => { cards.current[index] = el }} key={item.key} href={`/articles/${item.article.slug}`} className="gallery-card"
        aria-label={`${index + 1}. ${item.article.title}`} onPointerEnter={e => { if (e.pointerType !== 'touch') setHovered(index) }} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)}
        onPointerDown={e => { if (e.button === 0) e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerUp={e => {
          if (e.button === 0 && drag.current.active && !drag.current.moved) {
            openedByPointer.current = true
            openArticle(item.article, item, e.currentTarget.querySelector<HTMLElement>('.card-media'))
            setTimeout(() => { openedByPointer.current = false }, 0)
          }
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
        }}
        onClick={e => {
          if (e.ctrlKey || e.metaKey) return
          e.preventDefault()
          if (openedByPointer.current) return
          if (!drag.current.moved || e.detail === 0) openArticle(item.article, item, e.currentTarget.querySelector<HTMLElement>('.card-media'))
        }}>
        <span className="card-number label">{index + 1}</span><div className="card-media"><Media media={item} eager={index < 7} /><span className="card-tint" style={{ backgroundColor: item.article.color }} /></div>
        <span className="card-caption label">{item.article.category} ({item.month})</span>
      </a>)}
    </div>
    <div ref={ruler} className={`timeline-ruler ${mode === 'surf' ? 'ruler-hidden' : ''}`} role="slider" tabIndex={0} aria-label="Browse archive timeline" aria-valuemin={1} aria-valuemax={ordered.length} aria-valuenow={parseInt(announcement) || 1} aria-valuetext={announcement}
      onPointerDown={e => pointerDown(e,true)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onPointerLeave={() => { hoverX.current = -1000 }}>
      <canvas ref={canvas} aria-hidden="true" />
    </div>
    {mode === 'surf' && <div className={`surf-details${hovered !== null ? ' is-visible' : ''}`} aria-live="polite">
      {hovered !== null ? <>
        <span className="label">({String(hovered + 1).padStart(2,'0')}) {ordered[hovered].article.category} / {ordered[hovered].month}</span>
        <strong>{ordered[hovered].article.title}</strong>
        <span className="label">VIEW STORY ↗</span>
      </> : <span className="label">SCROLL TO SURF</span>}
    </div>}
    <div className="sr-only" role="status" aria-live="off">{announcement}</div>
  </div>
}
