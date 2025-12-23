import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Match .jfif files under /uploads and serve with JPEG content-type
        source: '/uploads/:path*\\.jfif',
        headers: [
          { key: 'Content-Type', value: 'image/jpeg' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // If a client requests .jfif, rewrite to .jpg (for files we normalized)
      {
        source: '/uploads/:name(.+)\\.jfif',
        destination: '/uploads/:name.jpg',
      },
    ];
  },
};

export default nextConfig;
