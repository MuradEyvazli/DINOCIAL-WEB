/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['res.cloudinary.com'],
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  // Render.com specific optimizations
  output: 'standalone',
};

export default nextConfig;
