# Xinzhe.Blog

基于 **Next.js 与 Notion** 的个人技术博客，用于发布技术文章、记录学习实践和展示个人项目。

[访问网站](https://xinzhe.dev) · [项目源码](https://github.com/XinzheGao/Xinzhe.Blog)

![网站展示](banner.png)

## 项目介绍

Xinzhe.Blog 是个人技术网站 **xinzhe.dev** 的源码仓库。项目基于开源博客框架 [Notionic](https://github.com/izuolan/notionic) 进行定制开发与维护，将 Notion 作为内容管理入口，通过 Next.js 展示文章与项目内容，并部署在 Vercel。

日常内容编辑在 Notion 中完成，网站负责内容读取、数据处理与页面呈现，减少发布文章时手动修改页面代码的工作。首页和文章页采用静态生成与增量静态再生成（SSG / ISR），RSS 则在服务端按请求生成。

## 主要功能

- **Notion 内容管理**：读取数据库属性与页面内容块，按发布状态、内容类型、日期、标签和语言筛选内容。
- **文章与项目展示**：提供文章列表、详情、分页、标签页，以及项目、笔记、书单和 Newsletter 等内容栏目。
- **多语言页面**：配置中文、英文和日文路由，按 `lang` 字段筛选内容，并为首页等页面选择对应语言的介绍。
- **阅读体验**：使用 `react-notion-x` 渲染 Notion 内容，结合响应式布局、明暗主题、图片预览与页面过渡效果。
- **SEO 与订阅**：设置页面标题、描述、Open Graph 和 Twitter Card；构建后生成 Sitemap 与 robots.txt，提供 `/feed` RSS 订阅入口。
- **内容请求处理**：对 Notion 请求使用进程内缓存、请求前延时和 HTTP 429 重试，减少重复读取并应对限流。

## 技术栈

| 技术 | 在项目中的用途 |
| --- | --- |
| Next.js 13 · React 18 | Pages Router、页面组件、SSG / ISR 与服务端 RSS 输出 |
| JavaScript | 当前页面、组件和数据处理逻辑的主要实现语言 |
| Notion · `notion-client` · `notion-utils` | 内容读取、数据库属性解析与页面数据处理 |
| `react-notion-x` | 将 Notion 内容块渲染为网页 |
| Tailwind CSS · `next-themes` · Framer Motion | 页面样式、主题切换与动画 |
| `next-sitemap` · `feed` | 生成站点地图与 RSS |
| Vercel | 网站构建、部署与域名接入 |

仓库已安装 TypeScript 开发依赖，当前业务源码以 `.js` 文件为主。Notion 内容读取使用 `notion-client`，配置方式与官方 Notion Integration API 不同。

## 内容如何发布

```text
在 Notion 编辑文章与项目
          ↓
读取数据库属性与页面内容块
          ↓
筛选已发布内容，按类型、标签与语言组织数据
          ↓
Next.js 生成页面 · react-notion-x 渲染正文
          ↓
通过 Vercel 提供网站访问
```

首页和文章页通过 `getStaticProps` 获取内容，文章路由通过 `getStaticPaths` 生成，并设置 `revalidate: 1`。该配置允许页面在后续访问时触发再生成；它不代表内容每秒自动同步。当前请求缓存没有过期机制，同一进程中可能继续使用已缓存的数据。

## 本地运行

### 1. 获取代码并安装依赖

准备 Node.js 24 与 pnpm 7.33.7。仓库通过 `engines.node` 固定运行时，通过 `packageManager` 固定 pnpm 版本，并使用 `pnpm-lock.yaml` 管理依赖；避免使用不兼容的新版 pnpm 重写现有锁文件。

```bash
git clone https://github.com/XinzheGao/Xinzhe.Blog.git
cd Xinzhe.Blog
pnpm install
```

### 2. 准备 Notion 数据库

使用与 Notionic 兼容的数据库结构，并确保数据库和文章页面可供当前内容读取方式访问。字段名称区分大小写，需与代码保持一致。

| 字段 | 类型 | 用途 / 示例 |
| --- | --- | --- |
| `title` | Title | 文章或项目名称 |
| `slug` | Text | 页面路径，例如 `my-first-post` |
| `status` | Select | 设置为 `Published` 才会展示 |
| `type` | Select | `Post`、`Projects`、`Notes`、`Book`、`Newsletter` 或 `Hidden` |
| `lang` | Select | `zh`、`en` 或 `ja`，用于对应语言的列表筛选 |
| `date` | Date | 发布日期；未填写时使用页面创建时间，未来日期暂不展示 |
| `summary` | Text | 文章摘要 |
| `tags` | Multi-select | 内容标签 |

首页介绍也来自该数据库：准备一条 `type = Hidden`、`status = Published`、`slug = index` 的页面作为默认介绍。英文和日文版本可分别使用 `index-en`、`index-ja`。其他栏目的介绍可参考 `pages/` 下对应页面的 slug 约定。

### 3. 配置环境变量与站点信息

在项目根目录创建 `.env.local`：

```dotenv
# 内容数据库页面 ID，通常为 Notion URL 中的 32 位 ID
NOTION_PAGE_ID=your_notion_database_page_id

# Notion workspace / space ID，用于 /s/[subpage] 子页面遍历与访问检查
NOTION_SPACES_ID=your_notion_space_id
```

`NOTION_ACCESS_TOKEN` 是可选配置，会传入 `notion-client` 的 `authToken` 参数；它不是官方 Integration Secret。使用私有内容时，需要确认当前客户端支持的认证方式。

编辑 [`blog.config.js`](blog.config.js)，设置站点标题、作者、域名、描述、主题、栏目和社交链接。更换域名时同步调整 `link`，站点地图和 RSS 会读取该配置。界面文案位于 [`lib/lang.js`](lib/lang.js)，静态图片与图标位于 `public/`。

### 4. 启动开发服务

```bash
pnpm dev
```

访问 [localhost:3000](http://localhost:3000)。

```bash
# 构建生产版本，同时生成 Sitemap 与 robots.txt
pnpm build

# 启动生产服务
pnpm start
```

构建过程会读取 Notion 内容，因此需要提前配置环境变量和数据库。

## 部署到 Vercel

1. 在 Vercel 导入本仓库，使用 Next.js 项目配置。
2. 添加 `NOTION_PAGE_ID` 与 `NOTION_SPACES_ID`；按需配置可选认证参数。
3. 检查 `blog.config.js` 中的域名和个人信息，执行部署。
4. 部署后检查首页、文章详情、语言路由、`/feed` 和 `/sitemap.xml`；使用自己的域名时，在 Vercel 中完成域名绑定。

## 代码结构

```text
.
├── components/             # 页面组件、SEO 与 Notion 正文渲染
├── layouts/                # 文章与搜索页面布局
├── lib/
│   ├── notion/             # 内容读取、属性解析、筛选与请求处理
│   ├── lang.js             # 多语言界面文案
│   └── rss.js              # RSS 生成
├── pages/                  # 首页、文章、栏目、标签与 API 路由
├── public/                 # 图片、图标与其他静态资源
├── styles/                 # 全局样式与阅读样式
├── blog.config.js          # 站点信息与功能配置
├── next.config.js          # Next.js、多语言与图片配置
├── next-sitemap.config.js  # Sitemap 配置
└── vercel.json             # Vercel 配置
```

## 开发与维护

本仓库围绕个人内容发布与项目展示进行定制，维护内容包括页面与组件调整、Notion 数据组织、多语言内容筛选、请求缓存与重试，以及 Vercel 部署和站点配置。

网站作为技术文章与个人项目的展示入口，也承载持续学习和开发实践记录。欢迎通过 [Issues](https://github.com/XinzheGao/Xinzhe.Blog/issues) 反馈问题或交流使用经验。

## 致谢与许可

项目基于 [Notionic](https://github.com/izuolan/notionic)，并使用 [React Notion X](https://github.com/NotionX/react-notion-x) 及其他开源依赖。

代码采用 [MIT License](LICENSE)，保留原项目的版权与许可声明。
