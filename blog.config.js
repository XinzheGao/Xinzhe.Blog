const notionRevalidateSeconds = Number(process.env.NOTION_REVALIDATE_SECONDS || 60)
if (!Number.isInteger(notionRevalidateSeconds) || notionRevalidateSeconds < 1 || notionRevalidateSeconds > 300) {
  throw new Error('NOTION_REVALIDATE_SECONDS must be an integer between 1 and 300')
}

const BLOG = {
  title: 'Xinzhe',
  author: 'Xinzhe',
  email: 'gao-yiqian@outlook.com',
  link: 'https://xinzhe.dev',
  musings: 'Musings',
  notes: 'Notes',
  projects: 'Project',
  books: 'Books',
  description: 'Dream it. Chase it. Code it.',
  lang: 'en', // ['zh', 'en'] 
  timezone: 'Asia/Tokyo', // See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones for all options.
  appearance: 'auto', // ['light', 'dark', 'auto'],
  font: 'sans-serif', // ['sans-serif', 'serif']
  lightBackground: '#F6F8FA', // use hex value, don't forget '#' e.g #fffefc
  darkBackground: '#212936', // use hex value, don't forget '#'
  path: '', // leave this empty unless you want to deploy Notionic in a folder
  since: 2023, // If leave this empty, current year will be used. 
  postsPerPage: 10,
  sortByDate: true,
  pagesShow: {
    musings: true,
    notes: true,
    projects: true,
    books: true,
  },
  previewImagesEnabled: true,
  autoCollapsedNavBar: false, // The automatically collapsed navigation bar 
  ogImageGenerateHost: 'og-zl.vercel.app', // The link to generate OG image, don't end with a slash
  defaultCover: '/cover.png',
  socialLink: {
    twitter: '',
    github: 'https://github.com/XinzheGao',
    telegram: ''
  },
  seo: {
    keywords: ['Xinzhe', 'Blog' , '信哲'],
    googleSiteVerification: '' // Remove the value or replace it with your own google site verification code
  },
  notionPageId: process.env.NOTION_PAGE_ID, // DO NOT CHANGE THIS! Edit .env file!
  notionSpacesId: process.env.NOTION_SPACES_ID, // DO NOT CHANGE THIS! Edit .env file!
  notionDataSourceId: process.env.NOTION_DATA_SOURCE_ID, // Optional for a database with one data source
  notionRevalidateSeconds, // Cache TTL and ISR refresh interval (default 60 seconds)
  notionDomain: 'izuolan.notion.site',
  telegramToken: process.env.TELEGRAM_TOKEN, // The token of your Telegram bot
  telegramChatId: '7087670492', // The chat id of your Telegram bot
  telegramChannelUrl: '', // The link of your Telegram channel
  telegramChannelName: '', // The name of your Telegram channel
  analytics: {
    provider: '', // Currently we support Google Analytics, Ackee, Umami and Cloudflare Insights, please fill with 'ga' or 'ackee' or 'umami' or 'cf', leave it empty to disable it.
    ackeeConfig: {
      tracker: '', // e.g 'https://ackee.example.com/tracker.js'
      dataAckeeServer: '', // e.g https://ackee.example.com , don't end with a slash
      domainId: '' // e.g '0e2257a8-54d4-4847-91a1-0311ea48cc7b'
    },
    cfConfig: {
      scriptUrl: 'https://static.cloudflareinsights.com/beacon.min.js', // Default
      token: '' // Like '{"token": "xxxxxxxxxxxxxxxxxx"}'
    },
    gaConfig: {
      measurementId: '' // e.g: G-XXXXXXXXXX
    },
    umamiConfig: {
      scriptUrl: '', // The url of your Umami script
      websiteId: '' // The website id of your Umami instance
    }
  },
  comment: {
    // support provider: utterances, supacomments
    provider: 'supacomments', // leave it empty if you don't need any comment plugin 评论区
    supaCommentsConfig: {
      supabaseUrl: '', // The url of your Supabase instance
      supabaseAnonKey: '' // The anonymous key of your Supabase instance
    },
    utterancesConfig: {
      repo: ''
    }
  },
  isProd: process.env.VERCEL_ENV === 'production' // distinguish between development and production environment (ref: https://vercel.com/docs/environment-variables#system-environment-variables)
}
// export default BLOG
module.exports = BLOG
