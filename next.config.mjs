/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // The `remotePatterns` array is the more modern way to configure allowed image sources.
    // The previous `domains` array is now redundant if covered by `remotePatterns`.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pocketbase.evoptech.com', // Fixed: Provided the hostname
        // You can also specify port and pathname if needed:
        // port: '',
        // pathname: '/path/to/images/**',
      },
      // Add any other remote patterns you need here
    ],
    unoptimized: true, // This disables Next.js Image Optimization.
  },
  env: {
    MAPBOX_TOKEN: 'pk.eyJ1IjoiZXZvcHRlY2giLCJhIjoiY21hcG85ZjhiMDByMDJqb2E1OGx4dGMyeSJ9.23o4bNoiuN4Xt9FpIfj1ow',
    POCKETBASE_URL: 'https://pocketbase.evoptech.com',
    // Consider using environment variables (.env files) for sensitive data
    // instead of hardcoding them directly in next.config.js, especially for POCKETBASE_PASSWORD.
    POCKETBASE_EMAIL: 'kajuki27@gmail.com',
    POCKETBASE_PASSWORD: 'EvopTech1sH3re',
  },
};

export default nextConfig;