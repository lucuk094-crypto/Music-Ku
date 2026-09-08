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
    ],
  },
  // Next.js 15: opt-out of dynamic IO warnings
  experimental: {
    dynamicIO: false,
  },
}

module.exports = nextConfig
