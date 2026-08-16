import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PropertySearch — find the right property faster",
    short_name: "PropertySearch",
    description: "A faster, more transparent way to search Australian property.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff9f2",
    theme_color: "#ff5a1f",
    orientation: "portrait",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }]
  };
}
