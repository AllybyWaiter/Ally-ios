import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Agreement to Terms</h2>
            <p className="leading-relaxed">
              By accessing or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Use License</h2>
            <p className="leading-relaxed mb-4">
              Permission is granted to temporarily access our services for personal, non-commercial use only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person or "mirror" on another server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Account Registration</h2>
            <p className="leading-relaxed">
              To access certain features of our services, you may be required to register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. User Content</h2>
            <p className="leading-relaxed">
              Our services may allow you to post, link, store, share, and otherwise make available certain information, text, graphics, or other material. You are responsible for the content that you post and for any consequences thereof. You represent that you own or have the necessary rights to use such content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Prohibited Uses</h2>
            <p className="leading-relaxed mb-4">
              You may not use our services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>In any way that violates any applicable laws or regulations</li>
              <li>To exploit, harm, or attempt to exploit or harm minors</li>
              <li>To transmit any advertising or promotional material</li>
              <li>To impersonate or attempt to impersonate the company or another user</li>
              <li>To engage in any automated use of the system</li>
              <li>To interfere with or circumvent security features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Intellectual Property</h2>
            <p className="leading-relaxed">
              The service and its original content, features, and functionality are and will remain the exclusive property of our company and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Disclaimer</h2>
            <p className="leading-relaxed">
              Our services are provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, and hereby disclaim all warranties including, without limitation, implied warranties of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Limitation of Liability</h2>
            <p className="leading-relaxed">
              In no event shall our company, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the services, whether based on warranty, contract, tort, or any other legal theory.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Termination</h2>
            <p className="leading-relaxed">
              We may terminate or suspend your account and access to our services immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the services will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through our contact form or at the email address provided on our website.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
