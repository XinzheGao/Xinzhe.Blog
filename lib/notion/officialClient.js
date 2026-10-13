const BLOG = require('../../blog.config')
const { fetchNotionSmart } = require('./notionFetchHelper')
const { pageBlock, convertBlock, textValue } = require('./officialAdapter')
const { contentMetadata, isPublishedContent } = require('./contentSchema')
const dayjs = require('dayjs')
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.extend(require('dayjs/plugin/timezone'))

const ttl = BLOG.notionRevalidateSeconds * 1000
let queue = Promise.resolve()
let nextRequestAt = 0
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function uuid(id) {
  const compact = String(id || '').replace(/-/g, '')
  if (!/^[0-9a-f]{32}$/i.test(compact)) throw new Error('Invalid Notion page or data source ID')
  return compact.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5').toLowerCase()
}

function notionRequest(path, body) {
  const request = queue.then(async () => {
    const token = process.env.NOTION_API_TOKEN
    if (!token) throw new Error('Missing NOTION_API_TOKEN: configure the official Notion connection in Vercel')
    for (let attempt = 0; attempt < 4; attempt++) {
      await sleep(Math.max(0, nextRequestAt - Date.now()))
      nextRequestAt = Date.now() + 350
      let response
      try {
        response = await fetch(`https://api.notion.com/v1/${path}`, {
          method: body ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(20000),
          headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2026-03-11', 'Content-Type': 'application/json' },
          ...(body ? { body: JSON.stringify(body) } : {})
        })
      } catch (error) {
        if (attempt < 3) { await sleep(1000 * 2 ** attempt); continue }
        throw new Error(`Notion network request failed: ${error.name}`)
      }
      if (response.ok) return response.json()
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        const retryAfter = Number(response.headers.get('retry-after'))
        await sleep(Math.min(30000, Math.max(1000 * 2 ** attempt, (retryAfter || 0) * 1000)))
        continue
      }
      const data = await response.json().catch(() => ({}))
      const error = new Error(`Notion API ${response.status} (${data.code || 'unknown'}): check the connection token and blog database access`)
      error.status = response.status
      throw error
    }
  })
  queue = request.catch(() => {})
  return request
}

async function paginate(path, body) {
  const results = []
  let cursor
  do {
    const response = body
      ? await notionRequest(path, { ...body, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) })
      : await notionRequest(`${path}?page_size=100${cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : ''}`)
    results.push(...response.results)
    if (response.has_more && !response.next_cursor) throw new Error('Notion returned incomplete pagination')
    cursor = response.has_more ? response.next_cursor : null
  } while (cursor)
  return results
}

async function loadBlogPages() {
  let sourceId = BLOG.notionDataSourceId
  if (!sourceId) {
    const database = await notionRequest(`databases/${uuid(BLOG.notionDatabaseId)}`)
    if (database.data_sources?.length !== 1) throw new Error('Set NOTION_DATA_SOURCE_ID when the blog database has multiple data sources')
    sourceId = database.data_sources[0].id
  }
  const pages = await paginate(`data_sources/${uuid(sourceId)}/query`, {})
  return pages.filter(page => page.object === 'page' && !page.archived && !page.in_trash)
}

function getBlogPages() {
  return fetchNotionSmart('official:blog-pages', loadBlogPages, { ttl })
}

function isPublished(page) {
  return isPublishedContent(contentMetadata(page, BLOG.defaultCover, BLOG.timezone))
}

async function getPublishedPage(id) {
  const pages = await getBlogPages()
  const pageId = uuid(id)
  const direct = pages.find(page => page.id === pageId)
  if (direct) return isPublished(direct) ? direct : null
  // API access alone does not make private content a public blog page.
  const page = await notionRequest(`pages/${pageId}`).catch(error => {
    if (error.status === 404) return null
    throw error
  })
  if (!page || page.archived || page.in_trash) return null
  let current = page
  const visited = new Set()
  for (let depth = 0; depth < 50; depth++) {
    const parent = current.parent
    if (!parent || !['page_id', 'block_id'].includes(parent.type)) return null
    const parentId = parent[parent.type]
    if (visited.has(parentId)) return null
    visited.add(parentId)
    const ancestor = pages.find(p => p.id === parentId)
    if (ancestor) return isPublished(ancestor) ? page : null
    current = await notionRequest(`${parent.type === 'page_id' ? 'pages' : 'blocks'}/${uuid(parentId)}`)
    if (current.archived || current.in_trash) return null
  }
  return null
}

async function loadPageRecordMap(page) {
  const recordMap = { block: {}, collection: {}, collection_view: {}, collection_query: {}, notion_user: {}, signed_urls: {} }
  const root = pageBlock(page)
  recordMap.block[page.id] = { role: 'reader', value: root }
  let count = 0
  async function visit(parent, depth = 0) {
    if (depth > 50) throw new Error('Notion content nesting exceeds supported depth')
    const children = await paginate(`blocks/${parent.id}/children`)
    parent.content = []
    for (const block of children) {
      if (block.archived || block.in_trash) continue
      if (++count > 10000) throw new Error('Notion page exceeds supported block count')
      const value = convertBlock(block, parent.id, parent)
      parent.content.push(value.id)
      recordMap.block[value.id] = { role: 'reader', value }
      if (block.has_children && block.type !== 'child_page') await visit(value, depth + 1)
    }
  }
  await visit(root)
  return recordMap
}

async function getPageRecordMap(id) {
  const page = await getPublishedPage(id)
  if (!page) return null
  return fetchNotionSmart(`official:page:${page.id}`, () => loadPageRecordMap(page), { ttl })
}

module.exports = { uuid, notionRequest, paginate, getBlogPages, isPublished, getPublishedPage, getPageRecordMap }
