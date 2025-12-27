import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDomainType, getAppUrl, getMarketingUrl } from "@/hooks/useDomainType";
import { Menu, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const solutionsLinks = [
  { label: "Why Ally", path: "/best-aquatic-app" },
  { label: "Best Aquarium App", path: "/best-aquarium-app" },
  { label: "Best Pool App", path: "/best-pool-app" },
  { label: "Best Spa App", path: "/best-spa-app" },
  { label: "AI Water Testing", path: "/ai-water-testing" },
  { label: "Compare Apps", path: "/compare" },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userName, signOut } = useAuth();
  const navigate = useNavigate();
  const domainType = useDomainType();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    }
  };

  const handleAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    if (domainType === 'marketing') {
      // On marketing domain, redirect to app domain
      window.location.href = getAppUrl(user ? '/dashboard' : '/auth');
    } else {
      // On app/dev domain, use internal navigation
      navigate(user ? '/dashboard' : '/auth');
    }
  };

  const handleLogoClick = () => {
    if (domainType === 'app') {
      // On app domain, go to marketing site
      window.location.href = getMarketingUrl('/');
    }
    // On marketing/dev domain, Link component handles it
  };

  const handleGetStarted = () => {
    if (domainType === 'marketing') {
      window.location.href = getAppUrl('/auth');
    } else {
      navigate('/auth');
    }
  };

  const logoElement = domainType === 'app' ? (
    <a 
      href={getMarketingUrl('/')} 
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      onClick={(e) => {
        e.preventDefault();
        handleLogoClick();
      }}
    >
      <div className="w-10 h-10 flex items-center justify-center">
        <img src={logo} alt="Ally Logo" className="w-10 h-10 object-contain" />
      </div>
      <div>
        <div className="font-bold text-lg leading-none">Ally</div>
        <div className="text-xs text-muted-foreground leading-none">by WA.I.TER</div>
      </div>
    </a>
  ) : (
    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="w-10 h-10 flex items-center justify-center">
        <img src={logo} alt="Ally Logo" className="w-10 h-10 object-contain" />
      </div>
      <div>
        <div className="font-bold text-lg leading-none">Ally</div>
        <div className="text-xs text-muted-foreground leading-none">by WA.I.TER</div>
      </div>
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border pt-safe">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {logoElement}

        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/features" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link 
            to="/how-it-works" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            How It Works
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              Solutions
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {solutionsLinks.map((link) => (
                <DropdownMenuItem key={link.path} asChild>
                  <Link to={link.path} className="w-full cursor-pointer">
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link 
            to="/pricing" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Pricing
          </Link>
          <Link 
            to="/blog" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Blog
          </Link>
          <a 
            href="#app" 
            className="text-sm font-medium hover:text-primary transition-colors"
            onClick={handleAppClick}
          >
            App
          </a>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {domainType === 'marketing' ? (
                <Button variant="default" size="sm" asChild>
                  <a href={getAppUrl('/dashboard')}>Go to Dashboard</a>
                </Button>
              ) : (
                <Button variant="default" size="sm" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => {
                signOut();
                if (domainType === 'app') {
                  window.location.href = getMarketingUrl('/');
                } else {
                  navigate('/');
                }
              }}>
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              {domainType === 'marketing' ? (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                    <a href={getAppUrl('/auth')}>Sign In</a>
                  </Button>
                  <Button variant="hero" size="sm" onClick={handleGetStarted} className="hidden md:flex">
                    Get Started
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button variant="hero" size="sm" onClick={handleGetStarted} className="hidden md:flex">
                    Get Started
                  </Button>
                </>
              )}
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
                <Link 
                  to="/features" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  to="/how-it-works" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                
                {/* Solutions Section */}
                <div className="py-2">
                  <div className="text-lg font-medium text-muted-foreground mb-2">Solutions</div>
                  <div className="pl-4 flex flex-col gap-2">
                    {solutionsLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className="text-base hover:text-primary transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
                
                <Link 
                  to="/pricing" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  to="/blog" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog
                </Link>
                <a 
                  href="#app" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={handleAppClick}
                >
                  App
                </a>
                
                <div className="border-t border-border pt-4 mt-4 flex flex-col gap-3">
                  {user ? (
                    <>
                      {domainType === 'marketing' ? (
                        <Button variant="default" asChild onClick={() => setMobileMenuOpen(false)}>
                          <a href={getAppUrl('/dashboard')}>Go to Dashboard</a>
                        </Button>
                      ) : (
                        <Button variant="default" asChild onClick={() => setMobileMenuOpen(false)}>
                          <Link to="/dashboard">Go to Dashboard</Link>
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                        if (domainType === 'app') {
                          window.location.href = getMarketingUrl('/');
                        } else {
                          navigate('/');
                        }
                      }}>
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      {domainType === 'marketing' ? (
                        <Button variant="ghost" asChild onClick={() => setMobileMenuOpen(false)}>
                          <a href={getAppUrl('/auth')}>Sign In</a>
                        </Button>
                      ) : (
                        <Button variant="ghost" asChild onClick={() => setMobileMenuOpen(false)}>
                          <Link to="/auth">Sign In</Link>
                        </Button>
                      )}
                      <Button variant="hero" onClick={() => {
                        setMobileMenuOpen(false);
                        handleGetStarted();
                      }}>
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;