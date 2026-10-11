// Convert the public REST API into the format consumed by react-notion-x.
function richText(items = []) {
  return items.map(item => {
    const marks = []
    const a = item.annotations || {}
    for (const [key, mark] of Object.entries({ bold: 'b', italic: 'i', strikethrough: 's', underline: '_', code: 'c' })) {
      if (a[key]) marks.push([mark])
    }
    if (a.color && a.color !== 'default') marks.push(['h', a.color])
    if (item.type === 'equation') marks.push(['e', item.equation.expression])
    else if (item.mention?.type === 'page') marks.push(['p', item.mention.page.id])
    else if (item.href || item.text?.link?.url) marks.push(['a', item.href || item.text.link.url])
    const text = item.type === 'equation' ? item.equation.expression : item.plain_text ?? item.text?.content ?? ''
    return marks.length ? [text, marks] : [text]
  })
}

function fileUrl(file) { return file?.[file.type]?.url || '' }
function iconValue(icon) { return icon?.emoji || fileUrl(icon) }
function textValue(items) { return (items || []).map(t => t.plain_text ?? t.text?.content ?? '').join('') }

function pageProperties(page, defaultCover) {
  const properties = { id: page.id, fullWidth: false, page_cover: fileUrl(page.cover) || defaultCover }
  for (const [name, p] of Object.entries(page.properties)) {
    switch (p.type) {
      case 'title': case 'rich_text': properties[name] = textValue(p[p.type]); break
      case 'select': case 'status': properties[name] = p[p.type] ? [p[p.type].name] : []; break
      case 'multi_select': properties[name] = p.multi_select.map(v => v.name); break
      case 'date': properties[name] = p.date; break
      case 'people': properties[name] = p.people.map(v => ({ id: v.id, first_name: v.name, profile_photo: v.avatar_url })); break
      default: break
    }
  }
  return properties
}

function pageBlock(page) {
  const title = Object.values(page.properties).find(p => p.type === 'title')
  return {
    id: page.id, type: 'page', alive: true,
    created_time: Date.parse(page.created_time), last_edited_time: Date.parse(page.last_edited_time),
    parent_id: page.parent[page.parent.type], parent_table: 'block',
    properties: { title: richText(title?.title) },
    format: { page_icon: iconValue(page.icon), page_cover: fileUrl(page.cover) }
  }
}

function convertBlock(block, parentId, parentBlock) {
  const data = block[block.type] || {}
  const typeMap = {
    paragraph: 'text', heading_1: 'header', heading_2: 'sub_header', heading_3: 'sub_sub_header',
    bulleted_list_item: 'bulleted_list', numbered_list_item: 'numbered_list',
    child_page: 'page', synced_block: 'transclusion_container'
  }
  const value = {
    id: block.id, type: typeMap[block.type] || block.type, alive: !block.archived && !block.in_trash,
    parent_id: parentId, parent_table: 'block',
    properties: { title: richText(data.rich_text) },
    format: data.color && data.color !== 'default' ? { block_color: data.color } : {}
  }
  if (block.type.startsWith('heading_') && data.is_toggleable) value.format.toggleable = true
  if (block.type === 'callout') value.format.page_icon = iconValue(data.icon)
  if (block.type === 'to_do') value.properties.checked = [[data.checked ? 'Yes' : 'No']]
  if (block.type === 'code') value.properties.language = [[data.language || 'plain text']]
  if (block.type === 'equation') value.properties.title = [[data.expression]]
  if (block.type === 'child_page') value.properties.title = [[data.title]]
  if (['image', 'video', 'audio', 'file', 'pdf'].includes(block.type)) {
    const source = fileUrl(data)
    value.properties.source = [[source]]
    value.properties.caption = richText(data.caption)
    value.format.display_source = source
    if (block.type === 'file') value.properties.title = [[data.name || 'Download file']]
  }
  if (['bookmark', 'embed', 'link_preview'].includes(block.type)) {
    value.type = block.type === 'link_preview' ? 'bookmark' : block.type
    value.properties.link = [[data.url]]
    value.properties.source = [[data.url]]
    value.properties.caption = richText(data.caption)
    value.format.display_source = data.url
  }
  if (block.type === 'column') value.format.column_ratio = data.width_ratio || 1
  if (block.type === 'table') value.format.table_block_column_order = Array.from({ length: data.table_width }, (_, i) => String(i))
  if (block.type === 'table_row') {
    value.properties = Object.fromEntries(data.cells.map((cell, i) => [String(i), richText(cell)]))
    if (parentBlock?.format?.table_block_column_order?.length !== data.cells.length) throw new Error('Notion table column count changed during refresh')
  }
  if (block.type === 'link_to_page') {
    value.type = 'text'
    value.properties.title = [['Open page', [['a', `/s/${String(data[data.type]).replace(/-/g, '')}`]]]]
  }
  const supported = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'quote', 'callout', 'toggle', 'to_do', 'code', 'equation', 'divider', 'image', 'video', 'audio', 'file', 'pdf', 'bookmark', 'embed', 'link_preview', 'column_list', 'column', 'table', 'table_row', 'table_of_contents', 'child_page', 'synced_block', 'link_to_page']
  // Fail rather than silently publish a truncated article.
  if (!supported.includes(block.type)) throw new Error(`Unsupported Notion block: ${block.type} (${block.id})`)
  return value
}

module.exports = { richText, fileUrl, textValue, pageProperties, pageBlock, convertBlock }
