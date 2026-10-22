'use client'
import { useEffect, useRef } from 'react'
import { useArchive } from './ArchiveContext'
import { Media } from './Media'
import { Footer } from './Footer'
let savedIndexScroll = 0
export function ArchiveIndex() {
  const { items, openArticle } = useArchive()
  const scroll = useRef<HTMLDivElement>(null)
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = savedIndexScroll }, [])
  return <div className="index-view" ref={scroll} onScroll={e => { savedIndexScroll = e.currentTarget.scrollTop }}>
    <h1 className="sr-only">The complete archive</h1>
    <div className="index-grid">{items.map((item, i) => {
      const newMonth = i === 0 || items[i-1].month !== item.month || items[i-1].year !== item.year
      return <a key={item.key} className="index-card" href={`/articles/${item.article.slug}`} aria-label={item.article.title} onClick={e => {
        if (e.ctrlKey || e.metaKey) return; e.preventDefault(); openArticle(item.article, item, e.currentTarget.querySelector<HTMLElement>('.index-media'))
      }}>
        {newMonth && <span className="index-month label">{item.month}</span>}
        <div className="index-media" style={{ aspectRatio: `${item.width}/${item.height}` }}><Media media={item} eager={i < 12} /></div>
        <span className="index-hover label">{String(i + 1).padStart(2,'0')}</span>
      </a>
    })}</div>
    {!items.length && <p className="index-empty">The archive is waiting for its first story.</p>}
    <Footer />
  </div>
}
