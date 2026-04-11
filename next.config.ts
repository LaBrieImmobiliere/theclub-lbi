import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.output = {
      ...config.output,
      charset: true,
    };
    return config;
  },
};

export default nextConfig;
