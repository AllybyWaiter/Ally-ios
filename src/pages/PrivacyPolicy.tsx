import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: February 2026</p>

          <p>
            This Privacy Policy describes how WA.I.TER ("we," "us," or "our") collects, uses, and shares
            information about you when you use the Ally mobile application and related services (collectively, the "Service").
          </p>

          <h2>Information We Collect</h2>

          <h3>Personal Information</h3>
          <ul>
            <li><strong>Account Information:</strong> Name and email address when you create an account</li>
            <li><strong>Aquarium/Water Data:</strong> Information about your aquariums, pools, ponds, or other water bodies including water test results, equipment, and maintenance logs</li>
            <li><strong>Photos:</strong> Images you upload for AI analysis (water tests, aquariums, livestock)</li>
            <li><strong>Chat History:</strong> Conversations with Ally, our AI assistant</li>
            <li><strong>Location Data:</strong> Approximate location for weather-based recommendations (only when you enable this feature)</li>
          </ul>

          <h3>Usage Information</h3>
          <ul>
            <li>Device information (device type, operating system)</li>
            <li>App usage analytics and feature interactions</li>
            <li>Error logs and crash reports</li>
            <li>Performance metrics</li>
          </ul>

          <h2>How We Use Your Information</h2>

          <h3>AI-Powered Features</h3>
          <p>Ally uses your data to provide personalized recommendations:</p>
          <ul>
            <li>Your aquarium data and chat history are processed to generate water care recommendations</li>
            <li>Photos are analyzed by AI models to identify water test results and provide insights</li>
            <li>Premium users benefit from Ally's memory feature, which remembers your setup and preferences for more personalized advice</li>
          </ul>

          <div className="bg-muted p-4 rounded-lg my-4">
            <p className="font-semibold">Important Disclaimer</p>
            <p className="text-sm mb-0">
              AI recommendations provided by Ally are informational only and not a substitute for professional
              aquarium, pool, or pond care advice. We are not responsible for the health of aquatic life or
              water quality outcomes based on AI suggestions.
            </p>
          </div>

          <h3>Other Uses</h3>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Send you notifications about your water care schedule</li>
            <li>Respond to your support requests</li>
            <li>Monitor and analyze usage trends</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>

          <h2>Data Retention</h2>
          <ul>
            <li><strong>Account Data:</strong> Retained while your account is active, plus 30 days after deletion</li>
            <li><strong>Chat History:</strong> Retained for up to 12 months</li>
            <li><strong>Photos:</strong> Deleted within 30 days of account closure</li>
            <li><strong>Anonymized Analytics:</strong> May be retained indefinitely</li>
          </ul>

          <h2>Third-Party Services</h2>
          <p>We share data with the following types of service providers:</p>
          <ul>
            <li><strong>Cloud Infrastructure:</strong> For hosting and data storage</li>
            <li><strong>AI Processing:</strong> Third-party AI models for photo analysis and recommendations</li>
            <li><strong>Error Monitoring:</strong> Sentry for crash reporting and performance monitoring</li>
            <li><strong>Payment Processing:</strong> For subscription billing</li>
            <li><strong>Email Services:</strong> For transactional emails and notifications</li>
          </ul>

          <h2>Your Rights</h2>

          <h3>All Users</h3>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Export your data</li>
            <li>Opt out of marketing communications</li>
          </ul>

          <h3>California Residents (CCPA/CPRA)</h3>
          <p>
            We do not sell your personal information. We do not share your personal information for
            cross-context behavioral advertising purposes.
          </p>
          <p>California residents have additional rights including:</p>
          <ul>
            <li>Right to know what personal information is collected</li>
            <li>Right to delete personal information</li>
            <li>Right to correct inaccurate personal information</li>
            <li>Right to opt out of sale/sharing (not applicable as we don't sell data)</li>
            <li>Right to non-discrimination for exercising privacy rights</li>
          </ul>

          <h3>European Users (GDPR)</h3>
          <p>If you are in the European Economic Area, you have additional rights under GDPR including data portability and the right to lodge a complaint with a supervisory authority.</p>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            The Service is not intended for children under 13. We do not knowingly collect personal information
            from children under 13. If you believe we have collected information from a child under 13, please
            contact us immediately.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by
            posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>Contact Us</h2>
          <p>For questions about this Privacy Policy:</p>
          <ul>
            <li>General inquiries: <a href="mailto:info@allybywaiter.com">info@allybywaiter.com</a></li>
            <li>Privacy requests: <a href="mailto:privacy@allybywaiter.com">privacy@allybywaiter.com</a></li>
          </ul>
        </article>
      </div>
    </div>
  );
}
