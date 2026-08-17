import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@codementor/api-client",
    "@codementor/auth",
    "@codementor/editor",
    "@codementor/types",
    "@codementor/ui",
  ],
};

export default nextConfig;
