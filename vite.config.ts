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
        manualChunks: {
          // Vendor chunks - separate heavy dependencies
          'vendor-recharts': ['recharts'],
          'vendor-framer': ['framer-motion'],
          'vendor-markdown': ['react-markdown', 'react-syntax-highlighter'],
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          // i18n locales loaded dynamically, but group the library
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));
