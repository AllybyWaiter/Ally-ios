import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 7, 2025</p>
        
        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-muted/30 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li><a href="#agreement" className="hover:text-primary transition-colors">Agreement to Terms</a></li>
            <li><a href="#license" className="hover:text-primary transition-colors">Use License</a></li>
            <li><a href="#beta" className="hover:text-primary transition-colors">Beta Program Terms</a></li>
            <li><a href="#registration" className="hover:text-primary transition-colors">Account Registration</a></li>
            <li><a href="#subscriptions" className="hover:text-primary transition-colors">Subscriptions and Payments</a></li>
            <li><a href="#user-content" className="hover:text-primary transition-colors">User Content</a></li>
            <li><a href="#ai-content" className="hover:text-primary transition-colors">AI Generated Content</a></li>
            <li><a href="#prohibited" className="hover:text-primary transition-colors">Prohibited Uses</a></li>
            <li><a href="#ip" className="hover:text-primary transition-colors">Intellectual Property</a></li>
            <li><a href="#disclaimer" className="hover:text-primary transition-colors">Disclaimer</a></li>
            <li><a href="#liability" className="hover:text-primary transition-colors">Limitation of Liability</a></li>
            <li><a href="#indemnification" className="hover:text-primary transition-colors">Indemnification</a></li>
            <li><a href="#suspension" className="hover:text-primary transition-colors">Account Suspension and Termination</a></li>
            <li><a href="#disputes" className="hover:text-primary transition-colors">Dispute Resolution</a></li>
            <li><a href="#governing-law" className="hover:text-primary transition-colors">Governing Law</a></li>
            <li><a href="#changes" className="hover:text-primary transition-colors">Changes to Terms</a></li>
            <li><a href="#contact" className="hover:text-primary transition-colors">Contact Us</a></li>
          </ol>
        </nav>

        <div className="space-y-8 text-foreground/90">
          <section id="agreement">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Agreement to Terms</h2>
            <p className="leading-relaxed">
              By accessing or using Ally ("the Service"), you agree to be bound by these Terms of Service ("Terms") and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing the Service. These Terms constitute a legally binding agreement between you and WA.I.TER.
            </p>
          </section>

          <section id="license">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Use License</h2>
            <p className="leading-relaxed mb-4">
              Permission is granted to access and use the Service for personal, non-commercial aquarium management purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify, copy, or create derivative works based on the Service</li>
              <li>Use the Service for any commercial purpose or resale</li>
              <li>Attempt to decompile, reverse engineer, or extract source code</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer access to another person or organization</li>
              <li>Use automated tools (bots, scrapers) to access the Service</li>
            </ul>
          </section>

          <section id="beta">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Beta Program Terms</h2>
            <p className="leading-relaxed mb-4">
              The Service is currently in a closed beta testing phase. By participating in the beta program, you acknowledge and agree to the following:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Beta access is by invitation only and may be granted or revoked at any time at our sole discretion</li>
              <li>The Service may contain bugs, errors, or other issues that could cause system failures or data loss</li>
              <li>Features and functionality are subject to change without notice during the beta period</li>
              <li>The Service is provided "as is" for testing and evaluation purposes only</li>
              <li>We may collect feedback, usage data, and error reports to improve the Service</li>
              <li>Beta access does not guarantee future access to the Service upon official launch</li>
              <li>You agree not to disclose confidential information about unreleased features without permission</li>
              <li>Subscription pricing may change upon official launch</li>
            </ul>
          </section>

          <section id="registration">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Account Registration</h2>
            <p className="leading-relaxed mb-4">
              To access the Service, you must register for an account. By registering, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Update your information to keep it accurate and complete</li>
              <li>Maintain the security and confidentiality of your account credentials</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="leading-relaxed mt-4">
              You must be at least 13 years of age to create an account. If you are under 18, you must have parental or guardian consent to use the Service.
            </p>
          </section>

          <section id="subscriptions">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Subscriptions and Payments</h2>
            <p className="leading-relaxed mb-4">
              The Service offers various subscription tiers with different features and limits:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Billing:</strong> Subscriptions are billed on a recurring monthly or annual basis depending on the plan selected</li>
              <li><strong>Automatic Renewal:</strong> Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date</li>
              <li><strong>Price Changes:</strong> We may change subscription prices with 30 days notice. Price changes will apply at your next renewal</li>
              <li><strong>Upgrades:</strong> Plan upgrades take effect immediately with prorated billing</li>
              <li><strong>Downgrades:</strong> Plan downgrades take effect at the next billing cycle</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period</li>
              <li><strong>Refunds:</strong> Subscriptions are generally non refundable. We may offer refunds at our discretion for technical issues or billing errors</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Feature limits (such as number of aquariums or monthly water test logs) are enforced based on your subscription tier. Exceeding limits may require an upgrade.
            </p>
          </section>

          <section id="user-content">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. User Content</h2>
            <p className="leading-relaxed mb-4">
              The Service allows you to upload, store, and share information including aquarium data, photos, notes, and communications. Regarding your content:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You retain ownership of content you create and upload</li>
              <li>You grant us a license to use, store, and process your content to provide the Service</li>
              <li>You represent that you have the rights to any content you upload</li>
              <li>You are responsible for the accuracy and legality of your content</li>
              <li>We may remove content that violates these Terms or applicable law</li>
            </ul>
          </section>

          <section id="ai-content">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. AI Generated Content</h2>
            <p className="leading-relaxed mb-4">
              The Service includes AI powered features including our chat assistant (Ally), water test photo analysis, and maintenance recommendations. Regarding AI generated content:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Informational Only:</strong> AI recommendations are provided for informational purposes only and should not be considered professional aquarium care advice</li>
              <li><strong>No Guarantees:</strong> We do not guarantee the accuracy, completeness, or reliability of AI generated content</li>
              <li><strong>Not a Substitute:</strong> AI suggestions are not a substitute for your own judgment, research, or consultation with qualified professionals</li>
              <li><strong>No Liability:</strong> We are not liable for any outcomes resulting from following AI generated recommendations</li>
              <li><strong>Continuous Improvement:</strong> AI models and recommendations may change over time as we improve the Service</li>
            </ul>
            <p className="leading-relaxed mt-4">
              <strong>Disclaimer:</strong> Aquarium care involves living organisms with complex needs. Always verify AI suggestions against reputable sources and consult with experienced aquarists or veterinarians for health related concerns. Ally is not responsible for the health or wellbeing of your aquatic life.
            </p>
          </section>

          <section id="prohibited">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Prohibited Uses</h2>
            <p className="leading-relaxed mb-4">
              You may not use the Service:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>In any way that violates any applicable laws or regulations</li>
              <li>To exploit, harm, or attempt to exploit or harm minors</li>
              <li>To transmit any advertising, promotional material, or spam</li>
              <li>To impersonate or attempt to impersonate Ally, WA.I.TER, employees, or other users</li>
              <li>To engage in any automated use of the system or circumvent rate limits</li>
              <li>To interfere with or circumvent security features</li>
              <li>To upload malicious code, viruses, or harmful data</li>
              <li>To harass, abuse, or harm other users</li>
              <li>To collect or harvest user information without consent</li>
            </ul>
          </section>

          <section id="ip">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Intellectual Property</h2>
            <p className="leading-relaxed">
              The Service and its original content, features, and functionality (excluding user content) are and will remain the exclusive property of WA.I.TER and its licensors. This includes our trademarks, logos, design, code, and documentation. You may not use our intellectual property without prior written consent. The Service is protected by copyright, trademark, and other laws.
            </p>
          </section>

          <section id="disclaimer">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Disclaimer</h2>
            <p className="leading-relaxed">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR FREE, OR THAT DEFECTS WILL BE CORRECTED. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.
            </p>
          </section>

          <section id="liability">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Limitation of Liability</h2>
            <p className="leading-relaxed">
              IN NO EVENT SHALL WA.I.TER, ITS DIRECTORS, EMPLOYEES, PARTNERS, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF PROFITS, HARM TO AQUATIC LIFE, OR PROPERTY DAMAGE, WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section id="indemnification">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Indemnification</h2>
            <p className="leading-relaxed">
              You agree to indemnify, defend, and hold harmless WA.I.TER and its officers, directors, employees, agents, and affiliates from and against any claims, damages, obligations, losses, liabilities, costs, or expenses (including attorney's fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third party rights; or (d) your user content. We reserve the right to assume exclusive defense and control of any matter subject to indemnification by you.
            </p>
          </section>

          <section id="suspension">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Account Suspension and Termination</h2>
            <p className="leading-relaxed mb-4">
              We may suspend or terminate your account and access to the Service:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Temporary Suspension:</strong> For investigation of potential Terms violations. You will be notified of the reason and duration when possible</li>
              <li><strong>Permanent Ban:</strong> For serious or repeated violations of these Terms</li>
              <li><strong>Immediate Termination:</strong> For illegal activity, fraud, or actions that harm other users or the Service</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Upon termination, your right to use the Service ceases immediately. We may delete your data in accordance with our Privacy Policy. You may request your data before account deletion by contacting support.
            </p>
          </section>

          <section id="disputes">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">14. Dispute Resolution</h2>
            <p className="leading-relaxed mb-4">
              In the event of a dispute arising from these Terms or your use of the Service:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Informal Resolution:</strong> You agree to first attempt to resolve any dispute informally by contacting us at <a href="mailto:info@allybywaiter.com" className="text-primary hover:underline">info@allybywaiter.com</a></li>
              <li><strong>Good Faith Negotiation:</strong> Both parties agree to negotiate in good faith for at least 30 days before pursuing formal legal action</li>
              <li><strong>Arbitration:</strong> If informal resolution fails, disputes shall be resolved through binding arbitration in accordance with applicable arbitration rules</li>
              <li><strong>Class Action Waiver:</strong> You agree to resolve disputes on an individual basis and waive the right to participate in class action lawsuits</li>
            </ul>
          </section>

          <section id="governing-law">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">15. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will remain in effect.
            </p>
          </section>

          <section id="changes">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">16. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these Terms at any time. If a revision is material, we will provide at least 30 days notice before the new terms take effect. Notice may be provided via email, in app notification, or by posting the updated Terms on this page. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms. If you do not agree to the new Terms, you must stop using the Service.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">17. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none space-y-2 mt-4 ml-4">
              <li><strong>Email:</strong> <a href="mailto:info@allybywaiter.com" className="text-primary hover:underline">info@allybywaiter.com</a></li>
              <li><strong>Support:</strong> Use the in app support chat or contact form</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
