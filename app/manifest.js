export default function manifest() {
  return {
    name: "Redu",
    short_name: "Redu",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F6F7FC",
    theme_color: "#2C3691",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
