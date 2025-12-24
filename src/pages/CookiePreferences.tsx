import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Cookie, Check, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

const CookiePreferences = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    functional: true,
    analytics: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedPrefs = localStorage.getItem("cookie-preferences");
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences({
          essential: true, // Always true
          functional: parsed.functional ?? true,
          analytics: parsed.analytics ?? true,
        });
      } catch {
        // Use defaults
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("cookie-preferences", JSON.stringify(preferences));
    localStorage.setItem("cookie-consent", "accepted");
    setSaved(true);
    toast({
      title: "Preferences Saved",
      description: "Your cookie preferences have been updated.",
    });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    const allEnabled = { essential: true, functional: true, analytics: true };
    setPreferences(allEnabled);
    localStorage.setItem("cookie-preferences", JSON.stringify(allEnabled));
    localStorage.setItem("cookie-consent", "accepted");
    toast({
      title: "All Cookies Accepted",
      description: "You have accepted all cookies.",
    });
  };

  const handleRejectNonEssential = () => {
    const essentialOnly = { essential: true, functional: false, analytics: false };
    setPreferences(essentialOnly);
    localStorage.setItem("cookie-preferences", JSON.stringify(essentialOnly));
    localStorage.setItem("cookie-consent", "declined");
    toast({
      title: "Non-Essential Cookies Rejected",
      description: "Only essential cookies will be used.",
    });
  };

  const cookieCategories = [
    {
      id: "essential",
      name: "Essential Cookies",
      description: "These cookies are necessary for the website to function and cannot be disabled. They enable core functionality such as security, authentication, and accessibility.",
      examples: ["Authentication tokens", "Session management", "Security features"],
      required: true,
    },
    {
      id: "functional",
      name: "Functional Cookies",
      description: "These cookies enable enhanced functionality and personalization. They remember your preferences such as theme, language, and cached data for offline access.",
      examples: ["Theme preference", "Language selection", "Chat history cache", "Notification settings"],
      required: false,
    },
    {
      id: "analytics",
      name: "Analytics Cookies",
      description: "These cookies help us understand how visitors interact with our website by collecting and reporting information. This helps us improve our service and fix issues.",
      examples: ["Error tracking (Sentry)", "Performance metrics", "Usage patterns"],
      required: false,
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Cookie Preferences"
        description="Manage your cookie preferences for Ally. Choose which types of cookies you allow us to use."
        path="/legal/cookie-preferences"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Cookie Preferences
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose which types of cookies you allow us to use. Essential cookies are always enabled 
            as they are necessary for the site to function.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button onClick={handleAcceptAll}>
            Accept All
          </Button>
          <Button variant="outline" onClick={handleRejectNonEssential}>
            Essential Only
          </Button>
        </div>

        {/* Cookie Categories */}
        <div className="space-y-6 mb-8">
          {cookieCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {category.name}
                      {category.required && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          Always Active
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {category.description}
                    </CardDescription>
                  </div>
                  <Switch
                    id={category.id}
                    checked={preferences[category.id as keyof CookiePreferences]}
                    onCheckedChange={(checked) =>
                      !category.required &&
                      setPreferences((prev) => ({ ...prev, [category.id]: checked }))
                    }
                    disabled={category.required}
                    aria-label={`Toggle ${category.name}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Examples:</strong> {category.examples.join(", ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex justify-center mb-12">
          <Button size="lg" onClick={handleSave} className="min-w-[200px]">
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>

        {/* Additional Info */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                <strong>Note:</strong> Disabling functional cookies may affect your experience. 
                For example, your theme preference won't be remembered between sessions.
              </p>
              <p>
                For more information about how we use cookies, please see our{" "}
                <Link to="/cookies" className="text-primary hover:underline">
                  Cookie Policy
                </Link>
                . For information about your privacy rights, visit our{" "}
                <Link to="/legal/privacy-rights" className="text-primary hover:underline">
                  Privacy Rights
                </Link>{" "}
                page.
              </p>
              <p>
                You can change these preferences at any time by returning to this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePreferences;
