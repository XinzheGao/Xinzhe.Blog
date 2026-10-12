import { useRouter } from 'next/router'
import StatusPage from '@/components/StatusPage'

export default function NotFound({ statusCode = 500 }) {
  const { locale } = useRouter()
  const kind = Number(statusCode) === 404 ? 'notFound' : 'error'
  return <StatusPage kind={kind} language={locale} statusCode={statusCode} image={`/images/status/${kind === 'notFound' ? 'map-not-found' : 'connection-error'}.png`} />
}
