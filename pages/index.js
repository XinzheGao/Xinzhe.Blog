import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import Hero from '@/components/Hero/Home'
import Pagination from '@/components/Pagination'
import { getAllPosts, getPostBlocks } from '@/lib/notion'
import BLOG from '@/blog.config'

export async function getStaticProps({ locale }) {
  // 根据当前语言获取文章
  // 如果没有指定语言或没有该语言的文章，则显示所有文章
  const posts = await getAllPosts({ 
    onlyPost: true,
    locale: locale || ''
  })

  const heros = await getAllPosts({ onlyHidden: true })
  
  // 根据当前语言获取对应的主页内容
  let hero
  if (locale === 'en') {
    // 英文主页
    hero = heros.find((t) => t.slug === 'index-en')
  } else if (locale === 'ja') {
    // 日文主页
    hero = heros.find((t) => t.slug === 'index-ja')
  } else {
    // 默认中文主页
    hero = heros.find((t) => t.slug === 'index')
  }

  // 如果找不到特定语言的主页，则使用默认主页
  if (!hero) {
    hero = heros.find((t) => t.slug === 'index')
  }

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
