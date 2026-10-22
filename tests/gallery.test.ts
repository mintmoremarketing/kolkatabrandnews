import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGallery, damp, safeExternalUrl, wrap } from '../src/lib/gallery'
import type { Article } from '../src/lib/types'
const article = (id: number, date: string, order: number, count = 1): Article => ({ id, date, order, slug: `article-${id}`, title: `Story ${id}`, category: 'Inspire', body: [], gallery: Array.from({ length: count }, () => ({ src: '/test.jpg', width: 800, height: 1000, alt: 'Test' })) })
test('chronology is descending and multiple images retain their article relationship', () => {
  const items = buildGallery([article(1,'2025-12-01',0),article(2,'2026-03-01',1,2),article(3,'2026-03-01',0)])
  assert.deepEqual(items.map(i => i.article.id),[3,2,2,1])
  assert.deepEqual(items.map(i => i.index),[0,1,2,3])
  assert.equal(new Set(items.map(i => i.key)).size,4)
  assert.equal(items[0].month,'March')
  assert.equal(items[3].year,'2025')
})
test('cyclic positions remain valid when dragging in either direction', () => {
  assert.equal(wrap(-1,27),26)
  assert.equal(wrap(54,27),0)
  assert.equal(wrap(1,0),0)
})
test('damping is frame-rate independent and never overshoots', () => {
  const whole = damp(0,100,1/30)
  const halves = damp(damp(0,100,1/60),100,1/60)
  assert.ok(Math.abs(whole-halves) < 0.00001)
  assert.ok(damp(99,100,.05) < 100)
  assert.ok(damp(100,0,.05) > 0)
})
test('source links reject executable and malformed protocols', () => {
  assert.equal(safeExternalUrl('javascript:alert(1)'),undefined)
  assert.equal(safeExternalUrl('data:text/html,hello'),undefined)
  assert.equal(safeExternalUrl('not a url'),undefined)
  assert.equal(safeExternalUrl('https://example.com'),'https://example.com/')
})
