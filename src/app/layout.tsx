import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "X-28 Agent Core",
  description: "Plataforma operativa para agentes X-28",
  manifest: "/manifest.json", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-red-500/30 selection:text-red-200`}>
        {children}
      </body>
    </html>
  );
}
