import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: {
        rootDir: ["apps/web/", "apps/lecturer/", "apps/admin/"],
      },
    },
    rules: {
      // These state-reset effects predate the migration. Keep them visible without
      // changing working modal and theme behavior as part of an architecture task.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/dist/**",
    "**/next-env.d.ts",
  ]),
]);

export default config;
