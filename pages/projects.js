import Container from '@/components/Container'
import BlogPost from '@/components/BlogPost'
import ProjectsHero from '@/components/Hero/Projects'
import { getContents, getPostBlocks, getSectionIntro } from '@/lib/notion'
import BLOG from '@/blog.config'

export async function getStaticProps({ locale }) {
  const posts = await getContents({ type: 'Project', language: locale })

  const hero = await getSectionIntro('projects', locale || 'zh')

  const blockMap = hero ? await getPostBlocks(hero.id) : null

  return {
    props: {
      posts,
      blockMap
    },
    revalidate: BLOG.notionRevalidateSeconds
  }
}

const projects = ({ posts, blockMap }) => {
  return (
    <Container title={BLOG.projects} description={BLOG.description}>
      <ProjectsHero blockMap={blockMap} />
      {posts.map((post) => (
        <BlogPost key={post.id} post={post} />
      ))}
    </Container>
  )
}

export default projects
