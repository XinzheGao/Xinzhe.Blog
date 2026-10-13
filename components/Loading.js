import { lang } from '@/lib/lang'
import { useRouter } from 'next/router'
import Image from 'next/image'

export default function Loading() {
  const { locale } = useRouter()
  const t = lang[locale]
  return (
    <div className='py-6 sm:py-8 lg:py-12'>
      <div className='max-w-screen-2xl px-4 md:px-8 mx-auto'>
        <div className='flex flex-col items-center'>
          <div className='inline-flex items-center gap-2.5 mb-8'>
            <Image src='/favicon.png' alt='Logo' width={50} height={50} />
          </div>

          <p className='inline-flex items-center text-sm md:text-base font-semibold uppercase mb-4'>
            <svg
              className='animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            {t.ERROR.LOADING}
          </p>
        </div>
      </div>
    </div>
  )
}
