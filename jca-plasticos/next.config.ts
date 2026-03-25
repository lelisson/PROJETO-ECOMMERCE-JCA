import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jcaplasticos.com.br",
        pathname: "/wp-content/**",
      },
    ],
  },
};

export default nextConfig;
