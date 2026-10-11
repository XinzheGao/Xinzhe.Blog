import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import Hero from '@/components/Hero/Home'
import Pagination from '@/components/Pagination'
import { getContents, getPostBlocks, getSectionIntro } from '@/lib/notion'
import BLOG from '@/blog.config'

export async function getStaticProps({ locale }) {
  // 根据当前语言获取文章
  const posts = await getContents({
    type: 'Post',
    language: locale || ''
  })

  const hero = await getSectionIntro('home', locale || 'zh')

  const blockMap = hero ? await getPostBlocks(hero.id) : null

  const postsToShow = posts.slice(0, BLOG.postsPerPage)
  const totalPosts = posts.length
  const showNext = totalPosts > BLOG.postsPerPage
  return {
    props: {
      page: 1, // current page is 1
      postsToShow,
      showNext,
      blockMap
    },
    revalidate: BLOG.notionRevalidateSeconds
  }
}

const blog = ({ postsToShow, page, showNext, blockMap }) => {
  return (
    <Container title={BLOG.title} description={BLOG.description}>
      <Hero blockMap={blockMap} />
      {postsToShow.map((post) => (
        <BlogPost key={post.id} post={post} />
      ))}
      {showNext && <Pagination page={page} showNext={showNext} />}
    </Container>
  )
}

export default blog
