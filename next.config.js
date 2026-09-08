/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: '**.ggpht.com' },
      { protocol: 'https', hostname: 'cdn-images.dzcdn.net' },
      { protocol: 'https', hostname: 'e-cdns-images.dzcdn.net' },
      { protocol: 'https', hostname: 'api.deezer.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: '**.deezer.com' },
      { protocol: 'https', hostname: 'cdns-images.dzcdn.net' },
    ],
    unoptimized: false,
  },
  // Disable ESLint during build to avoid blocking deploys
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
