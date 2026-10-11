import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import Pagination from '@/components/Pagination'
import { getAllPosts } from '@/lib/notion'
import BLOG from '@/blog.config'

const Page = ({ postsToShow, page, showNext }) => {
  return (
    <Container>
      {postsToShow &&
        postsToShow.map((post) => <BlogPost key={post.id} post={post} />)}
      <Pagination page={page} showNext={showNext} />
    </Container>
  )
}


export async function getStaticProps(context) {
  const { page } = context.params // 当前页码
  const locale = context.locale || ''
  const posts = await getAllPosts({ onlyPost: true, locale })
  const postsToShow = posts.slice(
    BLOG.postsPerPage * (page - 1),
    BLOG.postsPerPage * page
  )
  const totalPosts = posts.length
  const showNext = page * BLOG.postsPerPage < totalPosts
  return {
    props: {
      page, // 当前页码
      postsToShow,
      showNext
    },
    revalidate: BLOG.notionRevalidateSeconds
  }
}


export async function getStaticPaths({ locales }) {
  let paths = []
  for (const locale of locales) {
    const posts = await getAllPosts({ onlyNewsletter: false, locale })
    const totalPosts = posts.length
    const totalPages = Math.ceil(totalPosts / BLOG.postsPerPage)
    paths = paths.concat(
      Array.from({ length: totalPages - 1 }, (_, i) => ({
        params: { page: '' + (i + 2) },
        locale
      }))
    )
  }
  return {
    paths,
    fallback: true
  }
}

export default Page
