const { test } = require('node:test')
const assert = require('node:assert/strict')
const { selectSearchContents, searchContents, randomContents } = require('../lib/search')

test('search scope includes posts, notes and projects, excluding other sections', () => {
  const types = ['Post', 'Note', 'Project', 'Musings', 'Book', 'Page', 'SectionIntro']
  assert.deepEqual(selectSearchContents(types.map(type => ({ type }))).map(p => p.type), types.slice(0, 3))
})

test('random suggestions contain ten unique records without changing the full search data', () => {
  const posts = Array.from({ length: 35 }, (_, i) => ({ id: i, title: `Article ${i}` }))
  const original = [...posts]
  const suggestions = randomContents(posts, 10, () => 0)
  assert.equal(suggestions.length, 10)
  assert.equal(new Set(suggestions.map(p => p.id)).size, 10)
  assert.deepEqual(posts, original)
  assert.equal(randomContents(posts.slice(0, 3)).length, 3)
  assert.deepEqual(randomContents([]), [])
  assert.equal(searchContents(posts, 'article 34')[0].id, 34)
  assert.equal(searchContents(posts, 'article').length, 35)
})

test('search matches titles, summaries and tags, trims whitespace and ignores case', () => {
  const posts = [{ title: 'Agent', summary: '恢复任务', tags: ['Python'] }, { title: 'Other' }]
  for (const query of [' AGENT ', '恢复', 'python']) assert.deepEqual(searchContents(posts, query), [posts[0]])
  assert.deepEqual(searchContents(posts, '   '), posts)
  assert.deepEqual(searchContents(posts, 'missing'), [])
})
