import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      // প্রোডাকশনের জন্য (যদি থাকে)
      {
        protocol: "https",
        hostname: "your-production-domain.com",
        port: "",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
