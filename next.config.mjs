import 'dotenv/config';

const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self';",
  "img-src 'self' data: https: pocketbase.evoptech.com danusin.com localhost *.google.com *.gstatic.com *.googleusercontent.com api.mapbox.com;",
  [
    "connect-src 'self'",
    "http://localhost:*",
    "https://localhost:*",
    "https://pocketbase.evoptech.com",
    "https://danusin.com",
    "https://*.googleapis.com",
    "https://*.google.com",
    "https://nominatim.openstreetmap.org",
    "https://*.openstreetmap.org",
    "https://api.mapbox.com",
    "https://tiles.mapbox.com",
    "https://*.mapbox.com",
  ].join(' '),
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://*.googleapis.com https://*.gstatic.com https://*.google.com https://api.mapbox.com;`,
  `worker-src 'self' blob:;`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com;",
  // ++ MODIFIED THIS LINE TO ALLOW 'data:' FOR FONTS ++
  "font-src 'self' https://fonts.gstatic.com data:;",
  "frame-src https://*.google.com;",
].join('; ');

/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: csp,
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pocketbase.evoptech.com',
      },
      {
        protocol: 'https',
        hostname: '**.google.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
    ],
    unoptimized: true,
  },
  env: {
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
    POCKETBASE_URL: process.env.POCKETBASE_URL,
    POCKETBASE_EMAIL: process.env.POCKETBASE_EMAIL,
    POCKETBASE_PASSWORD: process.env.POCKETBASE_PASSWORD,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;