import type { MetadataRoute } from "next";

// Con output: "export", Next.js genera /sitemap.xml como archivo estático en el build.
// Declaramos SOLO la URL canónica para que Google no rastree variantes (www, http, /trailing).
const BASE_URL = "https://puma-code.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}