import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { initSentry } from "./lib/sentry";

// Initialize Sentry before rendering the app
initSentry();

// Hide splash screen once React is ready
const hideSplash = (window as unknown as { hideSplash?: () => void }).hideSplash;
if (hideSplash) {
  hideSplash();
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <App />
  </ThemeProvider>
);
