const notionRevalidateSeconds = Number(
  process.env.NOTION_REVALIDATE_SECONDS || 60
)
if (
  !Number.isInteger(notionRevalidateSeconds) ||
  notionRevalidateSeconds < 1 ||
  notionRevalidateSeconds > 300
) {
  throw new Error(
    'NOTION_REVALIDATE_SECONDS must be an integer between 1 and 300'
  )
}

// 网站身份与栏目
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
  // 外观与日期
  lang: 'zh', // 主语言
  timezone: 'Asia/Shanghai', // 内容日期统一使用北京时间
  appearance: 'auto', // 默认主题：light、dark、auto；auto 每次加载跟随浏览器偏好
  font: 'sans-serif', // 字体：sans-serif（无衬线）或 serif（衬线）
  lightBackground: '#F6F8FA', // 浅色背景
  darkBackground: '#212936', // 深色背景
  path: '', // 路径前缀；部署在域名根目录时留空
  since: 2023, // 版权起始年；留空则只显示当年
  // 列表与导航
  postsPerPage: 10,
  sortByDate: true,
  pagesShow: {
    musings: true,
    notes: true,
    projects: true,
    books: true
  },
  previewImagesEnabled: true,
  stickyNavBar: true, // 导航栏随滚动保持可见
  defaultCover: '/cover.png',
  socialLink: {
    github: 'https://github.com/XinzheGao'
  },
  seo: {
    keywords: ['Xinzhe', 'Blog', '信哲'],
    googleSiteVerification: '' // Google 网站所有权验证代码；为空则不输出
  },
  // Notion 内容连接
  notionDatabaseId:
    process.env.NOTION_DATABASE_ID || process.env.NOTION_PAGE_ID, // 优先读取新变量，兼容现有 NOTION_PAGE_ID
  notionDataSourceId: process.env.NOTION_DATA_SOURCE_ID, // 单数据源数据库可留空
  notionRevalidateSeconds, // 缓存及 ISR 间隔，默认 60 秒，范围 1～300 秒
  // 联系表单
  telegramToken: process.env.TELEGRAM_TOKEN, // 联系表单机器人凭据，来自服务器环境变量
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '7087670492', // 默认接收聊天 ID，可用环境变量覆盖
  comment: {
    provider: '', // supacomments；留空关闭评论
    supaCommentsConfig: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      // 浏览器公开密钥，不能使用 secret 或 service_role 密钥。
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    }
  }
}
module.exports = BLOG
