import { useEffect, useRef, useState } from 'react'
import StatusPage from '@/components/StatusPage'
import { maintenanceImages } from '@/lib/statusMessages'

export function getStaticProps({ locale }) {
  const language = ['zh', 'en', 'ja'].includes(locale) ? locale : 'zh'
  return { props: { language } }
}

export default function Maintenance({ language }) {
  const [imageIndex, setImageIndex] = useState(null)
  const selected = useRef(false)

  useEffect(() => {
    // Avoid advancing twice when React Strict Mode replays effects.
    if (selected.current) return
    selected.current = true
    let next = 0
    try {
      const previous = window.sessionStorage.getItem('blog:maintenance-image')
      if (previous !== null && /^[0-2]$/.test(previous)) {
        next = (Number(previous) + 1) % maintenanceImages.length
      }
      window.sessionStorage.setItem('blog:maintenance-image', String(next))
    } catch {
      // If browser storage is disabled, still show the first illustration.
    }
    setImageIndex(next)
  }, [])

  return <StatusPage kind='maintenance' language={language} image={imageIndex === null ? null : maintenanceImages[imageIndex]} />
}
