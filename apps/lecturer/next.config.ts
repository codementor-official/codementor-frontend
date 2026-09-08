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
  // Lecturer imports most shared components through workspace barrel files. Expanding an
  // entire barrel for every route made webpack parse editor, table and realtime modules
  // even when a page only used one button. Let Next rewrite named imports to their source
  // modules so the first visit to a tab compiles a much smaller graph.
  experimental: {
    optimizePackageImports: [
      "@codementor/ui",
      "@codementor/editor",
      "@codementor/solve",
      "lucide-react",
    ],
  },
  // Keep already visited tabs warm during development. The default eviction window is too
  // short for a dashboard with several management sections and causes a tab to compile again
  // when the lecturer returns to it a few minutes later.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 24,
  },
};

export default nextConfig;
