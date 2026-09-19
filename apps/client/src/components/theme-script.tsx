import { THEME_STORAGE_KEY } from "@/lib/store/theme-store";

/**
 * Applies the stored theme before first paint. Without this the page renders light,
 * then flips to dark once React hydrates — a visible white flash on every load.
 *
 * Reads zustand/persist's envelope (`{ state: { preference } }`) directly, since the
 * store itself isn't available this early.
 *
 * A plain `<script>` in the App Router's `<head>`, not `next/script`: `beforeInteractive`
 * is a Pages Router contract (it belongs in `_document`), and under the App Router the
 * runtime may still hand it to the client bundle — which is one paint too late for the
 * flash this exists to prevent. Inline and synchronous is the only ordering that works.
 */
export function ThemeScript() {
  const script = `(function(){try{
var p=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"{}").state?.preference||"system";
var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
if(d)document.documentElement.classList.add("dark");
}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} id="theme-script" />;
}
