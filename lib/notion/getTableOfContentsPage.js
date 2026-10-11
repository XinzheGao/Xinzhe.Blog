// The renderer uses the first block as the current page, including subpages.
// Official API record maps do not contain the legacy parent collection.
function getTableOfContentsPage(recordMap) {
  const blocks = recordMap?.block
  if (!blocks) return null
  const page = blocks[Object.keys(blocks)[0]]?.value
  return page?.type === 'page' || page?.type === 'collection_view_page' ? page : null
}

module.exports = { getTableOfContentsPage }
