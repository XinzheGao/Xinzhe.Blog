import BLOG from '@/blog.config'
import dynamic from 'next/dynamic'

const UtterancesComponent = dynamic(
  () => {
    return import('@/components/Post/Utterances')
  },
  { ssr: false }
)
const SupaCommentsComponent = dynamic(
  () => {
    return import('@/components/Post/SupaComments')
  },
  { ssr: false }
)

const Comments = ({ frontMatter }) => {
  const supaConfig = BLOG.comment?.supaCommentsConfig
  const supaConfigured = Boolean(
    supaConfig?.supabaseUrl?.trim() && supaConfig?.supabaseAnonKey?.trim()
  )
  return (
    <div>
      {BLOG.comment && BLOG.comment.provider === 'utterances' && (
        <UtterancesComponent issueTerm={frontMatter.id} />
      )}
      {BLOG.comment && BLOG.comment.provider === 'supacomments' && supaConfigured && (
        <SupaCommentsComponent key={frontMatter.id} postId={frontMatter.id} />
      )}
    </div>
  )
}

export default Comments
