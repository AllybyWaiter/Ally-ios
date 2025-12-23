import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { 
  Bot, 
  Eye, 
  EyeOff, 
  Database, 
  Clock, 
  AlertTriangle, 
  Users, 
  Settings,
  CheckCircle,
  XCircle,
  Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AITransparency = () => {
  const capabilities = [
    "Water test photo analysis and parameter extraction",
    "Personalized water quality recommendations",
    "Chat based assistance for aquarium, pool, and spa care",
    "Trend analysis and predictive insights",
    "Maintenance task suggestions",
    "Equipment and livestock compatibility guidance",
  ];

  const dataSent = [
    { item: "Your messages and questions", included: true },
    { item: "Water test photos (when you upload them)", included: true },
    { item: "Water test parameters and history", included: true },
    { item: "Aquarium, pool, or spa details you've added", included: true },
    { item: "Livestock and plant information", included: true },
    { item: "Conversation context for continuity", included: true },
  ];

  const dataNotSent = [
    { item: "Payment or billing information", included: false },
    { item: "Passwords or authentication credentials", included: false },
    { item: "Personal documents or files", included: false },
    { item: "Location data beyond what you provide", included: false },
    { item: "Data from other users", included: false },
  ];

  const limitations = [
    {
      title: "Not a Substitute for Professional Advice",
      description: "Ally AI provides guidance based on general best practices. For serious issues, consult a professional.",
    },
    {
      title: "May Make Mistakes",
      description: "AI responses are generated based on patterns and may occasionally be inaccurate. Always verify critical recommendations.",
    },
    {
      title: "Limited Real Time Data",
      description: "Ally AI does not have access to external real time data sources beyond what you provide.",
    },
    {
      title: "Photo Analysis Accuracy",
      description: "Photo based readings depend on image quality and lighting. Manual verification is recommended for precision.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="AI Transparency"
        description="Learn how Ally AI works, what data it uses, and how we ensure responsible AI practices. Our commitment to transparency in AI-powered water care."
        path="/legal/ai-transparency"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            AI Transparency
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Understanding how Ally AI works and how your data is handled. 
            We believe in being transparent about our AI systems.
          </p>
        </div>

        {/* About Ally AI */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">About Ally AI</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                Ally AI is our proprietary artificial intelligence system designed specifically 
                for water care management. It powers features like photo based water test analysis, 
                personalized recommendations, and conversational assistance to help you maintain 
                healthy aquariums, pools, and spas.
              </p>
              <h3 className="font-semibold mb-4 text-foreground">Capabilities</h3>
              <ul className="grid md:grid-cols-2 gap-3">
                {capabilities.map((capability, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {capability}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Data Handling */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">How Your Data is Handled</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Data Sent to Ally AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {dataSent.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      {item.item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5 text-primary" />
                  Data Never Sent to AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {dataNotSent.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      {item.item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data Usage */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Data Usage & Retention</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  How Your Data is Used
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  Your data is used solely to generate responses and provide personalized 
                  recommendations within the Ally application.
                </p>
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    Your data is never used to train external AI models.
                  </p>
                </div>
                <p>
                  We may use aggregated, anonymized data to improve our AI system's 
                  accuracy, but this data cannot be traced back to individual users.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Data Retention
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  <strong>Conversation History:</strong> Stored as long as your account is active. 
                  You can delete individual conversations or all history at any time.
                </p>
                <p>
                  <strong>Water Test Data:</strong> Retained for trend analysis until you delete 
                  it or your account.
                </p>
                <p>
                  <strong>AI Processing Logs:</strong> Temporary processing logs are retained for 
                  up to 30 days for debugging purposes, then automatically deleted.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">AI Limitations</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {limitations.map((limitation, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    {limitation.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{limitation.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Human Oversight */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Human Oversight & Controls</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Human Review
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  Our support team monitors AI performance and can intervene when needed. 
                  Feedback you provide helps us improve response quality.
                </p>
                <p>
                  Critical recommendations (like treating sick livestock) include suggestions 
                  to consult professionals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Your Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Delete conversation history anytime
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Provide feedback on AI responses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Export your data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Delete your account and all data
                  </li>
                </ul>
                <p className="mt-4 text-sm">
                  Manage these options in your{" "}
                  <Link to="/settings" className="text-primary hover:underline">
                    account settings
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Questions About Ally AI?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            We're committed to transparency. If you have questions about how Ally AI works 
            or handles your data, please reach out.
          </p>
          <Button asChild>
            <a href="mailto:ai@allybywaiterapp.com">
              <Mail className="mr-2 h-4 w-4" />
              Contact AI Team
            </a>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AITransparency;
