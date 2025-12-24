import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen">
      <SEO 
        title="Cookie Policy"
        description="Learn about how Ally uses cookies and similar technologies to improve your experience. Understand your choices and how to manage cookie preferences."
        path="/cookies"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 24, 2025</p>
        
        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-muted/30 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li><a href="#what-are-cookies" className="hover:text-primary transition-colors">What Are Cookies</a></li>
            <li><a href="#how-we-use" className="hover:text-primary transition-colors">How We Use Cookies</a></li>
            <li><a href="#types" className="hover:text-primary transition-colors">Types of Cookies We Use</a></li>
            <li><a href="#third-party" className="hover:text-primary transition-colors">Third Party Cookies</a></li>
            <li><a href="#your-choices" className="hover:text-primary transition-colors">Your Cookie Choices</a></li>
            <li><a href="#browser-settings" className="hover:text-primary transition-colors">Managing Cookies in Your Browser</a></li>
            <li><a href="#updates" className="hover:text-primary transition-colors">Updates to This Policy</a></li>
            <li><a href="#contact" className="hover:text-primary transition-colors">Contact Us</a></li>
          </ol>
        </nav>

        <div className="space-y-8 text-foreground/90">
          <section id="what-are-cookies">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. What Are Cookies</h2>
            <p className="leading-relaxed">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
            </p>
            <p className="leading-relaxed mt-4">
              We also use similar technologies including localStorage, sessionStorage, and web beacons. localStorage persists data between browser sessions, while sessionStorage clears when you close your browser. Web beacons are small graphic images that help us understand how you interact with our service.
            </p>
          </section>

          <section id="how-we-use">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. How We Use Cookies</h2>
            <p className="leading-relaxed mb-4">
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Authentication:</strong> We use cookies to keep you logged in and maintain your session securely across page visits.</li>
              <li><strong>Preferences:</strong> We store your settings such as theme (light/dark mode), language preference, and unit preferences (metric/imperial).</li>
              <li><strong>Security:</strong> Cookies help protect against cross site request forgery (CSRF) and other security threats.</li>
              <li><strong>Analytics:</strong> We use error tracking to understand and fix issues with the application.</li>
              <li><strong>Performance:</strong> Cookies help us cache data appropriately to improve loading times and reduce server load.</li>
            </ul>
          </section>

          <section id="types">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Types of Cookies We Use</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Essential Cookies</h3>
            <p className="leading-relaxed mb-4">
              These cookies are strictly necessary for the website to function and cannot be switched off. They are usually only set in response to actions you take, such as logging in or filling out forms.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-3 text-left">Cookie Name</th>
                    <th className="border border-border p-3 text-left">Purpose</th>
                    <th className="border border-border p-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3">sb-*-auth-token</td>
                    <td className="border border-border p-3">Authentication session management</td>
                    <td className="border border-border p-3">Session / 1 year</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">sb-*-auth-token-code-verifier</td>
                    <td className="border border-border p-3">OAuth PKCE security verification</td>
                    <td className="border border-border p-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Functional Cookies</h3>
            <p className="leading-relaxed mb-4">
              These cookies enable enhanced functionality and personalization, such as remembering your preferences. If you do not allow these cookies, some or all of these services may not function properly.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-3 text-left">Storage Key</th>
                    <th className="border border-border p-3 text-left">Purpose</th>
                    <th className="border border-border p-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3">theme</td>
                    <td className="border border-border p-3">Stores your light/dark mode preference</td>
                    <td className="border border-border p-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">i18nextLng</td>
                    <td className="border border-border p-3">Stores your language preference</td>
                    <td className="border border-border p-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">cookie-consent</td>
                    <td className="border border-border p-3">Remembers your cookie consent choice</td>
                    <td className="border border-border p-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">ally-chat-*</td>
                    <td className="border border-border p-3">Caches chat conversation data for offline access</td>
                    <td className="border border-border p-3">Persistent</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Analytics Cookies</h3>
            <p className="leading-relaxed mb-4">
              These cookies help us understand how visitors interact with our website by collecting and reporting information. This helps us improve our service.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-3 text-left">Cookie Name</th>
                    <th className="border border-border p-3 text-left">Purpose</th>
                    <th className="border border-border p-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3">sentry-*</td>
                    <td className="border border-border p-3">Error tracking and performance monitoring</td>
                    <td className="border border-border p-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="third-party">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Third Party Cookies</h2>
            <p className="leading-relaxed mb-4">
              In addition to our own cookies, we may also use various third party cookies to report usage statistics and deliver content:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Sentry:</strong> Error monitoring and performance tracking to help us identify and fix issues quickly. 
                <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Privacy Policy</a>
              </li>
              <li>
                <strong>Google AI (Gemini):</strong> Powers our AI chat assistant and water test analysis features. Data is processed according to 
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Google's Privacy Policy</a>
              </li>
              <li>
                <strong>OpenAI:</strong> Alternative AI provider for certain features. 
                <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Privacy Policy</a>
              </li>
            </ul>
          </section>

          <section id="your-choices">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Your Cookie Choices</h2>
            <p className="leading-relaxed mb-4">
              You have several options for managing cookies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Cookie Banner:</strong> When you first visit our site, you can accept or reject non-essential cookies through our cookie consent banner.</li>
              <li><strong>Cookie Preferences:</strong> You can manage your cookie preferences at any time through our Cookie Preferences center.</li>
              <li><strong>Browser Settings:</strong> You can configure your browser to refuse cookies or alert you when cookies are being sent.</li>
            </ul>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link to="/legal/cookie-preferences">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Cookie Preferences
                </Link>
              </Button>
            </div>
            <p className="leading-relaxed mt-4">
              <strong>Note:</strong> If you choose to disable essential cookies, some features of Ally may not function properly, particularly authentication and session management.
            </p>
          </section>

          <section id="browser-settings">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Managing Cookies in Your Browser</h2>
            <p className="leading-relaxed mb-4">
              Most web browsers allow you to control cookies through their settings. Here are links to instructions for popular browsers:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            </ul>
            <p className="leading-relaxed mt-4">
              For mobile devices, please refer to your device manufacturer's instructions for managing cookies.
            </p>
          </section>

          <section id="updates">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Updates to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. For significant changes, we may also display a notice in the app.
            </p>
            <p className="leading-relaxed mt-4">
              We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Contact Us</h2>
            <p className="leading-relaxed mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li><strong>Email:</strong> <a href="mailto:privacy@allybywaiterapp.com" className="text-primary hover:underline">privacy@allybywaiterapp.com</a></li>
              <li><strong>Contact Form:</strong> <Link to="/contact" className="text-primary hover:underline">Contact Page</Link></li>
            </ul>
          </section>

          {/* Legal Notice */}
          <section className="mt-12 p-6 bg-muted/30 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Legal Notice</h2>
            <p className="leading-relaxed text-sm">
              This Cookie Policy complies with the EU General Data Protection Regulation (GDPR), the ePrivacy Directive (Cookie Law), and the California Consumer Privacy Act (CCPA). For users in the European Economic Area, we obtain consent before placing non-essential cookies on your device. For California residents, you have the right to opt out of the "sale" of personal information, though we do not sell personal data collected through cookies.
            </p>
            <p className="leading-relaxed text-sm mt-4">
              For more information about your privacy rights, please see our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link to="/legal/privacy-rights" className="text-primary hover:underline">Your Privacy Rights</Link> page.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
