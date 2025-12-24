import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Status", href: "/status" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Glossary", href: "/glossary" },
      { label: "Guides", href: "/blog" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Compare Apps", href: "/compare" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Partners", href: "/partners" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Trust Center", href: "/trust" },
      { label: "Bug Bounty", href: "/security/bug-bounty" },
    ],
  },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Preferences", href: "/legal/cookie-preferences" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Your Privacy Choices", href: "/legal/privacy-rights" },
];

const Footer = () => {
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();

  return (
    <footer className="bg-muted py-12 px-4">
      <div className="container mx-auto">
        {/* Logo Section */}
        <div className="mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src={logo}
                alt="Ally Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">Ally</div>
              <div className="text-xs text-muted-foreground leading-none">
                by WA.I.TER
              </div>
            </div>
          </Link>
          <p className="text-muted-foreground max-w-sm">
            Making aquarium water care effortless with AI powered insights and
            personalized care plans.
          </p>
        </div>

        {/* Mobile: Status Quick Access + Accordions */}
        {isMobile ? (
          <div className="mb-8">
            {/* Status Quick Access */}
            <Link
              to="/status"
              className="flex items-center justify-between py-3 px-4 mb-4 bg-background/50 rounded-lg text-sm font-medium hover:bg-background/80 transition-colors"
            >
              <span>System Status</span>
              <span className="text-xs text-green-500">● Operational</span>
            </Link>

            {/* Accordion Sections */}
            <Accordion type="multiple" className="w-full">
              {footerSections.map((section) => (
                <AccordionItem
                  key={section.title}
                  value={section.title}
                  className="border-border/50"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pb-2">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            to={link.href}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Admin Link (Mobile) */}
            {isAdmin && (
              <Link
                to="/admin"
                className="block mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        ) : (
          /* Desktop: 5-Column Grid */
          <div className="grid grid-cols-5 gap-8 mb-8">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  {/* Admin Link in Company column */}
                  {section.title === "Company" && isAdmin && (
                    <li>
                      <Link
                        to="/admin"
                        className="hover:text-primary transition-colors"
                      >
                        Admin
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Legal Strip */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 WA.I.TER. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
