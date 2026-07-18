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
      },
      {
        protocol: "https",
        hostname: "static.tvmaze.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      }
    ]
  }
};

export default nextConfig;
