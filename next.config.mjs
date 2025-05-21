/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['pocketbase.evoptech.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  env: {
    MAPBOX_TOKEN: 'pk.eyJ1IjoiZXZvcHRlY2giLCJhIjoiY21hcG85ZjhiMDByMDJqb2E1OGx4dGMyeSJ9.23o4bNoiuN4Xt9FpIfj1ow',
    POCKETBASE_URL: 'https://pocketbase.evoptech.com',
  },
};

export default nextConfig;
