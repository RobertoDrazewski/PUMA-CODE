import type { MetadataRoute } from "next";

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