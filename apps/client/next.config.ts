import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TypeScript from src/index.ts.
  transpilePackages: [
    "@codementor/ui",
    "@codementor/editor",
  ],
  images: {
    // picsum.photos stands in for real course/roadmap cover thumbnails until there's a
    // backend/CMS to source them from — see src/lib/placeholder-image.ts.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      // Workspace covers are persisted in the configured S3 bucket. Bucket names vary
      // per environment, so allow AWS image hosts without coupling UI code to one bucket.
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default nextConfig;
