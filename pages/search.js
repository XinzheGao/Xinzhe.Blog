import BLOG from '@/blog.config'
import { getContents, getAllTagsFromPosts } from '@/lib/notion'
import { selectSearchContents, randomContents } from '@/lib/search'
import SearchLayout from '@/layouts/search'

export default function Search({ tags, posts, initialPosts }) {
  return <SearchLayout tags={tags} posts={posts} initialPosts={initialPosts} />
}

export async function getStaticProps({ locale }) {
  const posts = selectSearchContents(await getContents({ language: locale || BLOG.lang }))
  return {
    props: {
      tags: getAllTagsFromPosts(posts),
      posts,
      initialPosts: randomContents(posts)
    },
    revalidate: BLOG.notionRevalidateSeconds
  }
}
