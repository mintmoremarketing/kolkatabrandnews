/** Import the first ten distinct articles from the public reference archive.
 * Run with `node scripts/import-reference.mjs`. Existing downloaded assets are reused.
 * The article summaries are demo editorial copy, not copied article bodies.
 */
import { mkdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const origin = 'https://tlb.betteroff.studio'
const provenance = []
const summaries = {
  'defective-units-vol-1': ['Former’s Defective Units brings surf culture, movement, and an unpolished visual attitude into focus. A collection of moments worth coming back to.', 'Explore the original film and collection through the source link.'],
  '99-cents-only-store-gallery-exhibition': ['A familiar retail setting becomes a new context for looking at art. The 99 Cents Only Store Gallery exhibition places colour, objects, and everyday references side by side.', 'A reminder to find visual inspiration in unexpected places. Follow the source to see more from the exhibition.'],
  'the-legend-of-phil-shao': ['A look back at Phil Shao through skateboarding, photographs, and film. These images capture the energy and personality surrounding a singular skater.', 'Watch the documentary at Thrasher through the original source.'],
  'jellyfish-by-pharrell-from-virginia': ['Pharrell’s Virginia Adistar Jellyfish brings a distinctive silhouette to the archive. Layered forms and confident proportions make the shoe a study in product design.', 'See the details and original release at adidas.'],
  'adollarap-rocky-punk-rocky': ['Punk Rocky combines music and a striking visual world. The selected stills bring together character, colour, and a playful cinematic sensibility.', 'Watch the original A$AP Rocky video through the source link.'],
  'get-happly': ['A selection from Get Happly, collected for its confident graphic language and sense of personality. Expressive details carry the identity across the work.', 'Visit the original project to explore the full experience.'],
  'winter-x-games-2026': ['Snow, speed, and scale at the 2026 Winter X Games. A few frames from Aspen capture the visual energy of competition.', 'Explore the event and its athletes at the original source.'],
  'bo-reset-the-standard': ['A selection of identity and motion work from Better Off Studio. Bold typography and graphic rhythm bring the studio’s point of view into focus.', 'Explore more of the studio’s work through the source link.'],
  'andrew-dutton-sneaker-shots': ['Sneaker photography by Andrew Dutton, collected for its attention to light, texture, and composition. Familiar products become compelling images through a considered point of view.', 'See more of Dutton’s photography at the original source.'],
  'photography-by-estevan-oriol': ['A selection of images by photographer Estevan Oriol. Portraiture, place, and culture come together in a distinctive photographic voice.', 'Explore the photographer’s wider body of work through the original source.'],
}

async function fetchChecked(url) {
  let error
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90000) })
      if (!response.ok) throw new Error(`${response.status}: ${url}`)
      return response
    } catch (cause) { error = cause }
  }
  throw error
}

function decodePayload(html) {
  const match = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)<\/script>/s)
  if (!match) throw new Error('Reference payload was not found')
  const flattened = JSON.parse(match[1])
  const memo = new Map()
  function decode(index) {
    if (index < 0) return null
    if (memo.has(index)) return memo.get(index)
    const value = flattened[index]
    if (value === null || typeof value !== 'object') return value
    const result = Array.isArray(value) ? [] : {}
    memo.set(index, result)
    if (Array.isArray(value)) {
      value.forEach(item => result.push(typeof item === 'number' ? decode(item) : item))
    } else {
      for (const [key, item] of Object.entries(value)) result[key] = decode(item)
    }
    return result
  }
  return decode(0).pinia.main
}

async function download(url, destination) {
  const file = path.join(root, 'public', destination)
  await mkdir(path.dirname(file), { recursive: true })
  const existing = await stat(file).catch(() => null)
  if (!existing?.size) {
    const response = await fetchChecked(url)
    await writeFile(file, Buffer.from(await response.arrayBuffer()))
  }
  const { size } = await stat(file)
  provenance.push({ source: url, local: `/${destination}`, bytes: size })
  return `/${destination}`
}

const html = await (await fetchChecked(origin)).text()
const data = decodePayload(html)
const slugs = [...new Set([...html.matchAll(/data-url="\/articles\/([^"?#]+)/g)].map(match => match[1]))].slice(0, 10)
if (slugs.length !== 10) throw new Error('Expected ten distinct sample article routes')
const articles = []
for (const [order, slug] of slugs.entries()) {
  const item = data.articles.find(article => article.slug === slug)
  if (!item) throw new Error(`Missing reference data: ${slug}`)
  const gallery = []
  for (const [index, media] of item.images.entries()) {
    const stem = `reference/${slug}-${index + 1}`
    if (media.video) {
      const src = await download(media.video.mp4low, `${stem}.mp4`)
      const poster = await download(`${media.video.thumbnailUrl}?width=800`, `${stem}-poster.jpg`)
      gallery.push({ src, poster, type: 'video', width: media.width, height: media.height, alt: `${item.title} — ${index + 1}` })
    } else {
      const url = new URL(media.small)
      url.searchParams.set('w', '1000')
      url.searchParams.set('h', '1000')
      const ext = path.extname(url.pathname) || '.jpg'
      const src = await download(url.href, `${stem}${ext}`)
      gallery.push({ src, width: media.width, height: media.height, alt: media.alt || `${item.title} — ${index + 1}`, type: 'image' })
    }
  }
  articles.push({ slug, title: item.title, category: item.tag.slug, date: item.date, order, sourceUrl: item.url, paragraphs: summaries[slug], gallery })
  console.log(`Imported ${order + 1}/10: ${item.title} (${gallery.length} assets)`)
}

for (const [name, source] of Object.entries({
  bold: '/_nuxt/PPNeueMontreal-Bold.l3ulKZJq.woff2',
  medium: '/_nuxt/PPNeueMontreal-Medium.BCmCQQaX.woff2',
  book: '/_nuxt/PPNeueMontreal-Book.Oo-9ba79.woff2',
  mono: '/_nuxt/PPNeueMontrealMono-Medium.DUem7D_U.woff2',
})) await download(`${origin}${source}`, `fonts/${name}.woff2`)

await download(`${origin}/render-big.mp4`, 'reference/globe.mp4')
const playlist = []
for (const [index, track] of data.global.tracks.slice(0, 5).entries()) {
  const src = await download(track.mp3.url, `reference/track-${index + 1}.mp3`)
  const artwork = await download(track.thumbnail.src, `reference/track-${index + 1}.jpg`)
  playlist.push({ title: track.title, artist: track.artist, src, artwork })
}
await mkdir(path.join(root, 'src/data'), { recursive: true })
await writeFile(path.join(root, 'src/data/reference.json'), JSON.stringify(articles, null, 2) + '\n')
await writeFile(path.join(root, 'src/data/playlist.json'), JSON.stringify(playlist, null, 2) + '\n')
await writeFile(path.join(root, 'public/reference/source-manifest.json'), JSON.stringify({ reference: origin, importedAt: new Date().toISOString(), sampleCount: 10, articleCopy: 'Original demo summaries; reference titles, metadata, and media retained for design reproduction.', assets: provenance }, null, 2) + '\n')
console.log(`Done: ${articles.length} articles, ${articles.reduce((count, article) => count + article.gallery.length, 0)} gallery entries, ${playlist.length} tracks.`)
