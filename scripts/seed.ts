import nextEnv from '@next/env'
import path from 'node:path'
import { getPayload } from 'payload'
import reference from '../src/data/reference.json'
import playlist from '../src/data/playlist.json'
import { defaultSettings } from '../src/lib/defaults'

nextEnv.loadEnvConfig(process.cwd())
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const text = (paragraphs: string[]) => ({ root: { type: 'root', version: 1, format: '', indent: 0, direction: 'ltr', children: paragraphs.map(p => ({ type: 'paragraph', version: 1, format: '', indent: 0, direction: 'ltr', textFormat: 0, textStyle: '', children: [{ type: 'text', version: 1, text: p, format: 0, style: '', detail: 0, mode: 'normal' }] })) } })
const categories = new Map<string, number>()
for (const [slug,name,color] of [['inspire','Inspire','#eee2f7'],['showcase','Showcase','#def0db'],['educate','Educate','#e0e9fa']]) {
  const found = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 })
  const doc = found.docs[0] || await payload.create({ collection: 'categories', data: { slug,name,color } })
  categories.set(slug,doc.id)
}
const mediaIds = new Map<string, number>()
async function upload(src: string, alt: string) {
  if (mediaIds.has(src)) return mediaIds.get(src)!
  const filename = path.basename(src)
  const found = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
  const doc = found.docs[0] || await payload.create({ collection: 'media', data: { alt }, filePath: path.resolve('public',src.replace(/^\//,'')) })
  mediaIds.set(src,doc.id)
  return doc.id
}
let created = 0
for (const article of reference) {
  const found = await payload.find({ collection: 'articles', where: { slug: { equals: article.slug } }, limit: 1 })
  if (found.docs.length) continue
  const gallery = []
  for (const media of article.gallery) gallery.push({ media: await upload(media.src,media.alt) })
  const body: any[] = [{ blockType: 'text', content: text(article.paragraphs) }]
  if (article.slug === 'defective-units-vol-1') body.push({ blockType: 'embed', url: 'https://www.youtube-nocookie.com/embed/cIFqyLFVG4g', title: 'Defective Units — Volume 1' })
  for (const g of gallery) body.push({ blockType: 'image', media: g.media })
  await payload.create({ collection: 'articles', data: { title: article.title, slug: article.slug, category: categories.get(article.category)!, archiveDate: `${article.date}T12:00:00.000Z`, order: article.order, sourceUrl: article.sourceUrl, description: article.paragraphs[0], gallery, body, _status: 'published' } })
  created++
  console.log(`Seeded ${article.slug}`)
}
const site = await payload.findGlobal({ slug: 'site' })
if (!(site as any).aboutIntro) {
  const tracks = []
  for (const track of playlist) tracks.push({ title: track.title, artist: track.artist, audio: await upload(track.src,`${track.artist} — ${track.title}`), artwork: await upload(track.artwork,`${track.artist} album artwork`) })
  await payload.updateGlobal({ slug: 'site', data: { ...defaultSettings, aboutVideo: await upload('/reference/globe.mp4','Rotating metallic Better Off globe'), playlist: tracks } })
}
if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
  const existing = await payload.count({ collection: 'users' })
  if (!existing.totalDocs) await payload.create({ collection: 'users', data: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, role: 'admin', name: 'Administrator' } })
}
console.log(`Done. Created ${created} articles. Existing content was left unchanged.`)
await payload.destroy()
