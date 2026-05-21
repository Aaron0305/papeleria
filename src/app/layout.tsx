import type { Metadata } from "next";
import { Outfit, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ciber-Papelería POS",
  description: "Sistema de Punto de Venta premium y moderno",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("overflow-x-hidden", "antialiased", outfit.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="overflow-x-hidden">{children}</body>
    </html>
  );
}
