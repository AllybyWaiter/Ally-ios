import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userName } = useAuth();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    }
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src={logo} alt="Ally Logo" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <div className="font-bold text-lg leading-none">Ally</div>
            <div className="text-xs text-muted-foreground leading-none">by WA.I.TER</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a 
            href="#features" 
            className="text-sm font-medium hover:text-primary transition-colors"
            onClick={(e) => scrollToSection(e, "features")}
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="text-sm font-medium hover:text-primary transition-colors"
            onClick={(e) => scrollToSection(e, "how-it-works")}
          >
            How It Works
          </a>
          <Link 
            to="/pricing" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Pricing
          </Link>
          <a 
            href="#app" 
            className="text-sm font-medium hover:text-primary transition-colors"
            onClick={(e) => scrollToSection(e, "app")}
          >
            App
          </a>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="text-sm font-medium hidden md:block">
              Welcome, {userName || 'User'}
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="hero" size="sm" onClick={() => setShowWaitlist(true)} className="hidden md:flex">
                Get Early Access
              </Button>
            </>
          )}
          
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <a 
                  href="#features" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={(e) => scrollToSection(e, "features")}
                >
                  Features
                </a>
                <a 
                  href="#how-it-works" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={(e) => scrollToSection(e, "how-it-works")}
                >
                  How It Works
                </a>
                <Link 
                  to="/pricing" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <a 
                  href="#app" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={(e) => scrollToSection(e, "app")}
                >
                  App
                </a>
                
                <div className="border-t border-border pt-4 mt-4 flex flex-col gap-3">
                  {user ? (
                    <div className="text-sm font-medium py-2">
                      Welcome, {userName || 'User'}
                    </div>
                  ) : (
                    <>
                      <Button variant="ghost" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link to="/auth">Sign In</Link>
                      </Button>
                      <Button variant="hero" onClick={() => {
                        setMobileMenuOpen(false);
                        setShowWaitlist(true);
                      }}>
                        Get Early Access
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        
        <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />
      </div>
    </nav>
  );
};

export default Navbar;
