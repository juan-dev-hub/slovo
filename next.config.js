/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['jspdf', 'html2canvas'],
  },
}

module.exports = nextConfig
