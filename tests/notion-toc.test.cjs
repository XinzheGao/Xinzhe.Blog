const { test } = require('node:test')
const assert = require('node:assert/strict')
const { pageBlock, convertBlock } = require('../lib/notion/officialAdapter')
const { getTableOfContentsPage } = require('../lib/notion/getTableOfContentsPage')

function recordMap(id = 'article') {
  const page = pageBlock({
    id, parent: { type: 'data_source_id', data_source_id: 'database' },
    properties: { title: { type: 'title', title: [{ plain_text: 'Article' }] } }
  })
  const heading = convertBlock({
    id: 'heading', type: 'heading_1', heading_1: { rich_text: [{ plain_text: '目录标题' }] }
  }, id)
  page.content = [heading.id]
  return { block: { [id]: { value: page }, heading: { value: heading } }, collection: {} }
}

test('official API articles generate headings without a legacy collection', async () => {
  const { getPageTableOfContents } = await import('notion-utils')
  const map = recordMap()
  // This lookup previously crashed when the scroll-triggered directory mounted.
  const collectionId = Object.keys(map.collection)[0]
  assert.throws(() => Object.values(map.block).find(b => b.value.parent_id === collectionId).value, TypeError)
  const nodes = getPageTableOfContents(getTableOfContentsPage(map), map)
  assert.equal(nodes.length, 1)
  assert.equal(nodes[0].text, '目录标题')
})

test('subpage headings belong to the rendered page rather than its ancestor', async () => {
  const { getPageTableOfContents } = await import('notion-utils')
  const map = recordMap('subpage')
  map.block.ancestor = { value: { id: 'ancestor', type: 'page', content: [] } }
  assert.equal(getTableOfContentsPage(map).id, 'subpage')
  assert.equal(getPageTableOfContents(getTableOfContentsPage(map), map)[0].id, 'heading')
})

test('articles without headings and missing root records are safe', async () => {
  const { getPageTableOfContents } = await import('notion-utils')
  const map = recordMap()
  map.block.article.value.content = []
  assert.deepEqual(getPageTableOfContents(getTableOfContentsPage(map), map), [])
  for (const missing of [null, {}, { block: {} }, { block: { root: {} } }]) {
    assert.equal(getTableOfContentsPage(missing), null)
  }
})
