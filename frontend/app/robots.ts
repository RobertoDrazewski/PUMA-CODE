import type { MetadataRoute } from "next";

// Requerido por Next 16 con output: "export" para generar /robots.txt estático.
export const dynamic = "force-static";

const BASE_URL = "https://puma-code.com";

// Con output: "export", Next.js genera /robots.txt como archivo estático en el build.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}