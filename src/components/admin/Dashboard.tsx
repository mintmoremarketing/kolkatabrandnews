import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function Dashboard() {
  const payload = await getPayload({ config: configPromise })

  const [articlesRes, categoriesRes, mediaRes] = await Promise.all([
    payload.find({ collection: 'articles', limit: 12, sort: '-archiveDate', depth: 1,
      select: { title: true, slug: true, archiveDate: true, gallery: true, category: true, _status: true } as any }),
    payload.find({ collection: 'categories', limit: 100 }),
    payload.count({ collection: 'media' }),
  ])

  const articles = articlesRes.docs as any[]
  const categories = categoriesRes.docs as any[]
  const categoryMap: Record<string, any> = {}
  for (const cat of categories) categoryMap[typeof cat === 'object' ? cat.id : cat] = cat

  const fmt = (d: string) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

  return (
    <div style={s.root}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Kolkata Brand News</p>
          <h1 style={s.title}>Archive</h1>
        </div>
        <a href="/admin/collections/articles/create" style={s.createBtn}>+ New Article</a>
      </div>

      {/* ── Stats ── */}
      <div style={s.statsRow}>
        <Stat label="Articles" value={articlesRes.totalDocs} href="/admin/collections/articles" />
        <Stat label="Categories" value={categoriesRes.totalDocs} href="/admin/collections/categories" />
        <Stat label="Media files" value={mediaRes.totalDocs} href="/admin/collections/media" />
        {articles[0]?.archiveDate && (() => {
          const d = new Date(articles[0].archiveDate)
          const monthDay = d.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(' ', ' ')
          const year = d.getUTCFullYear()
          return <Stat label="Latest entry" value={<>{monthDay}<span style={{ fontSize: 16, opacity: 0.55, display: 'block', marginTop: 2, letterSpacing: 0 }}>{year}</span></>} href={`/admin/collections/articles/${articles[0].id}`} />
        })()}
      </div>

      {/* ── Quick nav ── */}
      <div style={s.quickNav}>
        <a href="/admin/collections/articles" style={s.quickLink}>All Articles →</a>
        <a href="/admin/collections/media" style={s.quickLink}>Media Library →</a>
        <a href="/admin/globals/site" style={s.quickLink}>Site Settings →</a>
        <a href="/" target="_blank" rel="noreferrer" style={s.quickLink}>View Archive ↗</a>
      </div>

      {/* ── Section heading ── */}
      <div style={s.sectionHead}>
        <span style={s.sectionLabel}>Recent articles</span>
        <a href="/admin/collections/articles" style={s.viewAll}>View all →</a>
      </div>

      {/* ── Article grid ── */}
      <div style={s.grid}>
        {articles.map((article: any) => {
          const media = article.gallery?.[0]?.media
          const thumb = (typeof media === 'object' && media !== null)
            ? (media.sizes?.thumbnail?.url || media.url)
            : null
          const catObj = typeof article.category === 'object' ? article.category : categoryMap[article.category]
          const catName = catObj?.name ?? ''
          const catColor = catObj?.color ?? '#2a2a2a'
          const isDraft = article._status === 'draft'
          return (
            <a key={article.id} href={`/admin/collections/articles/${article.id}`} style={s.card}>
              <div style={{ ...s.cardThumb, background: catColor + '33' }}>
                {thumb && <img src={thumb} alt={article.title} style={s.cardImg} />}
                {!thumb && <span style={s.cardNoThumb}>No image</span>}
                {isDraft && <span style={s.draftBadge}>Draft</span>}
              </div>
              <div style={s.cardBody}>
                {catName && (
                  <span style={{ ...s.catTag, background: catColor, color: isLight(catColor) ? '#111' : '#fff' }}>
                    {catName}
                  </span>
                )}
                <p style={s.cardTitle}>{article.title}</p>
                {article.archiveDate && <time style={s.cardDate}>{fmt(article.archiveDate)}</time>}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, href }: { label: string; value: number | string | React.ReactNode; href?: string }) {
  const inner = (
    <>
      <span style={s.statValue}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </>
  )
  return href
    ? <a href={href} style={s.stat}>{inner}</a>
    : <div style={s.stat}>{inner}</div>
}

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

const s: Record<string, React.CSSProperties> = {
  root: { padding: '40px 48px 80px', maxWidth: 1200, fontFamily: 'var(--font-body, inherit)' },
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, paddingBottom: 24, borderBottom: '1px solid var(--theme-elevation-150)' },
  eyebrow: { fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--theme-elevation-600)', margin: '0 0 6px' },
  title: { fontSize: 44, fontWeight: 500, letterSpacing: '-2px', margin: 0, color: 'var(--theme-elevation-1000)', lineHeight: 1 },
  createBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--theme-elevation-900)', color: 'var(--theme-elevation-0)', padding: '10px 20px', borderRadius: 6, fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '-0.02em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 500 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  stat: { display: 'flex', flexDirection: 'column', gap: 4, padding: '20px 24px', background: 'var(--theme-elevation-100)', borderRadius: 8, border: '1px solid var(--theme-elevation-150)', textDecoration: 'none', cursor: 'pointer', transition: 'border-color .15s' },
  statValue: { fontSize: 28, fontWeight: 500, letterSpacing: '-1.5px', color: 'var(--theme-elevation-1000)', lineHeight: 1 },
  statLabel: { fontFamily: 'var(--font-mono, monospace)', fontSize: 10, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--theme-elevation-600)' },
  quickNav: { display: 'flex', gap: 8, marginBottom: 48, flexWrap: 'wrap' },
  quickLink: { fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '-0.02em', textTransform: 'uppercase', padding: '8px 14px', border: '1px solid var(--theme-elevation-200)', borderRadius: 4, color: 'var(--theme-elevation-800)', textDecoration: 'none' },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionLabel: { fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--theme-elevation-600)' },
  viewAll: { fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '-0.02em', color: 'var(--theme-elevation-600)', textDecoration: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  card: { display: 'flex', flexDirection: 'column', background: 'var(--theme-elevation-100)', border: '1px solid var(--theme-elevation-150)', borderRadius: 8, overflow: 'hidden', textDecoration: 'none', transition: 'border-color .15s, transform .15s', color: 'inherit' },
  cardThumb: { position: 'relative', aspectRatio: '3/2', overflow: 'hidden', flexShrink: 0 },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardNoThumb: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', color: 'var(--theme-elevation-500)' },
  draftBadge: { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.6)', color: '#fff', fontFamily: 'var(--font-mono, monospace)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '-0.01em', padding: '3px 7px', borderRadius: 3 },
  cardBody: { padding: '14px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  catTag: { display: 'inline-block', fontFamily: 'var(--font-mono, monospace)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '-0.01em', padding: '3px 8px', borderRadius: 3, fontWeight: 500, alignSelf: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: 500, lineHeight: 1.3, letterSpacing: '-0.03em', margin: 0, color: 'var(--theme-elevation-1000)' },
  cardDate: { fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'var(--theme-elevation-600)', marginTop: 'auto', paddingTop: 4 },
}
