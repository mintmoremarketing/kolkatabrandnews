import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import nextEnv from '@next/env'
import { getPayload } from 'payload'
import type { SQLiteAdapter } from '@payloadcms/db-sqlite'
import sharp from 'sharp'

nextEnv.loadEnvConfig(process.cwd())
// Never run integration mutations against the user's local or hosted archive.
if (process.env.DATABASE_URL || process.env.VERCEL || process.env.S3_ENDPOINT) throw new Error('Run CMS verification locally without production database/storage variables.')
process.env.LOCAL_DATABASE_URL = 'file::memory:'
const { default: config } = await import('../src/payload.config')
const testConfig = await config
const mediaConfig = testConfig.collections.find(c => c.slug === 'media')!
if (mediaConfig.upload && typeof mediaConfig.upload === 'object') mediaConfig.upload.disableLocalStorage = true
const payload = await getPayload({ config: testConfig })
try {
  const password = randomBytes(24).toString('hex')
  const admin = await payload.create({ collection: 'users', data: { email: 'admin@example.test', password, role: 'editor' } })
  assert.equal(admin.role, 'admin', 'First account becomes administrator')
  const editor = await payload.create({ collection: 'users', data: { email: 'editor@example.test', password, role: 'editor' }, user: admin, overrideAccess: false })
  assert.equal(editor.role, 'editor')
  await assert.rejects(payload.create({ collection: 'categories', data: { name: 'Anonymous', slug: 'anonymous' }, overrideAccess: false }))
  await assert.rejects(payload.create({ collection: 'users', data: { email: 'intruder@example.test', password, role: 'editor' }, overrideAccess: false }))
  await assert.rejects(payload.updateGlobal({ slug: 'site', data: { brand: 'Forbidden' }, user: editor, overrideAccess: false }))
  const updatedEditor = await payload.update({ collection: 'users', id: editor.id, data: { name: 'Editor', role: 'admin' }, user: editor, overrideAccess: false })
  assert.equal(updatedEditor.role, 'editor', 'Editors cannot promote themselves')
  const category = await payload.create({ collection: 'categories', data: { name: 'Test', slug: 'test' }, user: editor, overrideAccess: false })
  // Exercise upload processing in memory without touching the real media library.
  const data = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#fff' } }).png().toBuffer()
  const media = await payload.create({ collection: 'media', data: { alt: 'Test fixture' }, file: { data, mimetype: 'image/png', name: 'fixture.png', size: data.length }, user: editor, overrideAccess: false })
  const article = await payload.create({ collection: 'articles', draft: true, user: editor, overrideAccess: false,
    data: { title: 'Private draft', slug: 'test-draft', category: category.id, archiveDate: '2026-01-01T00:00:00Z', gallery: [{ media: media.id }], _status: 'draft' } })
  const publicArticles = () => payload.find({ collection: 'articles', overrideAccess: false })
  assert.equal((await publicArticles()).totalDocs, 0, 'Draft hidden from anonymous readers')
  assert.equal((await payload.find({ collection: 'articles', draft: true, overrideAccess: false, user: editor })).docs[0].title, 'Private draft')
  await payload.update({ collection: 'articles', id: article.id, data: { title: 'Published title', _status: 'published' }, user: editor, overrideAccess: false })
  assert.equal((await publicArticles()).docs[0].title, 'Published title')
  await payload.update({ collection: 'articles', id: article.id, draft: true, data: { title: 'Unpublished changes' }, user: editor, overrideAccess: false })
  assert.equal((await publicArticles()).docs[0].title, 'Published title', 'Editing draft preserves published version')
  const versions = await payload.findVersions({ collection: 'articles', where: { parent: { equals: article.id } }, sort: '-createdAt', user: editor, overrideAccess: false })
  const published = versions.docs.find(v => v.version.title === 'Published title')!
  assert.ok(published, 'Published revision stored')
  await payload.restoreVersion({ collection: 'articles', id: published.id, user: editor, overrideAccess: false })
  assert.equal((await publicArticles()).docs[0].title, 'Published title', 'Revision can be restored')
  await payload.update({ collection: 'articles', id: article.id, data: { _status: 'draft' }, user: editor, overrideAccess: false })
  assert.equal((await publicArticles()).totalDocs, 0, 'Unpublish removes public article')
  console.log('CMS verification passed: bootstrap, permissions, private drafts, publishing, draft isolation, revisions, unpublishing.')
} finally {
  await payload.destroy()
  ;(payload.db as unknown as SQLiteAdapter).client.close()
}
// Payload background timers outlive the isolated test app.
process.exit(0)
