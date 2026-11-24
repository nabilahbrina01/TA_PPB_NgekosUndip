import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Konfigurasi Vite + PWA (manifest & service worker dibuat otomatis saat build)
export default defineConfig({
  build: { chunkSizeWarningLimit: 1000 }, // peta (Leaflet) cukup besar
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true }, // service worker aktif juga saat npm run dev
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "NgekosUndip",
        short_name: "NgekosUndip",
        description:
          "Informasi kos dan kontrakan untuk mahasiswa Universitas Diponegoro",
        lang: "id",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#F4F6FA",
        theme_color: "#0B2A4A",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Tampilan aplikasi disimpan di HP; data API selalu diambil terbaru
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          // Data API (GET): ambil terbaru dari internet, jika offline pakai data tersimpan
          {
            urlPattern: ({ url, request }) =>
              request.method === "GET" && url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/auth"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-data",
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Foto properti: simpan agar tetap tampil saat offline
          {
            urlPattern: ({ request, url }) =>
              request.destination === "image" && !url.hostname.endsWith("tile.openstreetmap.org"),
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Potongan peta OpenStreetMap
          {
            urlPattern: ({ url }) => url.hostname.endsWith("tile.openstreetmap.org"),
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 300, maxAgeSeconds: 14 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
