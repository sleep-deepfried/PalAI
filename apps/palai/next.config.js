const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['dolly-lauric-obdulia.ngrok-free.dev'],
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com'],
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
  transpilePackages: ['@palai/ml'],
  webpack: (config) => {
    // Resolve @palai/ml to the source directory for better builds
    config.resolve.alias['@palai/ml'] = path.resolve(__dirname, '../../packages/ml/src');
    return config;
  },
};

module.exports = nextConfig;
