import BLOG from '@/blog.config'
import { selectSearchContents } from '@/lib/search'
import { getContents, getAllTagsFromPosts } from '@/lib/notion'
import SearchLayout from '@/layouts/search'

export default function Tag({ tags, posts, currentTag }) {
  return <SearchLayout tags={tags} posts={posts} currentTag={currentTag} />
}

export async function getStaticProps({ params, locale }) {
  const currentTag = params.tag
  const posts = selectSearchContents(await getContents({ language: locale || BLOG.lang }))
  const tags = getAllTagsFromPosts(posts)
  const filteredPosts = posts.filter(
    (post) => post && post.tags && post.tags.includes(currentTag)
  )
  return {
    props: {
      tags,
      posts: filteredPosts,
      currentTag
    },
    revalidate: BLOG.notionRevalidateSeconds
  }
}

export async function getStaticPaths() {
  const posts = selectSearchContents(await getContents())
  const tags = getAllTagsFromPosts(posts)
  return {
    paths: Object.keys(tags).map((tag) => ({ params: { tag } })),
    fallback: 'blocking'
  }
}
