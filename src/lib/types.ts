export type MediaItem = { src: string; width: number; height: number; alt: string; caption?: string; type?: 'image' | 'video'; poster?: string }
export type Article = {
  id: string | number; slug: string; title: string; category: string; color?: string; date: string; order: number;
  sourceUrl?: string; gallery: MediaItem[]; body: any[]; description?: string
}
export type GalleryItem = MediaItem & { key: string; article: Article; index: number; month: string; year: string }
export type Track = { title: string; artist: string; src: string; artwork?: string }
export type SiteSettings = {
  brand: string; title: string; abbreviation: string; year: string; aboutTitle: string; aboutIntro: string;
  aboutText: string; aboutVideo: string; thanks: string; contactEmail: string; studioUrl: string;
  credits: { label: string; name: string; url: string }[]; playlist: Track[]
}
