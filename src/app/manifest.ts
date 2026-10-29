import type { MetadataRoute } from "next";

// Web app manifest — makes the reader installable on Android/desktop Chrome
// (and gives iOS the name/icon when added to the home screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Biblioteca de Amneris",
    short_name: "Amneris",
    description:
      "Recetas, menús y planes de alimentación para bebés de 0 a 2 años.",
    lang: "es",
    start_url: "/libro",
    scope: "/",
    display: "standalone",
    background_color: "#fdf6ee",
    theme_color: "#fdf6ee",
    icons: [
      { src: "/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
