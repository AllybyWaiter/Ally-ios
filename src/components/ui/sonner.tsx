import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      expand={false}
      richColors={false}
      closeButton
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black/70 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3 dark:group-[.toaster]:bg-white/10",
          title: "group-[.toast]:text-[13px] group-[.toast]:font-medium",
          description: "group-[.toast]:text-white/70 group-[.toast]:text-[12px]",
          actionButton: "group-[.toast]:bg-white/20 group-[.toast]:text-white group-[.toast]:rounded-full group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white/70 group-[.toast]:rounded-full group-[.toast]:text-xs",
          closeButton: "group-[.toast]:bg-white/10 group-[.toast]:border-0 group-[.toast]:text-white/50 group-[.toast]:hover:text-white group-[.toast]:hover:bg-white/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
