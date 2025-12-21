import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

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
        <p className="text-muted-foreground mb-8">Last updated: [DATE - TO BE FILLED BY LAWYER]</p>
        
        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-muted/30 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li><a href="#commitment" className="hover:text-primary transition-colors">Our Commitment to Accessibility</a></li>
            <li><a href="#conformance" className="hover:text-primary transition-colors">Conformance Status</a></li>
            <li><a href="#features" className="hover:text-primary transition-colors">Accessibility Features</a></li>
            <li><a href="#technologies" className="hover:text-primary transition-colors">Assistive Technologies Supported</a></li>
            <li><a href="#limitations" className="hover:text-primary transition-colors">Known Limitations</a></li>
            <li><a href="#testing" className="hover:text-primary transition-colors">Testing & Evaluation</a></li>
            <li><a href="#feedback" className="hover:text-primary transition-colors">Feedback & Assistance</a></li>
            <li><a href="#enforcement" className="hover:text-primary transition-colors">Enforcement Procedure</a></li>
          </ol>
        </nav>

        <div className="space-y-8 text-foreground/90">
          <section id="commitment">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Our Commitment to Accessibility</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Insert lawyer-approved commitment statement here.
              </p>
            </div>
            <p className="leading-relaxed">
              [COMPANY NAME] is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
            </p>
            <p className="leading-relaxed mt-4">
              [ADD: Specific commitment language, company values regarding inclusion, any certifications or pledges made]
            </p>
          </section>

          <section id="conformance">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Conformance Status</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Specify WCAG conformance level (A, AA, or AAA) after legal review.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.
            </p>
            <p className="leading-relaxed">
              <strong>Ally by WA.I.TER</strong> is [CONFORMANCE STATUS - e.g., "partially conformant" / "fully conformant"] with WCAG 2.1 Level [AA/A/AAA]. [CONFORMANCE STATUS] means that [EXPLANATION OF WHAT THIS MEANS].
            </p>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Conformance Details:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Standard:</strong> [WCAG 2.1 / WCAG 2.2]</li>
                <li><strong>Level:</strong> [A / AA / AAA]</li>
                <li><strong>Status:</strong> [Fully Conformant / Partially Conformant / Non-Conformant]</li>
                <li><strong>Date of Assessment:</strong> [DATE]</li>
                <li><strong>Assessed By:</strong> [Internal Team / Third-Party Auditor Name]</li>
              </ul>
            </div>
          </section>

          <section id="features">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Accessibility Features</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Review and confirm each feature with legal/development team.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              Ally includes the following accessibility features:
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Visual Accessibility</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>[CONFIRM] High contrast mode support through system preferences</li>
              <li>[CONFIRM] Dark mode/light mode toggle for reduced eye strain</li>
              <li>[CONFIRM] Resizable text up to 200% without loss of functionality</li>
              <li>[CONFIRM] Color is not used as the sole means of conveying information</li>
              <li>[CONFIRM] Minimum contrast ratio of 4.5:1 for normal text</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Navigation & Input</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>[CONFIRM] Full keyboard navigation support</li>
              <li>[CONFIRM] Skip navigation links</li>
              <li>[CONFIRM] Consistent navigation across all pages</li>
              <li>[CONFIRM] Clear focus indicators</li>
              <li>[CONFIRM] No keyboard traps</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Screen Reader Support</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>[CONFIRM] Semantic HTML structure</li>
              <li>[CONFIRM] ARIA labels and landmarks</li>
              <li>[CONFIRM] Alt text for all meaningful images</li>
              <li>[CONFIRM] Descriptive link text</li>
              <li>[CONFIRM] Form labels and error messages</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Content & Media</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>[CONFIRM] Clear and simple language</li>
              <li>[CONFIRM] Consistent page structure and headings</li>
              <li>[CONFIRM] Captions/transcripts for video content (if applicable)</li>
              <li>[CONFIRM] No auto-playing media with sound</li>
            </ul>
          </section>

          <section id="technologies">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Assistive Technologies Supported</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Verify compatibility through testing before finalizing.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              Ally is designed to be compatible with the following assistive technologies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Screen Readers:</strong> [VERIFY: NVDA, JAWS, VoiceOver (macOS/iOS), TalkBack (Android)]</li>
              <li><strong>Voice Control:</strong> [VERIFY: Dragon NaturallySpeaking, Voice Control (macOS/iOS)]</li>
              <li><strong>Screen Magnifiers:</strong> [VERIFY: ZoomText, Windows Magnifier, macOS Zoom]</li>
              <li><strong>Switch Access:</strong> [VERIFY: iOS Switch Control, Android Switch Access]</li>
            </ul>
            <p className="leading-relaxed mt-4">
              <strong>Browser Compatibility:</strong> [LIST SUPPORTED BROWSERS AND VERSIONS]
            </p>
          </section>

          <section id="limitations">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Known Limitations</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Document all known accessibility issues and remediation timeline.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              Despite our best efforts to ensure accessibility of Ally, there may be some limitations. Below is a description of known limitations and potential solutions:
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border mt-4">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-3 text-left">Feature/Content</th>
                    <th className="border border-border p-3 text-left">Limitation</th>
                    <th className="border border-border p-3 text-left">Alternative</th>
                    <th className="border border-border p-3 text-left">Target Fix Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3">[FEATURE 1]</td>
                    <td className="border border-border p-3">[DESCRIBE LIMITATION]</td>
                    <td className="border border-border p-3">[WORKAROUND]</td>
                    <td className="border border-border p-3">[DATE]</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">[FEATURE 2]</td>
                    <td className="border border-border p-3">[DESCRIBE LIMITATION]</td>
                    <td className="border border-border p-3">[WORKAROUND]</td>
                    <td className="border border-border p-3">[DATE]</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">[ADD MORE ROWS AS NEEDED]</td>
                    <td className="border border-border p-3">—</td>
                    <td className="border border-border p-3">—</td>
                    <td className="border border-border p-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="leading-relaxed mt-4">
              <strong>Third-Party Content:</strong> [ADD: Disclaimer about third-party content, embedded widgets, or user-generated content that may not meet accessibility standards]
            </p>
          </section>

          <section id="testing">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Testing & Evaluation</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Add details about testing methodology and frequency.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              We assess the accessibility of Ally through the following methods:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Self-Evaluation:</strong> [DESCRIBE: Internal testing procedures, tools used (e.g., axe, WAVE, Lighthouse)]</li>
              <li><strong>External Audit:</strong> [IF APPLICABLE: Third-party accessibility audit by [AUDITOR NAME] on [DATE]]</li>
              <li><strong>User Testing:</strong> [IF APPLICABLE: Testing with users who have disabilities]</li>
              <li><strong>Automated Testing:</strong> [DESCRIBE: CI/CD accessibility checks, automated scanning frequency]</li>
            </ul>
            <p className="leading-relaxed mt-4">
              <strong>Last Full Assessment:</strong> [DATE]<br />
              <strong>Next Scheduled Review:</strong> [DATE]
            </p>
          </section>

          <section id="feedback">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Feedback & Assistance</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Add official contact details and response time commitments.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              We welcome your feedback on the accessibility of Ally. If you encounter accessibility barriers or need assistance, please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li><strong>Email:</strong> <a href="mailto:accessibility@allybywaiter.com" className="text-primary hover:underline">[ACCESSIBILITY EMAIL - e.g., accessibility@allybywaiter.com]</a></li>
              <li><strong>Phone:</strong> [PHONE NUMBER WITH ACCESSIBILITY NOTE - e.g., "TTY users can reach us via relay service"]</li>
              <li><strong>Mailing Address:</strong> [PHYSICAL ADDRESS]</li>
              <li><strong>Response Time:</strong> We aim to respond to accessibility feedback within [X] business days</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Requesting Accessible Formats</h3>
            <p className="leading-relaxed">
              If you need information in an alternative format (e.g., large print, Braille, audio), please contact us using the information above. We will work with you to provide the information in a suitable format.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Accessibility Assistance</h3>
            <p className="leading-relaxed">
              If you need assistance using any part of Ally due to a disability, our support team is available to help. [ADD: Specific assistance offered, such as guided walkthroughs, alternative methods to complete tasks, etc.]
            </p>
          </section>

          <section id="enforcement">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Enforcement Procedure</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Legal review required for jurisdiction-specific enforcement language.
              </p>
            </div>
            <p className="leading-relaxed mb-4">
              [FOR US-BASED COMPANIES - ADD ADA REFERENCE]<br />
              This statement applies to websites and applications operated by [COMPANY NAME]. If you believe your accessibility rights have been violated, you may file a complaint with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>[RELEVANT REGULATORY BODY - e.g., U.S. Department of Justice, local civil rights office]</li>
              <li>[ANY APPLICABLE STATE AGENCIES]</li>
            </ul>

            <p className="leading-relaxed mt-4">
              [FOR EU-BASED OR GDPR-APPLICABLE - ADD]:
              In accordance with the European Accessibility Act and Web Accessibility Directive, you may also contact [RELEVANT EU BODY].
            </p>

            <p className="leading-relaxed mt-4">
              <strong>Before escalating:</strong> We encourage you to contact us first at [EMAIL] so we can attempt to resolve any issues directly.
            </p>
          </section>

          {/* Additional Legal Notice */}
          <section className="mt-12 p-6 bg-muted/30 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Legal Notice</h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Have your lawyer add any necessary legal disclaimers here.
              </p>
            </div>
            <p className="leading-relaxed text-sm">
              [ADD: Any legal disclaimers, limitation of liability statements, or jurisdiction-specific legal language as advised by legal counsel]
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Accessibility;
