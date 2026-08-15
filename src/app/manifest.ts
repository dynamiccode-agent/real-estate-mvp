import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hearth — homes, honestly",
    short_name: "Hearth",
    description: "A calmer, more transparent way to find Australian property.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3eee4",
    theme_color: "#18392f",
    orientation: "portrait",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }]
  };
}
