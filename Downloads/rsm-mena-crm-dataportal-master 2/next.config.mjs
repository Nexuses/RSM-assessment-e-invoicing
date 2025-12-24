let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-nexlink.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    missingSuspenseWithCSRBailout: false,
    // Add this to increase memory limit for server components
    serverMemoryLimit: 4096, // 4GB
    // Increase the size limit for server components
    serverComponentsExternalPackages: ['exceljs', 'papaparse'],
  },
  // For Next.js App Router, we need to configure the server
  serverRuntimeConfig: {
    // Will only be available on the server side
    maxBodySize: '50mb', // Increase the body parser limit
  },
  // Increase the response limit for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        // Specific headers for user data API to prevent caching
        source: '/api/user/data',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
        ],
      },
    ]
  },
  // Add this to increase the maximum payload size
  poweredByHeader: false,
  compress: true,
}

// Helper function to merge configs
function mergeConfig(baseConfig, userConfig) {
  if (!userConfig) return baseConfig
  return { ...baseConfig, ...userConfig }
}

export default mergeConfig(nextConfig, userConfig)
