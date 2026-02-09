import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, Droplets, Calendar, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";
import { triggerHaptic } from "@/hooks/useHaptics";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingOptional } from "@/contexts/OnboardingContext";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  isSpecial?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Droplets, label: "Tests", path: "/water-tests" },
  { icon: MessageSquare, label: "Chat", path: "/ally", isSpecial: true },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: CloudSun, label: "Weather", path: "/weather" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isKeyboardVisible } = useKeyboardVisibility();
  const { user } = useAuth();
  const onboardingContext = useOnboardingOptional();
  const isOnboarding = onboardingContext?.isOnboarding ?? false;

  if (!user) return null;
  if (!isMobile) return null;
  if (isKeyboardVisible) return null;
  if (isOnboarding) return null;

  const hiddenPaths = ["/auth", "/", "/privacy", "/terms", "/contact", "/about", "/pricing", "/features", "/how-it-works", "/blog", "/faq", "/help", "/chat", "/ally"];
  const shouldHide = hiddenPaths.some(path =>
    location.pathname === path || location.pathname.startsWith("/blog/")
  );
  
  if (shouldHide) return null;

  return (
    <nav 
      role="navigation"
      aria-label="Main navigation"
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-background/98 backdrop-blur-lg border-t border-border/40 pb-safe"
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          if (item.isSpecial) {
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => triggerHaptic('medium')}
                aria-label={item.label}
                className="flex flex-col items-center justify-center px-4 -mt-5 tap-highlight-transparent"
              >
                <div 
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br from-sand to-desat-blue",
                    "shadow-lg shadow-desat-blue/25",
                    "transition-all duration-200 active:scale-95"
                  )}
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-semibold mt-1 text-foreground">
                  {item.label}
                </span>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => triggerHaptic('light')}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2",
                "transition-colors tap-highlight-transparent",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <Icon 
                className="h-5 w-5 mb-0.5"
                strokeWidth={isActive ? 2.5 : 1.5}
                fill={isActive ? "currentColor" : "none"}
              />
              <span className={cn(
                "text-[10px]",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
