import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import MusingsHero from '@/components/Hero/Musings'
import { getContents, getPostBlocks, getSectionIntro } from '@/lib/notion'
import BLOG from '@/blog.config'

export async function getStaticProps({ locale }) {
  const posts = await getContents({ type: 'Musings', language: locale })

  const hero = await getSectionIntro('musings', locale || 'zh')

  const blockMap = hero ? await getPostBlocks(hero.id) : null

  return {
    props: {
      posts,
      blockMap
    },
    revalidate: BLOG.notionRevalidateSeconds
  }
}

const musings = ({ posts, blockMap }) => {
  return (
    <Container title={BLOG.musings} description={BLOG.description}>
      <MusingsHero blockMap={blockMap} />
      {posts.map((post) => (
        <BlogPost key={post.id} post={post} />
      ))}
    </Container>
  )
}

export default musings
