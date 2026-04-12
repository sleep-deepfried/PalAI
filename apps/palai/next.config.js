const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['dolly-lauric-obdulia.ngrok-free.dev'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
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
  // Enable Turbopack (default in Next.js 16)
  turbopack: {},
};

module.exports = nextConfig;
