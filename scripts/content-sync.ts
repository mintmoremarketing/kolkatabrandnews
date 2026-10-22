// Copy published articles + site text from one database to another.
//   Export (local SQLite):        npx tsx scripts/content-sync.ts export <file.json>
//   Import (Postgres + S3 env):   npx tsx scripts/content-sync.ts import <file.json>
// Import REPLACES every article in the target database with the exported ones.
import nextEnv from '@next/env'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

nextEnv.loadEnvConfig(process.cwd())
const [mode, file] = process.argv.slice(2)
if (!['export', 'import'].includes(mode) || !file) throw new Error('Usage: content-sync.ts export|import <file.json>')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })

type MediaRef = { filename: string; alt: string; caption?: string; sourceUrl?: string }
const siteFields = ['brand', 'title', 'abbreviation', 'year', 'contactEmail', 'studioUrl', 'aboutTitle', 'aboutIntro', 'aboutText', 'thanks'] as const
const strip = ({ id, ...rest }: any) => rest

if (mode === 'export') {
  const media = new Map<string, MediaRef>()
  const ref = (m: any) => {
    if (!m || typeof m !== 'object') return null
    media.set(m.filename, { filename: m.filename, alt: m.alt, caption: m.caption || undefined, sourceUrl: m.sourceUrl || undefined })
    return m.filename as string
  }
  const { docs } = await payload.find({ collection: 'articles', limit: 1000, depth: 1, where: { _status: { equals: 'published' } } })
  const articles = docs.map((a: any) => ({
    title: a.title, slug: a.slug, archiveDate: a.archiveDate, order: a.order, sourceUrl: a.sourceUrl, description: a.description,
    category: { slug: a.category.slug, name: a.category.name, color: a.category.color },
    gallery: a.gallery.map((g: any) => ({ media: ref(g.media), caption: g.caption || undefined })),
    body: (a.body || []).map((b: any) => {
      const block = strip(b)
      for (const key of ['media', 'left', 'right']) if (key in block) block[key] = ref(block[key])
      return block
    }),
  }))
  const raw = await payload.findGlobal({ slug: 'site', depth: 0 }) as any
  const site = Object.fromEntries([...siteFields.map(k => [k, raw[k]]), ['credits', (raw.credits || []).map(strip)]])
  fs.writeFileSync(file, JSON.stringify({ articles, media: [...media.values()], site }, null, 2))
  console.log(`Exported ${articles.length} articles and ${media.size} media files to ${file}`)
} else {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const mediaIds = new Map<string, number | string>()
  for (const m of data.media as MediaRef[]) {
    const found = await payload.find({ collection: 'media', where: { filename: { equals: m.filename } }, limit: 1 })
    const doc = found.docs[0] || await payload.create({ collection: 'media', data: { alt: m.alt, caption: m.caption, sourceUrl: m.sourceUrl },
      filePath: path.resolve('media', m.filename) })
    if (!found.docs[0]) console.log(`Uploaded ${m.filename}`)
    mediaIds.set(m.filename, doc.id)
  }
  const id = (filename: string | null) => filename ? mediaIds.get(filename) : undefined
  const categories = new Map<string, number | string>()
  for (const c of new Map(data.articles.map((a: any) => [a.category.slug, a.category])).values() as Iterable<any>) {
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: c.slug } }, limit: 1 })
    categories.set(c.slug, (found.docs[0] || await payload.create({ collection: 'categories', data: c })).id)
  }
  const removed = await payload.delete({ collection: 'articles', where: { id: { exists: true } } })
  console.log(`Removed ${removed.docs.length} existing articles`)
  for (const a of data.articles) {
    await payload.create({ collection: 'articles', data: {
      ...a, category: categories.get(a.category.slug),
      gallery: a.gallery.map((g: any) => ({ ...g, media: id(g.media) })),
      body: a.body.map((b: any) => {
        const block = { ...b }
        for (const key of ['media', 'left', 'right']) if (key in block) block[key] = id(block[key])
        return block
      }),
      _status: 'published',
    } })
    console.log(`Created ${a.slug}`)
  }
  await payload.updateGlobal({ slug: 'site', data: data.site })
  console.log(`Done. ${data.articles.length} articles, site text updated.`)
}
await payload.destroy()
process.exit(0)
