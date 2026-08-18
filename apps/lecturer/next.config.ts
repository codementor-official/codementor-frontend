import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TypeScript from src/index.ts, so Next has to compile them.
  transpilePackages: [
    "@codementor/ui",
    "@codementor/auth",
    "@codementor/api-client",
    "@codementor/types",
    "@codementor/utils",
    "@codementor/editor",
    "@codementor/solve",
  ],
};

export default nextConfig;
