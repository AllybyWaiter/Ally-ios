import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Wrench, Bug, AlertTriangle, Rocket } from "lucide-react";

type ChangeType = "feature" | "improvement" | "fix" | "security" | "breaking";

interface ChangeItem {
  type: ChangeType;
  description: string;
}

interface ReleaseEntry {
  version: string;
  date: string;
  title: string;
  changes: ChangeItem[];
}

const Changelog = () => {
  // Placeholder releases - update with real version history
  const releases: ReleaseEntry[] = [
    {
      version: "[X.X.X]",
      date: "[YYYY-MM-DD]",
      title: "[RELEASE TITLE - e.g., AI Enhancements & Performance]",
      changes: [
        { type: "feature", description: "[PLACEHOLDER: New feature description]" },
        { type: "feature", description: "[PLACEHOLDER: Another new feature]" },
        { type: "improvement", description: "[PLACEHOLDER: Improvement description]" },
        { type: "fix", description: "[PLACEHOLDER: Bug fix description]" },
      ],
    },
    {
      version: "[X.X.X]",
      date: "[YYYY-MM-DD]",
      title: "[RELEASE TITLE]",
      changes: [
        { type: "feature", description: "[PLACEHOLDER: Feature description]" },
        { type: "improvement", description: "[PLACEHOLDER: Improvement description]" },
        { type: "security", description: "[PLACEHOLDER: Security update description]" },
        { type: "fix", description: "[PLACEHOLDER: Bug fix description]" },
      ],
    },
    {
      version: "[X.X.X]",
      date: "[YYYY-MM-DD]",
      title: "[RELEASE TITLE]",
      changes: [
        { type: "breaking", description: "[PLACEHOLDER: Breaking change description]" },
        { type: "feature", description: "[PLACEHOLDER: Feature description]" },
        { type: "improvement", description: "[PLACEHOLDER: Improvement description]" },
      ],
    },
    {
      version: "1.0.0",
      date: "[YYYY-MM-DD]",
      title: "Initial Release",
      changes: [
        { type: "feature", description: "[PLACEHOLDER: Core feature 1]" },
        { type: "feature", description: "[PLACEHOLDER: Core feature 2]" },
        { type: "feature", description: "[PLACEHOLDER: Core feature 3]" },
        { type: "feature", description: "[PLACEHOLDER: Core feature 4]" },
      ],
    },
  ];

  const getChangeIcon = (type: ChangeType) => {
    switch (type) {
      case "feature":
        return <Sparkles className="h-4 w-4" />;
      case "improvement":
        return <Rocket className="h-4 w-4" />;
      case "fix":
        return <Bug className="h-4 w-4" />;
      case "security":
        return <AlertTriangle className="h-4 w-4" />;
      case "breaking":
        return <Wrench className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getChangeBadgeVariant = (type: ChangeType): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "feature":
        return "default";
      case "improvement":
        return "secondary";
      case "fix":
        return "outline";
      case "security":
        return "destructive";
      case "breaking":
        return "destructive";
      default:
        return "default";
    }
  };

  const getChangeLabel = (type: ChangeType) => {
    switch (type) {
      case "feature":
        return "New";
      case "improvement":
        return "Improved";
      case "fix":
        return "Fixed";
      case "security":
        return "Security";
      case "breaking":
        return "Breaking";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title="Changelog"
        description="Stay up to date with the latest Ally features, improvements, and bug fixes. See what's new in each version."
        path="/changelog"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Changelog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay up to date with the latest features, improvements, and fixes in Ally.
          </p>
        </div>

        {/* Placeholder Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-8">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>PLACEHOLDER:</strong> Replace all entries below with actual release notes. Follow semantic versioning (MAJOR.MINOR.PATCH) and include dates in YYYY-MM-DD format.
          </p>
        </div>

        {/* Legend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Change Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  New
                </Badge>
                <span className="text-sm text-muted-foreground">New features</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Rocket className="h-3 w-3" />
                  Improved
                </Badge>
                <span className="text-sm text-muted-foreground">Enhancements</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Bug className="h-3 w-3" />
                  Fixed
                </Badge>
                <span className="text-sm text-muted-foreground">Bug fixes</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Security
                </Badge>
                <span className="text-sm text-muted-foreground">Security updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="gap-1">
                  <Wrench className="h-3 w-3" />
                  Breaking
                </Badge>
                <span className="text-sm text-muted-foreground">Breaking changes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Release Entries */}
        <div className="space-y-8">
          {releases.map((release, index) => (
            <Card key={index} className="relative">
              {/* Version connector line */}
              {index < releases.length - 1 && (
                <div className="absolute left-8 top-full w-0.5 h-8 bg-border" />
              )}
              
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-16 h-8 rounded-full bg-primary/10 text-primary text-sm font-mono">
                      v{release.version}
                    </span>
                    <span className="text-foreground">{release.title}</span>
                  </CardTitle>
                  <time className="text-sm text-muted-foreground font-mono">
                    {release.date}
                  </time>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {release.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-3">
                      <Badge 
                        variant={getChangeBadgeVariant(change.type)} 
                        className="gap-1 shrink-0 mt-0.5"
                      >
                        {getChangeIcon(change.type)}
                        {getChangeLabel(change.type)}
                      </Badge>
                      <span className="text-foreground/90">{change.description}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscribe Section */}
        <section className="mt-16 text-center p-8 bg-muted/30 rounded-2xl border">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Stay Updated</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Get notified about new features and updates. Follow our changelog or subscribe to release notes.
          </p>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add newsletter signup form or RSS feed link for changelog updates.
            </p>
          </div>
        </section>

        {/* Versioning Note */}
        <section className="mt-8 p-6 bg-muted/30 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2 text-foreground">About Our Versioning</h3>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-3">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Customize versioning explanation as needed.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            We follow <a href="https://semver.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Semantic Versioning</a> (SemVer). 
            Version numbers are formatted as MAJOR.MINOR.PATCH where:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
            <li><strong>MAJOR:</strong> Breaking changes that may require action</li>
            <li><strong>MINOR:</strong> New features that are backwards compatible</li>
            <li><strong>PATCH:</strong> Bug fixes and minor improvements</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Changelog;
