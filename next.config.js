/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-nexlink.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '22527425.fs1.hubspotusercontent-na2.net',
      },
    ],
  },
  reactStrictMode: true,
  transpilePackages: ["framer-motion"],
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        canvas: 'canvas',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
