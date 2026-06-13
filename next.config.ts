import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.appspot.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'huggingface.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.hf.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.huggingface.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
