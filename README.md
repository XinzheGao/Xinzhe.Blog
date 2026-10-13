# Xinzhe.Blog

我的个人博客，用来记录技术实践、学习笔记、开源项目和生活中的思考。内容在 Notion 中编辑，网站通过官方 Notion API 读取，使用 Next.js 和 React 展示。

[访问博客](https://xinzhe.dev) · [问题反馈](https://github.com/XinzheGao/Xinzhe.Blog/issues) · [MIT License](LICENSE)

## 当前状态

- 主要维护中文网站，首页、笔记、项目、随想和文章详情可以访问。
- 英文、日文及书架入口暂时显示维护页，内容和相关实现仍保留。
- 搜索页默认随机展示 10 条内容，关键词搜索覆盖全部已发布的推文、笔记和项目。
- 文章地址自动生成，已保存的历史地址继续跳转到新地址。
- 评论支持免登录提交、直接公开，以及当前浏览器凭证删除。Telegram 和邮件通知尚未恢复。

项目基于 [Notionic](https://github.com/izuolan/notionic) 定制。当前源码主要使用 JavaScript，`package.json` 仍保留部分上游项目元信息。

## 技术栈

| 部分 | 实现 |
| --- | --- |
| 运行环境 | Node.js 24.x、pnpm 7.33.7 |
| 页面与路由 | Next.js 13 Pages Router、React 18、JavaScript |
| 样式与交互 | Tailwind CSS、Framer Motion、next-themes、NProgress |
| 内容读取 | 服务端 `fetch` 调用官方 Notion REST API |
| 正文展示 | react-notion-x、notion-utils、Prism、KaTeX |
| 图片预览 | sharp、got、p-map、p-memoize |
| 日期与订阅 | Day.js、feed |
| 网站地图 | next-sitemap |
| 部署 | Vercel Git 集成，也可使用 Node.js 运行生产构建 |

## 内容怎样到达网页

```text
Notion 数据库：属性与页面正文
    │
    ├─ officialClient.js：查询数据源、分页取数、递归读取正文
    ├─ notionFetchHelper.js：缓存与合并并发请求
    │
    ├─ contentSchema.js：解析属性、判断发布条件、生成地址
    └─ officialAdapter.js：转换正文块为 recordMap
             │
             ▼
    pages：getStaticProps / getStaticPaths / getServerSideProps
             │
             ▼
    layouts + components：列表、正文、目录、搜索、导航
             │
             ▼
    React 页面 / RSS XML
```

### 1. 查询内容列表

页面通过 [`lib/notion.js`](lib/notion.js) 导入公共取数方法。`getContents()` 的调用路径是：

```text
getContents({ type, language, tag })
    → getBlogPages()
    → getBlogPages 的进程内缓存
    → 查询 Notion 数据源
    → contentMetadata() 统一属性
    → filterContents() 筛选可发布内容
    → 按 publishedAt 降序排列
```

[`officialClient.js`](lib/notion/officialClient.js) 使用 `Notion-Version: 2026-03-11`。未填写数据源 ID 时，先通过数据库 ID 查询数据源；只有一个数据源才会自动选用。数据库查询每页最多取 100 条，继续读取游标直到结束，不只处理第一页。

首页及各栏目按 `type` 和当前语言取数；栏目顶部介绍由 `getSectionIntro(section, language)` 单独取得。

### 2. 读取文章正文

[`pages/[slug].js`](pages/[slug].js) 先根据地址和语言找到内容，随后调用：

```text
getPostBlocks(pageId)
    → getPageRecordMap(pageId)
    → 检查页面的公开访问条件
    → 分页、递归读取 blocks/{id}/children
    → officialAdapter 转换正文块
    → 可选的图片模糊预览
    → NotionRenderer 展示 recordMap
```

支持文本、标题、列表、引用、折叠块、待办事项、代码、公式、图片、媒体、简单表格和分栏等常用块。代码与公式组件按需加载。文章目录从正文的页面根节点与标题块生成。

转换层遇到不支持的块会报错，而不是静默丢掉这部分正文。嵌入数据库不在当前支持范围内；Notion 的页面全宽设置也未映射，默认使用普通阅读宽度。

### 3. 页面生成与刷新

- 文章和栏目主要通过 `getStaticProps` 生成，结合 ISR 更新。
- 文章、标签和子页面的未预生成地址使用 `fallback: 'blocking'` 按需生成。
- 首页后续分页使用动态分页路由。
- `/feed` 通过 `getServerSideProps` 返回 RSS XML。
- `/api/*` 为服务端接口，Notion 令牌不传给浏览器。

`/s/{pageId}` 用于访问 Notion 子页面。服务端会追溯它是否属于本博客已发布的内容，连接能读取的其他页面不会因此自动公开。已发布文章下的子页面属于文章的公开内容范围。

## 本地运行

准备 Node.js 24.x 和 pnpm 7.33.7：

```bash
npm install -g pnpm@7.33.7

git clone https://github.com/XinzheGao/Xinzhe.Blog.git
cd Xinzhe.Blog
pnpm install --frozen-lockfile
cp .env.example .env.local
```

在 Notion 创建有读取权限的内部连接，并在博客数据库的 Connections 中添加该连接。连接需要能读取数据库及页面正文，无须将整个数据库公开发布。

在 `.env.local` 填写：

```dotenv
NOTION_API_TOKEN=your_internal_connection_token
NOTION_DATABASE_ID=your_database_id
NOTION_DATA_SOURCE_ID=
NOTION_REVALIDATE_SECONDS=60
```

| 变量 | 说明 |
| --- | --- |
| `NOTION_API_TOKEN` | 必需，官方 Notion 内部连接令牌 |
| `NOTION_DATABASE_ID` | 数据库 ID；兼容旧变量 `NOTION_PAGE_ID`，两者都有时以新变量为准 |
| `NOTION_DATA_SOURCE_ID` | 可选；数据库含多个数据源时必须指定 |
| `NOTION_REVALIDATE_SECONDS` | 缓存与 ISR 间隔，整数 `1–300`，默认 `60` 秒 |

真实令牌只放在服务器环境变量或被 Git 忽略的 `.env.local` 中，不使用 `NEXT_PUBLIC_` 前缀。旧 `NOTION_ACCESS_TOKEN` 和 `NOTION_SPACES_ID` 不参与当前取数流程。

配置完成后运行：

```bash
pnpm dev
```

打开 [localhost:3000](http://localhost:3000)。修改站点信息使用 [`blog.config.js`](blog.config.js)，其中包含标题、作者、域名、描述、时区、分页和可选服务配置。当前日期按 `Asia/Shanghai` 解释。

## 网站配置

`blog.config.js` 按网站身份、外观与日期、列表与导航、Notion 连接、联系表单及可选服务组织，注释说明各项用途。

- 内容日期使用 `Asia/Shanghai`。纯日期保留所选年月日，带时区偏移的时间保留原始时刻后按北京时间显示。
- `appearance` 支持 `auto`、`light`、`dark`。自动模式每次打开或刷新时按浏览器的 `prefers-color-scheme` 判断深浅色，并在未手动切换时同步浏览器偏好的变化；手动按钮仅覆盖本次访问，下次加载重新跟随浏览器。
- `stickyNavBar` 控制粘性导航。`notionDatabaseId` 优先读取 `NOTION_DATABASE_ID`，旧部署的 `NOTION_PAGE_ID` 仍兼容。
- 联系表单需要服务器环境变量 `TELEGRAM_TOKEN`。`TELEGRAM_CHAT_ID` 可选，未设置时继续使用原默认接收聊天 ID。

## Notion 内容模型

属性名称和选项值应与代码一致。

| 属性 | Notion 类型 | 用途 |
| --- | --- | --- |
| `title` | Title | 内容标题 |
| `type` | Select | 内容类型，见下表 |
| `language` | Select | `zh`、`en`、`ja` |
| `publicationStatus` | Select 或 Status | 网站只展示 `Published` 内容 |
| `publishedAt` | Date | 手动发布日期，不用创建时间替代 |
| `summary` | Text | 可选摘要，用于列表、搜索、订阅和页面描述 |
| `tags` | Multi-select | 可选标签 |
| `section` | Select | 栏目介绍的定位属性 |
| `source` | Relation，关联本数据库 | 译文关联原文，每篇译文关联一篇原文 |
| `translations` | Relation，关联本数据库 | 可选，在 Notion 中查看对应译文 |
| `legacySlug` | Text | 可选，补充历史地址别名 |

| `type` | 内容 | 列表入口 |
| --- | --- | --- |
| `Post` | 首页推文、技术文章 | `/`、`/posts` |
| `Note` | 学习笔记 | `/notes` |
| `Project` | 项目记录 | `/projects` |
| `Musings` | 随想 | `/musings` |
| `Book` | 读书笔记 | `/books`，当前显示维护页 |
| `Page` | 独立页面 | 自动生成的详情地址 |
| `SectionIntro` | 首页或栏目介绍 | 由 `section` 和 `language` 定位 |

栏目介绍使用 `home`、`notes`、`projects`、`musings` 或 `books` 作为 `section`，不会进入普通内容列表，也不需要公开 slug。首页介绍缺少英文或日文记录时，取数逻辑可以回退到中文；当前英文和日文网站仍处于维护状态。

发布内容时，填写标题、类型、语言、发布日期和正文，再将 `publicationStatus` 设为 `Published`。公开内容需要标题非空、发布日期有效且已到达；草稿、未来日期、缺少发布日期、归档及回收站页面不进入公开列表。

翻译计划、校对状态、项目阶段和阅读状态等其他属性可以用于 Notion 内的管理，但不会代替网站发布条件，也不会触发自动翻译或自动发布。

## 自动地址与历史跳转

新内容无须填写 `slug`，地址根据类型和页面 ID 生成：

```text
/post-{去掉连字符的页面ID}
/note-{去掉连字符的页面ID}
/project-{去掉连字符的页面ID}
```

修改标题不改变地址；修改类型会改变地址前缀。历史别名来自 [`legacySlugs.json`](lib/notion/legacySlugs.json)，以及可选的 `legacySlug`、旧 `slug` 属性。访问已保存的历史地址时，永久跳转到对应语言的新地址。删除 Notion 的旧 slug 列，不影响已经写入 JSON 的别名。

多语言内容分别保存为独立页面，通过译文的 `source` 关联原文。当前维护策略只影响路由展示，未删除译文数据。

## 搜索与标签

搜索与标签页共用 [`layouts/search.js`](layouts/search.js)，筛选和随机抽样函数位于 [`lib/search.js`](lib/search.js)。

1. 服务端取得当前语言全部已发布内容，只保留 `Post`、`Note`、`Project`。
2. 服务端提供初始的随机 10 条，浏览器挂载后重新抽样；抽样不改变完整搜索列表。
3. 输入关键词时，在完整列表的标题、摘要和标签中匹配，忽略大小写及关键词两端空格。
4. 搜索结果先展示 20 条，点击“加载更多”每次增加 20 条。
5. 清空关键词后恢复本次访问的随机列表。

搜索不读取文章正文，也不包含随想、书架、独立页面或栏目介绍。标签数量按相同的三类内容计算；标签页只展示当前语言该标签下的内容，支持继续搜索和加载更多。

搜索数据随页面的 ISR 更新，不会在每次按键时重新请求 Notion。

## 缓存与图片

[`notionFetchHelper.js`](lib/notion/notionFetchHelper.js) 为内容列表和正文提供进程内缓存：相同请求合并、条目按 TTL 过期、缓存数量超过 300 时淘汰最早插入的条目。缓存不是持久化数据库，不同进程不共享。

Notion 请求在单进程内排队，请求起始时间至少间隔 350 毫秒，单次超时 20 秒；网络错误、429 和服务端错误最多尝试 4 次。正文递归设有深度和块数量上限，避免无限遍历。

`NOTION_REVALIDATE_SECONDS` 同时控制上述缓存 TTL 与页面 ISR。ISR 由访问触发，60 秒不是固定轮询周期，也不保证 Notion 修改在 60 秒内恰好显示。刷新失败时请求层抛出错误，已有成功页面可由 Next.js ISR 保留；首次生成失败没有旧页面可回退。

图片使用 Notion 返回的完整地址，上传资源的临时签名链接不再经过旧图片代理。开启 `previewImagesEnabled` 时，服务端生成低清模糊占位图；预览生成失败会返回空预览，不会因此主动截断正文。

Open Graph 和 Twitter 分享图片默认使用本站 `/cover.png`，不再依赖旧外部图片生成服务。站点图标使用现有 PNG 和 ICO；静态资源缓存配置位于 [`vercel.json`](vercel.json)，实际响应还可能受前置 CDN 的缓存规则影响。

## 维护页与错误页

- 根路径使用中文，关闭浏览器语言自动跳转。
- [`siteAvailability.js`](lib/siteAvailability.js) 指定维护语言，当前为 `en`、`ja`。
- [`next.config.js`](next.config.js) 将这两种语言的页面路径重写到对应维护页，将 `/books` 重写到中文维护页。
- `/book` 永久跳转到 `/books`，`/newsletter` 永久跳转到 `/musings`。
- 维护、404 和服务错误页由 `StatusPage` 统一展示；维护与错误页声明 `noindex`，维护语言和书架路径被网站地图配置排除。
- `/status-preview` 仅在开发环境开放，可预览状态页、语言和主题。

恢复维护中的栏目时，需要修改路由与维护语言配置；导航显示开关本身不等于解除维护路由。

## 服务端接口与暂缓功能

| 接口 | 当前实现 |
| --- | --- |
| `/api/check-slug?slug=...` | 检查已发布内容的当前自动地址，返回 `{ found }`；不解析历史别名 |
| `/api/content-languages?slug=...&language=zh` | 根据原文关联取得已发布语言版本，返回 `{ versions }` |
| `/api/sendtotg` | 接收联系表单，调用 Telegram Bot API |

联系表单经 `ContactForm → /api/sendtotg → Telegram sendMessage` 转发，需要服务器环境变量 `TELEGRAM_TOKEN`；`TELEGRAM_CHAT_ID` 可覆盖默认接收聊天 ID。当前实现没有将私信保存到数据库，并把请求对象直接放进消息 `text`；发送逻辑仍待修整，不能仅凭接口存在认定通知可用。

评论组件按 `blog.config.js` 选择 SupaComments 或 Utterances。SupaComments 接入使用 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；配置缺失时不加载评论。当前组件直接访问 Supabase Data API，不再加载 `public/comments` 中的旧打包脚本。只能使用公开 publishable key，不能填写 secret 或 service_role key。

新项目的建表与权限草稿位于 `supabase/comments-setup.sql`，需要单独执行后才能接入。评论按 Notion 页面 ID 关联，提交后直接公开；昵称、正文和时间可公开读取，联系方式和删除凭证哈希不可公开读取。访客不能修改评论，删除需要匹配当前浏览器保存的随机凭证。换设备或清除浏览器存储后，用户需要联系博主处理删除。旧评论不迁移，评论不会触发 Telegram 通知。

执行建表后，用 `supabase/comments-verify.sql` 验证公开读取、联系方式与凭证保护、禁止修改、错误凭证拒绝删除、本人删除；验证数据在事务中回滚，不会留下评论。两项公开环境变量需要在部署前配置并重新构建。前端和数据库的真实交互还需单独验证，Node 单元测试不能代替这些检查。

邮件通知、私信持久化和评论恢复均未实现。统计组件保留 Google Analytics、Ackee、Umami 和 Cloudflare Insights 的选择，当前 `analytics.provider` 为空。

此前清理已移除旧 Craft 卡片和转发接口、旧 SVG 头像、旧全文订阅与元信息工具，以及直接依赖 `notion-client`、`preact`。仓库仍有部分旧文案与注释代码；保留中的多语言、书架和评论功能不属于已经删除的范围。

## RSS 与部署

`/feed` 返回 RSS 2.0，包含最新 10 条已发布内容的标题、摘要、链接和日期。当前代码未限定内容类型或语言，范围与搜索页不同；不包含正文全文。

### Vercel

将仓库导入 Vercel，使用 Node.js 24.x，并为 Production、Preview 分别配置 Notion 环境变量。生产分支使用 `main`，推送后由 Git 集成构建和部署。

构建需要访问 Notion 数据库与正文。完成后核对部署提交、Ready 状态和正式域名，再检查搜索、标签、正文滚动、维护入口与旧地址跳转。

仓库另外保留每日调用 Deploy Hook 的 GitHub Actions 工作流；它与访问触发的 ISR 是两条独立机制。复制项目时需要配置自己的 Hook，文件存在不代表工作流已在 GitHub 启用。

### 本地生产运行与网站地图

```bash
pnpm build
pnpm run postbuild
pnpm start
```

`build` 脚本执行 `next build`；`postbuild` 执行 `next-sitemap`，按照配置生成网站地图和 `robots.txt`。pnpm 环境可能不自动执行前后置脚本，因此这里显式调用；部署环境若已配置执行该步骤，无须重复添加。

代码配置了 `output: 'standalone'`，但内容读取、API 和 ISR 仍需要服务器运行，不是纯静态 HTML 导出项目。

## 开发与验证

```bash
node --test tests/*.test.cjs
```

| 测试文件 | 覆盖范围 |
| --- | --- |
| `content-schema.test.cjs` | 发布条件、日期、自动地址、历史跳转、多语言关联 |
| `notion-backend.test.cjs` | 属性与正文转换、分页、缓存、公开访问边界 |
| `notion-toc.test.cjs` | 文章与子页面目录、缺少根节点和标题的情况 |
| `search.test.cjs` | 搜索类型范围、随机抽样、完整列表匹配和关键词处理 |

测试使用模拟数据，不需要真实 Notion 令牌。测试通过不等于真实服务已可用，部署后仍需检查数据和浏览器交互。使用模拟内容验证本地构建时，不应把模拟环境配置或构建产物用于正式部署。

其他命令：`pnpm dev` 启动开发服务，`pnpm start` 运行生产构建，`pnpm format` 格式化文件。`dev.sh` 会结束匹配到的 pnpm/next 进程，日常启动优先使用 `pnpm dev`。

## 目录结构

```text
.
├── components/
│   ├── Common/          # SEO、图标、日期、标签、统计与动画
│   ├── Hero/            # 首页与栏目介绍
│   ├── NavBar/          # 导航、页脚、语言与主题切换
│   └── Post/            # 正文、目录、侧栏与评论
├── layouts/             # 文章详情和搜索布局
├── lib/
│   ├── notion/          # 官方 API、转换、内容规则、缓存和历史地址
│   ├── search.js        # 搜索范围、匹配与随机抽样
│   ├── lang.js          # 界面文字
│   ├── siteAvailability.js
│   └── rss.js
├── pages/
│   ├── api/             # 查询与通知接口
│   ├── [slug].js        # 正文与历史地址解析
│   ├── s/[subpage].js   # Notion 子页面
│   ├── tag/[tag].js     # 标签筛选
│   └── page/[page].js   # 列表分页
├── public/              # 封面、图标、状态插图、评论打包脚本
├── styles/              # 全局、正文、代码与进度条样式
├── tests/               # Node.js 回归测试
├── .github/workflows/   # 定时部署 Hook
├── .env.example
├── blog.config.js
├── next.config.js
├── next-sitemap.config.js
├── package.json
└── pnpm-lock.yaml
```

`node_modules` 是本地依赖，`.next` 是构建产物，两者不提交到 Git。文章正文来自 Notion，仓库外的本地草稿和迁移记录不参与当前网站取数。

## 致谢与许可证

感谢 [Notionic](https://github.com/izuolan/notionic)、[React Notion X](https://github.com/NotionX/react-notion-x) 及相关开源项目。

代码采用 [MIT License](LICENSE)，保留原项目版权声明。欢迎提交 Issue 或 Pull Request；涉及取数、正文转换、搜索和路由的修改，请附复现方式并运行相关测试。
