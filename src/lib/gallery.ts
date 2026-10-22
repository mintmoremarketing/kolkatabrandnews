import type { Article, GalleryItem } from './types'

export function buildGallery(articles: Article[]): GalleryItem[] {
  return [...articles].sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order).flatMap(article =>
    article.gallery.map((media, i) => ({ ...media, article, key: `${article.id}-${i}`, index: 0,
      month: new Date(article.date).toLocaleString('en', { month: 'long', timeZone: 'UTC' }),
      year: new Date(article.date).getUTCFullYear().toString(),
    })),
  ).map((item, index) => ({ ...item, index }))
}
export function wrap(value: number, length: number) { return length > 0 ? ((value % length) + length) % length : 0 }
export function damp(current: number, target: number, dt: number, speed = 9) {
  return current + (target - current) * (1 - Math.exp(-speed * Math.min(dt, 0.05)))
}
export function safeExternalUrl(value?: string): string | undefined {
  if (!value) return undefined
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined } catch { return undefined }
}
