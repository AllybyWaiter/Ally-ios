import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

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
        <p className="text-muted-foreground mb-8">Last updated: [DATE - TO BE FILLED BY LAWYER]</p>
        
        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-muted/30 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li><a href="#what-are-cookies" className="hover:text-primary transition-colors">What Are Cookies</a></li>
            <li><a href="#how-we-use" className="hover:text-primary transition-colors">How We Use Cookies</a></li>
            <li><a href="#types" className="hover:text-primary transition-colors">Types of Cookies We Use</a></li>
            <li><a href="#third-party" className="hover:text-primary transition-colors">Third-Party Cookies</a></li>
            <li><a href="#your-choices" className="hover:text-primary transition-colors">Your Cookie Choices</a></li>
            <li><a href="#browser-settings" className="hover:text-primary transition-colors">Managing Cookies in Your Browser</a></li>
            <li><a href="#updates" className="hover:text-primary transition-colors">Updates to This Policy</a></li>
            <li><a href="#contact" className="hover:text-primary transition-colors">Contact Us</a></li>
          </ol>
        </nav>

        <div className="space-y-8 text-foreground/90">
          <section id="what-are-cookies">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. What Are Cookies</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Have lawyer review and approve cookie definition language.
              </p>
            </div>
            <p className="leading-relaxed">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
            </p>
            <p className="leading-relaxed mt-4">
              [ADD: Explanation of similar technologies used - local storage, session storage, pixels, beacons, etc.]
            </p>
          </section>

          <section id="how-we-use">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. How We Use Cookies</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> List specific purposes after technical/legal review.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Authentication:</strong> [DESCRIBE: How cookies maintain logged-in state]</li>
              <li><strong>Preferences:</strong> [DESCRIBE: Remembering user settings like theme, language]</li>
              <li><strong>Security:</strong> [DESCRIBE: CSRF protection, fraud prevention]</li>
              <li><strong>Analytics:</strong> [DESCRIBE: Understanding how users interact with the app]</li>
              <li><strong>Performance:</strong> [DESCRIBE: Improving loading times, user experience]</li>
            </ul>
          </section>

          <section id="types">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Types of Cookies We Use</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Complete cookie audit and categorization required.
              </p>
            </div>

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
                    <td className="border border-border p-3">[COOKIE_NAME]</td>
                    <td className="border border-border p-3">[PURPOSE]</td>
                    <td className="border border-border p-3">[DURATION - e.g., Session, 1 year]</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">[ADD MORE ROWS]</td>
                    <td className="border border-border p-3">—</td>
                    <td className="border border-border p-3">—</td>
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
                    <th className="border border-border p-3 text-left">Cookie Name</th>
                    <th className="border border-border p-3 text-left">Purpose</th>
                    <th className="border border-border p-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3">[COOKIE_NAME]</td>
                    <td className="border border-border p-3">[PURPOSE]</td>
                    <td className="border border-border p-3">[DURATION]</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Analytics Cookies</h3>
            <p className="leading-relaxed mb-4">
              These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our service.
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
                    <td className="border border-border p-3">[COOKIE_NAME]</td>
                    <td className="border border-border p-3">[PURPOSE]</td>
                    <td className="border border-border p-3">[DURATION]</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="third-party">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Third-Party Cookies</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> List all third-party services that set cookies.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics and deliver content:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>[SERVICE NAME - e.g., Google Analytics]:</strong> [PURPOSE AND LINK TO THEIR PRIVACY POLICY]</li>
              <li><strong>[SERVICE NAME - e.g., Sentry]:</strong> [PURPOSE AND LINK TO THEIR PRIVACY POLICY]</li>
              <li><strong>[ADD MORE AS APPLICABLE]</strong></li>
            </ul>
          </section>

          <section id="your-choices">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Your Cookie Choices</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Confirm opt-out mechanisms are implemented.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              You have several options for managing cookies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Cookie Banner:</strong> When you first visit our site, you can accept or reject non-essential cookies through our cookie consent banner.</li>
              <li><strong>Cookie Settings:</strong> [IF APPLICABLE: Link to cookie preference center]</li>
              <li><strong>Browser Settings:</strong> You can configure your browser to refuse cookies or alert you when cookies are being sent.</li>
              <li><strong>Opt-Out Links:</strong> [LIST ANY SPECIFIC OPT-OUT LINKS FOR ANALYTICS PROVIDERS]</li>
            </ul>
            <p className="leading-relaxed mt-4">
              <strong>Note:</strong> If you choose to disable cookies, some features of Ally may not function properly.
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
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Add notification mechanism details.
              </p>
            </div>
            <p className="leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by [NOTIFICATION METHOD - e.g., posting the new policy on this page, sending an email, displaying a notice in the app].
            </p>
            <p className="leading-relaxed mt-4">
              We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Contact Us</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Add official contact details.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li><strong>Email:</strong> <a href="mailto:privacy@allybywaiter.com" className="text-primary hover:underline">[PRIVACY EMAIL]</a></li>
              <li><strong>Mailing Address:</strong> [PHYSICAL ADDRESS]</li>
            </ul>
          </section>

          {/* Legal Notice */}
          <section className="mt-12 p-6 bg-muted/30 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Legal Notice</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Have your lawyer add any necessary legal disclaimers here.
              </p>
            </div>
            <p className="leading-relaxed text-sm">
              [ADD: Any jurisdiction-specific requirements, GDPR/CCPA references, or other legal language as advised by legal counsel]
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
