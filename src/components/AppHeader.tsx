import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AppHeader = () => {
  const { user, userName, signOut } = useAuth();
  const location = useLocation();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src={logo} alt="Ally Logo" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <div className="font-bold text-lg leading-none">Ally</div>
            <div className="text-xs text-muted-foreground leading-none">by WA.I.TER</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/dashboard">
            <Button
              variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
              size="sm"
            >
              Dashboard
            </Button>
          </Link>
          <Link to="/water-tests">
            <Button
              variant={location.pathname === "/water-tests" ? "secondary" : "ghost"}
              size="sm"
            >
              Water Tests
            </Button>
          </Link>
          <Link to="/calendar">
            <Button
              variant={location.pathname === "/calendar" ? "secondary" : "ghost"}
              size="sm"
            >
              Calendar
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Notification Bell - placeholder for future */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
