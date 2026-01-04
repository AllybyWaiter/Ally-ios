import { toast as sonnerToast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { triggerHaptic } from "@/hooks/useHaptics";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Standardized toast durations for consistency across the app
const TOAST_DURATIONS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
  loading: Infinity,
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconProps = { className: "h-5 w-5 shrink-0" };
  
  switch (type) {
    case "success":
      return <CheckCircle {...iconProps} className="h-5 w-5 shrink-0 text-green-500" />;
    case "error":
      return <XCircle {...iconProps} className="h-5 w-5 shrink-0 text-red-500" />;
    case "warning":
      return <AlertTriangle {...iconProps} className="h-5 w-5 shrink-0 text-amber-500" />;
    case "info":
      return <Info {...iconProps} className="h-5 w-5 shrink-0 text-blue-500" />;
    case "loading":
      return <Loader2 {...iconProps} className="h-5 w-5 shrink-0 text-primary animate-spin" />;
    default:
      return null;
  }
};

const createToast = (type: ToastType, title: string, options?: ToastOptions) => {
  const duration = options?.duration ?? TOAST_DURATIONS[type];
  
  // Trigger haptic feedback based on toast type
  if (type === "success") {
    triggerHaptic("success");
  } else if (type === "error") {
    triggerHaptic("error");
  } else if (type === "warning") {
    triggerHaptic("medium");
  }
  
  return sonnerToast(title, {
    description: options?.description,
    duration,
    icon: <ToastIcon type={type} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  });
};

export const toast = {
  success: (title: string, options?: ToastOptions) => createToast("success", title, options),
  error: (title: string, options?: ToastOptions) => createToast("error", title, options),
  warning: (title: string, options?: ToastOptions) => createToast("warning", title, options),
  info: (title: string, options?: ToastOptions) => createToast("info", title, options),
  loading: (title: string, options?: ToastOptions) => createToast("loading", title, options),
  
  // Promise-based toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: (data) => typeof messages.success === "function" ? messages.success(data) : messages.success,
      error: (error) => typeof messages.error === "function" ? messages.error(error) : messages.error,
    });
  },
  
  // Dismiss all toasts
  dismiss: sonnerToast.dismiss,
};

export type { ToastOptions };
