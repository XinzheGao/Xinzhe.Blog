import Layout from '@/layouts/layout'
import { getContents, getPostBlocks } from '@/lib/notion'
import BLOG from '@/blog.config'
import { useRouter } from 'next/router'
import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'

const Post = ({ post, blockMap }) => {
  const router = useRouter()
  if (router.isFallback) {
    return (
      <Loading />
    )
  }
  if (!post) {
    return <NotFound statusCode={404} />
  }
  return (
    <Layout blockMap={blockMap} frontMatter={post} fullWidth={post.fullWidth} />
  )
}

export async function getStaticPaths() {
  const contents = await getContents()
  const paths = contents.filter(content => content.language).map(content => ({
    params: { slug: content.slug }, locale: content.language
  }))
  return { paths, fallback: 'blocking' }
}

export async function getStaticProps({ params: { slug }, locale }) {
  const contents = await getContents()
  const post = contents.find(content => content.slug === slug && content.language === locale)
  if (!post) {
    const alias = contents.find(content => content.legacySlug === slug && content.slug !== slug)
    if (alias) return { redirect: {
      destination: `${alias.language === 'zh' ? '' : '/' + alias.language}/${alias.slug}`,
      permanent: true
    } }
    return { notFound: true, revalidate: BLOG.notionRevalidateSeconds }
  }
  const blockMap = await getPostBlocks(post.id)
  if (!blockMap) return { notFound: true, revalidate: BLOG.notionRevalidateSeconds }
  return { props: { post, blockMap }, revalidate: BLOG.notionRevalidateSeconds }
}

export default Post
