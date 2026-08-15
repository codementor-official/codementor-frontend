import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TypeScript from src/index.ts.
  transpilePackages: [
    "@codementor/ui",
    "@codementor/auth",
    "@codementor/api-client",
    "@codementor/types",
    "@codementor/utils",
  ],
};

export default nextConfig;
