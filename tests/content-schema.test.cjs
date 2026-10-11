const { test } = require('node:test')
const assert = require('node:assert/strict')
const { contentMetadata, isPublishedContent, filterContents, languageVersions, resolveContentRoute } = require('../lib/notion/contentSchema')
const { formatContentDate } = require('../lib/contentDate')
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

test('generated slugs resolve three languages through the original relation', () => {
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

test('legacy whitespace in slugs does not break redirects', () => {
  const raw = page('book', 'en')
  raw.properties.slug = text(' Book-01 ')
  const content = contentMetadata(raw)
  assert.equal(content.slug, 'page-book')
  assert.equal(resolveContentRoute([content], 'Book-01', 'en').redirect.destination, '/en/page-book')
  assert.equal(resolveContentRoute([content], ' Book-01 ', 'en').redirect.destination, '/en/page-book')
})

test('all slugs are automatic, stable, unique and independent of Notion slug properties', () => {
  const raw = page('ABCDEF12-3456-7890-ABCD-EF1234567890', 'zh')
  raw.properties.type = select('Post')
  raw.properties.slug = text('   ')
  const generated = contentMetadata(raw)
  assert.equal(generated.slug, 'post-abcdef1234567890abcdef1234567890')
  assert.equal(isPublishedContent(generated), true)
  assert.equal(filterContents([generated], { type: 'Post' }).length, 1)
  raw.properties.title.title = [{ plain_text: 'Changed title' }]
  assert.equal(contentMetadata(raw).slug, generated.slug)
  const translation = page('12345678-1234-1234-1234-123456789012', 'en', [raw.id])
  delete translation.properties.slug
  const translated = contentMetadata(translation)
  assert.equal(translated.slug, 'page-12345678123412341234123456789012')
  assert.notEqual(translated.slug, generated.slug)
  assert.equal(languageVersions(generated, [generated, translated])[1].slug, translated.slug)
  raw.properties.slug = text(' Post-12 ')
  assert.equal(contentMetadata(raw).slug, generated.slug)
  assert.equal(contentMetadata(raw).legacySlug, 'Post-12')
  assert.equal(resolveContentRoute([contentMetadata(raw)], 'Post-12', 'zh').redirect.destination, `/${generated.slug}`)
  raw.properties.publicationStatus = select('Draft')
  raw.properties.slug = text('')
  assert.equal(isPublishedContent(contentMetadata(raw)), false)
})

test('every public content type publishes after deleting the slug property', () => {
  for (const type of ['Post', 'Page', 'Note', 'Project', 'Musings', 'Book']) {
    const raw = page('article', 'zh')
    raw.properties.type = select(type)
    delete raw.properties.slug
    const content = contentMetadata(raw)
    assert.equal(content.slug, `${type.toLowerCase()}-article`)
    assert.equal(isPublishedContent(content), true)
  }
})

test('saved old addresses survive deletion and shared aliases resolve the requested language', () => {
  const originals = [
    page('1f02f6e1-253b-801c-8fdb-dd21641cd507', 'zh'),
    page('5e5aca34-2d6e-45d6-a6cf-c7431f874da4', 'en'),
    page('1f02f6e1-253b-80c4-85fb-c369fbabb426', 'ja')
  ]
  const contents = originals.map(raw => {
    delete raw.properties.slug
    delete raw.properties.legacySlug
    return contentMetadata(raw)
  })
  for (const content of contents) {
    assert.equal(resolveContentRoute(contents, 'about', content.language).redirect.destination,
      `${content.language === 'zh' ? '' : '/' + content.language}/${content.slug}`)
    assert.equal(resolveContentRoute(contents, content.slug, content.language).content, content)
  }
  assert.equal(resolveContentRoute(contents, 'about-en', 'zh').redirect.destination, `/${'en'}/${contents[1].slug}`)
  assert.equal(resolveContentRoute(contents, 'missing', 'zh'), null)
  assert.equal(resolveContentRoute(filterContents(contents.map(c => ({ ...c, publicationStatus: 'Draft' }))), 'about', 'zh'), null)
})

test('date-only publication dates retain the chosen day across server timezones', () => {
  const timestamp = contentMetadata(page('book', 'en')).publishedAt
  assert.equal(formatContentDate(timestamp, 'en', 'Asia/Tokyo'), 'Jan 1, 2025')
  assert.equal(formatContentDate(timestamp, 'ja', 'Asia/Tokyo'), '2025年1月1日')
  assert.equal(formatContentDate(timestamp, 'zh', 'Asia/Tokyo'), '2025年1月1日')
})
