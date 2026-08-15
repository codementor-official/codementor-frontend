import { THEME_STORAGE_KEY } from "@/lib/store/theme-store";

/**
 * Applies the stored theme before first paint. Without this the page renders light,
 * then flips to dark once React hydrates — a visible white flash on every load.
 *
 * Reads zustand/persist's envelope (`{ state: { preference } }`) directly, since the
 * store itself isn't available this early.
 */
export function ThemeScript() {
  const script = `(function(){try{
var p=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"{}").state?.preference||"system";
var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
if(d)document.documentElement.classList.add("dark");
}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
