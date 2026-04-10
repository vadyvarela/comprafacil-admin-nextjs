import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  images: {
    domains: ['res.cloudinary.com'],
  },
};

export default nextConfig;
