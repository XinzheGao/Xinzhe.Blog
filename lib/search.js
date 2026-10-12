const searchableTypes = new Set(['Post', 'Note', 'Project'])

function selectSearchContents(contents = []) {
  return contents.filter(content => searchableTypes.has(content.type))
}

function searchContents(contents, query) {
  const keyword = query.trim().toLowerCase()
  return contents.filter(content =>
    [content.title, content.summary, ...(content.tags || [])]
      .join(' ').toLowerCase().includes(keyword))
}

function randomContents(contents, count = 10, random = Math.random) {
  const shuffled = [...contents]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

module.exports = { selectSearchContents, searchContents, randomContents }
