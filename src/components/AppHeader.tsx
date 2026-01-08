import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationBell from "./NotificationBell";

const AppHeader = () => {
  const { user, userName, signOut } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const getInitials = (name: string | null) => {
    if (!name || !name.trim()) return "U";
    const trimmedName = name.trim();
    const parts = trimmedName.split(" ").filter(n => n.length > 0);
    if (parts.length === 0) return "U";
    return parts
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/30 pt-safe supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 flex items-center justify-center">
            <img src={logo} alt="Ally Logo" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <div className="font-semibold text-base leading-tight">Ally</div>
            <div className="text-[10px] text-muted-foreground/70 leading-tight">by WA.I.TER</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-0.5">
          <Link to="/dashboard">
            <Button
              variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 text-sm font-medium"
            >
              {t('navigation.dashboard')}
            </Button>
          </Link>
          <Link to="/ally">
            <Button
              variant={location.pathname === "/ally" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 text-sm font-medium"
            >
              {t('navigation.chatWithAlly')}
            </Button>
          </Link>
          <Link to="/water-tests">
            <Button
              variant={location.pathname === "/water-tests" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 text-sm font-medium"
            >
              {t('navigation.waterTests')}
            </Button>
          </Link>
          <Link to="/calendar">
            <Button
              variant={location.pathname === "/calendar" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 text-sm font-medium"
            >
              {t('navigation.calendar')}
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 hover:bg-foreground/5">
                <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                  <AvatarFallback className="bg-[#34406A] text-white text-sm font-medium">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">{userName || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('navigation.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('navigation.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
