import BLOG from '@/blog.config'
import dayjs from '@/lib/day'
import filterPublishedPosts from './filterPublishedPosts'
import { getBlogPages } from './officialClient'
import { pageProperties } from './officialAdapter'

/**
 * @param {{ onlyNewsletter: boolean }} - false: all types / true: newsletter only
 * @param {{ onlyPost: boolean }} - false: all types / true: post only
 * @param {{ onlyHidden: boolean }} - false: all types / true: hidden only
 * @param {{ onlyNotes: boolean }} - false: all types / true: notes only
 * @param {{ onlyProjects: boolean }} - false: all types / true: projects only
 * @param {{ onlyBook: boolean }} - false: all types / true: book only
 * @param {{ tagFilter: string }} - 根据标签过滤文章
 * @param {{ locale: string }} - 根据语言过滤文章 (zh, en, ja)
 */
export async function getAllPosts({
  onlyNewsletter = false,
  onlyPost = false,
  onlyHidden = false,
  onlyNotes = false,
  onlyProjects = false,
  onlyBook = false,
  tagFilter = '',
  locale = ''
}) {
  const pages = await getBlogPages()
  const data = pages.map(page => {
    const properties = pageProperties(page, BLOG.defaultCover)
    properties.date = (properties.date?.start
      ? dayjs.tz(properties.date.start)
      : dayjs(page.created_time)).valueOf()
    return properties
  })
  const posts = filterPublishedPosts({
    posts: data, onlyNewsletter, onlyPost, onlyHidden, onlyNotes,
    onlyProjects, onlyBook, tagFilter, locale
  })
  if (BLOG.sortByDate) posts.sort((a, b) => b.date - a.date)
  return posts
}
