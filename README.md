# Xinzhe.Blog

基于 Next.js 和 Notion 的个人博客，用于发布技术文章、学习笔记、项目记录、随想与读书笔记。内容在 Notion 中编辑，网站通过官方 API 读取并渲染，当前专注维护中文网站，英文和日文入口暂时显示维护提示并返回中文首页。

[在线访问](https://xinzhe.dev) · [问题反馈](https://github.com/XinzheGao/Xinzhe.Blog/issues) · [MIT 许可证](LICENSE)

## 功能

- **统一内容管理**：一个 Notion 数据库管理文章、笔记、项目、随想、书架、独立页面及栏目介绍。
- **中文首页**：域名根路径固定显示中文，不根据浏览器语言自动跳转。英文和日文路径显示维护插画及对应语言的文案，可点击按钮返回中文首页。
- **自动文章地址**：根据内容类型与 Notion 页面 ID 生成地址，无需填写 slug；保留旧地址的永久跳转。
- **发布状态与日期控制**：草稿、未填写发布日期及未来日期的内容不进入公开内容列表。
- **Notion 正文渲染**：支持常见文本块、代码高亮、数学公式、图片、媒体、简单表格及文章目录。
- **内容更新**：服务端请求缓存配合 Next.js ISR，在访问时更新页面；内容编辑通常不需要重新部署代码。
- **阅读与发现**：响应式布局、浅色与深色主题、文章分页、标签页面和基于元数据的搜索。
- **订阅与分享**：提供 RSS、页面 SEO 信息、Open Graph 元数据，以及构建时生成的网站地图和 robots.txt。

## 技术栈

| 层级       | 技术                                        |
| ---------- | ------------------------------------------- |
| 运行环境   | Node.js 24.x、pnpm 7.33.7                   |
| 应用框架   | Next.js 13，Pages Router                    |
| 页面开发   | JavaScript、React 18                        |
| 样式与交互 | Tailwind CSS、Framer Motion、next-themes    |
| 内容读取   | 官方 Notion REST API，API 版本 `2026-03-11` |
| 正文渲染   | react-notion-x、Prism、公式渲染组件         |
| 日期与订阅 | Day.js、feed、next-sitemap                  |
| 部署       | Vercel；也可使用 Node.js 运行生产构建       |

项目基于 [Notionic](https://github.com/izuolan/notionic) 定制。内容读取层将官方 Notion API 返回的数据转换成 `react-notion-x` 使用的格式。

## 工作流程

```text
Notion 数据库与页面正文
        ↓ 官方 API：查询内容、分页读取正文块
服务端缓存与发布条件筛选
        ↓ 属性解析、自动地址、多语言原文关联
Next.js 静态生成 / 按需生成 / ISR
        ↓
文章页面、栏目列表、搜索与 RSS
```

Notion 连接令牌只在服务端使用。子页面访问需要属于本博客的已发布内容；连接能读取的其他页面不会因此成为公开博客页面。

## 快速开始

### 1. 安装依赖

准备 Node.js 24.x，并安装仓库指定版本的 pnpm：

```bash
npm install -g pnpm@7.33.7

git clone https://github.com/XinzheGao/Xinzhe.Blog.git
cd Xinzhe.Blog
pnpm install --frozen-lockfile
```

### 2. 连接 Notion

1. 在 Notion 中创建内部连接，并启用读取内容的权限。
2. 在博客数据库的 Connections 中添加该连接，确保它可以读取数据库与页面正文。
3. 按下方的内容模型准备数据库属性，属性名称和选项值区分大小写。
4. 获取数据库 ID；如果数据库包含多个数据源，再指定要使用的数据源 ID。

内容读取使用连接授权，无需为了读取内容而将整个数据库公开发布。

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写：

```dotenv
NOTION_API_TOKEN=your_internal_connection_token
NOTION_PAGE_ID=your_database_id
# 多数据源数据库需要填写；只有一个数据源时可留空。
NOTION_DATA_SOURCE_ID=
NOTION_REVALIDATE_SECONDS=60
```

| 变量                        | 是否必需           | 说明                                              |
| --------------------------- | ------------------ | ------------------------------------------------- |
| `NOTION_API_TOKEN`          | 是                 | 官方 Notion 内部连接令牌                          |
| `NOTION_PAGE_ID`            | 是，未指定数据源时 | 博客数据库 ID；代码用它查询唯一的数据源           |
| `NOTION_DATA_SOURCE_ID`     | 否                 | 显式指定数据源；多数据源数据库必须配置            |
| `NOTION_REVALIDATE_SECONDS` | 否                 | 缓存与 ISR 的刷新间隔，整数 `1–300`，默认 `60` 秒 |

`.env.local` 已被 Git 忽略。不要提交真实令牌，也不要给令牌变量添加 `NEXT_PUBLIC_` 前缀。旧的 `NOTION_ACCESS_TOKEN`、`NOTION_SPACES_ID` 不参与当前官方 API 的内容认证。

### 4. 配置站点并启动

在 [`blog.config.js`](blog.config.js) 中修改站点标题、作者、域名、描述、时区、分页数量与社交链接。语言路由在 [`next.config.js`](next.config.js) 中配置，界面文案位于 [`lib/lang.js`](lib/lang.js)。

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## Notion 内容模型

### 数据库属性

| 属性                | Notion 类型            | 用途                                                 |
| ------------------- | ---------------------- | ---------------------------------------------------- |
| `title`             | Title                  | 内容标题                                             |
| `type`              | Select                 | 内容类型，选项见下表                                 |
| `language`          | Select                 | `zh`、`en`、`ja`                                     |
| `publicationStatus` | Select 或 Status       | `Draft` 或 `Published`                               |
| `publishedAt`       | Date                   | 手动选择发布日期；按站点时区解释，不使用创建时间代替 |
| `summary`           | Text                   | 可选摘要，用于列表简介、搜索、订阅及页面描述         |
| `tags`              | Multi-select           | 可选标签                                             |
| `section`           | Select                 | 栏目介绍使用的定位属性                               |
| `source`            | Relation，关联本数据库 | 译文关联原文；每篇译文关联一篇原文                   |
| `translations`      | Relation，关联本数据库 | 可选，用于在 Notion 中查看对应译文                   |
| `legacySlug`        | Text                   | 可选旧地址别名，新内容无需填写                       |

`translationTargets`、`translationStatus`、`projectStage`、`readingStatus` 与 `createdAt` 可以用于 Notion 内的编辑、翻译计划、项目和阅读管理。它们不代替网站的发布状态或发布日期。

### 内容类型与栏目

| `type`         | 内容           | 页面入口                          |
| -------------- | -------------- | --------------------------------- |
| `Post`         | 文章           | `/`、`/posts`                     |
| `Note`         | 笔记           | `/notes`                          |
| `Project`      | 项目           | `/projects`                       |
| `Musings`      | 随想           | `/musings`                        |
| `Book`         | 读书笔记       | `/books`                          |
| `Page`         | 独立页面       | 自动生成的页面地址                |
| `SectionIntro` | 首页或栏目介绍 | 通过 `section` 与 `language` 定位 |

栏目介绍的 `section` 使用 `home`、`notes`、`projects`、`musings` 或 `books`。这类记录不会进入普通文章列表，也不需要 slug。首页缺少英文或日文介绍时，可回退使用中文首页介绍。

### 发布一篇内容

1. 新建数据库页面，填写标题并编辑正文。
2. 选择内容类型和语言。
3. 填写 `publishedAt`；摘要与标签按需填写。
4. 将 `publicationStatus` 设置为 `Published`。

网站展示需要标题非空、状态为 `Published`，且发布日期已经到达；正文内容还需使用支持的类型与语言。草稿和未来日期的内容不会进入公开列表。数据库中归档或移入回收站的页面也会被排除。

### 自动地址与旧链接

正文页面地址的格式为：

```text
/{内容类型的小写名称}-{去掉连字符的 Notion 页面 ID}
```

例如：

```text
/post-0123456789abcdef0123456789abcdef
/en/post-abcdef0123456789abcdef0123456789
/ja/note-1234567890abcdef1234567890abcdef
```

Notion 数据库不需要 `slug` 列。修改标题不会改变地址，同名文章也有不同地址；修改内容类型会改变地址前缀。

历史地址保存在 [`lib/notion/legacySlugs.json`](lib/notion/legacySlugs.json) 中，也可以通过可选的 `legacySlug` 添加别名。旧地址会永久跳转到对应语言的新地址；删除数据库的 slug 属性不会删除已保存的历史跳转。

### 多语言内容

当前只开放中文网站。`/en`、`/ja` 及其子路径根据 `lib/siteAvailability.js` 配置显示对应语言的维护页，不自动跳转，可点击明确标注的按钮返回中文首页。维护页固定使用一张齿轮与扳手插画，刷新时不切换。语言菜单保留英文、日文入口并标注“维护中”，维护页不进入搜索索引或站点地图。

404 页面和服务错误页使用地图与断开连接插画，以及中文、英文、日文文案。语言由当前路由确定，不根据浏览器语言切换。服务错误页提供重试按钮，页面不显示内部错误详情。返回首页时优先使用同语言首页；该语言处于维护状态时，按钮明确标注返回中文首页。三张透明 PNG 位于 `public/images/status/`，通过响应式图片适配手机与浅色、深色主题。开发环境的 `/status-preview` 可切换场景、语言与主题；生产环境不开放该预览页。

多语言内容数据继续保留：每种语言是一条独立页面记录，分别设置 `language`；英文和日文译文的 `source` 关联同一篇中文原文。

翻译由编辑者维护。Notion 中的翻译计划属性用于组织工作，不会自动翻译或自动发布内容。

## 缓存与更新

`NOTION_REVALIDATE_SECONDS` 同时控制进程内 Notion 请求缓存和页面 ISR。请求层还会合并相同的并发读取、限制请求间隔，并对网络错误、限流和服务端错误重试。

ISR 由访问触发，刷新间隔不代表固定时间轮询，也不保证修改后恰好在该秒数生效。低访问量页面会在后续访问时更新，缓存层叠加也可能延迟显示。更新失败会抛出错误；Next.js 可保留之前成功生成的页面并在后续访问重试，首次生成失败则无法使用旧页面回退。

## 部署

### Vercel

1. 导入 GitHub 仓库，框架选择 Next.js，Node.js 版本设置为 `24.x`。
2. 为部署环境配置上述 Notion 环境变量；Preview 和 Production 分别配置。
3. 使用 `pnpm build` 构建。`postbuild` 会根据 `blog.config.js` 中的域名生成网站地图与 robots.txt。
4. 部署后检查首页、正文、语言切换和旧地址跳转，再连接自定义域名。

构建时会读取 Notion 数据库和正文，因此部署环境需要有效令牌、正确的数据源配置及 Notion API 网络访问。

### 本地生产运行

```bash
pnpm build
pnpm start
```

代码配置了 `output: 'standalone'`。文章正文依赖服务端 Notion 读取与 ISR，不是纯静态 HTML 导出项目。

## 开发与验证

| 命令          | 用途                             |
| ------------- | -------------------------------- |
| `pnpm dev`    | 启动开发服务器                   |
| `pnpm build`  | 构建生产版本，并执行网站地图生成 |
| `pnpm start`  | 启动生产服务器                   |
| `pnpm format` | 使用 Prettier 格式化仓库文件     |

后端与内容模型的回归检查使用 Node.js 内置测试运行器：

```bash
node --test tests/content-schema.test.cjs tests/notion-backend.test.cjs tests/notion-toc.test.cjs
```

测试覆盖属性与正文块转换、分页读取、缓存行为、发布条件、子页面访问边界、自动地址、历史跳转、多语言关联、日期显示及目录生成。测试中的 API 响应通过模拟提供，不需要真实 Notion 令牌；真实数据与线上部署仍需单独验证。

## 项目结构

```text
.
├── components/           # 导航、列表、主题、SEO、正文与目录组件
├── layouts/              # 正文和搜索布局
├── lib/
│   ├── notion/           # 官方 API、块转换、内容模型、缓存与历史地址
│   ├── contentDate.js    # 按语言与时区格式化日期
│   ├── lang.js           # 中英日界面文案
│   └── rss.js            # RSS 生成
├── pages/                # Pages Router 页面、动态正文及 API 路由
├── public/               # 图片、字体与图标等静态资源
├── styles/               # 全局、Notion 正文与代码样式
├── tests/                # 内容模型与后端回归检查
├── .env.example          # 环境变量模板
├── blog.config.js        # 站点与可选服务配置
├── next.config.js        # 语言路由、构建与图片配置
└── next-sitemap.config.js
```

## 可选服务与当前限制

- 评论组件支持 Utterances 与 SupaComments；统计脚本支持 Google Analytics、Ackee、Umami 和 Cloudflare Insights。需要在 `blog.config.js` 中填写对应服务配置，代码集成不代表服务已经可用。
- 联系表单通过 Telegram Bot 发送消息，需要 `TELEGRAM_TOKEN` 和自己的 `telegramChatId`。这是可选通知功能，不是文章发布流程的一部分。
- `/search` 当前随机选取当前语言的最多 10 条已发布内容，在浏览器中匹配标题、摘要和标签；不提供全部正文的全文搜索。
- 官方 API 转换层支持常用正文块，但不支持嵌入数据库等未列入转换规则的块。遇到未支持的块会报错，避免静默截断正文。
- Notion 页面的 full-width 设置未映射到当前官方 API 转换层，默认使用普通阅读宽度。

## 贡献

欢迎通过 [Issues](https://github.com/XinzheGao/Xinzhe.Blog/issues) 反馈问题，或提交 Pull Request。涉及内容模型、正文转换或路由的修改，请附上复现方式并运行相关回归检查；界面修改请说明页面与语言场景。

## 致谢与许可证

本项目基于 [Notionic](https://github.com/izuolan/notionic) 定制，并使用 [React Notion X](https://github.com/NotionX/react-notion-x) 及其他开源依赖。

代码采用 [MIT License](LICENSE)，保留原项目版权声明。
