'use client'

import { createContext, useContext } from 'react'
import type { Article, GalleryItem, MediaItem, SiteSettings } from '@/lib/types'

export type PhotoRect = { left: number; top: number; width: number; height: number }
export type PhotoTransition = {
  id: number
  origin: 'collection' | 'article'
  targetSlug: string
  sources: Record<string, PhotoRect>
  direction: -1 | 1
  exiting?: { media: MediaItem; rect: PhotoRect }
}

export type ArchiveContextValue = {
  settings: SiteSettings
  articles: Article[]
  items: GalleryItem[]
  returnTo: string
  openArticle: (article: Article, media: MediaItem, element?: HTMLElement | null) => void
  closeArticle: () => void
  selected: { slug: string; media: MediaItem } | null
  photoTransition: PhotoTransition | null
  finishPhotoTransition: () => void
}

export const ArchiveContext = createContext<ArchiveContextValue | null>(null)

export function useArchive() {
  const context = useContext(ArchiveContext)
  if (!context) throw new Error('Missing archive context')
  return context
}
