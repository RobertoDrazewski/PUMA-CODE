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

const SITE_URL = "https://puma-code.com";
const SITE_TITLE = "Puma Code | Software Factory & AI Solutions";
const SITE_DESCRIPTION =
  "Desarrollo de software a medida con inteligencia artificial integrada. Desde Mendoza al mundo.";

// Metadatos optimizados para SEO + PWA (App en el teléfono)
export const metadata: Metadata = {
  // metadataBase es clave: genera URLs absolutas para canonical, OG y twitter.
  // Sin esto, Google trata www/no-www/http/https/trailing-slash como páginas distintas.
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: ["Software Factory", "Inteligencia Artificial", "Mendoza", "Desarrollo Web", "Puma Code"],
  // Canonical explícita -> unifica todas las variantes en una sola URL indexable.
  alternates: {
    canonical: "/",
  },
  // Le decimos a Google que indexe y siga, sin restricciones de snippet.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "Puma Code",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/logotrans.png",
        width: 512,
        height: 512,
        alt: "Puma Code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/logotrans.png"],
  },
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

// Datos estructurados (JSON-LD) para que Google entienda que es una organización.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Puma Code",
  url: SITE_URL,
  logo: `${SITE_URL}/logotrans.png`,
  description: SITE_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mendoza",
    addressCountry: "AR",
  },
  sameAs: [
    "https://www.linkedin.com/company/puma-code",
    "https://www.instagram.com/puma_code",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
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