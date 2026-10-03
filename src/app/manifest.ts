import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BlueClue — Beat Trainer",
    short_name: "BlueClue",
    description: "Aprende a escuchar el pulso y reconocer el 1, a tu ritmo.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#09141c",
    theme_color: "#09141c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
