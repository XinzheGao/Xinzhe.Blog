import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import NotesHero from '@/components/Hero/Notes'
import { getContents, getPostBlocks, getSectionIntro } from '@/lib/notion'
import BLOG from '@/blog.config'

export async function getStaticProps({ locale }) {
  const posts = await getContents({ type: 'Note', language: locale })

  const hero = await getSectionIntro('notes', locale || 'zh')

  const blockMap = hero ? await getPostBlocks(hero.id) : null

  return {
    props: {
      posts,
      blockMap
    },
    revalidate: BLOG.notionRevalidateSeconds
  }
}

const notes = ({ posts, blockMap }) => {
  return (
    <Container title={BLOG.notes} description={BLOG.description}>
      <NotesHero blockMap={blockMap} />
      {posts.map((post) => (
        <BlogPost key={post.id} post={post} />
      ))}
    </Container>
  )
}

export default notes