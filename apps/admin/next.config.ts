import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@codementor/api-client",
    "@codementor/auth",
    "@codementor/types",
    "@codementor/ui",
  ],
  async rewrites() {
    const keycloakUrl = (
      process.env.KEYCLOAK_INTERNAL_URL ??
      process.env.NEXT_PUBLIC_KEYCLOAK_URL ??
      "http://13.214.122.227:8080"
    ).replace(/\/+$/, "");
    return {
      beforeFiles: [
        { source: "/auth/:path*", destination: `${keycloakUrl}/:path*` },
        { source: "/realms/:path*", destination: `${keycloakUrl}/realms/:path*` },
        { source: "/resources/:path*", destination: `${keycloakUrl}/resources/:path*` },
      ],
    };
  },
};

export default nextConfig;
