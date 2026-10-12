module.exports = {
  i18n: {
    locales: ['en', 'zh', 'ja'],
    defaultLocale: 'zh',
    localeDetection: false
  },
  output: 'standalone',
  // Avoid multiple build workers exhausting one Notion connection's rate limit.
  experimental: { cpus: 1 },
  transpilePackages: ['dayjs'],
  images: {
    domains: ['www.notion.so', 'images.unsplash.com', 's3.us-west-2.amazonaws.com', 'prod-files-secure.s3.us-west-2.amazonaws.com', 'attachment.notion-static.com']
  },
  async headers() {
    return [
      {
        source: '/:path*{/}?',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=()'
          }
        ]
      }
    ]
  },
  async redirects() {
    return [
      { source: '/newsletter', destination: '/musings', permanent: true },
      { source: '/book', destination: '/books', permanent: true }
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/en/:path*', destination: '/en/maintenance', locale: false },
        { source: '/ja/:path*', destination: '/ja/maintenance', locale: false }
      ]
    }
  }
}
