import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail, Building2, Users, Newspaper, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AllySupportChat from "@/components/AllySupportChat";
import { useRateLimit } from "@/hooks/useRateLimit";
import { motion } from "framer-motion";
import { SEO, StructuredData, generateBreadcrumbData } from "@/components/SEO";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  company: z.string().trim().max(100, "Company name must be less than 100 characters").optional(),
  inquiry_type: z.enum(["general", "partnership", "business", "press", "other"]),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const inquiryTypes = [
  { value: "general", label: "General Inquiry", icon: MessageSquare },
  { value: "partnership", label: "Partnership Opportunity", icon: Users },
  { value: "business", label: "Business / Enterprise", icon: Building2 },
  { value: "press", label: "Press / Media", icon: Newspaper },
  { value: "other", label: "Other", icon: Mail },
];

const contactInfo = [
  { type: "General Inquiries", email: "info@allybywaiter.com", icon: MessageSquare },
  { type: "Partnerships", email: "info@allybywaiter.com", icon: Users },
  { type: "Business / Enterprise", email: "info@allybywaiter.com", icon: Building2 },
  { type: "Press / Media", email: "info@allybywaiter.com", icon: Newspaper },
];

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    company: "",
    inquiry_type: "general",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { isRateLimited, attemptsRemaining, checkRateLimit } = useRateLimit({
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    onLimitExceeded: () => {
      toast.error("Too many submissions. Please try again later.");
    },
  });

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkRateLimit()) return;

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: {
          name: result.data.name,
          email: result.data.email,
          message: result.data.message,
          inquiry_type: result.data.inquiry_type,
          company: result.data.company || null,
          subject: result.data.subject,
        },
      });

      if (error) throw error;
      
      // Check for API-level errors in response
      if (data?.error) {
        throw new Error(data.error);
      }

      setIsSuccess(true);
      toast.success("Message sent successfully!");
    } catch (error: unknown) {
      console.error("Contact form error:", error);
      const message = error instanceof Error ? error.message : '';
      
      // Handle rate limit response
      if (message.includes('Rate limit')) {
        toast.error("Too many submissions. Please try again later.");
      } else {
        toast.error(message || "Failed to send message. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 pt-28 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Message Sent!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for reaching out. We typically respond within 24 to 48 hours during business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
              <Button onClick={() => { setIsSuccess(false); setFormData({ name: "", email: "", company: "", inquiry_type: "general", subject: "", message: "" }); }}>
                Send Another Message
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Contact Us - Get Help with Ally"
        description="Have a question about Ally? Contact our team for general inquiries, partnership opportunities, business solutions, or press inquiries. We typically respond within 24-48 hours."
        path="/contact"
      />
      <StructuredData
        type="BreadcrumbList"
        data={{ items: generateBreadcrumbData([{ name: 'Home', url: '/' }, { name: 'Contact', url: '/contact' }]) }}
      />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-28">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground">
            Have a question, partnership idea, or just want to say hello? We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Inquiry Type */}
                  <div className="space-y-2">
                    <Label htmlFor="inquiry_type">Inquiry Type</Label>
                    <Select
                      value={formData.inquiry_type}
                      onValueChange={(value) => handleChange("inquiry_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        {inquiryTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.inquiry_type && (
                      <p className="text-sm text-destructive">{errors.inquiry_type}</p>
                    )}
                  </div>

                  {/* Name and Email Row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Your name"
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="you@example.com"
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Company (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="company">Company / Organization (Optional)</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleChange("company", e.target.value)}
                      placeholder="Your company name"
                      className={errors.company ? "border-destructive" : ""}
                    />
                    {errors.company && (
                      <p className="text-sm text-destructive">{errors.company}</p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleChange("subject", e.target.value)}
                      placeholder="Brief description of your inquiry"
                      className={errors.subject ? "border-destructive" : ""}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive">{errors.subject}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.message.length} / 2000
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isRateLimited}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>

                  {isRateLimited && (
                    <p className="text-sm text-destructive text-center">
                      Too many attempts. Please try again later.
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    We typically respond within 24 to 48 hours during business days.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Direct Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Direct Contact</CardTitle>
                <CardDescription>
                  Prefer email? Reach out directly to the right team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info) => (
                  <div key={info.type} className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <info.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{info.type}</p>
                      <a
                        href={`mailto:${info.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {info.email}
                      </a>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Before You Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Before You Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You might find answers in our resources:
                </p>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/faq"
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Frequently Asked Questions
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/features"
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4" />
                      Features Overview
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/pricing"
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Pricing Plans
                    </Link>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Response Time</p>
                    <p className="text-sm text-muted-foreground">
                      24 to 48 hours on business days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <AllySupportChat />
    </div>
  );
};

export default Contact;
