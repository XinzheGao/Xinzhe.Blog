const { pageProperties } = require('./officialAdapter')
const dayjs = require('dayjs')
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.extend(require('dayjs/plugin/timezone'))

const first = value => Array.isArray(value) ? value[0] : value

function contentMetadata(page, defaultCover, timezone = 'Asia/Tokyo') {
  const p = pageProperties(page, defaultCover)
  const type = first(p.type) || null
  const language = first(p.language) || null
  const date = p.publishedAt?.start
  return {
    id: page.id, title: p.title || '', summary: p.summary || '', tags: p.tags || [],
    slug: (p.slug || '').trim(),
    legacySlug: (p.legacySlug || p.slug || '').trim(),
    type, language, publicationStatus: first(p.publicationStatus) || null,
    publishedAt: date ? dayjs.tz(date, timezone).valueOf() : null,
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

module.exports = { contentMetadata, isPublishedContent, filterContents, languageVersions }
