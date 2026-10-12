import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { statusMessages } from '@/lib/statusMessages'

const actionClass = 'inline-flex min-h-[44px] items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500'

export default function StatusPage({ kind, language = 'zh', image, statusCode }) {
  const locale = statusMessages[language] ? language : 'zh'
  const t = statusMessages[locale]
  const message = t[kind]
  // English and Japanese homepages are currently under maintenance.
  const homeLabel = locale === 'zh' ? t.home : t.chineseHome

  return (
    <>
      <Head>
        <title>{`${message.title} · Xinzhe.Blog`}</title>
        <meta name='robots' content='noindex, follow' />
      </Head>
      <main lang={locale} className={`mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center ${kind === 'maintenance' ? 'min-h-screen justify-center py-12' : 'py-10 sm:py-14'}`}>
        <div className='relative mb-8 aspect-[3/2] w-full max-w-[480px]' aria-hidden='true'>
          {image && <Image src={image} alt='' fill sizes='(max-width: 528px) calc(100vw - 48px), 480px' quality={85} priority className='object-contain' draggable={false} />}
        </div>
        {statusCode && <p className='mb-3 text-sm font-medium tracking-widest text-gray-500 dark:text-gray-400'>{statusCode}</p>}
        <h1 className='text-2xl font-semibold leading-snug text-gray-900 dark:text-gray-100 sm:text-3xl'>{message.title}</h1>
        <p className='mt-4 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-400'>{message.description}</p>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          {kind === 'error' && <button type='button' onClick={() => window.location.reload()} className={`${actionClass} bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600`}>{t.retry}</button>}
          <Link href='/' locale='zh' className={`${actionClass} bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300`}>{homeLabel}</Link>
        </div>
      </main>
    </>
  )
}
