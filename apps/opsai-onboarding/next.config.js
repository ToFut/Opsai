/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lucide-react'],
  typescript: {
    // Type errors have been fixed, so we can now enforce type checking
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint errors will now be caught during builds
    ignoreDuringBuilds: false,
  },
  // Skip static generation for problematic pages
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig