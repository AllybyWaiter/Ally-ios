import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";

const Accessibility = () => {
  return (
    <div className="min-h-screen">
      <SEO 
        title="Accessibility Statement"
        description="Ally's commitment to digital accessibility. Learn about our WCAG compliance, accessibility features, and how to request accommodations."
        path="/accessibility"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Accessibility Statement</h1>
        {/* [LEGAL REVIEW: Confirm last updated date before publishing] */}
        <p className="text-muted-foreground mb-8">Last updated: December 24, 2025</p>
        
        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-muted/30 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li><a href="#commitment" className="hover:text-primary transition-colors">Our Commitment to Accessibility</a></li>
            <li><a href="#conformance" className="hover:text-primary transition-colors">Conformance Status</a></li>
            <li><a href="#features" className="hover:text-primary transition-colors">Accessibility Features</a></li>
            <li><a href="#technologies" className="hover:text-primary transition-colors">Assistive Technologies Supported</a></li>
            <li><a href="#limitations" className="hover:text-primary transition-colors">Known Limitations</a></li>
            <li><a href="#feedback" className="hover:text-primary transition-colors">Feedback & Assistance</a></li>
          </ol>
        </nav>

        <div className="space-y-8 text-foreground/90">
          <section id="commitment">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Our Commitment to Accessibility</h2>
            {/* [LEGAL REVIEW: Confirm commitment language] */}
            <p className="leading-relaxed">
              Ally by WA.I.TER is committed to ensuring digital accessibility for people with disabilities. 
              We are continually improving the user experience for everyone and applying the relevant 
              accessibility standards.
            </p>
            <p className="leading-relaxed mt-4">
              We believe that everyone should have equal access to information and functionality. 
              Our goal is to make Ally as accessible as possible to users of all abilities.
            </p>
          </section>

          <section id="conformance">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Conformance Status</h2>
            {/* [LEGAL REVIEW: Verify conformance level after full accessibility audit] */}
            <p className="leading-relaxed mb-4">
              The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and 
              developers to improve accessibility for people with disabilities. It defines three levels 
              of conformance: Level A, Level AA, and Level AAA.
            </p>
            <p className="leading-relaxed">
              <strong>Ally by WA.I.TER</strong> is partially conformant with WCAG 2.1 Level AA. 
              Partially conformant means that some parts of the content do not fully conform to the 
              accessibility standard. We are actively working to achieve full conformance.
            </p>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Conformance Details:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li><strong>Standard:</strong> WCAG 2.1</li>
                <li><strong>Target Level:</strong> AA</li>
                <li><strong>Status:</strong> Partially Conformant</li>
              </ul>
            </div>
          </section>

          <section id="features">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Accessibility Features</h2>
            <p className="leading-relaxed mb-4">
              Ally includes the following accessibility features:
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Visual Accessibility</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>High contrast mode support through system preferences</li>
              <li>Dark mode and light mode options for reduced eye strain</li>
              <li>Resizable text up to 200% without loss of functionality</li>
              <li>Color is not used as the sole means of conveying information</li>
              <li>Minimum contrast ratio of 4.5:1 for normal text</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Navigation & Input</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Full keyboard navigation support</li>
              <li>Consistent navigation across all pages</li>
              <li>Clear focus indicators for interactive elements</li>
              <li>No keyboard traps</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Screen Reader Support</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Semantic HTML structure</li>
              <li>ARIA labels and landmarks where appropriate</li>
              <li>Alt text for all meaningful images</li>
              <li>Descriptive link text</li>
              <li>Form labels and error messages</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Content & Media</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Clear and simple language</li>
              <li>Consistent page structure and headings</li>
              <li>No auto-playing media with sound</li>
            </ul>
          </section>

          <section id="technologies">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Assistive Technologies Supported</h2>
            <p className="leading-relaxed mb-4">
              Ally is designed to be compatible with the following assistive technologies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li><strong>Screen Readers:</strong> NVDA, JAWS, VoiceOver (macOS/iOS), TalkBack (Android)</li>
              <li><strong>Voice Control:</strong> Voice Control (macOS/iOS)</li>
              <li><strong>Screen Magnifiers:</strong> ZoomText, Windows Magnifier, macOS Zoom</li>
            </ul>
            <p className="leading-relaxed mt-4 text-muted-foreground">
              <strong>Browser Compatibility:</strong> Chrome, Firefox, Safari, Edge (latest two major versions)
            </p>
          </section>

          <section id="limitations">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Known Limitations</h2>
            {/* [INTERNAL: Update this section as accessibility issues are identified and resolved] */}
            <p className="leading-relaxed mb-4">
              Despite our best efforts to ensure accessibility of Ally, there may be some limitations. 
              We are actively working to identify and address accessibility barriers:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Some complex data visualizations (charts) may have limited screen reader support</li>
              <li>User-uploaded images may lack alt text descriptions</li>
              <li>Some third-party integrations may have their own accessibility limitations</li>
            </ul>
            <p className="leading-relaxed mt-4">
              If you encounter any accessibility barriers not listed above, please contact us so we can 
              address them.
            </p>
          </section>

          <section id="feedback">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Feedback & Assistance</h2>
            <p className="leading-relaxed mb-4">
              We welcome your feedback on the accessibility of Ally. If you encounter accessibility 
              barriers or need assistance, please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4 text-muted-foreground">
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:accessibility@allybywaiterapp.com" className="text-primary hover:underline">
                  accessibility@allybywaiterapp.com
                </a>
              </li>
              <li><strong>Response Time:</strong> We aim to respond to accessibility feedback within 5 business days</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Requesting Accessible Formats</h3>
            <p className="leading-relaxed text-muted-foreground">
              If you need information in an alternative format, please contact us using the information 
              above. We will work with you to provide the information in a suitable format.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Accessibility Assistance</h3>
            <p className="leading-relaxed text-muted-foreground">
              If you need assistance using any part of Ally due to a disability, our support team is 
              available to help. <Link to="/contact" className="text-primary hover:underline">Contact us</Link> and 
              we'll do our best to accommodate your needs.
            </p>
          </section>

          {/* Additional Notice */}
          <section className="mt-12 p-6 bg-muted/30 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Continuous Improvement</h2>
            <p className="leading-relaxed text-muted-foreground">
              We view accessibility as an ongoing effort rather than a one-time task. We regularly 
              review our platform, train our team on accessibility best practices, and incorporate 
              accessibility considerations into our development process.
            </p>
            <p className="leading-relaxed text-muted-foreground mt-4">
              For questions about our privacy practices, please see our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Accessibility;