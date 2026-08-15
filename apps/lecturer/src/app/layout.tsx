import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@codementor/ui/styles.css";

export const metadata: Metadata = {
  title: "CodeMentor Lecturer Dashboard",
  description: "Lecturer tools for the CodeMentor learning platform.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
