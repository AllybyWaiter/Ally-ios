import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Handshake, Users, Code, Store, Megaphone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Partners = () => {
  const partnershipTypes = [
    {
      icon: Users,
      title: "Affiliate Partners",
      description: "[PLACEHOLDER: Describe affiliate program - earn commission on referrals, promotional materials provided]",
      benefits: [
        "[PLACEHOLDER: Competitive commission rates]",
        "[PLACEHOLDER: Marketing materials provided]",
        "[PLACEHOLDER: Real-time tracking dashboard]",
      ],
    },
    {
      icon: Code,
      title: "Technology Partners",
      description: "[PLACEHOLDER: Describe API integrations, co-development opportunities, technical partnerships]",
      benefits: [
        "[PLACEHOLDER: API access and documentation]",
        "[PLACEHOLDER: Co-marketing opportunities]",
        "[PLACEHOLDER: Technical support]",
      ],
    },
    {
      icon: Store,
      title: "Retail Partners",
      description: "[PLACEHOLDER: Describe distribution, reseller, and retail store partnerships]",
      benefits: [
        "[PLACEHOLDER: Wholesale pricing]",
        "[PLACEHOLDER: Training and certification]",
        "[PLACEHOLDER: Marketing support]",
      ],
    },
    {
      icon: Megaphone,
      title: "Content Partners",
      description: "[PLACEHOLDER: Describe influencer, blogger, and educator partnerships]",
      benefits: [
        "[PLACEHOLDER: Free premium access]",
        "[PLACEHOLDER: Exclusive content]",
        "[PLACEHOLDER: Revenue sharing]",
      ],
    },
  ];

  const partnerLogos = [
    "[PARTNER LOGO 1]",
    "[PARTNER LOGO 2]",
    "[PARTNER LOGO 3]",
    "[PARTNER LOGO 4]",
    "[PARTNER LOGO 5]",
    "[PARTNER LOGO 6]",
  ];

  const affiliateSteps = [
    {
      step: "1",
      title: "Apply",
      description: "[PLACEHOLDER: Submit your application with details about your audience and reach]",
    },
    {
      step: "2",
      title: "Get Approved",
      description: "[PLACEHOLDER: Our team reviews your application within X business days]",
    },
    {
      step: "3",
      title: "Start Promoting",
      description: "[PLACEHOLDER: Access your unique links, banners, and promotional materials]",
    },
    {
      step: "4",
      title: "Earn Commission",
      description: "[PLACEHOLDER: Track conversions and receive monthly payouts]",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Partners"
        description="Partner with Ally. Explore affiliate, technology, retail, and content partnership opportunities."
        path="/partners"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Handshake className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Partner With Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join our partner ecosystem and help bring better water care to more people around the world.
          </p>
        </div>

        {/* Placeholder Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-12">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>PLACEHOLDER:</strong> All partnership details, commission rates, and benefits should be reviewed and finalized before publishing.
          </p>
        </div>

        {/* Partnership Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Partnership Types</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {partnershipTypes.map((type, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <type.icon className="h-5 w-5 text-primary" />
                    </div>
                    {type.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Current Partners */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Our Partners</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add actual partner logos with proper permission and branding guidelines.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {partnerLogos.map((logo, index) => (
              <div
                key={index}
                className="h-24 bg-muted/30 rounded-lg border flex items-center justify-center text-muted-foreground text-sm"
              >
                {logo}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits of Partnership */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Why Partner With Ally?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Growing Market",
                description: "[PLACEHOLDER: Describe market opportunity in water care technology]",
              },
              {
                title: "Dedicated Support",
                description: "[PLACEHOLDER: Describe partner success team and resources]",
              },
              {
                title: "Mutual Growth",
                description: "[PLACEHOLDER: Describe revenue sharing and growth opportunities]",
              },
            ].map((item, index) => (
              <div key={index} className="p-6 bg-muted/30 rounded-lg border text-center">
                <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Affiliate Program Steps */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Affiliate Program</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Define commission rates, payment terms, and program requirements.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {affiliateSteps.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Commission Structure */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Commission Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>PLACEHOLDER:</strong> Add actual commission rates and tier structure.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-primary mb-2">[X]%</p>
                  <p className="text-sm text-muted-foreground">Standard Commission</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-primary mb-2">[Y]%</p>
                  <p className="text-sm text-muted-foreground">Premium Tier</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-primary mb-2">[Z] days</p>
                  <p className="text-sm text-muted-foreground">Cookie Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Partner?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Fill out our partnership application and our team will reach out within 2-3 business days.
          </p>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add partnership application form or email contact.
            </p>
          </div>
          <Button size="lg">
            Apply Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;
