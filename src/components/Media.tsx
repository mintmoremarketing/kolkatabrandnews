'use client'
import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '@/lib/types'
export function Media({ media, eager = false, className = '' }: { media: MediaItem; eager?: boolean; className?: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [media.src])
  useEffect(() => {
    const element = video.current
    if (!element) return
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    const update = () => {
      if (visible && !preference.matches) element.play().catch(() => {})
      else element.pause()
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    }, { rootMargin: '100px' })
    observer.observe(element)
    preference.addEventListener('change', update)
    return () => { observer.disconnect(); preference.removeEventListener('change', update); element.pause() }
  }, [media.src, media.type, failed])
  if (failed) return <div className={`media-fallback ${className}`} role="img" aria-label={media.alt}>KBN<span className="label">IMAGE UNAVAILABLE</span></div>
  return media.type === 'video'
    ? <video ref={video} className={className} src={media.src} poster={media.poster} muted loop playsInline preload={eager ? 'auto' : 'metadata'} aria-label={media.alt} onError={() => setFailed(true)} />
    : <img className={className} src={media.src} alt={media.alt} width={media.width} height={media.height} loading={eager ? 'eager' : 'lazy'} decoding={eager ? 'sync' : 'async'} draggable={false} onError={() => setFailed(true)} />
}
