// REST already supplies an authorized, expiring URL for uploaded media.
// Do not send it through the old notion.so image proxy.
function mapNotionImageUrl(url) {
  if (!url) return null
  if (url.startsWith('/')) return `https://www.notion.so${url}`
  return url
}

module.exports = { mapNotionImageUrl }
