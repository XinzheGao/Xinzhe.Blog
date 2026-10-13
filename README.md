# Xinzhe.Blog

在 Notion 中写作，用 Next.js 展示，记录技术实践、学习笔记、开源项目和生活中的思考。

这是 [Xinzhe](https://xinzhe.dev) 持续维护的个人博客，基于 [Notionic](https://github.com/izuolan/notionic) 定制。内容通过官方 Notion API 读取，使用 React 渲染，部署在 Vercel。

[访问博客](https://xinzhe.dev) · [本地运行](#本地运行) · [部署](#部署) · [内容管理](#内容管理) · [问题反馈](https://github.com/XinzheGao/Xinzhe.Blog/issues)

## 功能

- **Notion 写作**：文章、摘要、标签、封面和栏目介绍在 Notion 数据库中管理。
- **分类展示**：文章、笔记、项目、随想和独立页面使用统一的内容模型。
- **内容更新**：通过 ISR 按需刷新页面，配合请求缓存、分页读取和并发合并。
- **稳定地址**：根据类型和页面 ID 自动生成地址，修改标题不改变链接；历史地址继续跳转。
- **搜索与标签**：搜索全部已发布文章、笔记和项目的标题、摘要及标签；空搜索随机推荐 10 条。
- **阅读体验**：文章目录、返回顶部、代码高亮、公式、图片预览、主题切换和页面过渡。
- **订阅与分享**：RSS、SEO 元信息、Open Graph 分享图片和网站地图。
- **状态页面**：中文、英文和日文的维护、404 与服务错误提示。

### 当前开放范围

中文首页、笔记、项目、随想及文章详情开放。英文、日文和书架暂时显示维护页，相关内容与实现保留。

## 本地运行

### 1. 准备环境

使用 **Node.js 24.x** 和 **pnpm 7.33.7**，与 [package.json](package.json) 的配置一致。

```bash
npm install -g pnpm@7.33.7

git clone https://github.com/XinzheGao/Xinzhe.Blog.git
cd Xinzhe.Blog
pnpm install --frozen-lockfile
cp .env.example .env.local
```

### 2. 连接 Notion

在 Notion 创建具有读取权限的内部连接，并将它添加到博客数据库的 Connections 中。连接需要能读取数据库及正文，无须公开发布整个数据库。

按[内容管理](#内容管理)中的字段准备数据库，在 `.env.local` 填写：

```dotenv
NOTION_API_TOKEN=your_internal_connection_token
NOTION_DATABASE_ID=your_database_id
NOTION_DATA_SOURCE_ID=
NOTION_REVALIDATE_SECONDS=60
```

| 变量                        | 用途                                                   |
| --------------------------- | ------------------------------------------------------ |
| `NOTION_API_TOKEN`          | 官方 Notion 连接令牌，必需                             |
| `NOTION_DATABASE_ID`        | 博客数据库 ID；未指定数据源时用于查找数据源            |
| `NOTION_DATA_SOURCE_ID`     | 可选；数据库只有一个数据源时可留空，多个数据源时须指定 |
| `NOTION_REVALIDATE_SECONDS` | 缓存与 ISR 间隔，整数 `1–300`，默认 `60` 秒            |

已有部署仍兼容 `NOTION_PAGE_ID`：它作为数据库 ID 的后备变量，两者同时存在时优先使用 `NOTION_DATABASE_ID`。当前站点部署仍使用这一后备变量，迁移前应保留。`NOTION_ACCESS_TOKEN` 和 `NOTION_SPACES_ID` 不参与当前取数。

连接令牌只放在服务器环境变量或被 Git 忽略的 `.env.local` 中，不使用 `NEXT_PUBLIC_` 前缀。

### 3. 启动

```bash
pnpm dev
```

打开 [localhost:3000](http://localhost:3000)。站点身份与外观在 [blog.config.js](blog.config.js) 中修改。

## 部署

### Vercel

1. 将你的 GitHub 仓库导入 Vercel，选择 Next.js，设置 Node.js 24.x。
2. 在所需部署环境中配置 Notion 变量；Production、Preview 和 Development 分别管理。
3. 设置构建命令为 `pnpm build`。需要生成网站地图时，可显式使用 `pnpm build && pnpm run postbuild`，并避免与平台已有的后置步骤重复执行。
4. 部署完成后绑定域名，在 `blog.config.js` 中更新 `link`，核对正式域名和部署 Ready 状态。

本项目使用 `main` 作为生产分支，推送到 GitHub 后由 Vercel Git 集成自动构建和部署。构建需要读取真实 Notion 内容。

修改 Notion 内容后，页面通过访问触发 ISR 更新，无须每次手动部署。`60` 秒表示允许重新生成的间隔，并非固定轮询，也不保证改动恰好在 60 秒内出现。

仓库另有[每日重建工作流](.github/workflows/daily-vercel-redeploy.yml)，它与 Git 推送部署、ISR 分别运行。复用项目时应配置自己的 Deploy Hook，建议通过 GitHub Secret 保存；工作流文件存在不代表定时任务已启用。

### 本地生产运行

```bash
pnpm build
pnpm run postbuild
pnpm start
```

`postbuild` 使用 [next-sitemap.config.js](next-sitemap.config.js) 生成网站地图与 `robots.txt`。项目保留 API、ISR 和服务端取数，需要服务器运行；当前配置的 `standalone` 输出不是纯静态 HTML 导出。

## 内容管理

### 数据库字段

字段名称、类型选项和语言值需要与代码一致。

| 字段                | Notion 类型            | 说明                                     |
| ------------------- | ---------------------- | ---------------------------------------- |
| `title`             | Title                  | 内容标题                                 |
| `type`              | Select                 | 内容类型，见下表                         |
| `language`          | Select                 | `zh`、`en`、`ja`                         |
| `publicationStatus` | Select 或 Status       | 发布时设为 `Published`                   |
| `publishedAt`       | Date                   | 手动发布日期                             |
| `summary`           | Text                   | 可选摘要，用于列表、搜索、RSS 和页面描述 |
| `tags`              | Multi-select           | 可选标签                                 |
| `section`           | Select                 | 栏目介绍对应的位置                       |
| `source`            | Relation，关联本数据库 | 译文关联一篇原文                         |
| `translations`      | Relation，关联本数据库 | 可选，方便在 Notion 中查看译文           |
| `legacySlug`        | Text                   | 可选，补充历史地址别名                   |

| `type`         | 内容               | 入口                            |
| -------------- | ------------------ | ------------------------------- |
| `Post`         | 技术文章、首页推文 | `/`、`/posts`                   |
| `Note`         | 学习笔记           | `/notes`                        |
| `Project`      | 项目记录           | `/projects`                     |
| `Musings`      | 随想               | `/musings`                      |
| `Book`         | 读书笔记           | `/books`，当前维护中            |
| `Page`         | 独立页面           | 自动生成的详情地址              |
| `SectionIntro` | 首页、栏目介绍     | 由 `section` 和 `language` 定位 |

### 发布一篇内容

1. 填写标题、类型、语言、发布日期和正文。
2. 按需补充摘要、标签和封面。
3. 将 `publicationStatus` 设为 `Published`。
4. 页面刷新后检查列表、正文和链接。

公开内容需要标题非空、发布日期有效且已到达。草稿、未来日期、缺少发布日期、归档和回收站页面不会进入公开列表；日期不会自动回退到创建时间。

栏目介绍选择 `SectionIntro`，`section` 使用 `home`、`notes`、`projects`、`musings` 或 `books`，同样填写语言和发布信息。它不会进入普通内容列表。首页缺少对应译文介绍时，可回退到中文。

### 地址与翻译

内容地址由类型和去掉连字符的 Notion 页面 ID 组成，例如：

```text
/post-12345678123412341234123456789abc
/note-12345678123412341234123456789abc
/project-12345678123412341234123456789abc
```

修改标题不会改变地址；修改类型会改变地址前缀。历史别名来自 [legacySlugs.json](lib/notion/legacySlugs.json)、`legacySlug` 和兼容的旧 `slug` 属性，访问时永久跳转到新地址。

译文作为独立页面保存，通过 `source` 关联原文。翻译管理属性不会触发自动翻译或发布；维护中的语言也不会因添加译文自动开放。

## 网站配置

| 调整内容                                   | 位置                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| 标题、作者、邮箱、域名、描述、GitHub       | [blog.config.js](blog.config.js)                                                     |
| 主题、字体、背景、日期时区、分页、导航显示 | [blog.config.js](blog.config.js)                                                     |
| 界面中文、英文、日文文案                   | [lib/lang.js](lib/lang.js)                                                           |
| 维护语言、路由重写和历史栏目跳转           | [lib/siteAvailability.js](lib/siteAvailability.js)、[next.config.js](next.config.js) |
| 维护页和错误页文案                         | [lib/statusMessages.js](lib/statusMessages.js)                                       |
| 封面、图标、头像和状态插图                 | [public](public)                                                                     |

默认以北京时间解释内容日期。`appearance: 'auto'` 每次加载跟随浏览器主题偏好；手动切换覆盖本次访问，下次加载重新跟随。导航显示开关只控制入口，恢复维护栏目还需调整路由配置。

### 评论与联系表单

评论开关为 `comment.provider`，空字符串关闭展示；配置 `'supacomments'` 后，还需提供以下公开环境变量并重新构建：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

评论直接访问 Supabase Data API，只接受公开 publishable key。新项目的表结构与权限脚本见 [comments-setup.sql](supabase/comments-setup.sql)，权限验证见 [comments-verify.sql](supabase/comments-verify.sql)。建表脚本用于新项目的一次性初始化，启用前需验证实际数据库权限与页面交互。

评论按 Notion 页面 ID 关联，提交后直接公开；联系方式和删除凭证哈希不公开。访客不能修改评论，删除凭证保存在当前浏览器；换设备或清除浏览器数据后，需要联系博主处理删除。旧评论迁移和通知暂未实现。

联系表单通过 `/api/sendtotg` 调用 Telegram，需要服务器变量 `TELEGRAM_TOKEN`；复用项目时设置自己的 `TELEGRAM_CHAT_ID`，避免沿用配置中的默认接收目标。

## 技术实现

```text
Notion 数据库与正文
    ↓ 官方 REST API：分页读取、公开访问检查、限速与重试
内容规则：发布筛选、日期、类型、语言、自动地址
    ↓ 正文转换为 react-notion-x 的 recordMap
Next.js Pages Router：列表、正文、搜索、RSS、API
    ↓ ISR + 服务端请求缓存
React 页面 → Vercel → xinzhe.dev
```

| 部分             | 实现                                                |
| ---------------- | --------------------------------------------------- |
| 页面             | Next.js 13 Pages Router、React 18、JavaScript       |
| 样式与交互       | Tailwind CSS、Framer Motion、next-themes、NProgress |
| 内容读取与渲染   | 官方 Notion REST API、react-notion-x、notion-utils  |
| 代码、公式和图片 | Prism、KaTeX、sharp、got、p-map、p-memoize          |
| 日期、订阅和地图 | Day.js、feed、next-sitemap                          |

核心代码位于 [lib/notion](lib/notion)：`officialClient.js` 读取数据库、数据源和正文；`contentSchema.js` 处理内容规则；`officialAdapter.js` 转换正文块；`notionFetchHelper.js` 提供缓存与并发合并。API 请求使用 `Notion-Version: 2026-03-11`。

搜索只覆盖 `Post`、`Note`、`Project` 的标题、摘要和标签。结果先显示 20 条，每次加载更多增加 20 条；搜索数据随 ISR 更新，每次按键不会重新请求 Notion。

`/s/{pageId}` 按需展示子页面，并检查其是否位于已发布内容之下。连接能读取的其他页面不会因此自动公开。

`/feed` 返回最新 10 条已发布内容的 RSS，包含标题、摘要、链接和日期；当前未限定类型或语言，不包含正文全文。

保留的查询接口为 `/api/check-slug?slug=...` 和 `/api/content-languages?slug=...&language=zh`，分别检查当前地址和查询已发布译文。第一个接口不解析历史别名。

### 当前限制

- 支持常用文字、标题、列表、代码、公式、媒体、简单表格和分栏；嵌入数据库暂不支持。遇到不支持的块会报错，避免无提示地丢失正文。
- Notion 页面全宽设置尚未映射，默认使用普通阅读宽度。
- 请求缓存属于单进程内存缓存，不同进程不共享；刷新失败时，已有页面可由 ISR 保留，首次生成失败则没有旧页面可回退。
- Notion 上传媒体使用临时签名链接，长时间未刷新的页面仍可能遇到图片过期，需要核对重新生成和定时重建行为。

## 开发与验证

| 命令                           | 用途                      |
| ------------------------------ | ------------------------- |
| `pnpm dev`                     | 本地开发                  |
| `pnpm build`                   | 生产构建                  |
| `pnpm run postbuild`           | 生成网站地图和 robots.txt |
| `pnpm start`                   | 运行生产构建              |
| `pnpm format`                  | 格式化文件                |
| `node --test tests/*.test.cjs` | 运行现有回归测试          |

测试覆盖发布条件、日期、自动地址、历史跳转、正文转换、公开边界、缓存、目录、搜索、评论请求与主题初始化，使用模拟数据，不需要真实 Notion 令牌。部署后仍需检查真实内容和浏览器交互。`pnpm lint` 保留，但 ESLint 配置尚未完成，暂不作为已配置的检查流程。

开发环境提供 `/status-preview`，可以预览维护、404、错误页面的语言与主题；生产环境不开放此入口。

目录分工：`pages` 管理路由，`components` 与 `layouts` 展示页面，`lib` 处理内容，`styles` 管理样式，`public` 保存静态资源，`tests` 保存测试，`supabase` 保存评论初始化与权限验证 SQL。文章正文保存在 Notion 中。

## 致谢与许可证

- [NotionNext](https://github.com/notionnext-org/NotionNext)：是我学习搭建个人网站的起点。看到这个项目后，我决定做一个属于自己的网站，并在学习过程中收获了许多经验。
- [Anjhon](https://www.anjhon.top)：上网冲浪时偶然发现了Anjhon的个人主页，受到启发，随后参考站点继续学习，逐步搭建了现在的网站。
- [Notionic](https://github.com/izuolan/notionic)：本项目的上游基础，感谢 Zuo Lan 的开源工作。
- [Nobelium](https://github.com/craigary/nobelium)：Notionic 的上游项目。
- [React Notion X](https://github.com/NotionX/react-notion-x)：Notion 正文渲染与相关工具。

代码采用 [MIT License](LICENSE)。Xinzhe 的新增与修改代码同样使用 MIT 许可，保留上游代码的原版权及许可声明。

欢迎通过 [Issues](https://github.com/XinzheGao/Xinzhe.Blog/issues) 反馈问题或提交 Pull Request。涉及内容读取、路由和渲染的修改，请附复现方式和相关验证结果。
