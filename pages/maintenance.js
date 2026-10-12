import StatusPage from '@/components/StatusPage'

export function getStaticProps({ locale }) {
  const language = ['zh', 'en', 'ja'].includes(locale) ? locale : 'zh'
  return { props: { language } }
}

export default function Maintenance({ language }) {
  return <StatusPage kind='maintenance' language={language} image='/images/status/maintenance-tools.png' />
}
