const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias['@palai/ml'] = path.resolve(__dirname, '../../packages/ml/dist');
    return config;
  },
};

module.exports = nextConfig;

