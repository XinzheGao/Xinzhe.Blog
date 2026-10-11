const { test } = require('node:test')
const assert = require('node:assert/strict')
const { contentMetadata, isPublishedContent, filterContents, languageVersions } = require('../lib/notion/contentSchema')
const select = name => ({ type: 'select', select: { name } })
const text = value => ({ type: 'rich_text', rich_text: [{ plain_text: value }] })
const page = (id, language, source = []) => ({
  id, created_time: '2025-01-01T00:00:00Z', last_edited_time: '2025-01-02T00:00:00Z',
  properties: {
    title: { type: 'title', title: [{ plain_text: 'About' }] },
    slug: text('about'), language: select(language), type: select('Page'),
    publicationStatus: select('Published'), publishedAt: { type: 'date', date: { start: '2025-01-01' } },
    source: { type: 'relation', relation: source.map(id => ({ id })) }
  }
})

test('same slug resolves three languages through the original relation', () => {
  const contents = [page('zh', 'zh'), page('en', 'en', ['zh']), page('ja', 'ja', ['zh'])]
    .map(p => contentMetadata(p, '/cover.png'))
  assert.equal(filterContents(contents, { type: 'Page', language: 'en' })[0].id, 'en')
  assert.deepEqual(languageVersions(contents[1], contents).map(v => v.language).sort(), ['en', 'ja', 'zh'])
  const available = filterContents(contents.filter(c => c.language !== 'ja'))
  assert.deepEqual(languageVersions(contents[1], available).map(v => v.language).sort(), ['en', 'zh'])
})

test('manual dates do not fall back to creation time; drafts and future dates stay private', () => {
  const raw = page('article', 'zh')
  raw.properties.publishedAt.date = null
  assert.equal(isPublishedContent(contentMetadata(raw)), false)
  raw.properties.publishedAt.date = { start: '2099-01-01' }
  assert.equal(isPublishedContent(contentMetadata(raw)), false)
  raw.properties.publishedAt.date = { start: '2025-01-01' }
  raw.properties.publicationStatus = select('Draft')
  assert.equal(isPublishedContent(contentMetadata(raw)), false)
})

test('section introductions use section and language without requiring a public slug', () => {
  const raw = page('intro', 'ja')
  raw.properties.slug = text('')
  raw.properties.type = select('SectionIntro')
  raw.properties.section = select('musings')
  const intro = contentMetadata(raw)
  assert.equal(isPublishedContent(intro), true)
  assert.equal(filterContents([intro]).length, 0)
  assert.equal(filterContents([intro], { type: 'SectionIntro', language: 'ja' }).length, 1)
})
