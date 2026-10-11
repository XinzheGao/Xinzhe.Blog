import BLOG from '@/blog.config'
import { getBlogPages } from './officialClient'
import { contentMetadata, filterContents } from './contentSchema'

export async function getContents({ type = '', language = '', tag = '' } = {}) {
  const pages = await getBlogPages()
  const contents = pages.map(page => contentMetadata(page, BLOG.defaultCover, BLOG.timezone))
  const result = filterContents(contents, { type, language, tag })
  if (BLOG.sortByDate) result.sort((a, b) => b.publishedAt - a.publishedAt)
  return result
}

export async function getSectionIntro(section, language) {
  const contents = await getContents({ type: 'SectionIntro', language })
  const intro = contents.find(content => content.section === section)
  if (intro || language === 'zh' || section !== 'home') return intro || null
  const fallback = await getContents({ type: 'SectionIntro', language: 'zh' })
  return fallback.find(content => content.section === section) || null
}
