import { useEffect, useCallback, useState, useRef } from 'react'
import Link from 'next/link'
import BLOG from '@/blog.config'
import { lang } from '@/lib/lang'
import { useRouter } from 'next/router'
import {
  HomeIcon,
  CollectionIcon,
  SparklesIcon,
  SearchIcon,
  MenuIcon
} from '@heroicons/react/outline'
import Social from '../Common/Social.js'
import ThemeSwitcher from './ThemeSwitcher.js'
import LangSwitcher from './LangSwitcher.js'
import Logo from '@/components/Common/Logo'
import { motion } from 'framer-motion'

const NavBar = ({ showMenu, setShowMenu, showLangMenu, setShowLangMenu }) => {
  const router = useRouter()
  const { locale } = useRouter()
  const t = lang[locale]

  let activeMenu = ''
  if (router.query.slug) {
    activeMenu = '/' + router.query.slug
  } else {
    activeMenu = router.pathname
  }

  const links = [
    {
      id: 0,
      name: t.NAV.INDEX,
      to: BLOG.path || '/',
      icon: <HomeIcon className='inline-block mb-1 h-5 w-5' />,
      show: true
    },
    {
      id: 1,
      name: t.NAV.NOTES,
      to: '/notes',
      icon: <CollectionIcon className='inline-block mb-1 h-5 w-5' />,
      show: BLOG.pagesShow.notes
    },
    {
      id: 2,
      name: t.NAV.PROJECTS,
      to: '/projects',
      icon: <SparklesIcon className='inline-block mb-1 h-5 w-5' />,
      show: BLOG.pagesShow.projects
    },
    {
      id: 3,
      name: t.NAV.SEARCH,
      to: '/search',
      icon: <SearchIcon className='inline-block mb-1 h-5 w-5' />,
      show: true
    }
  ]

  const navMenuRef = useRef(null);

  // 点击空白处关闭菜单栏
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event) => {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, setShowMenu]);

  // 滚动时自动关闭菜单栏和语言切换器
  useEffect(() => {
    if (!showMenu && !showLangMenu) return;
    const handleScroll = () => {
      setShowMenu(false);
      setShowLangMenu(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showMenu, showLangMenu, setShowMenu, setShowLangMenu]);

  return (
    <motion.div className='flex'>
      {/* Desktop Menu */}
      <ul className='hidden md:flex md:gap-1'>
        {links.map(
          (link) =>
            link.show && (
              <Link passHref href={link.to} key={link.id} scroll={false}>
                <li
                  className={`${
                    activeMenu === link.to ? 'bg-gray-200 dark:bg-gray-700' : ''
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

      <div className='nav-func-btn flex items-center'>
        <ThemeSwitcher />
        <LangSwitcher showLangMenu={showLangMenu} setShowLangMenu={setShowLangMenu} showMenu={showMenu} setShowMenu={setShowMenu} />
      </div>

      {/* Mobile Phone Menu */}
      <div className='md:hidden mr-2 block ' ref={navMenuRef}>
        <button
          type='button' aria-label='Menu'
          onClick={() => {
            setShowMenu((prev) => {
              if (!prev) setShowLangMenu(false)
              return !prev
            })
          }}
          className='hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-lg block p-2 -mr-3 md:pb-3'
        >
          <MenuIcon className='inline-block mb-1 h-5 w-5' />
        </button>
        {showMenu && (
          <div className='absolute right-0 w-40 mr-4 mt-2 bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600 rounded-md shadow-lg outline-none'>
            <div className='py-1'>
              {links.map(
                (link) =>
                  link.show && (
                    <Link passHref key={link.id} href={link.to} scroll={false}>
                      <button
                        onClick={() => setShowMenu((showMenu) => !showMenu)}
                        className='text-left hover:bg-gray-100 dark:hover:bg-gray-600 font-light block justify-between w-full px-4 py-2 leading-5'
                      >
                        {link.icon}
                        <span className='m-1'>{link.name}</span>
                      </button>
                    </Link>
                  )
              )}
            </div>
            <div className='px-4 py-4'>
              <Social />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const Header = ({ navBarTitle, fullWidth }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const useSticky = BLOG.stickyNavBar
  const navRef = useRef(/** @type {HTMLDivElement} */ undefined)
  const sentinelRef = useRef(/** @type {HTMLDivElement} */ undefined)
  const [showTitle, setShowTitle] = useState(true)
  const handler = useCallback(([entry]) => {
    if (useSticky && navRef.current) {
      navRef.current?.classList.toggle('sticky-nav-full', !entry.isIntersecting)
      // 顶部吸附时隐藏标题，否则显示
      setShowTitle(entry.isIntersecting)
    } else {
      navRef.current?.classList.add('remove-sticky')
    }
  }, [useSticky])
  const router = useRouter()

  useEffect(() => {
    const sentinelEl = sentinelRef.current
    const observer = new window.IntersectionObserver(handler)
    observer.observe(sentinelEl)

    const handleScroll = () => {
      if (window.innerWidth >= 768) { // md断点
        if (window.pageYOffset > 400) {
          setShowMenu(true)
        } else {
          setShowMenu(false)
        }
      }
    }
    window.addEventListener('scroll', handleScroll)

    const handleRouteChange = () => {
      setShowMenu(false)
      setShowLangMenu(false)
    }
    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      sentinelEl && observer.unobserve(sentinelEl)
      window.removeEventListener('scroll', handleScroll)
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [handler, sentinelRef, router])
  return (
    <>
      <div className='observer-element h-4 md:h-12' ref={sentinelRef}></div>
      <div
        className={`sticky-nav m-auto w-full h-6 flex flex-row justify-between items-center mb-2 md:mb-12 py-8 bg-opacity-60 ${
          !fullWidth ? 'max-w-4xl px-4' : 'px-4 md:px-24'
        }`}
        id='sticky-nav'
        ref={navRef}
      >
        <div className='flex items-center'>
          <Link passHref href='/' scroll={false} aria-label={BLOG.title}>
            <div>
              <Logo className='h-6 hover:text-blue-500 dark:hover:text-blue-500 fill-current' />
            </div>
          </Link>
          {navBarTitle ? (
            <p className={`ml-2 font-medium hidden xl:block transition-opacity duration-300 ${showTitle ? 'opacity-0' : 'opacity-100'}`}>
              {navBarTitle}
            </p>
          ) : (
            <p className={`ml-2 font-medium hidden xl:block transition-opacity duration-300 ${showTitle ? 'opacity-0' : 'opacity-100'}`}>
              {BLOG.title},{' '}
              <span className='font-normal'>{BLOG.description}</span>
            </p>
          )}
        </div>
        <NavBar showMenu={showMenu} setShowMenu={setShowMenu} showLangMenu={showLangMenu} setShowLangMenu={setShowLangMenu} />
      </div>
    </>
  )
}

export default Header
