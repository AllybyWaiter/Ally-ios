import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { FileText, Download, Mail, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DPA = () => {
  const dpaIncludes = [
    "Processing terms and scope",
    "Data security measures",
    "Subprocessor requirements",
    "Data subject rights procedures",
    "Breach notification obligations",
    "Data deletion and return provisions",
    "Standard Contractual Clauses (for international transfers)",
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Data Processing Agreement"
        description="Information about Ally's Data Processing Agreement (DPA) for business and enterprise customers. Learn how to request an executed DPA."
        path="/legal/dpa"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Data Processing Agreement
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            For business and enterprise customers who require a formal Data Processing Agreement 
            to comply with data protection regulations.
          </p>
        </div>

        {/* What is a DPA */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>What is a Data Processing Agreement?</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                A Data Processing Agreement (DPA) is a legally binding contract between a data 
                controller (you) and a data processor (Ally). It defines how personal data is 
                handled and ensures compliance with data protection laws like GDPR and CCPA.
              </p>
              <p>
                A DPA is typically required when your organization uses Ally to process personal 
                data on behalf of your customers or employees, particularly for business accounts 
                in the European Union or dealing with EU residents' data.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* What's Included */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">What Our DPA Includes</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="grid md:grid-cols-2 gap-4">
                {dpaIncludes.map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Who Needs a DPA */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Who Needs a DPA?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">You May Need a DPA If:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    Your organization is based in the EU/EEA
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    You process data of EU residents
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    Your business requires vendor DPAs for compliance
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    You're using Ally for business or enterprise purposes
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Account Users</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  If you're using Ally for personal use (managing your own aquarium, pool, or spa), 
                  our standard{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  {" "}govern our relationship. A DPA is typically not required for personal accounts.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How to Request */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">How to Request a DPA</h2>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Contact Us</h3>
                  <p className="text-sm text-muted-foreground">
                    Email our legal team with your request and company details
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Review</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll send you our standard DPA for your legal team to review
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Execute</h3>
                  <p className="text-sm text-muted-foreground">
                    Once agreed, both parties sign the DPA
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <p className="text-muted-foreground mb-4">
                  To request a DPA or download our standard template, please contact our legal team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild>
                    <a href="mailto:legal@allybywaiterapp.com?subject=DPA%20Request">
                      <Mail className="mr-2 h-4 w-4" />
                      Request DPA
                    </a>
                  </Button>
                  <Button variant="outline" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template (Coming Soon)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Related Resources */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/privacy">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="pt-6">
                  <FileText className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground">
                    How we collect and use data
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/legal/subprocessors">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="pt-6">
                  <FileText className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Subprocessors</h3>
                  <p className="text-sm text-muted-foreground">
                    Third parties that process data
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/security">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="pt-6">
                  <FileText className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Our security practices
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Questions About Our DPA?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Our legal team is available to answer questions about data processing agreements 
            and help you meet your compliance requirements.
          </p>
          <Button asChild>
            <a href="mailto:legal@allybywaiterapp.com">
              <Mail className="mr-2 h-4 w-4" />
              Contact Legal Team
            </a>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DPA;
