import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

// Configuración de la barra de estado y color del tema para móviles
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

// Metadatos optimizados para PWA (App en el teléfono)
export const metadata: Metadata = {
  title: "Puma Code | Software Factory & AI Solutions",
  description: "Desarrollo de software a medida con inteligencia artificial integrada. Desde Mendoza al mundo.",
  keywords: ["Software Factory", "Inteligencia Artificial", "Mendoza", "Desarrollo Web", "Puma Code"],
  authors: [{ name: "Roberto Drazewski" }],
  manifest: "/manifest.json", // Importante para Android
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Puma Code",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/icon-192x192.png",
    apple: "/apple-icon.png", // Este es el que verás en el escritorio del iPhone
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          antialiased 
          bg-black 
          text-white 
          selection:bg-blue-500/30
          font-sans 
        `}
      >
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}