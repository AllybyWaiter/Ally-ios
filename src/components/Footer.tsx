import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Footer = () => {
  const { isAdmin } = useAuth();
  
  return (
    <footer className="bg-muted py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logo} alt="Ally Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <div className="font-bold text-lg leading-none">Ally</div>
                <div className="text-xs text-muted-foreground leading-none">by WA.I.TER</div>
              </div>
            </Link>
            <p className="text-muted-foreground max-w-sm">
              Making aquarium water care effortless with AI powered insights and personalized care plans.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/glossary" className="hover:text-primary transition-colors">Glossary</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Solutions</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/best-aquatic-app" className="hover:text-primary transition-colors">Why Ally</Link></li>
              <li><Link to="/best-aquarium-app" className="hover:text-primary transition-colors">Best Aquarium App</Link></li>
              <li><Link to="/best-pool-app" className="hover:text-primary transition-colors">Best Pool App</Link></li>
              <li><Link to="/best-spa-app" className="hover:text-primary transition-colors">Best Spa App</Link></li>
              <li><Link to="/ai-water-testing" className="hover:text-primary transition-colors">AI Water Testing</Link></li>
              <li><Link to="/compare" className="hover:text-primary transition-colors">Compare Apps</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="/partners" className="hover:text-primary transition-colors">Partners</Link></li>
              <li><Link to="/trust" className="hover:text-primary transition-colors">Trust Center</Link></li>
              <li><Link to="/security" className="hover:text-primary transition-colors">Security</Link></li>
              <li><Link to="/status" className="hover:text-primary transition-colors">Status</Link></li>
              {isAdmin && <li><Link to="/admin" className="hover:text-primary transition-colors">Admin</Link></li>}
            </ul>
          </div>
        </div>

        {/* Legal Links Row */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <p className="text-sm text-muted-foreground">
              © 2025 WA.I.TER. All rights reserved.
            </p>
            
            {/* Primary Legal Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
              <Link to="/accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
              <Link to="/privacy#ccpa" className="hover:text-primary transition-colors">Do Not Sell My Info</Link>
            </div>
          </div>
          
          {/* Secondary Links Row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4">
            <Link to="/legal/ai-transparency" className="hover:text-primary transition-colors">AI Transparency</Link>
            <Link to="/legal/subprocessors" className="hover:text-primary transition-colors">Subprocessors</Link>
            <Link to="/legal/dpa" className="hover:text-primary transition-colors">DPA</Link>
            <Link to="/legal/sla" className="hover:text-primary transition-colors">SLA</Link>
            <Link to="/changelog" className="hover:text-primary transition-colors">Changelog</Link>
            <Link to="/testimonials" className="hover:text-primary transition-colors">Testimonials</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;