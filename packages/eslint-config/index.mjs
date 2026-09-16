import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Design-system checks, shared by the per-app blocks below. Each entry encodes a finding
 * from docs/UI_AUDIT_AND_PLAN.md — a convention that lives only in a document is one that
 * nobody runs, which is how the drift these describe got there in the first place.
 */
const DESIGN_TOKEN_RESTRICTIONS = [
      {
        // Hardcoded palette colors do not follow the theme. Each app redefines its
        // tokens under `.dark`; a literal `bg-white` or `text-zinc-600` does not move,
        // so it becomes a light-on-light hole the moment dark mode is on.
        selector:
          "Literal[value=/(?:^|\\s|`)(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|placeholder|accent|shadow)-(?:zinc|gray|slate|neutral|stone|orange|amber|emerald|green|red|rose|blue|indigo|violet|purple|pink|teal|cyan|sky|lime|yellow|fuchsia)(?:-\\d{2,3})?(?:\\/\\d{1,3})?(?:$|\\s|`)/]",
        message:
          "Hardcoded Tailwind palette color. Use a design token (bg-surface, text-navy, text-text-muted, border-border, bg-primary-tint, text-on-ink). Literals do not flip in dark mode — see DESIGN-SYSTEM.md.",
      },
      {
        // Same reason, for the two literals that carry no numeric step.
        selector:
          "Literal[value=/(?:^|\\s|`)(?:bg|text|border|ring|fill|stroke|divide|outline|placeholder)-(?:white|black)(?:\\/\\d{1,3})?(?:$|\\s|`)/]",
        message:
          "Hardcoded white/black. Use bg-surface / text-navy / text-on-ink (or the -fixed tokens where the surface is dark in both themes).",
      },
      {
        // The type scale exists so metadata lines up across pages. `text-[11px]` next to
        // `text-[10.5px]` next to `text-[10px]` is three sizes doing one job.
        selector: "Literal[value=/(?:^|\\s|`)text-\\[\\d/]",
        message:
          "Arbitrary font size. Use the scale: text-2xs, text-xs, text-sm, text-base, text-lg, text-xl, text-2xl…",
      },
      {
        // Hover is a border or background delta, at 150ms. A card that lifts is a card
        // that reflows its neighbours' perceived alignment on every mouse move.
        selector: "Literal[value=/(?:^|\\s|`)(?:group-)?hover:(?:-?translate|scale|shadow)/]",
        message:
          "Hover must be a border or background delta only — no translate, scale, or shadow. See DESIGN-SYSTEM.md → Interaction.",
      },
      {
        // A bare `outline-none` removes the outline in every state including keyboard
        // focus, and being a utility class it outranks the zero-specificity base rule
        // that rings every interactive element. Four shared controls carried it and
        // silently suppressed focus across all three applications.
        selector: "Literal[value=/(?:^|\\s|`)outline-none(?:$|\\s|`)/]",
        message:
          "`outline-none` suppresses the keyboard focus ring. Focus is handled by the base rule in globals.css — see DESIGN-SYSTEM.md → Focus. If an element needs a different indicator, declare that indicator rather than removing the outline.",
      },
];

const config = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: {
        rootDir: ["apps/client/", "apps/lecturer/", "apps/admin/"],
      },
    },
  },
  {
    // `files` is required here, not decoration. `react-hooks` is registered by
    // eslint-config-next only on the object matching this glob; a config object with no
    // `files` is a base object whose rules must resolve against every linted file, and for
    // the ones outside that glob the plugin does not exist — ESLint then refuses the whole
    // run with "could not find plugin react-hooks" rather than skipping the rule.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      // These state-reset effects predate the migration. Keep them visible without
      // changing working modal and theme behavior as part of an architecture task.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // Design-system enforcement. Every rule below encodes a finding from
    // docs/UI_AUDIT_AND_PLAN.md — without them, the same drift comes back, because a
    // convention that only lives in a document is a convention nobody runs.
    files: ["apps/client/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...DESIGN_TOKEN_RESTRICTIONS],
    },
  },
  {
    // lecturer and admin have not had their design audit yet, so the same checks run as
    // warnings there: the debt stays visible without turning their build red for drift
    // that predates this work. Promote to "error" as each app is cleaned up.
    files: ["apps/lecturer/src/**/*.{ts,tsx}", "apps/admin/src/**/*.{ts,tsx}", "packages/ui/src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": ["warn", ...DESIGN_TOKEN_RESTRICTIONS],
    },
  },
  {
    // The two component libraries are deliberately separate: packages/ui serves the dense
    // lecturer/admin surfaces, apps/client/src/components/ui serves the student product, and
    // they do not share a palette (web's navy/surface/on-ink tokens are not defined in the
    // other apps). What must never happen is a file reaching for the wrong Button.
    files: ["apps/client/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@codementor/ui",
              importNames: ["Button", "Card", "CardHeader", "CardContent", "PageHeader"],
              message:
                "apps/client has its own Button/Card/PageHeader in @/components/ui — the @codementor/ui ones are styled for the lecturer/admin shells and use tokens web does not define.",
            },
          ],
        },
      ],
    },
  },
  {
    // `.cjs` is CommonJS by definition: `require()` is the only import syntax it has.
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
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
