/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@google/generative-ai'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'remark': 'commonjs remark',
        'remark-gfm': 'commonjs remark-gfm',
        'remark-html': 'commonjs remark-html',
      })
    }
    return config
  },
}

module.exports = nextConfig

