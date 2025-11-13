/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@google/generative-ai'],
  experimental: {
    serverComponentsExternalPackages: ['remark', 'remark-gfm', 'remark-html'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/content/**',
          '**/logs/**',
          '**/test-results/**',
          '**/playwright-report/**',
        ],
      }
    }
    return config
  },
}

module.exports = nextConfig

