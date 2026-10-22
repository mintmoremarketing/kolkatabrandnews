import type { CollectionConfig, Field, GlobalConfig } from 'payload'
import { adminField, adminOnly, authenticated, publishedOrAuthenticated } from './access'

const urlField = (name: string, label?: string): Field => ({ name, label, type: 'text', validate: (value: unknown) => {
  if (!value) return true
  try { const u = new URL(String(value)); return ['https:', 'http:'].includes(u.protocol) || 'Use an http or https URL.' } catch { return 'Enter a complete URL.' }
} })
const mediaField = (name: string, required = true): Field => ({ name, type: 'upload', relationTo: 'media', required })
const richTextBlock = { slug: 'text', labels: { singular: 'Text', plural: 'Text' }, fields: [{ name: 'content', type: 'richText' as const, required: true }] }
const mediaBlock = { slug: 'image', labels: { singular: 'Image / video', plural: 'Media' }, fields: [mediaField('media'), { name: 'caption', type: 'text' as const }] }
const pairBlock = { slug: 'pair', labels: { singular: 'Two-column media', plural: 'Media pairs' }, fields: [mediaField('left'), mediaField('right'), { name: 'caption', type: 'text' as const }] }
const embedBlock = { slug: 'embed', fields: [{ name: 'url', type: 'text' as const, required: true, validate: (v: unknown) => {
  try { const u = new URL(String(v)); return (u.protocol === 'https:' && ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'].includes(u.hostname) && /^\/(embed|video)\//.test(u.pathname)) || 'Use a YouTube embed or Vimeo player URL.' } catch { return 'Enter a supported embed URL.' }
} }, { name: 'title', type: 'text' as const, required: true }] }

export const Users: CollectionConfig = {
  slug: 'users', auth: { tokenExpiration: 7200, maxLoginAttempts: 5, lockTime: 600000 },
  admin: { useAsTitle: 'email', group: 'Settings' },
  access: { create: adminOnly, delete: adminOnly, read: ({ req }) => req.user?.role === 'admin' ? true : req.user ? { id: { equals: req.user.id } } : false,
    update: ({ req }) => req.user?.role === 'admin' ? true : req.user ? { id: { equals: req.user.id } } : false },
  fields: [{ name: 'name', type: 'text' }, { name: 'role', type: 'select', defaultValue: 'editor', required: true,
    options: [{ label: 'Administrator', value: 'admin' }, { label: 'Editor', value: 'editor' }], access: { create: adminField, update: adminField } }],
  hooks: { beforeChange: [async ({ data, operation, req }) => {
    if (operation === 'create') {
      const existing = await req.payload.count({ collection: 'users', req })
      if (existing.totalDocs === 0) data.role = 'admin'
    }
    return data
  }] },
}
export const Media: CollectionConfig = {
  slug: 'media', admin: { useAsTitle: 'alt', group: 'Library' },
  access: { read: () => true, create: authenticated, update: authenticated, delete: authenticated },
  upload: { staticDir: 'media', mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav'],
    focalPoint: true, imageSizes: [{ name: 'thumbnail', width: 320 }, { name: 'card', width: 800 }, { name: 'large', width: 1600 }] },
  fields: [{ name: 'alt', type: 'text', required: true }, { name: 'caption', type: 'text' }, urlField('sourceUrl', 'Original source')],
}
export const Categories: CollectionConfig = {
  slug: 'categories', admin: { useAsTitle: 'name', group: 'Library' },
  access: { read: () => true, create: authenticated, update: authenticated, delete: adminOnly },
  fields: [{ name: 'name', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'color', type: 'text', defaultValue: '#eee2f7', admin: { description: 'Badge background, e.g. #eee2f7' }, validate: (v: unknown) => /^#[\da-f]{6}$/i.test(String(v)) || 'Use a six-digit hex color.' }],
}
export const Articles: CollectionConfig = {
  slug: 'articles', admin: { useAsTitle: 'title', group: 'Archive', defaultColumns: ['title', 'category', 'archiveDate', '_status'],
    preview: (data) => `/preview?slug=${encodeURIComponent(data.slug as string)}`,
    livePreview: { url: ({ data }) => `/preview?slug=${encodeURIComponent(data.slug as string)}`, breakpoints: [
      { label: 'Mobile', name: 'mobile', width: 390, height: 844 }, { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
    ] },
  },
  access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: authenticated },
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 30 },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, validate: (v: unknown) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(v)) || 'Use lowercase words separated by hyphens.' },
    { type: 'row', fields: [{ name: 'category', type: 'relationship', relationTo: 'categories', required: true },
      { name: 'archiveDate', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
      { name: 'order', type: 'number', defaultValue: 0, admin: { description: 'Order within the same date; lower numbers come first.' } }] },
    urlField('sourceUrl', 'Source link'),
    { name: 'description', type: 'textarea', admin: { description: 'Short description used for search and link previews.' } },
    { name: 'gallery', type: 'array', minRows: 1, required: true, labels: { singular: 'Gallery card', plural: 'Gallery cards' },
      admin: { description: 'Drag rows to arrange the images shown in Timeline, Surf, and Index.' },
      fields: [mediaField('media'), { name: 'caption', type: 'text' }] },
    { name: 'body', type: 'blocks', blocks: [richTextBlock, mediaBlock, pairBlock, embedBlock] },
  ],
}
export const Site: GlobalConfig = {
  slug: 'site', label: 'Site & About', admin: { group: 'Settings' }, access: { read: () => true, update: adminOnly },
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Identity', fields: [
        { name: 'brand', type: 'text', defaultValue: 'Better Off®', required: true },
        { name: 'title', type: 'text', defaultValue: 'KOLKATA BRAND NEWS', required: true },
        { name: 'abbreviation', type: 'text', defaultValue: 'BO®S', required: true },
        { name: 'year', type: 'text', defaultValue: '2026', required: true },
        { name: 'contactEmail', type: 'email', defaultValue: 'hello@betteroff.studio' }, urlField('studioUrl', 'Studio website'),
      ] },
      { label: 'About', fields: [
        { name: 'aboutTitle', type: 'textarea', defaultValue: 'KOLKATA\nBRAND\nNEWS' },
        { name: 'aboutIntro', type: 'textarea' }, { name: 'aboutText', type: 'textarea' },
        mediaField('aboutVideo', false), { name: 'thanks', type: 'textarea' },
        { name: 'credits', type: 'array', fields: [{ name: 'label', type: 'text', required: true }, { name: 'name', type: 'text', required: true }, urlField('url')] },
      ] },
      { label: 'Soundtrack', fields: [{ name: 'playlist', type: 'array', fields: [
        { name: 'title', type: 'text', required: true }, { name: 'artist', type: 'text', required: true }, mediaField('audio'), mediaField('artwork', false),
      ] }] },
    ] },
  ],
}
