import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import NotesHero from '@/components/Hero/Notes'
import { getAllPosts, getPostBlocks } from '@/lib/notion'
import BLOG from '@/blog.config'

export async function getStaticProps({ locale }) {
  const posts = await getAllPosts({ onlyNotes: true, locale })

  const heros = await getAllPosts({ onlyHidden: true })
  let hero
  if (locale === 'en') {
    hero = heros.find((t) => t.slug === 'notes-en')
  } else if (locale === 'ja') {
    hero = heros.find((t) => t.slug === 'notes-ja')
  } else {
    hero = heros.find((t) => t.slug === 'notes')
  }

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