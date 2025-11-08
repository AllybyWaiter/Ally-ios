import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <a 
            href="#app" 
            className="text-sm font-medium hover:text-primary transition-colors"
            onClick={(e) => scrollToSection(e, "app")}
          >
            App
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button variant="hero" size="sm" onClick={() => setShowWaitlist(true)}>
            Get Early Access
          </Button>
        </div>
        
        <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />
      </div>
    </nav>
  );
};

export default Navbar;
