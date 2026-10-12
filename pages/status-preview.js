import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon } from '@heroicons/react/outline'
import StatusPage from '@/components/StatusPage'

export function getServerSideProps() {
  if (process.env.NODE_ENV !== 'development') return { notFound: true }
  return { props: {} }
}

export default function StatusPreview() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const kind = ['notFound', 'error', 'maintenance'].includes(router.query.scene) ? router.query.scene : 'notFound'
  const language = ['zh', 'en', 'ja'].includes(router.query.language) ? router.query.language : 'zh'
  const update = (key, value) => router.replace({ pathname: '/status-preview', query: { ...router.query, [key]: value } }, undefined, { shallow: true })
  const image = { notFound: 'map-not-found', error: 'connection-error', maintenance: 'maintenance-tools' }[kind]

  return (
    <>
      <div className='mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 px-4 pt-6 text-sm'>
        <select aria-label='预览场景' value={kind} onChange={(event) => update('scene', event.target.value)} className='rounded-md bg-gray-100 p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100'>
          <option value='notFound'>404</option><option value='error'>服务错误</option><option value='maintenance'>维护中</option>
        </select>
        <select aria-label='预览语言' value={language} onChange={(event) => update('language', event.target.value)} className='rounded-md bg-gray-100 p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100'>
          <option value='zh'>中文</option><option value='en'>English</option><option value='ja'>日本語</option>
        </select>
        <button aria-label='浅色模式' title='浅色模式' onClick={() => setTheme('light')} className='rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700'><SunIcon className='h-5 w-5' /></button>
        <button aria-label='深色模式' title='深色模式' onClick={() => setTheme('dark')} className='rounded-md p-3 hover:bg-gray-200 dark:hover:bg-gray-700'><MoonIcon className='h-5 w-5' /></button>
      </div>
      <StatusPage kind={kind} language={language} image={`/images/status/${image}.png`} statusCode={kind === 'maintenance' ? undefined : kind === 'notFound' ? 404 : 500} />
    </>
  )
}
