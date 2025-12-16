import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AllySupportChat from "@/components/AllySupportChat";
import DemoVideoModal from "@/components/DemoVideoModal";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, PlayCircle, BookOpen, FileText, HelpCircle, 
  Droplets, Wrench, Settings, Fish, Waves, MessageSquare,
  ChevronRight, ExternalLink, Clock, CheckCircle
} from "lucide-react";

// Video tutorials data
const videoTutorials = [
  {
    id: "getting-started",
    title: "Getting Started with Ally",
    description: "A complete overview of Ally and its features",
    duration: "5 min",
    thumbnail: "🎬",
    videoUrl: ""
  },
  {
    id: "water-testing",
    title: "How to Log Water Tests",
    description: "Learn to log tests manually or with photo analysis",
    duration: "4 min",
    thumbnail: "🧪",
    videoUrl: ""
  },
  {
    id: "photo-analysis",
    title: "AI Photo Analysis",
    description: "Use your camera to automatically read test strips",
    duration: "3 min",
    thumbnail: "📸",
    videoUrl: ""
  },
  {
    id: "maintenance-tasks",
    title: "Setting Up Maintenance Tasks",
    description: "Create and manage recurring maintenance schedules",
    duration: "4 min",
    thumbnail: "🔧",
    videoUrl: ""
  },
  {
    id: "equipment-tracking",
    title: "Equipment Tracking",
    description: "Track filters, heaters, and other equipment",
    duration: "3 min",
    thumbnail: "⚙️",
    videoUrl: ""
  },
  {
    id: "ally-chat",
    title: "Using Ally Chat Assistant",
    description: "Get personalized advice from your AI assistant",
    duration: "4 min",
    thumbnail: "💬",
    videoUrl: ""
  }
];

// Quick start guides
const quickStartGuides = [
  {
    id: "freshwater",
    title: "Freshwater Aquarium Setup",
    description: "Complete guide for setting up and maintaining freshwater tanks",
    icon: Fish,
    color: "text-blue-500",
    steps: [
      "Add your first aquarium with tank size and type",
      "Add your fish, plants, and equipment",
      "Log your first water test",
      "Set up weekly maintenance tasks",
      "Enable notifications for reminders"
    ]
  },
  {
    id: "saltwater",
    title: "Saltwater & Reef Tank Guide",
    description: "Essential setup for marine and reef aquariums",
    icon: Waves,
    color: "text-cyan-500",
    steps: [
      "Create a saltwater or reef tank profile",
      "Add corals, fish, and invertebrates",
      "Track additional parameters (Calcium, Alkalinity, Magnesium)",
      "Set up water change schedules",
      "Monitor salinity and temperature trends"
    ]
  },
  {
    id: "pool",
    title: "Pool Maintenance Guide",
    description: "Keep your pool crystal clear all season",
    icon: Droplets,
    color: "text-sky-500",
    steps: [
      "Add your pool with volume and type (chlorine/saltwater)",
      "Log chlorine, pH, and alkalinity tests",
      "Set up seasonal maintenance tasks",
      "Enable weather-aware task suggestions",
      "Track pump and filter equipment"
    ]
  },
  {
    id: "spa",
    title: "Spa & Hot Tub Care",
    description: "Maintain safe and comfortable spa water",
    icon: Waves,
    color: "text-purple-500",
    steps: [
      "Create your spa profile with volume",
      "Track bromine or chlorine levels",
      "Set up weekly drain and refill reminders",
      "Monitor temperature and pH balance",
      "Schedule filter cleaning tasks"
    ]
  }
];

// Help articles organized by category
const helpArticles = [
  {
    category: "Water Testing",
    icon: Droplets,
    articles: [
      { title: "Log your first water test", difficulty: "Beginner", content: "Navigate to Water Tests from your dashboard, select your aquatic space, and enter your parameter values. Save to track your water quality over time." },
      { title: "Use AI photo analysis", difficulty: "Beginner", content: "Tap the camera icon when logging a water test. Take a clear photo of your test strip and Ally will automatically read the values for you." },
      { title: "Understand water parameters", difficulty: "Intermediate", content: "pH measures acidity (6.5-7.5 for freshwater). Ammonia and Nitrite should be 0. Nitrate under 40ppm. Temperature varies by species." },
      { title: "Read trend alerts", difficulty: "Intermediate", content: "Ally analyzes your test history to detect concerning patterns like rising nitrates or falling pH before they become problems." },
      { title: "Create custom test templates", difficulty: "Advanced", content: "Go to Water Tests > Templates to create custom parameter sets for your specific testing routine or kit brand." }
    ]
  },
  {
    category: "Maintenance Tasks",
    icon: Wrench,
    articles: [
      { title: "Create a maintenance task", difficulty: "Beginner", content: "From your aquatic space detail page, tap Tasks > Add Task. Enter the task name, type, and due date." },
      { title: "Set up recurring schedules", difficulty: "Beginner", content: "When creating a task, enable 'Repeat this task' and select a frequency (daily, weekly, biweekly, monthly, or custom)." },
      { title: "AI task suggestions", difficulty: "Intermediate", content: "Ally analyzes your water tests, equipment, and weather to suggest maintenance tasks tailored to your specific needs." },
      { title: "Use the calendar view", difficulty: "Beginner", content: "Navigate to Calendar from the main menu to see all your tasks across all aquatic spaces in a monthly or weekly view." },
      { title: "Mark tasks complete", difficulty: "Beginner", content: "Tap the checkmark on any task to mark it complete. For recurring tasks, the next occurrence is automatically created." }
    ]
  },
  {
    category: "Equipment",
    icon: Settings,
    articles: [
      { title: "Add equipment to your tank", difficulty: "Beginner", content: "From your aquatic space, go to Equipment > Add Equipment. Enter details like brand, model, and installation date." },
      { title: "Set maintenance intervals", difficulty: "Beginner", content: "For each piece of equipment, set a maintenance interval (e.g., clean filter every 30 days) to get automatic reminders." },
      { title: "Track filter media", difficulty: "Intermediate", content: "Add filter media as separate equipment items to track when each type (mechanical, biological, chemical) needs replacement." },
      { title: "Equipment health monitoring", difficulty: "Intermediate", content: "Review equipment status from your dashboard. Ally flags items that are overdue for maintenance or nearing replacement age." }
    ]
  },
  {
    category: "Livestock & Plants",
    icon: Fish,
    articles: [
      { title: "Add fish and corals", difficulty: "Beginner", content: "From Livestock, tap Add to enter species name, quantity, date added, and health status. Track individual specimens or groups." },
      { title: "Track health status", difficulty: "Beginner", content: "Update health status (Healthy, Stressed, Sick, Quarantine) to monitor changes over time and identify patterns." },
      { title: "Log additions and losses", difficulty: "Beginner", content: "Update quantities when you add new fish or experience losses. This helps track your tank's biological history." },
      { title: "Add plants and placement", difficulty: "Beginner", content: "Track aquatic plants with species, quantity, placement (foreground, midground, background), and condition." }
    ]
  },
  {
    category: "Pool & Spa",
    icon: Waves,
    articles: [
      { title: "Chlorine management basics", difficulty: "Beginner", content: "Maintain free chlorine between 1-3 ppm for pools, 3-5 ppm for spas. Test daily during heavy use periods." },
      { title: "pH balancing guide", difficulty: "Intermediate", content: "Keep pH between 7.2-7.6. Low pH causes corrosion; high pH reduces sanitizer effectiveness and causes scaling." },
      { title: "Seasonal maintenance calendar", difficulty: "Intermediate", content: "Spring: shock and algae treatment. Summer: frequent testing. Fall: winterization prep. Winter: close or maintain minimal chemistry." },
      { title: "Saltwater pool care", difficulty: "Intermediate", content: "Maintain salt levels between 2700-3400 ppm. Clean salt cell regularly. Test salt levels monthly." }
    ]
  },
  {
    category: "Account & Settings",
    icon: Settings,
    articles: [
      { title: "Update your profile", difficulty: "Beginner", content: "Go to Settings > Account > Profile to update your display name, experience level, and other preferences." },
      { title: "Change subscription", difficulty: "Beginner", content: "View and change your plan from Settings > Account > Subscription, or visit the Pricing page for plan comparisons." },
      { title: "Export your data", difficulty: "Beginner", content: "Download all your data from Settings > Account > Data & Privacy > Download My Data. You'll receive a JSON file." },
      { title: "Notification preferences", difficulty: "Beginner", content: "Customize which notifications you receive, set quiet hours, and manage sound preferences in Settings > Preferences > Notifications." }
    ]
  }
];

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<typeof videoTutorials[0] | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  // Filter articles based on search
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return helpArticles;
    
    const query = searchQuery.toLowerCase();
    return helpArticles.map(category => ({
      ...category,
      articles: category.articles.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query)
      )
    })).filter(category => category.articles.length > 0);
  }, [searchQuery]);

  // Filter videos based on search
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videoTutorials;
    const query = searchQuery.toLowerCase();
    return videoTutorials.filter(video => 
      video.title.toLowerCase().includes(query) ||
      video.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filter guides based on search
  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return quickStartGuides;
    const query = searchQuery.toLowerCase();
    return quickStartGuides.filter(guide => 
      guide.title.toLowerCase().includes(query) ||
      guide.description.toLowerCase().includes(query) ||
      guide.steps.some(step => step.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const totalResults = filteredVideos.length + filteredGuides.length + 
    filteredArticles.reduce((acc, cat) => acc + cat.articles.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Help Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find tutorials, guides, and answers to common questions
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help articles, videos, or guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-full border-2 focus:border-primary"
              />
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4">
          <Tabs defaultValue="guides" className="space-y-8">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 h-auto p-1 bg-muted/50">
              <TabsTrigger value="videos" className="gap-2 py-3 relative">
                <PlayCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Videos</span>
                <Badge variant="secondary" className="absolute -top-2 -right-1 text-[10px] px-1.5 py-0">Soon</Badge>
              </TabsTrigger>
              <TabsTrigger value="guides" className="gap-2 py-3">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Guides</span>
              </TabsTrigger>
              <TabsTrigger value="articles" className="gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Articles</span>
              </TabsTrigger>
            </TabsList>

            {/* Video Tutorials Tab - Coming Soon */}
            <TabsContent value="videos" className="space-y-6">
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <PlayCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Video Tutorials Coming Soon</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  We're creating step by step video guides to help you get the most out of Ally. Check back soon!
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Getting Started", "Water Testing", "AI Photo Analysis", "Maintenance Tasks", "Equipment Tracking", "Ally Chat"].map((topic) => (
                    <Badge key={topic} variant="outline" className="text-sm">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Quick Start Guides Tab */}
            <TabsContent value="guides" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Quick Start Guides</h2>
                <p className="text-muted-foreground">Get up and running with your aquatic space</p>
              </div>
              
              {filteredGuides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No guides found matching "{searchQuery}"
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredGuides.map((guide) => (
                    <Card 
                      key={guide.id} 
                      className={`transition-all ${expandedGuide === guide.id ? 'ring-2 ring-primary' : ''}`}
                    >
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-muted ${guide.color}`}>
                            <guide.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center justify-between">
                              {guide.title}
                              <ChevronRight className={`h-5 w-5 transition-transform ${expandedGuide === guide.id ? 'rotate-90' : ''}`} />
                            </CardTitle>
                            <CardDescription>{guide.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      {expandedGuide === guide.id && (
                        <CardContent className="pt-0">
                          <div className="space-y-3 border-t pt-4">
                            {guide.steps.map((step, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                                <p className="text-sm text-muted-foreground">{step}</p>
                              </div>
                            ))}
                            <Button variant="outline" className="w-full mt-4" asChild>
                              <Link to="/dashboard">
                                Get Started <ChevronRight className="h-4 w-4 ml-2" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Help Articles Tab */}
            <TabsContent value="articles" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Help Articles</h2>
                <p className="text-muted-foreground">Detailed guides for every feature</p>
              </div>
              
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No articles found matching "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredArticles.map((category) => (
                    <Card key={category.category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3">
                          <category.icon className="h-5 w-5 text-primary" />
                          {category.category}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible className="space-y-2">
                          {category.articles.map((article, index) => (
                            <AccordionItem 
                              key={index} 
                              value={`${category.category}-${index}`}
                              className="border rounded-lg px-4"
                            >
                              <AccordionTrigger className="hover:no-underline py-3">
                                <div className="flex items-center gap-3 text-left">
                                  <span className="font-medium">{article.title}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {article.difficulty}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4 text-muted-foreground">
                                {article.content}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Still Need Help Section */}
        <section className="container mx-auto px-4 mt-16">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? We're here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link to="/contact">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/faq">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Browse FAQ
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/ally">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Chat with Ally
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
      <AllySupportChat />

      {/* Video Modal */}
      <DemoVideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.videoUrl}
        title={selectedVideo?.title}
      />
    </div>
  );
};

export default HelpCenter;
