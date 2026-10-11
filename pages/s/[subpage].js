import Layout from '@/layouts/layout'
import BLOG from '@/blog.config'
import { getPostBlocks } from '@/lib/notion'
import { uuid, getPublishedPage } from '@/lib/notion/officialClient'
import { textValue } from '@/lib/notion/officialAdapter'

export default function Subpage({ post, blockMap }) {
  return <Layout blockMap={blockMap} frontMatter={post} fullWidth={post.fullWidth} />
}

export async function getStaticPaths() {
  // Resolve nested pages on demand; never traverse the private database root.
  return { paths: [], fallback: 'blocking' }
}

export async function getStaticProps({ params: { subpage } }) {
  let id
  try { id = uuid(subpage) } catch { return { notFound: true } }
  const page = await getPublishedPage(id)
  if (!page) return { notFound: true, revalidate: BLOG.notionRevalidateSeconds }
  const blockMap = await getPostBlocks(page.id)
  if (!blockMap) return { notFound: true, revalidate: BLOG.notionRevalidateSeconds }
  const title = Object.values(page.properties).find(property => property.type === 'title')
  return {
    props: { post: { id: page.id, title: textValue(title?.title), type: 'Page', fullWidth: false }, blockMap },
    revalidate: BLOG.notionRevalidateSeconds
  }
}
