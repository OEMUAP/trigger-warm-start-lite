import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warm Start Service",
  description: "Trigger.dev Warm Start Service Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
