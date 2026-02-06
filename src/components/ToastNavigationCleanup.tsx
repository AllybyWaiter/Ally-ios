import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { useToast } from "@/hooks/use-toast";

/**
 * Clears transient notifications on route changes so stale success toasts
 * don't persist while the user navigates between pages.
 */
export function ToastNavigationCleanup() {
  const location = useLocation();
  const { dismiss } = useToast();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    sonnerToast.dismiss();
    dismiss();
  }, [location.pathname, location.search, dismiss]);

  return null;
}

