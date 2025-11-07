import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-water flex items-center justify-center">
            <Waves className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-lg leading-none">Ally</div>
            <div className="text-xs text-muted-foreground leading-none">by WA.I.TER</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            How It Works
          </a>
          <a href="#app" className="text-sm font-medium hover:text-primary transition-colors">
            App
          </a>
        </div>

        <Button variant="hero" size="sm">
          Get Early Access
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
