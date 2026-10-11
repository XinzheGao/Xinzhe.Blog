import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import BookHero from '@/components/Hero/Book'
import { getContents, getPostBlocks, getSectionIntro } from '@/lib/notion'
import BLOG from '@/blog.config'

export async function getStaticProps({ locale }) {
  const posts = await getContents({ type: 'Book', language: locale })

  const hero = await getSectionIntro('books', locale || 'zh')

  const blockMap = hero ? await getPostBlocks(hero.id) : null

  return {
    props: {
      posts,
      blockMap
    },
    revalidate: BLOG.notionRevalidateSeconds
  }
}

const book = ({ posts, blockMap }) => {
  return (
    <Container title={BLOG.books} description={BLOG.description}>
      <BookHero blockMap={blockMap} />
      {posts.map((post) => (
        <BlogPost key={post.id} post={post} />
      ))}
    </Container>
  )
}

export default book 