import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.anili.st"
      },
      {
        protocol: "https",
        hostname: "s4.anilist.co"
      }
    ]
  }
};

export default nextConfig;
