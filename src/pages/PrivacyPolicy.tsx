import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 7, 2025</p>
        
        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-muted/30 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li><a href="#introduction" className="hover:text-primary transition-colors">Introduction</a></li>
            <li><a href="#beta-testing" className="hover:text-primary transition-colors">Beta Testing Data Collection</a></li>
            <li><a href="#information-collected" className="hover:text-primary transition-colors">Information We Collect</a></li>
            <li><a href="#how-we-use" className="hover:text-primary transition-colors">How We Use Your Information</a></li>
            <li><a href="#ai-machine-learning" className="hover:text-primary transition-colors">AI and Machine Learning</a></li>
            <li><a href="#data-security" className="hover:text-primary transition-colors">Data Security</a></li>
            <li><a href="#data-retention" className="hover:text-primary transition-colors">Data Retention</a></li>
            <li><a href="#third-party" className="hover:text-primary transition-colors">Third Party Services</a></li>
            <li><a href="#international-transfers" className="hover:text-primary transition-colors">International Data Transfers</a></li>
            <li><a href="#your-rights" className="hover:text-primary transition-colors">Your Rights</a></li>
            <li><a href="#children" className="hover:text-primary transition-colors">Children's Privacy</a></li>
            <li><a href="#cookies" className="hover:text-primary transition-colors">Cookies and Tracking</a></li>
            <li><a href="#changes" className="hover:text-primary transition-colors">Changes to This Policy</a></li>
            <li><a href="#contact" className="hover:text-primary transition-colors">Contact Us</a></li>
          </ol>
        </nav>

        <div className="space-y-8 text-foreground/90">
          <section id="introduction">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
            <p className="leading-relaxed">
              Welcome to AquaDex ("we," "our," or "us"). Your privacy is critically important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our aquarium management services. By using AquaDex, you consent to the data practices described in this policy.
            </p>
          </section>

          <section id="beta-testing">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Beta Testing Data Collection</h2>
            <p className="leading-relaxed mb-4">
              As a closed beta service, we collect additional information to improve our platform:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Beta waitlist information: Email addresses and submission timestamps</li>
              <li>Feature usage analytics: How beta users interact with different features</li>
              <li>Error logs and crash reports: Technical data to identify and fix issues</li>
              <li>Feedback and bug reports: User submitted information about service quality</li>
              <li>Performance metrics: System response times and resource usage</li>
            </ul>
          </section>

          <section id="information-collected">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              We may collect information about you in a variety of ways. The information we may collect includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Personal Data:</strong> Name, email address, and other contact information you provide during registration</li>
              <li><strong>Aquarium Data:</strong> Information about your aquariums, including tank specifications, livestock, plants, equipment, and water test results</li>
              <li><strong>Photo and Image Data:</strong> Water test strip photos and aquarium images you upload for AI analysis or record keeping</li>
              <li><strong>Chat and Communication Data:</strong> Messages exchanged with our AI assistant (Ally) and support team</li>
              <li><strong>Usage Data:</strong> Information about how you use our website and services, including pages visited, features used, and time spent</li>
              <li><strong>Device Data:</strong> Information about your device, browser type, operating system, and IP address</li>
            </ul>
          </section>

          <section id="how-we-use">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. How We Use Your Information</h2>
            <p className="leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, operate, and maintain our aquarium management services</li>
              <li>Improve, personalize, and expand our services based on your usage patterns</li>
              <li>Understand and analyze how you use our services to enhance user experience</li>
              <li>Provide AI powered recommendations and insights for your aquarium care</li>
              <li>Communicate with you about updates, offers, and important service notifications</li>
              <li>Process your transactions and manage your subscription</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
            </ul>
          </section>

          <section id="ai-machine-learning">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. AI and Machine Learning</h2>
            <p className="leading-relaxed mb-4">
              Our service uses artificial intelligence and machine learning to provide personalized recommendations and features:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>AI Chat Assistant:</strong> Our AI assistant (Ally) processes your aquarium data and conversation history to provide contextual advice and recommendations</li>
              <li><strong>Photo Analysis:</strong> Water test photos are processed by AI models to automatically read and interpret parameter values</li>
              <li><strong>Maintenance Suggestions:</strong> AI analyzes your aquarium setup, livestock, and history to suggest maintenance tasks</li>
              <li><strong>Memory and Preferences:</strong> For premium users, our AI may remember your preferences and past interactions to provide more personalized assistance</li>
            </ul>
            <p className="leading-relaxed mt-4">
              <strong>Important:</strong> AI generated recommendations are provided for informational purposes only and should not be considered a substitute for professional aquarium care advice. We do not guarantee the accuracy of AI generated content.
            </p>
          </section>

          <section id="data-security">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information, including encryption of data in transit and at rest, secure authentication protocols, and regular security audits. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security. We encourage you to use strong passwords and protect your account credentials.
            </p>
          </section>

          <section id="data-retention">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Data Retention</h2>
            <p className="leading-relaxed mb-4">
              We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Account Data:</strong> Retained while your account is active and for up to 30 days after account deletion to allow for recovery</li>
              <li><strong>Aquarium and Test Data:</strong> Retained for the duration of your account to provide historical tracking and analysis</li>
              <li><strong>Chat History:</strong> Conversation logs are retained for up to 12 months to provide context for AI interactions</li>
              <li><strong>Uploaded Photos:</strong> Images are retained while your account is active and deleted within 30 days of account closure</li>
              <li><strong>Usage Analytics:</strong> Anonymized usage data may be retained indefinitely for service improvement purposes</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Upon account deletion, we will delete or anonymize your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as fraud prevention).
            </p>
          </section>

          <section id="third-party">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Third Party Services</h2>
            <p className="leading-relaxed mb-4">
              We may employ third party companies and services to facilitate our service. These third parties have access to your personal information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Cloud Infrastructure:</strong> Secure hosting and database services</li>
              <li><strong>AI Processing:</strong> Third party AI models for chat, photo analysis, and recommendations</li>
              <li><strong>Error Monitoring:</strong> Services like Sentry to track and resolve technical issues</li>
              <li><strong>Payment Processing:</strong> Secure payment processors for subscription management</li>
              <li><strong>Email Services:</strong> Transactional email delivery for notifications and announcements</li>
            </ul>
          </section>

          <section id="international-transfers">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. International Data Transfers</h2>
            <p className="leading-relaxed">
              Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ from those in your jurisdiction. If you are located outside the United States and choose to provide information to us, please note that we transfer the data to the United States and process it there. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer. We take appropriate measures to ensure your data receives an adequate level of protection wherever it is processed.
            </p>
          </section>

          <section id="your-rights">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Your Rights</h2>
            <p className="leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
              <li><strong>Restriction:</strong> Request limitation of processing of your data</li>
              <li><strong>Portability:</strong> Request transfer of your data in a machine readable format</li>
              <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
              <li><strong>Withdraw Consent:</strong> Withdraw previously given consent at any time</li>
            </ul>
            <p className="leading-relaxed mt-4">
              To exercise any of these rights, please contact us at <a href="mailto:privacy@aquadex.app" className="text-primary hover:underline">privacy@aquadex.app</a>.
            </p>
          </section>

          <section id="children">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Children's Privacy</h2>
            <p className="leading-relaxed">
              Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and become aware that your child has provided us with personal information, please contact us immediately. If we discover that a child under 13 has provided us with personal information, we will delete such information from our servers promptly.
            </p>
          </section>

          <section id="cookies">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Cookies and Tracking</h2>
            <p className="leading-relaxed mb-4">
              We use cookies and similar tracking technologies to track activity on our service and store certain information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Essential Cookies:</strong> Required for basic functionality, authentication, and security</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences (language, theme, units)</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our service</li>
            </ul>
            <p className="leading-relaxed mt-4">
              You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          <section id="changes">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Changes to This Privacy Policy</h2>
            <p className="leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page, updating the "Last updated" date, and sending you an email notification if the changes are significant. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">14. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-none space-y-2 mt-4 ml-4">
              <li><strong>Email:</strong> <a href="mailto:privacy@aquadex.app" className="text-primary hover:underline">privacy@aquadex.app</a></li>
              <li><strong>Support:</strong> Use the in app support chat or contact form</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
