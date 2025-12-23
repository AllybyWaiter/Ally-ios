import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  Mail,
  Globe,
  Building2,
  Phone,
  Briefcase,
  Clock,
  Link2,
  Target,
  BarChart3,
  FileText,
  Wallet,
  MessageSquare,
  Shield,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { useRateLimit } from "@/hooks/useRateLimit";
import { sanitizeInput } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Ireland",
  "Portugal",
  "Poland",
  "Czech Republic",
  "New Zealand",
  "Japan",
  "South Korea",
  "Singapore",
  "Hong Kong",
  "India",
  "Brazil",
  "Mexico",
  "Argentina",
  "Chile",
  "Colombia",
  "South Africa",
  "United Arab Emirates",
  "Israel",
  "Other",
];

const TIMEZONES = [
  "UTC-12:00",
  "UTC-11:00",
  "UTC-10:00 (Hawaii)",
  "UTC-09:00 (Alaska)",
  "UTC-08:00 (Pacific)",
  "UTC-07:00 (Mountain)",
  "UTC-06:00 (Central)",
  "UTC-05:00 (Eastern)",
  "UTC-04:00 (Atlantic)",
  "UTC-03:00",
  "UTC-02:00",
  "UTC-01:00",
  "UTC+00:00 (GMT)",
  "UTC+01:00 (CET)",
  "UTC+02:00 (EET)",
  "UTC+03:00",
  "UTC+04:00",
  "UTC+05:00",
  "UTC+05:30 (IST)",
  "UTC+06:00",
  "UTC+07:00",
  "UTC+08:00 (CST/SGT)",
  "UTC+09:00 (JST/KST)",
  "UTC+10:00 (AEST)",
  "UTC+11:00",
  "UTC+12:00 (NZST)",
];

const CHANNELS = [
  { id: "website", label: "Website" },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "Twitter/X" },
  { id: "newsletter", label: "Newsletter" },
  { id: "podcast", label: "Podcast" },
  { id: "other", label: "Other" },
];

const AUDIENCES = [
  { id: "pool", label: "Pool owners" },
  { id: "spa", label: "Spa/Hot tub owners" },
  { id: "aquarium", label: "Aquarium hobbyists" },
  { id: "service", label: "Service professionals" },
];

const BUSINESS_TYPES = [
  { value: "creator", label: "Creator" },
  { value: "brand", label: "Brand" },
  { value: "agency", label: "Agency" },
  { value: "retailer", label: "Retailer" },
  { value: "software", label: "Software company" },
  { value: "service", label: "Service company" },
];

const REFERRAL_SOURCES = [
  { value: "search", label: "Search engine" },
  { value: "social", label: "Social media" },
  { value: "referral", label: "Friend/Colleague referral" },
  { value: "blog", label: "Blog/Article" },
  { value: "podcast", label: "Podcast" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  partnership_type: z.enum(["affiliate", "content", "retail", "technology"], {
    required_error: "Please select a partnership type",
  }),
  business_type: z.string().optional(),
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  country: z.string().min(1, "Please select your country"),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  role_title: z.string().optional(),
  website_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  timezone: z.string().optional(),
  channels: z.array(z.string()).min(1, "Please select at least one channel"),
  primary_channel_link: z.string().min(1, "Please provide your primary channel link"),
  additional_links: z.string().optional(),
  audience_focus: z.array(z.string()).min(1, "Please select at least one audience"),
  total_followers: z.number().int().min(0).optional().nullable(),
  avg_views: z.number().int().min(0).optional().nullable(),
  monthly_visitors: z.number().int().min(0).optional().nullable(),
  newsletter_subscribers: z.number().int().min(0).optional().nullable(),
  promotion_plan: z.string().optional(),
  payout_method: z.enum(["paypal", "bank", "venmo", "other"], {
    required_error: "Please select a payout method",
  }),
  paypal_email: z.string().email().optional().or(z.literal("")),
  referral_source: z.string().optional(),
  referral_code: z.string().optional(),
  agreed_to_terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms & Conditions",
  }),
  agreed_to_ftc: z.boolean().refine((val) => val === true, {
    message: "You must agree to follow FTC disclosure guidelines",
  }),
  confirmed_accuracy: z.boolean().refine((val) => val === true, {
    message: "You must confirm the accuracy of your information",
  }),
}).refine((data) => {
  // Company name required unless individual creator
  if (data.business_type !== "creator" && !data.company_name) {
    return false;
  }
  return true;
}, {
  message: "Company/Brand name is required unless you're an individual creator",
  path: ["company_name"],
}).refine((data) => {
  // Promotion plan required for non-affiliate
  if (data.partnership_type !== "affiliate" && !data.promotion_plan) {
    return false;
  }
  return true;
}, {
  message: "Promotion plan is required for this partnership type",
  path: ["promotion_plan"],
});

type FormData = z.infer<typeof formSchema>;

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 rounded-lg bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
  </div>
);

export default function PartnerApply() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isRateLimited, attemptsRemaining, resetTime, checkRateLimit } = useRateLimit({
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channels: [],
      audience_focus: [],
      agreed_to_terms: false,
      agreed_to_ftc: false,
      confirmed_accuracy: false,
    },
  });

  const watchPartnershipType = form.watch("partnership_type");
  const watchBusinessType = form.watch("business_type");
  const watchChannels = form.watch("channels");
  const watchPayoutMethod = form.watch("payout_method");

  const showVideoMetrics = watchChannels?.some((c) =>
    ["youtube", "tiktok", "instagram"].includes(c)
  );
  const showWebsiteMetrics = watchChannels?.includes("website");
  const showNewsletterMetrics = watchChannels?.includes("newsletter");
  const isNonAffiliate = watchPartnershipType && watchPartnershipType !== "affiliate";
  const isCreator = watchBusinessType === "creator";

  const onSubmit = async (data: FormData) => {
    if (isRateLimited) {
      toast.error("Too many attempts", {
        description: `Please try again in ${Math.ceil(((resetTime || Date.now()) - Date.now()) / 60000)} minutes`,
      });
      return;
    }

    if (!checkRateLimit()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedData = {
        partnership_type: data.partnership_type,
        business_type: data.business_type || null,
        full_name: sanitizeInput(data.full_name),
        email: sanitizeInput(data.email).toLowerCase(),
        country: data.country,
        company_name: data.company_name ? sanitizeInput(data.company_name) : null,
        phone: data.phone ? sanitizeInput(data.phone) : null,
        role_title: data.role_title ? sanitizeInput(data.role_title) : null,
        website_url: data.website_url || null,
        timezone: data.timezone || null,
        channels: data.channels,
        primary_channel_link: sanitizeInput(data.primary_channel_link),
        additional_links: data.additional_links ? sanitizeInput(data.additional_links) : null,
        audience_focus: data.audience_focus,
        total_followers: data.total_followers || null,
        avg_views: data.avg_views || null,
        monthly_visitors: data.monthly_visitors || null,
        newsletter_subscribers: data.newsletter_subscribers || null,
        promotion_plan: data.promotion_plan ? sanitizeInput(data.promotion_plan) : null,
        payout_method: data.payout_method,
        paypal_email: data.paypal_email || null,
        referral_source: data.referral_source || null,
        referral_code: data.referral_code ? sanitizeInput(data.referral_code) : null,
        agreed_to_terms: true,
        agreed_to_ftc: true,
        confirmed_accuracy: true,
      };

      const { error } = await supabase
        .from("partner_applications")
        .insert(sanitizedData);

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <SEO
          title="Application Received | Ally Partner Program"
          description="Thank you for applying to Ally's Partner Program."
        />
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-24 pb-16">
            <div className="container max-w-2xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  Application received.
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                  Thanks for applying to Ally's Partner Program. We're reviewing your
                  submission and will reach out by email if there's a fit. In the
                  meantime, make sure your links and handles are accessible and up to
                  date.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  Questions?{" "}
                  <a
                    href="mailto:partners@useally.com"
                    className="text-primary hover:underline"
                  >
                    partners@useally.com
                  </a>
                </p>
                <Button asChild>
                  <Link to="/partners">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Partners
                  </Link>
                </Button>
              </motion.div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Apply to Partner Program | Ally"
        description="Join Ally's Partner Program as an affiliate, content creator, retailer, or technology partner. Earn commissions and grow with us."
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container max-w-3xl mx-auto px-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <Link
                to="/partners"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Partners
              </Link>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Partner Application
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Tell us about yourself and how you'd like to partner with Ally. We
                review applications within 5 to 7 business days.
              </p>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Section 1: Partnership Type */}
                  <Card>
                    <CardHeader>
                      <SectionHeader icon={Users} title="Partnership Type" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="partnership_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What type of partnership interests you? *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                {[
                                  { value: "affiliate", label: "Affiliate", desc: "Earn commissions on referrals" },
                                  { value: "content", label: "Content", desc: "Create content about Ally" },
                                  { value: "retail", label: "Retail", desc: "Sell Ally in your store" },
                                  { value: "technology", label: "Technology", desc: "Integrate with Ally" },
                                ].map((type) => (
                                  <Label
                                    key={type.value}
                                    htmlFor={type.value}
                                    className={`flex flex-col items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                      field.value === type.value
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    <RadioGroupItem
                                      value={type.value}
                                      id={type.value}
                                      className="sr-only"
                                    />
                                    <span className="font-medium">{type.label}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {type.desc}
                                    </span>
                                  </Label>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchPartnershipType && (
                        <FormField
                          control={form.control}
                          name="business_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Which best describes you?</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BUSINESS_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 2: Contact Information */}
                  <Card>
                    <CardHeader>
                      <SectionHeader icon={Mail} title="Contact Information" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="you@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {COUNTRIES.map((country) => (
                                    <SelectItem key={country} value={country}>
                                      {country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="company_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Company/Brand Name {!isCreator && "*"}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your company or brand"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {isCreator
                                  ? "Optional for individual creators"
                                  : "Required unless you're an individual creator"}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+1 (555) 000-0000"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="role_title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role/Title</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Marketing Director" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="website_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website URL</FormLabel>
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder="https://yourwebsite.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Time Zone</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select timezone" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIMEZONES.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                      {tz}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 3: Channels */}
                  <Card>
                    <CardHeader>
                      <SectionHeader icon={Globe} title="Promotion Channels" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="channels"
                        render={() => (
                          <FormItem>
                            <FormLabel>Where do you reach your audience? *</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                              {CHANNELS.map((channel) => (
                                <FormField
                                  key={channel.id}
                                  control={form.control}
                                  name="channels"
                                  render={({ field }) => (
                                    <FormItem
                                      key={channel.id}
                                      className="flex items-center space-x-2 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(channel.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, channel.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== channel.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        {channel.label}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="primary_channel_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Channel Link/Handle *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://youtube.com/@yourchannel or @yourhandle"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Your main platform where we can see your content
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="additional_links"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Links</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add any other relevant links or handles, one per line"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Section 4: Audience Focus */}
                  <Card>
                    <CardHeader>
                      <SectionHeader icon={Target} title="Audience Focus" />
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="audience_focus"
                        render={() => (
                          <FormItem>
                            <FormLabel>Who is your primary audience? *</FormLabel>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              {AUDIENCES.map((audience) => (
                                <FormField
                                  key={audience.id}
                                  control={form.control}
                                  name="audience_focus"
                                  render={({ field }) => (
                                    <FormItem
                                      key={audience.id}
                                      className="flex items-center space-x-2 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(audience.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, audience.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== audience.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        {audience.label}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Section 5: Reach Metrics */}
                  <Card>
                    <CardHeader>
                      <SectionHeader icon={BarChart3} title="Reach Metrics" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-sm text-muted-foreground">
                        Approximate numbers are fine. Leave blank if not applicable.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="total_followers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Followers/Subscribers</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g., 50000"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value) : null
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>All platforms combined</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {showVideoMetrics && (
                          <FormField
                            control={form.control}
                            name="avg_views"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Average Views Per Post/Video</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 10000"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value ? parseInt(e.target.value) : null
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {showWebsiteMetrics && (
                          <FormField
                            control={form.control}
                            name="monthly_visitors"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Website Visitors</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 25000"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value ? parseInt(e.target.value) : null
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {showNewsletterMetrics && (
                          <FormField
                            control={form.control}
                            name="newsletter_subscribers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Newsletter Subscribers</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 5000"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value ? parseInt(e.target.value) : null
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 6: Promotion Plan */}
                  <Card>
                    <CardHeader>
                      <SectionHeader icon={FileText} title="Promotion Plan" />
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="promotion_plan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              How do you plan to promote Ally?{" "}
                              {isNonAffiliate && "*"}
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your content ideas, placements, or campaign plans..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              <ul className="list-disc list-inside text-xs space-y-1 mt-2">
                                <li>What content or placements do you envision?</li>
                                <li>Who is the audience and what problem are you solving?</li>
                                <li>Any campaign ideas or timelines?</li>
                              </ul>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Section 7: Payout Preferences */}
                  <Card>
                    <CardHeader>
                      <SectionHeader icon={Wallet} title="Payout Preferences" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="payout_method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Payout Method *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payout method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="paypal">PayPal</SelectItem>
                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                <SelectItem value="venmo">Venmo</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Full payment details will be collected after approval
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchPayoutMethod === "paypal" && (
                        <FormField
                          control={form.control}
                          name="paypal_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PayPal Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="your-paypal@email.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Section 8: Attribution */}
                  <Card>
                    <CardHeader>
                      <SectionHeader icon={MessageSquare} title="How Did You Find Us?" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="referral_source"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How did you hear about Ally's Partner Program?</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {REFERRAL_SOURCES.map((source) => (
                                    <SelectItem key={source.value} value={source.value}>
                                      {source.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="referral_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Referral Code</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter code if you have one" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 9: Legal */}
                  <Card>
                    <CardHeader>
                      <SectionHeader icon={Shield} title="Terms & Compliance" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="agreed_to_terms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal cursor-pointer">
                                I agree to the{" "}
                                <Link
                                  to="/terms"
                                  target="_blank"
                                  className="text-primary hover:underline"
                                >
                                  Partner Terms & Conditions
                                </Link>{" "}
                                *
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="agreed_to_ftc"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal cursor-pointer">
                                I understand and will follow FTC disclosure guidelines for
                                affiliate/content promotions *
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmed_accuracy"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal cursor-pointer">
                                I confirm the information and metrics provided are accurate
                                to the best of my knowledge *
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <p className="text-xs text-muted-foreground pt-2">
                        By submitting, you also agree to our{" "}
                        <Link
                          to="/privacy"
                          target="_blank"
                          className="text-primary hover:underline"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <div className="flex flex-col items-center gap-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full md:w-auto min-w-[200px]"
                      disabled={isSubmitting || isRateLimited}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                    {isRateLimited && (
                      <p className="text-sm text-destructive">
                        Too many attempts. Please try again in{" "}
                        {Math.ceil(((resetTime || Date.now()) - Date.now()) / 60000)} minutes.
                      </p>
                    )}
                  </div>
                </form>
              </Form>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
