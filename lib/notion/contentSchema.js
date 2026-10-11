const { pageProperties } = require('./officialAdapter')
const dayjs = require('dayjs')
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.extend(require('dayjs/plugin/timezone'))

// Temporary migration boundary: business code uses only the canonical names.
const legacyTypes = { Notes: 'Note', Projects: 'Project', Newsletter: 'Musings', Hidden: 'SectionIntro' }
const legacySections = { index: 'home', notes: 'notes', projects: 'projects', newsletter: 'musings', book: 'books' }
const first = value => Array.isArray(value) ? value[0] : value
const baseSlug = slug => String(slug || '').replace(/-(en|ja)$/, '')

function contentMetadata(page, defaultCover, timezone = 'Asia/Tokyo') {
  const p = pageProperties(page, defaultCover)
  const legacy = !Object.hasOwn(page.properties, 'language')
  const rawType = first(p.type)
  const type = legacyTypes[rawType] || rawType || null
  const language = first(p.language || p.lang) || (legacy && p.slug ? (/-en$/.test(p.slug) ? 'en' : /-ja$/.test(p.slug) ? 'ja' : 'zh') : null)
  const date = (p.publishedAt || p.date)?.start
  return {
    id: page.id, title: p.title || '', summary: p.summary || '', tags: p.tags || [],
    slug: type === 'Page' && baseSlug(p.slug) === 'about' ? 'about' : p.slug || '',
    legacySlug: p.legacySlug || p.slug || '',
    type, language, publicationStatus: first(p.publicationStatus || p.status) || null,
    publishedAt: date ? dayjs.tz(date, timezone).valueOf() : null,
    section: first(p.section) || (type === 'SectionIntro' ? legacySections[baseSlug(p.slug)] : null) || null,
    source: p.source || [], translations: p.translations || [],
    createdAt: page.created_time, lastEditedAt: page.last_edited_time,
    page_cover: p.page_cover || defaultCover || '', fullWidth: p.fullWidth,
    migrationLegacy: legacy
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
  return contents.filter(candidate => {
    if (candidate.id === originalId || candidate.source[0] === originalId) return true
    // Only used before the Notion relation migration has completed.
    return content.migrationLegacy && candidate.migrationLegacy &&
      candidate.type === content.type && baseSlug(candidate.legacySlug) === baseSlug(content.legacySlug)
  }).map(candidate => ({ language: candidate.language, slug: candidate.slug }))
}

module.exports = { contentMetadata, isPublishedContent, filterContents, languageVersions }
