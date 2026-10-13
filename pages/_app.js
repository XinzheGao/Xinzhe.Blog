import 'react-notion-x/src/styles.css'
import 'katex/dist/katex.min.css'
import '@/styles/globals.css'
import '@/styles/notion.css'
import BLOG from '@/blog.config'
import { ThemeProvider } from 'next-themes'
import TransitionEffect from '@/components/Common/TransitionEffect'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import NProgress from 'nprogress'
import '@/styles/nprogress.css'
import Header from '@/components/NavBar/Header'
import Footer from '@/components/NavBar/Footer'

function MyApp({ Component, pageProps }) {
  // https://github.com/vercel/next.js/blob/canary/examples/with-loading/pages/_app.js
  const router = useRouter()
  const showChrome = !['/maintenance', '/status-preview'].includes(router.pathname)

  useEffect(() => {
    const handleStart = (url) => {
      NProgress.start()
    }
    const handleStop = () => {
      NProgress.done()
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleStop)
    router.events.on('routeChangeError', handleStop)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleStop)
      router.events.off('routeChangeError', handleStop)
    }
  }, [router])

  return (
    <>
      <ThemeProvider attribute='class' enableSystem={true} defaultTheme={BLOG.appearance === 'auto' ? 'system' : BLOG.appearance}>
        {showChrome && <Header
          navBarTitle={pageProps.post ? pageProps.post.title : null}
          fullWidth={pageProps.post ? pageProps.post.fullWidth : false}
        />}
        <TransitionEffect>
            <div
              className={`min-h-[calc(100vh-14rem)] md:min-h-[calc(100vh-18rem)] ${
                BLOG.font === 'serif' ? 'font-serif' : 'font-sans'
              }`}
            >
              <Component {...pageProps} />
            </div>
        </TransitionEffect>
        {showChrome && <Footer fullWidth={pageProps.post ? pageProps.post.fullWidth : false} />}
      </ThemeProvider>
    </>
  )
}

export default MyApp
