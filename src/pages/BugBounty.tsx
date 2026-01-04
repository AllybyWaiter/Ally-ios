import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { 
  Shield, 
  Award, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Clock, 
  FileText, 
  AlertTriangle,
  Target,
  BookOpen,
  Users,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const BugBounty = () => {
  const inScopeItems = [
    "Authentication and authorization vulnerabilities",
    "Cross-site scripting (XSS)",
    "SQL injection and NoSQL injection",
    "Remote code execution (RCE)",
    "Server-side request forgery (SSRF)",
    "Insecure direct object references (IDOR)",
    "Sensitive data exposure",
    "API security vulnerabilities",
    "Privilege escalation",
    "Business logic flaws with security impact",
  ];

  const outOfScopeItems = [
    "Social engineering or phishing attacks",
    "Denial of service (DoS/DDoS) attacks",
    "Physical security issues",
    "Vulnerabilities in third-party services",
    "Self-XSS (requiring user interaction on own session)",
    "Rate limiting issues without security impact",
    "Missing security headers (informational only)",
    "Outdated software without demonstrable exploit",
    "Clickjacking on non-sensitive pages",
    "Username/email enumeration",
  ];

  const rewardTiers = [
    {
      severity: "Critical",
      range: "$500 – $2,000",
      examples: "Remote code execution, authentication bypass, complete data breach",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      severity: "High",
      range: "$250 – $500",
      examples: "Data exposure, IDOR affecting multiple users, privilege escalation",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      severity: "Medium",
      range: "$50 – $250",
      examples: "Stored XSS, CSRF on sensitive actions, information disclosure",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      severity: "Low",
      range: "Recognition",
      examples: "Reflected XSS, minor information leaks, best practice improvements",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  const submissionSteps = [
    {
      step: 1,
      title: "Discover",
      description: "Find a vulnerability in our applications within scope",
    },
    {
      step: 2,
      title: "Document",
      description: "Create a detailed report with steps to reproduce and impact assessment",
    },
    {
      step: 3,
      title: "Report",
      description: "Email your findings to security@allybywaiterapp.com",
    },
    {
      step: 4,
      title: "Collaborate",
      description: "Work with our team to verify and address the issue",
    },
    {
      step: 5,
      title: "Reward",
      description: "Receive recognition and reward after the fix is deployed",
    },
  ];

  const rules = [
    "Do not access, modify, or delete data belonging to other users",
    "Do not perform actions that could disrupt service availability",
    "Report vulnerabilities promptly and do not publicly disclose before a fix is deployed",
    "Submit one vulnerability per report for clarity",
    "Provide clear, detailed reproduction steps",
    "Only test against accounts you own or have explicit permission to use",
    "Do not use automated scanners that generate excessive traffic",
    "Allow reasonable time for our team to investigate and fix issues",
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Bug Bounty Program"
        description="Join Ally's Security Research Program. Report vulnerabilities responsibly and earn rewards for helping keep our platform secure."
        path="/security/bug-bounty"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Security Research Program
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            We value the security community's efforts in keeping Ally safe. 
            Report vulnerabilities responsibly and earn rewards for your contributions.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span><strong>48 hour</strong> response time</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span><strong>Safe harbor</strong> guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-5 w-5 text-primary" />
              <span><strong>Up to $2,000</strong> rewards</span>
            </div>
          </div>
        </div>

        {/* Program Overview */}
        <section className="mb-16">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                Program Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Ally's Security Research Program rewards security researchers who help us identify 
                and fix vulnerabilities in our platform. We believe in working collaboratively with 
                the security community to maintain the highest level of protection for our users.
              </p>
              <p className="text-muted-foreground">
                This program is open to all security researchers who agree to follow our responsible 
                disclosure guidelines. Both individual researchers and organized security teams are 
                welcome to participate.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Scope Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Scope</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  In Scope
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {inScopeItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Out of Scope
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {outOfScopeItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Rules of Engagement */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Rules of Engagement</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                Guidelines for Researchers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-4">
                {rules.map((rule, ruleIndex) => (
                  <li key={`rule-${ruleIndex}`} className="flex items-start gap-3 text-muted-foreground">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      {ruleIndex + 1}
                    </span>
                    <span className="text-sm">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Rewards Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Rewards</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {rewardTiers.map((tier) => (
              <Card key={tier.severity} className={`${tier.bgColor} border-0`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-lg ${tier.color}`}>{tier.severity}</CardTitle>
                    <span className={`text-lg font-bold ${tier.color}`}>{tier.range}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tier.examples}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-6 text-center">
            Reward amounts are determined based on severity, impact, exploitability, and report quality. 
            Final reward decisions are at Ally's discretion.
          </p>
        </section>

        {/* Submission Process */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Submission Process</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />
            <div className="space-y-6">
              {submissionSteps.map((item) => (
                <div key={`step-${item.step}`} className="flex gap-6">
                  <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-xl shrink-0">
                    {item.step}
                  </div>
                  <Card className="flex-1">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Report Contents */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">What to Include in Your Report</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                Report Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">Required Information</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Clear description of the vulnerability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Step-by-step reproduction instructions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Impact assessment and potential risks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Affected URLs, endpoints, or components</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">Helpful Additions</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Proof-of-concept code or screenshots</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Video demonstration (if applicable)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Suggested remediation steps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Your contact information for follow-up</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Safe Harbor */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Safe Harbor</h2>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                Our Commitment to Researchers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We are committed to working with security researchers in good faith. If you comply 
                with our responsible disclosure guidelines:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>We will not pursue legal action against you</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>We will work with you to understand and resolve the issue quickly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>We will recognize your contribution (with your permission)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>We will keep you informed throughout the remediation process</span>
                </li>
              </ul>
              <div className="pt-4 border-t border-green-500/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> Safe harbor protection requires 
                  good-faith testing, compliance with our rules, and responsible disclosure. Testing 
                  on other users' accounts or data without permission is not covered.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Hall of Fame */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Hall of Fame</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                Security Researchers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  We recognize researchers who have helped improve Ally's security. 
                  Be among the first to be acknowledged here.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your name can appear here with your permission after a verified disclosure.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Report?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Found a vulnerability? Send your detailed report to our security team. 
            We appreciate your efforts in keeping Ally secure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="mailto:security@allybywaiterapp.com">
                <Mail className="mr-2 h-5 w-5" />
                security@allybywaiterapp.com
              </a>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mt-6">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm">Initial response within 48 hours</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
            <Link to="/security" className="text-primary hover:underline">
              Back to Security
            </Link>
            <Link to="/trust" className="text-primary hover:underline">
              Trust Center
            </Link>
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BugBounty;
