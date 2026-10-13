import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/outline'
import { useTheme } from 'next-themes'

const ThemeSwitcher = () => {
  const { theme, setTheme, systemTheme } = useTheme()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) return null

  const isDark = theme === 'system' ? systemTheme === 'dark' : theme === 'dark'

  return (
    <button
      aria-label='ThemeSwitcher'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className='p-2 ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-lg dark:text-gray-100'
    >
      {isDark ? (
        <MoonIcon className='h-5 w-5' />
      ) : (
        <SunIcon className='h-5 w-5' />
      )}
    </button>
  )
}

export default ThemeSwitcher
