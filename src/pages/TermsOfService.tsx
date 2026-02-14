import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Link>
          </Button>
        </div>

        <article className="prose prose-sm dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: February 2026</p>

          <p>
            These Terms of Service ("Terms") govern your access to and use of the Ally mobile application
            and related services (collectively, the "Service") provided by WA.I.TER ("we," "us," or "our").
            By using the Service, you agree to be bound by these Terms.
          </p>

          <h2>Account Registration</h2>
          <p>
            To use certain features of the Service, you must create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Promptly notify us of any unauthorized access</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>

          <h2>Age Requirements</h2>
          <p>
            You must be at least 13 years old to use the Service. If you are under 18, you must have
            parental or guardian consent to use the Service.
          </p>

          <h2>AI-Powered Features</h2>

          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="font-semibold">Important Disclaimer</p>
            <p className="text-sm mb-0">
              Ally provides AI-generated recommendations for water care. These recommendations are
              <strong> informational only</strong> and should not be considered professional advice.
              We make no guarantees about the accuracy, completeness, or reliability of AI-generated content.
            </p>
          </div>

          <p>By using the AI features, you acknowledge that:</p>
          <ul>
            <li>AI recommendations are not a substitute for professional aquarium, pool, or pond care advice</li>
            <li>We are not responsible for any outcomes resulting from following AI suggestions</li>
            <li>We are not liable for the health, injury, or death of any aquatic life</li>
            <li>You should verify important recommendations with qualified professionals</li>
            <li>AI models may occasionally produce inaccurate or inappropriate responses</li>
          </ul>

          <h2>Subscriptions and Billing</h2>

          <h3>Subscription Plans</h3>
          <p>
            Ally offers subscription plans with different features and pricing. By subscribing, you agree to:
          </p>
          <ul>
            <li><strong>Billing:</strong> Monthly or annual billing as selected at purchase</li>
            <li><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal date</li>
            <li><strong>Price Changes:</strong> We will provide 30 days' notice before any price increases</li>
            <li><strong>Upgrades:</strong> Upgrading to a higher tier will be prorated for the remaining billing period</li>
          </ul>

          <h3>Refunds</h3>
          <p>
            Subscription fees are generally non-refundable. Refund requests may be considered on a case-by-case
            basis at our discretion. For refunds on App Store purchases, please contact Apple directly.
          </p>

          <h3>Cancellation</h3>
          <p>
            You may cancel your subscription at any time through the App Store subscription settings.
            Cancellation will take effect at the end of your current billing period.
          </p>

          <h2>Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to the Service or its systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Upload malicious content or code</li>
            <li>Impersonate others or provide false information</li>
            <li>Use the Service to harass, abuse, or harm others</li>
            <li>Reverse engineer or attempt to extract the source code of the Service</li>
            <li>Use automated systems to access the Service without permission</li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by WA.I.TER and
            are protected by international copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You retain ownership of content you submit to the Service (such as photos and aquarium data).
            By submitting content, you grant us a license to use, store, and process that content to
            provide and improve the Service.
          </p>

          <h2>Limitation of Liability</h2>

          <div className="bg-destructive/10 p-4 rounded-lg my-4 border border-destructive/20">
            <p className="font-semibold text-destructive">Liability Cap</p>
            <p className="text-sm mb-0">
              To the maximum extent permitted by law, our total liability for any claims arising from
              your use of the Service is limited to the amount you paid us in the 12 months preceding
              the claim.
            </p>
          </div>

          <p>We are not liable for:</p>
          <ul>
            <li>Indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Harm to or death of aquatic life, regardless of cause</li>
            <li>Damage to property resulting from use of AI recommendations</li>
            <li>Interruptions or errors in the Service</li>
            <li>Actions of third-party services</li>
          </ul>

          <h2>Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>

          <h2>Dispute Resolution</h2>

          <h3>Informal Resolution</h3>
          <p>
            Before filing any formal dispute, you agree to contact us at{' '}
            <a href="mailto:info@allybywaiter.com">info@allybywaiter.com</a> and attempt to resolve
            the dispute informally for at least 30 days.
          </p>

          <h3>Arbitration</h3>
          <p>
            If we cannot resolve the dispute informally, you agree that any dispute arising from these
            Terms or the Service will be resolved through binding arbitration, rather than in court.
          </p>

          <h3>Class Action Waiver</h3>
          <p>
            You agree to resolve disputes with us on an individual basis and waive any right to
            participate in a class action lawsuit or class-wide arbitration.
          </p>

          <h2>Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, United States, without
            regard to its conflict of law provisions.
          </p>

          <h2>Termination</h2>
          <p>
            We may terminate or suspend your access to the Service at any time, with or without cause,
            with or without notice. Upon termination, your right to use the Service will immediately cease.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of material
            changes by posting the new Terms on this page and updating the "Last updated" date.
            Your continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>

          <h2>Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining provisions
            will continue in full force and effect.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:info@allybywaiter.com">info@allybywaiter.com</a>.
          </p>
        </article>
      </div>
    </div>
  );
}
