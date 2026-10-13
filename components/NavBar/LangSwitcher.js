import { TranslateIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import { useRef, useEffect } from 'react'

const LangSwitcher = ({ showLangMenu, setShowLangMenu, setShowMenu }) => {
  const router = useRouter()
  const { locale, asPath } = router
  const menuRef = useRef(null)

  const languages = [
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English · 维护中' },
    { code: 'ja', name: '日本語 · 维护中' }
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuRef, setShowLangMenu])

  useEffect(() => {
    if (!showLangMenu) return;
    const handleScroll = () => {
      setShowLangMenu(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showLangMenu, setShowLangMenu]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        aria-label='LangSwitcher'
        onClick={() => {
          setShowLangMenu((prev) => {
            if (!prev) setShowMenu(false)
            return !prev
          })
        }}
        className='p-2 ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-lg dark:text-gray-100'
      >
        <TranslateIcon className='h-5 w-5' />
      </button>
      
      {showLangMenu && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="language-menu">
            {languages.map((lang) => (
              <a
                key={lang.code}
                href={lang.code === 'zh' ? asPath : `/${lang.code}`}
                className={`block px-4 py-2 text-sm ${
                  locale === lang.code
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                role="menuitem"
                onClick={() => setShowLangMenu(false)}
              >
                {lang.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LangSwitcher
