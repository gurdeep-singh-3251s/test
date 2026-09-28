import type { NextConfig } from "next";

if (process.env.VERCEL === "1" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "Set NEXT_PUBLIC_API_URL in Vercel to your live API, for example https://api.your-domain.com/api",
  );
}

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
