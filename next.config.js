/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper routing for dashboard pages
  async rewrites() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/dashboard/:path*'
      }
    ]
  },
  
  // Optimize for production deployment
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },
  
  // Ensure proper static optimization
  output: 'standalone',
  
  // Handle edge runtime properly
  runtime: 'nodejs',
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      }
    ]
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for proper caching
  async headers() {
    return [
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ]
  },

  // Skip static generation for pages that use authentication
  trailingSlash: false,
  
  // Override page configs for dynamic rendering
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Disable static optimization for auth-dependent pages
  generateStaticParams: false
}

module.exports = nextConfig