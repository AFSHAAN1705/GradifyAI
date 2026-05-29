import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"]
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;
