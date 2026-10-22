import nextEnv from '@next/env'
import path from 'node:path'
import { getPayload } from 'payload'

nextEnv.loadEnvConfig(process.cwd())
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })

const text = (paragraphs: string[]) => ({
  root: { type: 'root', version: 1, format: '', indent: 0, direction: 'ltr',
    children: paragraphs.map(p => ({ type: 'paragraph', version: 1, format: '', indent: 0,
      direction: 'ltr', textFormat: 0, textStyle: '',
      children: [{ type: 'text', version: 1, text: p, format: 0, style: '', detail: 0, mode: 'normal' }] })) } })

async function upload(src: string, alt: string) {
  const filename = path.basename(src)
  const found = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
  if (found.docs[0]) return found.docs[0].id
  const doc = await payload.create({ collection: 'media', data: { alt },
    filePath: path.resolve('public', src.replace(/^\//, '')) })
  return doc.id
}

// Get or create category
const categories = new Map<string, number>()
for (const [slug, name, color] of [
  ['inspire', 'Inspire', '#eee2f7'],
  ['showcase', 'Showcase', '#def0db'],
  ['educate', 'Educate', '#e0e9fa'],
] as const) {
  const found = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 })
  const doc = found.docs[0] || await payload.create({ collection: 'categories', data: { slug, name, color } })
  categories.set(slug, doc.id)
}

const kbnArticles = [
  {
    slug: 'kbn-new-year-new-labels-jan-2026',
    title: 'New Year, New Labels',
    date: '2026-01-15T12:00:00.000Z',
    category: 'inspire',
    order: 110,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'Kolkata welcomes 2026 with a fresh wave of independent labels making noise in fashion, food, and design.',
    gallery: [{ src: '/articles/jan-2026-hero.jpg', alt: 'New labels launching in Kolkata January 2026' }],
    paragraphs: [
      'Kolkata welcomed 2026 with something different. Not the usual press releases or flashy launches, but a quieter wave of independent labels announcing themselves in the most personal way possible, through product, through story, through people.',
      'From a small leather goods brand out of Shyambazar to a plant-based skincare line launched from a Behala kitchen, the city\'s creative class started the year by putting things into the world. No runway. No agency. Just conviction.',
      'What stands out across these new ventures is a refusal to imitate. The founders we spoke to, most of them under 30, were building for Kolkata first. They understood the city\'s pace, its skepticism, and its deep loyalty to things that feel honest.',
      'The visual language of these brands is telling. Hand-drawn logos, natural textures, Bengali script used not as decoration but as identity. There is a clarity of intent here that feels earned.',
      'If January is any sign, 2026 is shaping up to be a significant year for independent brand culture in the city. Not loud, not sudden, just steady and real.',
    ],
    body_images: [{ src: '/articles/jan-2026-b1.jpg', alt: 'Kolkata brand founders at work', caption: 'Independent founders setting the tone for 2026' }],
  },
  {
    slug: 'kbn-made-in-kolkata-made-for-love-feb-2026',
    title: 'Made in Kolkata, Made for Love',
    date: '2026-02-10T12:00:00.000Z',
    category: 'showcase',
    order: 111,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'This February, Kolkata\'s artisan and gifting brands stepped into the spotlight with work that is deeply personal.',
    gallery: [{ src: '/articles/feb-2026-hero.jpg', alt: 'Handcrafted gifts from Kolkata artisans' }],
    paragraphs: [
      'There is a certain kind of brand that does not advertise itself loudly. You find it through a friend, or in a small shelf at the back of a bookstore in Hindustan Park. February brought several of these into focus.',
      'Kolkata has always had artisan culture, but what is changing now is the business layer underneath it. These makers are learning to price their work correctly, to tell their story on Instagram without losing the texture of what they do.',
      'A ceramics studio in Lake Gardens. A letterpress print shop run by two sisters in Tollygunge. A natural dye textile brand sourcing from weavers in Murshidabad. Each one doing something specific, with care.',
      'The gifting season around Valentine\'s Day brought these brands unexpected attention. Not because they marketed harder, but because people were looking for something real to give. Something that said, I thought about this.',
      'Made in Kolkata used to be a descriptor. Increasingly, it is becoming a claim worth making.',
    ],
    body_images: [
      { src: '/articles/feb-2026-b1.jpg', alt: 'Ceramic studio work in progress', caption: 'Handmade ceramics from Lake Gardens studio' },
      { src: '/articles/feb-2026-b2.jpg', alt: 'Natural dye textiles', caption: 'Natural dye process, Murshidabad sourced' },
    ],
  },
  {
    slug: 'kbn-holi-colour-report-mar-2026',
    title: 'The Holi Colour Report',
    date: '2026-03-12T12:00:00.000Z',
    category: 'educate',
    order: 112,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'Every Holi, Kolkata\'s streets become a colour lab. This year we paid attention to what that means for brand and visual culture.',
    gallery: [{ src: '/articles/mar-2026-hero.jpg', alt: 'Holi colours and street visual culture in Kolkata' }],
    paragraphs: [
      'Holi in Kolkata is not just a festival. It is a crash course in colour theory. Every lane becomes a living mood board for about six hours, and if you are paying attention, it tells you something about the city\'s visual appetite.',
      'This year we noticed something specific. The colours people reached for, the gulal shades most visible across Park Circus and Gariahat and Uttarpara, leaned earthy. Burnt orange. Muted pink. Deep turmeric. Not the neon that had dominated recent years.',
      'Brand designers we spoke to found this meaningful. One creative director put it plainly: Kolkata is moving toward depth. The flashy is getting tired. People want something that holds.',
      'Three local brands launched Holi-adjacent campaigns this year with natural, plant-based gulal as their anchor. Each sold out before the day. The colour palette they chose matched exactly what was in the streets.',
      'The street does not lie. If you want to know what Kolkata is feeling, watch what it reaches for when it plays.',
    ],
    body_images: [{ src: '/articles/mar-2026-b1.jpg', alt: 'Earthy Holi colours in Kolkata streets', caption: 'Natural gulal and earthy tones dominating Holi 2026' }],
  },
  {
    slug: 'kbn-summer-edit-apr-2026',
    title: 'The Summer Edit',
    date: '2026-04-08T12:00:00.000Z',
    category: 'showcase',
    order: 113,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'Kolkata summer is brutal. These brands are building for it honestly, designing for heat, sweat, and the city\'s particular pace.',
    gallery: [{ src: '/articles/apr-2026-hero.jpg', alt: 'Summer fashion and lifestyle brands Kolkata 2026' }],
    paragraphs: [
      'April in Kolkata is not for the faint-hearted. Forty degrees, humidity that wraps around you before you step outside, the city moving at a different frequency. Most fashion brands do not design for this. They design for air conditioning.',
      'A few are changing that. A clothing brand from New Town is making garments in handloom cotton with construction that accounts for sweat. A footwear label in Kasba is building sandals with natural soles and open structures because closed shoes in April are a statement of either vanity or suffering.',
      'There is also a growing conversation around summer food culture and brand. Cold brew coffee sold from a bicycle in Ballygunge. Local sherbet brands getting proper packaging and distribution for the first time.',
      'What connects all of these is honesty about context. They are not pretending Kolkata summer is something to be romanticized. They are building things that help you survive it with some dignity.',
      'Designing for the actual city, not an imagined one, is maybe the most Kolkata thing a brand can do right now.',
    ],
    body_images: [
      { src: '/articles/apr-2026-b1.jpg', alt: 'Handloom cotton summer garments', caption: 'Handloom cotton, built for Kolkata heat' },
      { src: '/articles/apr-2026-b2.jpg', alt: 'Natural sandals and footwear', caption: 'Open-structure sandals from Kasba label' },
    ],
  },
  {
    slug: 'kbn-coffee-culture-may-2026',
    title: 'Coffee Culture and the New Kolkata Cafe',
    date: '2026-05-05T12:00:00.000Z',
    category: 'inspire',
    order: 114,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'Kolkata has always had chai. But something is shifting. A new generation of cafe brands is building something different in the city.',
    gallery: [{ src: '/articles/may-2026-hero.jpg', alt: 'New cafe culture emerging in Kolkata 2026' }],
    paragraphs: [
      'Kolkata has always been a tea city. That is not changing. But alongside the established adda culture and the old-school Flurys crowd, something new is taking shape. It is quiet, it is considered, and it is very good at making coffee.',
      'Three cafes opened in the last six months with a specific point of view. Not just about the drink, but about the space, the brand, the feeling they were engineering. One in Jodhpur Park, one in Salt Lake, one in a converted house near Rabindra Sarani.',
      'Each is doing something interesting with branding. The Jodhpur Park one has essentially no signage. You find it by address. The Salt Lake cafe publishes a weekly newsletter about single-origin sourcing that has a mailing list of 800 people. The Rabindra Sarani one is Bengali-language first, both in its menu and its social media.',
      'What these cafes share is an understanding that Kolkata does not need another generic third-wave coffee brand. They are building for the city\'s particular intellectual curiosity and its deep comfort with slowness.',
      'The best new Kolkata cafe is not the loudest one. It is the one that trusts you to find it.',
    ],
    body_images: [{ src: '/articles/may-2026-b1.jpg', alt: 'Interior of new Kolkata specialty cafe', caption: 'Considered space design at a new Jodhpur Park cafe' }],
  },
  {
    slug: 'kbn-monsoon-uniform-jun-2026',
    title: 'The Monsoon Uniform',
    date: '2026-06-18T12:00:00.000Z',
    category: 'educate',
    order: 115,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'What do you wear when it rains for four months? Kolkata has always had answers. Now its brands are catching up.',
    gallery: [{ src: '/articles/jun-2026-hero.jpg', alt: 'Monsoon fashion and dressing in Kolkata' }],
    paragraphs: [
      'The monsoon arrives and Kolkata becomes itself fully. The streets flood a little, the air smells like earth, and the pace changes. You start dressing differently without thinking about it. Lighter fabrics. Darker colours that do not show what the city puts on you.',
      'For a long time, monsoon dressing in Kolkata was informal adaptation, people making do. Now there are brands thinking deliberately about it. A sustainable label in Howrah makes a full rain kit, from a waxed cotton overcoat to quick-dry linen trousers. A bag brand in Park Street has a season-specific line built around waterproof materials and minimalist shapes.',
      'What is interesting is how they are communicating this. The Howrah brand ran a campaign this year that was just photographs of the city in rain. No models. No copy except the product name and a price. It performed better than anything they had done before.',
      'There is a visual grammar to Kolkata monsoon that the city\'s brands are starting to speak in. Muted tones. Natural textures. A sense of practicality that does not sacrifice feeling.',
      'When you dress for the monsoon in Kolkata, you are not dressing against the weather. You are dressing with it.',
    ],
    body_images: [
      { src: '/articles/jun-2026-b1.jpg', alt: 'Waxed cotton rain gear on Kolkata streets', caption: 'Waxed cotton and linen, the Howrah rain kit' },
      { src: '/articles/jun-2026-b2.jpg', alt: 'Waterproof bags for monsoon season', caption: 'Minimal waterproof bags, Park Street label' },
    ],
  },
  {
    slug: 'kbn-rath-yatra-brands-jul-2026',
    title: 'Rath Yatra and the Brands That Showed Up',
    date: '2026-07-02T12:00:00.000Z',
    category: 'inspire',
    order: 116,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'Rath Yatra is one of the biggest street events in Kolkata. Some brands are finally learning how to be present without being intrusive.',
    gallery: [{ src: '/articles/jul-2026-hero.jpg', alt: 'Rath Yatra procession and brand presence Kolkata 2026' }],
    paragraphs: [
      'Rath Yatra draws millions onto the streets of Kolkata. It is not a sponsorship opportunity. Or it was not, for a long time, because the brands that tried to treat it that way got the city\'s indifference in return.',
      'But this year something shifted. A few local brands found ways to be present that felt like participation rather than advertising. A food brand set up water distribution points along the route with simple branded cups. No logo on everything, just a small mark and a QR code to their site. A textile brand donated fabric to charities associated with the Jagannath temple in Mahesh.',
      'These are not big gestures. They are the right size of gesture. Kolkata is a city that notices when you are trying to take something and when you are trying to add something. The brands that showed up this Rath Yatra added something.',
      'The photographs from the day tell the story without needing explanation. Crowds, colour, movement, and somewhere in the frame, a brand that understood it was a guest.',
      'Presence at a city\'s most sacred moments is earned, not bought. Some brands are starting to understand this.',
    ],
    body_images: [
      { src: '/articles/jul-2026-b1.jpg', alt: 'Rath Yatra crowds on Kolkata streets', caption: 'Rath Yatra, Mahesh, July 2026' },
      { src: '/articles/jul-2026-b2.jpg', alt: 'Brand water distribution at Rath Yatra', caption: 'Community water distribution, subtle brand presence' },
    ],
  },
  {
    slug: 'kbn-august-independence-brands-2026',
    title: 'August and the Independence Question',
    date: '2026-08-12T12:00:00.000Z',
    category: 'educate',
    order: 117,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'Independence Day is one of the most contested moments in Indian brand communication. What does it mean to speak authentically about it?',
    gallery: [{ src: '/articles/aug-2026-hero.jpg', alt: 'Independence Day brand campaigns India 2026' }],
    paragraphs: [
      'Every August, Indian brands face the same question: what do we do with Independence Day? The safe answer is a tricolour somewhere and a discount code. The brand graveyard is full of those.',
      'A few Kolkata brands tried something different this year. A bookstore in College Street ran a week of readings on the partition, with a small poster campaign that used archival photographs and almost no branding. A clothing brand published an essay by one of its designers on what independence means to a third-generation Bengali family from Dhaka.',
      'These were not risk-free choices. But they were specific. They said something. And in saying something, they distinguished themselves from the noise.',
      'The lesson is not to be political for its own sake. It is that generic patriotism is its own form of dishonesty. If your brand is going to speak to a moment that means this much to this many people, it should have something real to say.',
      'The brands that moved us in August 2026 were the ones that treated Independence Day as something worth thinking about, not just marking.',
    ],
    body_images: [{ src: '/articles/aug-2026-b1.jpg', alt: 'Archival independence imagery in brand campaign', caption: 'Partition archive imagery, College Street bookstore campaign' }],
  },
  {
    slug: 'kbn-pre-puja-wave-sep-2026',
    title: 'The Pre-Puja Wave',
    date: '2026-09-10T12:00:00.000Z',
    category: 'showcase',
    order: 118,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'September in Kolkata is anticipation made physical. The brands that understand this are building in a different way.',
    gallery: [{ src: '/articles/sep-2026-hero.jpg', alt: 'Pre-Durga Puja brand launches Kolkata September 2026' }],
    paragraphs: [
      'There is no month in Kolkata quite like September. Durga Puja is weeks away and the city is vibrating with it. The air changes, the colours in the market change, and the city starts to feel like it is rehearsing for something.',
      'For brands, September is the most important month of the year. More important than January. More important than Diwali. The Puja shopping window is when Kolkata opens its wallet for things that matter.',
      'This year the brands that stood out were not the ones that launched the loudest. A small jewellery brand in Burrabazar sent handwritten notes to their 200 best customers with a private preview of their Puja collection. A clothing label did a single post on Instagram, no caption, just an image. Both sold out before October.',
      'The pre-Puja consumer in Kolkata is sophisticated. They have been through many Pujas. They know what feels special and what feels rushed. The brands that earn their attention in September are the ones that seem to have been building toward this moment all year.',
      'September is when the city shows you who has been paying attention.',
    ],
    body_images: [
      { src: '/articles/sep-2026-b1.jpg', alt: 'Puja collection jewellery Burrabazar', caption: 'Private Puja collection preview, Burrabazar label' },
      { src: '/articles/sep-2026-b2.jpg', alt: 'Pre-Puja fashion collection launch', caption: 'Minimal launch, maximum anticipation' },
    ],
  },
  {
    slug: 'kbn-durga-puja-2026-brand-moments',
    title: 'Durga Puja 2026: The Brand Moments That Mattered',
    date: '2026-10-01T12:00:00.000Z',
    category: 'inspire',
    order: 119,
    sourceUrl: 'https://kolkatabrandnews.com',
    description: 'Durga Puja 2026 was the biggest yet. These are the brand moments that will be remembered long after the pandals come down.',
    gallery: [{ src: '/articles/oct-2026-hero.jpg', alt: 'Durga Puja 2026 brand moments Kolkata' }],
    paragraphs: [
      'Durga Puja 2026 was different. Not because the pandals were bigger or the crowds more enormous, though both of those things were true. It was different because the brands that showed up had clearly spent the year thinking about what it means to be part of something this large.',
      'The moment that stayed with us was not from a big label. A small clothing brand from Behala set up a free alteration stall near Ekdalia Evergreen on Saptami. No branding on the stall, just a small card with their name. They fixed sarees, helped people with last-minute adjustments, and turned down payment. By Navami, their Instagram had quadrupled.',
      'Kolkata\'s largest brands also stepped up, but with more restraint than usual. The big campaigns were less about the product and more about the city. One campaign was entirely shot by photographers from Kolkata who had never done commercial work before. The brief, apparently, was just to shoot Puja the way they would for themselves.',
      'What 2026 clarified is something Kolkata brands have been learning for a while: Durga Puja is not a marketing opportunity. It is the city\'s deepest expression of itself. The brands that understand this do not try to insert themselves. They try to belong.',
      'The pandals came down. The brands that did it right are still being talked about.',
    ],
    body_images: [
      { src: '/articles/oct-2026-b1.jpg', alt: 'Durga Puja pandal with brand presence', caption: 'Puja 2026, Ekdalia Evergreen, Saptami evening' },
      { src: '/articles/oct-2026-b2.jpg', alt: 'Community brand moments during Durga Puja', caption: 'The alteration stall that said everything' },
    ],
  },
]

let created = 0
for (const article of kbnArticles) {
  const found = await payload.find({ collection: 'articles', where: { slug: { equals: article.slug } }, limit: 1 })
  if (found.docs.length) { console.log(`Skipping (exists): ${article.slug}`); continue }

  // Upload hero image
  const heroId = await upload(article.gallery[0].src, article.gallery[0].alt)
  const gallery = [{ media: heroId }]

  // Build body: text block + image blocks
  const body: any[] = [{ blockType: 'text', content: text(article.paragraphs) }]

  if (article.body_images.length === 2) {
    // pair block
    const leftId = await upload(article.body_images[0].src, article.body_images[0].alt)
    const rightId = await upload(article.body_images[1].src, article.body_images[1].alt)
    body.push({ blockType: 'pair', left: leftId, right: rightId, caption: article.body_images[0].caption })
  } else if (article.body_images.length === 1) {
    const imgId = await upload(article.body_images[0].src, article.body_images[0].alt)
    body.push({ blockType: 'image', media: imgId, caption: article.body_images[0].caption })
  }

  await payload.create({
    collection: 'articles',
    data: {
      title: article.title,
      slug: article.slug,
      category: categories.get(article.category)!,
      archiveDate: article.date,
      order: article.order,
      sourceUrl: article.sourceUrl,
      description: article.description,
      gallery,
      body,
      _status: 'published',
    },
  })
  created++
  console.log(`Created: ${article.slug}`)
}

console.log(`\nDone. Created ${created} KBN articles.`)
await payload.destroy()
