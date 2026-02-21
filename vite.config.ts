import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png"],
      injectManifest: {
        globPatterns: ["**/*.{css,html,ico,png,svg,woff,woff2}"],
      },
      manifest: false, // Use existing manifest.webmanifest
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Keep major heavy libraries isolated.
          if (id.includes("node_modules/recharts")) return "vendor-recharts";
          if (
            id.includes("node_modules/framer-motion") ||
            id.includes("node_modules/motion-dom") ||
            id.includes("node_modules/motion-utils")
          ) {
            return "vendor-framer";
          }
          if (
            id.includes("node_modules/leaflet") ||
            id.includes("node_modules/react-leaflet") ||
            id.includes("node_modules/@react-leaflet/core")
          ) {
            return "vendor-leaflet";
          }
          if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) return "vendor-i18n";
          if (id.includes("node_modules/react-dom")) return "vendor-react-dom";
          if (id.includes("node_modules/react/")) return "vendor-react";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
          if (id.includes("node_modules/@supabase")) return "vendor-supabase";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (id.includes("node_modules/react-router") || id.includes("node_modules/@remix-run/router")) return "vendor-router";
          if (id.includes("node_modules/@sentry")) return "vendor-sentry";
          if (id.includes("node_modules/date-fns")) return "vendor-datefns";
          if (id.includes("node_modules/lucide-react")) return "vendor-icons";
          if (id.includes("node_modules/@capacitor") || id.includes("node_modules/@revenuecat")) return "vendor-native";
          if (id.includes("node_modules/react-day-picker")) return "vendor-datepicker";

          // Split markdown and syntax stack to avoid a single oversized chunk.
          if (id.includes("node_modules/react-syntax-highlighter") || id.includes("node_modules/refractor")) {
            return "vendor-syntax";
          }
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark-") ||
            id.includes("node_modules/rehype-") ||
            id.includes("node_modules/unified") ||
            id.includes("node_modules/micromark") ||
            id.includes("node_modules/mdast") ||
            id.includes("node_modules/hast") ||
            id.includes("node_modules/vfile") ||
            id.includes("node_modules/unist")
          ) {
            return "vendor-markdown";
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));
