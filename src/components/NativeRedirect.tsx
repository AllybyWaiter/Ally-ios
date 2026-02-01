import { Capacitor } from "@capacitor/core";
import { Navigate } from "react-router-dom";
import Index from "@/pages/Index";

/**
 * On native iOS/Android, skip the marketing landing page
 * and go straight to auth (which will redirect to dashboard if already logged in).
 * On web, show the normal landing page.
 */
const NativeRedirect = () => {
  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/auth" replace />;
  }
  return <Index />;
};

export default NativeRedirect;
