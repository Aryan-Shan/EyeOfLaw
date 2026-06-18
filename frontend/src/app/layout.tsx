import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eye of Law - Adaptive Urban Traffic Intelligence Platform",
  description: "Mission-Critical Decision-Support Dashboard for Municipal Traffic Commissioners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full min-h-full flex flex-col text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
