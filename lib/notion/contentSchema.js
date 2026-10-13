const { pageProperties } = require('./officialAdapter')
const savedLegacySlugs = require('./legacySlugs.json')
const dayjs = require('dayjs')
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.extend(require('dayjs/plugin/timezone'))

const first = value => Array.isArray(value) ? value[0] : value

function contentMetadata(page, defaultCover, timezone = 'Asia/Shanghai') {
  const p = pageProperties(page, defaultCover)
  const type = first(p.type) || null
  const language = first(p.language) || null
  const date = p.publishedAt?.start
  // Page IDs keep generated URLs stable even when titles are edited.
  const pageId = (page.id || '').replace(/-/g, '').toLowerCase()
  const generatedSlug = pageId && ['Post', 'Page', 'Note', 'Project', 'Musings', 'Book'].includes(type)
    ? `${type.toLowerCase()}-${pageId}`
    : ''
  const legacySlugs = [...new Set([
    ...(savedLegacySlugs[pageId] || []), p.legacySlug, p.slug
  ].map(value => (value || '').trim()).filter(Boolean))]
  return {
    id: page.id, title: p.title || '', summary: p.summary || '', tags: p.tags || [],
    slug: generatedSlug,
    legacySlug: (p.legacySlug || p.slug || '').trim(),
    legacySlugs,
    type, language, publicationStatus: first(p.publicationStatus) || null,
    // 纯日期按站点时区解释；带偏移的时间保留原始时刻。
    publishedAt: date ? (/^\d{4}-\d{2}-\d{2}$/.test(date)
      ? dayjs.tz(date, timezone).valueOf()
      : dayjs(date).valueOf()) : null,
    section: first(p.section) || null,
    source: p.source || [], translations: p.translations || [],
    createdAt: page.created_time, lastEditedAt: page.last_edited_time,
    page_cover: p.page_cover || defaultCover || '', fullWidth: p.fullWidth
  }
}

function isPublishedContent(content, now = Date.now()) {
  return Boolean(content.title && content.publicationStatus === 'Published' &&
    content.publishedAt !== null && content.publishedAt <= now &&
    (content.type === 'SectionIntro' ? content.section : content.slug))
}

function filterContents(contents, { type = '', language = '', tag = '' } = {}) {
  return contents.filter(content =>
    isPublishedContent(content) &&
    (type ? content.type === type : content.type !== 'SectionIntro') &&
    (!language || content.language === language) &&
    (!tag || content.tags.includes(tag)))
}

function languageVersions(content, contents) {
  const originalId = content.source[0] || content.id
  return contents.filter(candidate =>
    candidate.id === originalId || candidate.source[0] === originalId
  ).map(candidate => ({ language: candidate.language, slug: candidate.slug }))
}

function resolveContentRoute(contents, slug, language) {
  const content = contents.find(item => item.slug === slug && item.language === language)
  if (content) return { content }
  const aliases = contents.filter(item => item.slug !== slug && item.legacySlugs?.includes(slug.trim()))
  const alias = aliases.find(item => item.language === language) ||
    (aliases.length === 1 ? aliases[0] : null)
  if (alias) return { redirect: {
    destination: `${alias.language === 'zh' ? '' : '/' + alias.language}/${alias.slug}`,
    permanent: true
  } }
  return null
}

module.exports = { contentMetadata, isPublishedContent, filterContents, languageVersions, resolveContentRoute }
