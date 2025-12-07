import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
const Footer = () => {
  const {
    isAdmin
  } = useAuth();
  return <footer className="bg-muted py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
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
            <p className="text-muted-foreground max-w-sm">Making aquarium water care effortless with AI powered insights and personalized care plans.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              {isAdmin && <li><Link to="/admin" className="hover:text-primary transition-colors">Admin</Link></li>}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 WA.I.TER. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;