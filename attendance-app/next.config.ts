import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["localhost"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/public/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
