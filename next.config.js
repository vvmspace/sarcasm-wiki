/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@google/generative-ai'],
  experimental: {
    serverComponentsExternalPackages: ['remark', 'remark-gfm', 'remark-html'],
  },
}

module.exports = nextConfig

