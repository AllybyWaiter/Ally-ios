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
          if (id.includes("node_modules/framer-motion")) return "vendor-framer";
          if (id.includes("node_modules/leaflet") || id.includes("node_modules/react-leaflet")) return "vendor-leaflet";
          if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) return "vendor-i18n";

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
