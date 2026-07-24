import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.sisgo.co.id",
        pathname: "/**",
      },
    ],
    localPatterns: [
      {
        pathname: "/images/**",
      },
    ],
  },
  allowedDevOrigins: ["192.168.50.184", "192.168.1.10"],
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;