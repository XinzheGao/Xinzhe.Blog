const { test } = require('node:test')
const assert = require('node:assert/strict')
const { richText, convertBlock, pageProperties } = require('../lib/notion/officialAdapter')
const { fetchNotionSmart } = require('../lib/notion/notionFetchHelper')

test('formatting, links, equations and page mentions survive conversion', () => {
  const result = richText([
    { type: 'text', text: { content: '中文', link: { url: 'https://example.com' } }, annotations: { bold: true, code: true } },
    { type: 'equation', equation: { expression: 'x^2' } },
    { type: 'mention', plain_text: 'Page', mention: { type: 'page', page: { id: 'page' } } }
  ])
  assert.deepEqual(result[0], ['中文', [['b'], ['c'], ['a', 'https://example.com']]])
  assert.deepEqual(result[1], ['x^2', [['e', 'x^2']]])
  assert.deepEqual(result[2], ['Page', [['p', 'page']]])
})

test('uploaded images and nested table cells use the renderer format', () => {
  const image = convertBlock({ id: 'image', type: 'image', image: { type: 'file', file: { url: 'https://example.com/signed-image' }, caption: [{ plain_text: 'caption' }] } }, 'root')
  assert.equal(image.format.display_source, 'https://example.com/signed-image')
  assert.deepEqual(image.properties.caption, [['caption']])
  const table = convertBlock({ id: 'table', type: 'table', table: { table_width: 2 } }, 'root')
  const row = convertBlock({ id: 'row', type: 'table_row', table_row: { cells: [[{ plain_text: '日本語' }], [{ plain_text: 'English' }]] } }, 'table', table)
  assert.deepEqual(table.format.table_block_column_order, ['0', '1'])
  assert.deepEqual(row.properties['0'], [['日本語']])
  assert.throws(() => convertBlock({ id: 'unknown', type: 'unsupported' }, 'root'), /Unsupported Notion block/)
})

test('metadata keeps language, publication status and signed cover', () => {
  const p = pageProperties({ id: 'page', cover: { type: 'file', file: { url: 'https://example.com/cover' } }, properties: {
    title: { type: 'title', title: [{ plain_text: 'Article' }] },
    lang: { type: 'select', select: { name: 'ja' } },
    status: { type: 'status', status: { name: 'Draft' } },
    date: { type: 'date', date: { start: '2025-03-14' } }
  } }, '/cover.png')
  assert.deepEqual(p.lang, ['ja'])
  assert.deepEqual(p.status, ['Draft'])
  assert.equal(p.page_cover, 'https://example.com/cover')
  assert.equal(p.date.start, '2025-03-14')
})

test('cache deduplicates concurrent reads, expires, and propagates refresh errors', async () => {
  let reads = 0
  const fetcher = async () => { reads++; await new Promise(r => setTimeout(r, 5)); return reads }
  assert.deepEqual(await Promise.all([fetchNotionSmart('test', fetcher, { ttl: 10 }), fetchNotionSmart('test', fetcher, { ttl: 10 })]), [1, 1])
  assert.equal(await fetchNotionSmart('test', fetcher), 1)
  await new Promise(r => setTimeout(r, 15))
  await assert.rejects(fetchNotionSmart('test', async () => { throw new Error('Notion unavailable') }), /Notion unavailable/)
  assert.equal(await fetchNotionSmart('test', fetcher), 2)
})

test('official API pagination and visibility prevent publishing drafts or unrelated pages', async () => {
  const root = '11111111-1111-1111-1111-111111111111'
  const live = '22222222-2222-2222-2222-222222222222'
  const draft = '33333333-3333-3333-3333-333333333333'
  const privatePage = '44444444-4444-4444-4444-444444444444'
  const child = '55555555-5555-5555-5555-555555555555'
  const BLOG = require('../blog.config')
  BLOG.notionPageId = root
  process.env.NOTION_API_TOKEN = 'test-placeholder'
  const originalFetch = global.fetch
  const seen = []
  const page = (id, status) => ({ object: 'page', id, parent: { type: 'data_source_id', data_source_id: root }, created_time: '2025-01-01T00:00:00Z', last_edited_time: '2025-01-01T00:00:00Z', properties: {
    title: { type: 'title', title: [{ plain_text: 'Article' }] },
    slug: { type: 'rich_text', rich_text: [{ plain_text: id }] },
    status: { type: 'select', select: { name: status } }
  } })
  global.fetch = async (url, options) => {
    seen.push(url)
    assert.equal(options.headers['Notion-Version'], '2026-03-11')
    const path = new URL(url).pathname
    let data
    if (path.includes('/databases/')) data = { data_sources: [{ id: root }] }
    else if (path.endsWith('/query')) {
      const body = JSON.parse(options.body)
      data = body.start_cursor ? { results: [page(draft, 'Draft')], has_more: false } : { results: [page(live, 'Published')], has_more: true, next_cursor: 'next-page' }
    } else if (path.includes('/children')) {
      data = { results: [{ id: child, type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Visible body' }] } }], has_more: false }
    } else data = { ...page(privatePage, 'Published'), parent: { type: 'workspace', workspace: true } }
    return { ok: true, json: async () => data }
  }
  try {
    const api = require('../lib/notion/officialClient')
    assert.equal((await api.getBlogPages()).length, 2)
    assert.equal(await api.getPageRecordMap(draft), null)
    assert.equal(await api.getPageRecordMap(privatePage), null)
    const map = await api.getPageRecordMap(live)
    assert.deepEqual(map.block[live].value.content, [child])
    assert.deepEqual(map.block[child].value.properties.title, [['Visible body']])
    assert.equal(seen.filter(url => url.endsWith('/query')).length, 2)
    // Validate against the installed renderer, not just the adapter output.
    const React = require('react')
    const { renderToStaticMarkup } = require('react-dom/server')
    const { NotionRenderer } = require('react-notion-x')
    assert.match(renderToStaticMarkup(React.createElement(NotionRenderer, { recordMap: map })), /Visible body/)
  } finally {
    global.fetch = originalFetch
    delete process.env.NOTION_API_TOKEN
  }
})
