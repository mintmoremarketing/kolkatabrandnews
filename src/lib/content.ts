import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode, headers } from 'next/headers'
import type { Article, MediaItem, SiteSettings } from './types'
import { defaultSettings } from './defaults'

// Payload prefixes local uploads with serverURL; keep them relative so any port/host works.
const serverURL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
const relative = (url?: string | null) => url && url.startsWith(serverURL + '/') ? url.slice(serverURL.length) : url || undefined
export function mapMedia(media: any): MediaItem | null {
  if (!media || typeof media !== 'object' || !media.url) return null
  const video = media.mimeType?.startsWith('video/')
  const preserveAnimation = ['image/gif', 'image/webp'].includes(media.mimeType)
  return { src: relative(video || preserveAnimation ? media.url : media.sizes?.card?.url || media.url)!,
    width: media.width || 800, height: media.height || 1000, alt: media.alt || '', caption: media.caption || '',
    type: video ? 'video' : 'image', poster: relative(media.thumbnailURL) }
}
export function mapArticle(doc: any): Article {
  const gallery = (doc.gallery || []).flatMap((g: any) => {
    const media = mapMedia(g.media)
    return media ? [{ ...media, caption: g.caption || media.caption }] : []
  })
  const galleryStill = gallery.find((media: MediaItem) => media.type !== 'video')?.src
  const galleryWithPosters = gallery.map((media: MediaItem) =>
    media.type === 'video' && !media.poster && galleryStill ? { ...media, poster: galleryStill } : media)
  return { id: doc.id, slug: doc.slug, title: doc.title, category: doc.category?.name || 'Inspire', color: doc.category?.color || '#eee2f7',
    date: doc.archiveDate, order: doc.order || 0, sourceUrl: doc.sourceUrl, description: doc.description,
    gallery: galleryWithPosters,
    body: (doc.body || []).map((b: any) => ({ ...b, media: mapMedia(b.media), left: mapMedia(b.left), right: mapMedia(b.right) })),
  }
}
export const getContent = cache(async () => {
  const payload = await getPayload({ config })
  const draft = await draftMode()
  let user: any = undefined
  if (draft.isEnabled) user = (await payload.auth({ headers: await headers() })).user
  const [result, site] = await Promise.all([
    payload.find({ collection: 'articles', limit: 1000, depth: 2, sort: '-archiveDate', draft: Boolean(user), overrideAccess: false, user,
      ...(user ? {} : { where: { _status: { equals: 'published' } } }) }),
    payload.findGlobal({ slug: 'site', depth: 2, overrideAccess: false }),
  ])
  const raw = site as any
  const settings: SiteSettings = { ...defaultSettings }
  for (const key of ['brand','title','abbreviation','year','aboutTitle','aboutIntro','aboutText','thanks','contactEmail','studioUrl'] as const) {
    if (raw[key]) settings[key] = raw[key]
  }
  settings.aboutVideo = relative(raw.aboutVideo?.url) || defaultSettings.aboutVideo
  if (raw.credits?.length) settings.credits = raw.credits
  settings.playlist = (raw.playlist || []).filter((t: any) => t.audio?.url).map((t: any) => ({ title: t.title, artist: t.artist, src: relative(t.audio.url)!, artwork: relative(t.artwork?.url) }))
  return { articles: result.docs.map(mapArticle), settings, preview: Boolean(user) }
})
