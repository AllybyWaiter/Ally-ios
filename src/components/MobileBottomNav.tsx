import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, Droplets, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";
import { triggerHaptic } from "@/hooks/useHaptics";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Droplets, label: "Tests", path: "/water-tests" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isKeyboardVisible } = useKeyboardVisibility();
  const { user } = useAuth();
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Only show for authenticated users
  if (!user) return null;

  // Detect onboarding state by checking for data-onboarding attribute
  useEffect(() => {
    const checkOnboarding = () => {
      const onboardingElement = document.querySelector('[data-onboarding="true"]');
      setIsOnboarding(!!onboardingElement);
    };
    
    checkOnboarding();
    
    // Observe DOM changes to detect onboarding mounting/unmounting
    const observer = new MutationObserver(checkOnboarding);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  // Only show on mobile
  if (!isMobile) return null;

  // Hide when keyboard is visible
  if (isKeyboardVisible) return null;

  // Hide during onboarding
  if (isOnboarding) return null;

  // Hide on certain pages where it doesn't make sense
  const hiddenPaths = ["/auth", "/", "/privacy", "/terms", "/contact", "/about", "/pricing", "/features", "/how-it-works", "/blog", "/faq", "/help", "/chat"];
  const shouldHide = hiddenPaths.some(path => 
    location.pathname === path || location.pathname.startsWith("/blog/")
  );
  
  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => triggerHaptic('light')}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors relative",
                "active:bg-accent/50 tap-highlight-transparent",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-transform",
                  isActive && "scale-110"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
