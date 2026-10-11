import { useRouter } from 'next/router'
import BLOG from '@/blog.config'
import { formatContentDate } from '@/lib/contentDate'

export default function FormattedDate ({ date }) {
  const { locale } = useRouter()
  return <span>{formatContentDate(date, locale, BLOG.timezone)}</span>
}
