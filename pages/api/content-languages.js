import { getContents } from '@/lib/notion'
import { languageVersions } from '@/lib/notion/contentSchema'

export default async function handler(req, res) {
  const { slug, language } = req.query
  if (typeof slug !== 'string' || !['zh', 'en', 'ja'].includes(language)) {
    return res.status(400).json({ versions: [] })
  }
  const contents = await getContents()
  const content = contents.find(item => item.slug === slug && item.language === language)
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ versions: content ? languageVersions(content, contents) : [] })
}
