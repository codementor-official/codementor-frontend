import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { AuthProvider } from "@/providers/auth-provider";

// No `weight` list on purpose. Naming individual weights makes next/font request the
// static Inter build, which Google has retired — those .woff2 URLs now 404 and the
// page fails to render once the local font cache is gone. Without it Next fetches the
// variable font, which covers the whole 400–800 range continuously. apps/lecturer and
// apps/admin already declare it this way.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

// Same reason as Inter above: the static build's .woff2 files are gone.
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeMentor",
  description: "Nền tảng học và luyện tập lập trình",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
