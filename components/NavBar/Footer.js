import Link from 'next/link'
import BLOG from '@/blog.config'
import { lang } from '@/lib/lang'
import { useRouter } from 'next/router'
import {
  UserIcon,
  MailIcon,
  NewspaperIcon,
  BookOpenIcon
} from '@heroicons/react/outline'

import Social from '../Common/Social.js'
import { motion } from 'framer-motion'

const Footer = ({ fullWidth }) => {
  const router = useRouter()
  const { locale } = useRouter()
  const t = lang[locale]

  let activeMenu = ''
  if (router.query.slug) {
    activeMenu = '/' + router.query.slug
  } else {
    activeMenu = router.pathname
  }

  const d = new Date()
  const y = d.getFullYear()
  const from = +BLOG.since

  const links = [
    {
      id: 0,
      name: t.NAV.ABOUT,
      to: BLOG.path || '/about',
      icon: <UserIcon className='inline-block mb-1 h-5 w-5' />,
      show: true
    },
    {
      id: 1,
      name: t.NAV.MUSINGS,
      to: '/musings',
      icon: <NewspaperIcon className='inline-block mb-1 h-5 w-5' />,
      show: BLOG.pagesShow.musings
    },
    {
      id: 2,
      name: t.NAV.BOOK,
      to: '/books',
      icon: <BookOpenIcon className='inline-block mb-1 h-5 w-5' />,
      show: BLOG.pagesShow.books
    },
    {
      id: 3,
      name: t.NAV.CONTACT,
      to: '/contact',
      icon: <MailIcon className='inline-block mb-1 h-5 w-5' />,
      show: false
    },
  ]

  return (
    <motion.div
      className={`mt-6 flex-shrink-0 m-auto w-full text-gray-600 dark:text-gray-300 transition-all ${
        !fullWidth ? 'max-w-4xl md:px-4' : 'px-4 md:px-24'
      }`}
    >
      <footer className='max-w-screen-2xl px-4 md:px-4 mx-auto'>
        <div className='flex flex-col md:flex-row justify-between items-center border-b dark:border-gray-600 py-1'>
          <ul className='flex flex-wrap justify-center md:justify-start md:gap-1'>
            {links.map(
              (link) =>
                link.show && (
                  <Link passHref key={link.id} href={link.to} scroll={false}>
                    <li key={link.id}
                      className={`${
                        activeMenu === link.to
                          ? 'bg-gray-200 dark:bg-gray-700'
                          : ''
                      } hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-lg block py-1 px-2 nav`}
                    >
                      <div className='font-light'>
                        {link.icon}
                        <span className='inline-block m-1'>{link.name}</span>
                      </div>
                    </li>
                  </Link>
                )
            )}
          </ul>
          <div className='hidden md:flex'>
            <Social />
          </div>
        </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className='text-gray-400 text-xs font-light py-4'>
          © {from === y || !from ? y : `${from} - ${y}`} | {BLOG.author}
        </div>
      </div>
        
      </footer>
    </motion.div>
  )
}

export default Footer
