/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@google/generative-ai'],
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  experimental: {
    serverComponentsExternalPackages: ['remark', 'remark-gfm', 'remark-html'],
    // Lightning fast optimizations ⚡
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Faster builds and runtime
    serverMinification: true,
    swcMinify: true,
    esmExternals: true,
    // Preload critical resources
    optimisticClientCache: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Headers for lightning performance ⚡
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Lightning cache for content
      {
        source: '/((?!api|_next|admin).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development'
              ? 'no-cache'
              : 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600'
          }
        ]
      }
    ]
  },
  
  webpack: (config, { dev, isServer }) => {
    // Lightning development optimizations ⚡
    if (dev) {
      // Faster file watching
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 100, // Faster response
        poll: false,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/content/**',
          '**/logs/**',
          '**/test-results/**',
          '**/playwright-report/**',
          '**/.temp/**',
        ],
      }
      
      // Lightning fast rebuilds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        // Aggressive caching
        maxMemoryGenerations: 1,
        memoryCacheUnaffected: true,
      }
      
      // Optimize module resolution for speed
      config.resolve.symlinks = false
      config.resolve.cacheWithContext = false
      
      // Lightning fast source maps
      config.devtool = 'eval-cheap-module-source-map'
      
      // Reduce bundle analysis overhead
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        // Lightning fast module concatenation
        concatenateModules: false,
        // Skip expensive optimizations in dev
        minimize: false,
        sideEffects: false,
      }
      
      // Faster module loading
      config.experiments = {
        ...config.experiments,
        cacheUnaffected: true,
      }
    }
    
    // Lightning production optimizations ⚡
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
            },
          },
        },
        // Lightning fast runtime
        runtimeChunk: 'single',
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      }
      
      // Aggressive compression
      config.resolve.alias = {
        ...config.resolve.alias,
        // Lighter alternatives
        'react/jsx-runtime': 'react/jsx-runtime',
      }
    }
    
    return config
  },
}

module.exports = nextConfig

