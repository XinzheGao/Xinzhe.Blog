import Layout from '@/layouts/layout'
import { getAllPosts, getPostBlocks } from '@/lib/notion'
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

export async function getStaticPaths({ locales }) {
  const posts = await getAllPosts({ onlyNewsletter: false })
  
  const paths = []
  const seen = new Set()
  for (const locale of locales || ['zh']) {
    for (const post of posts) {
      if (post.lang?.length && post.lang[0] !== locale) continue
      const key = `${locale}:${post.slug}`
      if (seen.has(key)) continue
      seen.add(key)
      paths.push({ params: { slug: post.slug }, locale })
    }
  }
  return { paths, fallback: 'blocking' }
}

export async function getStaticProps({ params: { slug }, locale }) {
  // 根据slug和当前语言获取对应的内容
  // 比如对于"about"页面:
  // 中文使用 "about"
  // 英文使用 "about-en"
  // 日文使用 "about-ja"
  
  let targetSlug = slug
  if (locale === 'en') {
    if (slug === 'about') {
    targetSlug = 'about-en'
    } else if (slug === 'notes') {
      targetSlug = 'notes-en'
    } else if (slug === 'projects') {
      targetSlug = 'projects-en'
    }
  } else if (locale === 'ja') {
    if (slug === 'about') {
    targetSlug = 'about-ja'
    } else if (slug === 'notes') {
      targetSlug = 'notes-ja'
    } else if (slug === 'projects') {
      targetSlug = 'projects-ja'
    }
  }
  
  const posts = await getAllPosts({ onlyNewsletter: false })
  let post = posts.find((t) => t.slug === targetSlug && (!t.lang?.length || t.lang[0] === locale))
  
  // 如果找不到特定语言的内容，则使用默认内容
  if (!post && targetSlug !== slug) {
    post = posts.find((t) => t.slug === slug && (!t.lang?.length || t.lang[0] === locale))
  }

  if (!post) {
    return {
      notFound: true,
      revalidate: BLOG.notionRevalidateSeconds
    }
  }

  const blockMap = await getPostBlocks(post.id)
  if (!blockMap) return { notFound: true, revalidate: BLOG.notionRevalidateSeconds }
  return {
    props: { post, blockMap },
    revalidate: BLOG.notionRevalidateSeconds
  }
}

export default Post
