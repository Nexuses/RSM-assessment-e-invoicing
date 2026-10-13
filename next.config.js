// Served as https://hub.rsm.ae/einvoicing-assessment. Must match the nginx
// location prefix exactly. BASE_PATH= (empty) serves from "/". Build-time:
// rebuild after changing.
const basePath = process.env.BASE_PATH ?? "/einvoicing-assessment";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
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
