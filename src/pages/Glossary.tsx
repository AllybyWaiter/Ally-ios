import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ArrowRight, Fish, Droplets, Waves, FlaskConical } from "lucide-react";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: "aquarium" | "pool" | "spa" | "general";
  idealRange?: string;
  relatedTerms?: string[];
}

const glossaryTerms: GlossaryTerm[] = [
  // Aquarium-Specific Terms
  {
    term: "Ammonia (NH₃/NH₄⁺)",
    definition: "Toxic nitrogen compound from fish waste, uneaten food, and decaying organic matter. The first stage of the nitrogen cycle. Even small amounts stress fish and can be fatal.",
    category: "aquarium",
    idealRange: "0 ppm (any detectable level is dangerous)",
    relatedTerms: ["Nitrogen Cycle", "Nitrite", "Beneficial Bacteria"]
  },
  {
    term: "Beneficial Bacteria",
    definition: "Nitrifying bacteria (Nitrosomonas, Nitrobacter) that colonize filter media and surfaces, processing ammonia and nitrite into less harmful nitrate. Essential for a healthy aquarium.",
    category: "aquarium",
    relatedTerms: ["Nitrogen Cycle", "Cycling", "Bioload"]
  },
  {
    term: "Bioload",
    definition: "Total biological waste produced by fish, invertebrates, and decaying matter in an aquarium. Higher bioload requires more filtration capacity and more frequent water changes.",
    category: "aquarium",
    relatedTerms: ["Nitrogen Cycle", "Water Change"]
  },
  {
    term: "Calcium (Reef)",
    definition: "Essential mineral for coral skeleton growth, invertebrate shells, and coralline algae development. Depleted by calcifying organisms and must be supplemented in reef tanks.",
    category: "aquarium",
    idealRange: "380–450 ppm (reef tanks)",
    relatedTerms: ["Magnesium", "Alkalinity", "KH"]
  },
  {
    term: "CO₂ (Carbon Dioxide)",
    definition: "Essential for planted tank photosynthesis. Injected CO₂ promotes plant growth but excessive levels can stress fish by reducing available oxygen.",
    category: "aquarium",
    idealRange: "20–35 ppm (planted tanks)",
    relatedTerms: ["pH", "Planted Tank"]
  },
  {
    term: "Cycling",
    definition: "Process of establishing beneficial bacteria colonies in a new aquarium before adding fish. Can take 4–8 weeks. Critical for fish survival and prevents 'new tank syndrome.'",
    category: "aquarium",
    relatedTerms: ["Nitrogen Cycle", "Beneficial Bacteria", "Ammonia"]
  },
  {
    term: "Denitrification",
    definition: "Anaerobic bacterial process that converts nitrate to harmless nitrogen gas. Occurs naturally in deep sand beds, porous live rock, and specialized filter media.",
    category: "aquarium",
    relatedTerms: ["Nitrate", "Nitrogen Cycle"]
  },
  {
    term: "GH (General Hardness)",
    definition: "Measures dissolved calcium and magnesium ions in water. Affects fish osmoregulation, breeding, and shell/coral development. Different species have different GH requirements.",
    category: "aquarium",
    idealRange: "4–8 dGH (freshwater), 8–12 dGH (African cichlids)",
    relatedTerms: ["KH", "Minerals"]
  },
  {
    term: "KH (Carbonate Hardness)",
    definition: "Measures carbonates and bicarbonates that buffer pH, preventing dangerous pH swings. Critical for reef tanks where stable pH is essential for coral health.",
    category: "aquarium",
    idealRange: "3–8 dKH (freshwater), 8–12 dKH (saltwater/reef)",
    relatedTerms: ["pH", "Alkalinity", "GH"]
  },
  {
    term: "Magnesium",
    definition: "Works synergistically with calcium and alkalinity for coral health in reef tanks. Stabilizes calcium and alkalinity balance; deficiency causes calcium precipitation.",
    category: "aquarium",
    idealRange: "1250–1350 ppm (reef tanks)",
    relatedTerms: ["Calcium", "Alkalinity"]
  },
  {
    term: "Nitrate (NO₃⁻)",
    definition: "End product of the nitrogen cycle. Less toxic than ammonia/nitrite but causes fish stress, algae blooms, and coral issues when elevated. Removed through water changes and plants.",
    category: "aquarium",
    idealRange: "<20 ppm freshwater, <10 ppm reef, <40 ppm marine",
    relatedTerms: ["Nitrogen Cycle", "Nitrite", "Water Change"]
  },
  {
    term: "Nitrite (NO₂⁻)",
    definition: "Second stage of the nitrogen cycle, produced when beneficial bacteria convert ammonia. Highly toxic to fish by binding to hemoglobin and preventing oxygen transport.",
    category: "aquarium",
    idealRange: "0 ppm (any level is harmful)",
    relatedTerms: ["Nitrogen Cycle", "Ammonia", "Nitrate"]
  },
  {
    term: "Nitrogen Cycle",
    definition: "Biological process where beneficial bacteria convert toxic ammonia → nitrite → less-toxic nitrate. Foundation of aquarium health and the reason cycling is essential.",
    category: "aquarium",
    relatedTerms: ["Ammonia", "Nitrite", "Nitrate", "Cycling"]
  },
  {
    term: "Phosphate (PO₄³⁻)",
    definition: "Nutrient that fuels nuisance algae growth when elevated. Enters aquariums through feeding, tap water, and decaying matter. Especially problematic in reef tanks.",
    category: "aquarium",
    idealRange: "<0.03 ppm reef, <0.5 ppm freshwater",
    relatedTerms: ["Algae", "Water Change"]
  },
  {
    term: "Salinity",
    definition: "Concentration of dissolved salts in water, critical for marine life osmoregulation. Measured in specific gravity (SG) or parts per thousand (ppt). Stability is more important than exact values.",
    category: "aquarium",
    idealRange: "1.023–1.026 SG (35 ppt)",
    relatedTerms: ["Specific Gravity", "Marine"]
  },
  {
    term: "Specific Gravity (SG)",
    definition: "Ratio of saltwater density to pure water density. Standard method for measuring salinity in marine aquariums using a hydrometer or refractometer.",
    category: "aquarium",
    idealRange: "1.023–1.026",
    relatedTerms: ["Salinity"]
  },

  // Pool-Specific Terms
  {
    term: "Calcium Hardness",
    definition: "Dissolved calcium level that prevents water from being corrosive (low) or scaling (high). Protects pool surfaces, plumbing, and equipment from damage.",
    category: "pool",
    idealRange: "200–400 ppm",
    relatedTerms: ["Saturation Index", "Scaling"]
  },
  {
    term: "Combined Chlorine",
    definition: "Chlorine bound to ammonia and nitrogen compounds, forming chloramines. Causes eye/skin irritation and the 'chlorine smell.' Removed by shocking the pool.",
    category: "pool",
    idealRange: "<0.5 ppm (shock if higher)",
    relatedTerms: ["Free Chlorine", "Total Chlorine", "Shock Treatment"]
  },
  {
    term: "Cyanuric Acid (CYA/Stabilizer)",
    definition: "Protects chlorine from UV degradation in outdoor pools. Essential for sunny climates but excessive levels reduce chlorine effectiveness. Indoor pools typically don't need it.",
    category: "pool",
    idealRange: "30–50 ppm outdoor pools, 0 ppm indoor",
    relatedTerms: ["Free Chlorine", "UV"]
  },
  {
    term: "Free Chlorine",
    definition: "Active, available chlorine that sanitizes pool water by killing bacteria, algae, and pathogens. The most important sanitizer measurement for pool safety.",
    category: "pool",
    idealRange: "1–3 ppm (pools), 3–5 ppm (spas)",
    relatedTerms: ["Total Chlorine", "Combined Chlorine"]
  },
  {
    term: "Salt (Pool)",
    definition: "Sodium chloride level for saltwater chlorine generators. The salt cell converts salt to chlorine through electrolysis, providing continuous sanitization.",
    category: "pool",
    idealRange: "2700–3400 ppm (target 3200 ppm)",
    relatedTerms: ["Salt Cell", "Chlorine Generator"]
  },
  {
    term: "Saturation Index (LSI)",
    definition: "Langelier Saturation Index calculates if water is corrosive, balanced, or scale-forming based on pH, temperature, alkalinity, calcium, and TDS. Used to prevent equipment damage.",
    category: "pool",
    idealRange: "-0.3 to +0.3 (balanced)",
    relatedTerms: ["Calcium Hardness", "Total Alkalinity", "pH"]
  },
  {
    term: "Shock Treatment",
    definition: "Adding high dose of chlorine (or non-chlorine oxidizer) to destroy chloramines, organic contaminants, and algae. Perform weekly or after heavy use, rain, or visible problems.",
    category: "pool",
    idealRange: "10x normal chlorine (follow product directions)",
    relatedTerms: ["Combined Chlorine", "Free Chlorine"]
  },
  {
    term: "TDS (Pool)",
    definition: "Total Dissolved Solids measures all dissolved substances including minerals, salts, and organics. High TDS reduces sanitizer effectiveness and causes cloudy water.",
    category: "pool",
    idealRange: "<1500 ppm (pools), <2000 ppm (spas)",
    relatedTerms: ["Water Clarity"]
  },
  {
    term: "Total Alkalinity",
    definition: "Water's ability to resist pH changes by buffering acids. Prevents 'pH bounce' that stresses swimmers and damages equipment. Adjust before correcting pH.",
    category: "pool",
    idealRange: "80–120 ppm",
    relatedTerms: ["pH", "Saturation Index"]
  },
  {
    term: "Total Chlorine",
    definition: "Combined amount of free chlorine plus combined chlorine. Should be close to free chlorine level; a large gap indicates chloramines need to be removed by shocking.",
    category: "pool",
    idealRange: "Within 0.5 ppm of free chlorine",
    relatedTerms: ["Free Chlorine", "Combined Chlorine"]
  },

  // Spa-Specific Terms
  {
    term: "Bromine",
    definition: "Alternative sanitizer to chlorine, more stable at spa temperatures (above 95°F). Produces less odor than chlorine and remains effective in a wider pH range.",
    category: "spa",
    idealRange: "3–5 ppm",
    relatedTerms: ["Chlorine", "Sanitizer"]
  },
  {
    term: "Drain & Refill",
    definition: "Complete water replacement recommended every 3–4 months for spas due to concentrated contaminants in a small volume. More frequent with heavy use or persistent water quality issues.",
    category: "spa",
    idealRange: "Every 3–4 months",
    relatedTerms: ["TDS", "Water Quality"]
  },
  {
    term: "Foam",
    definition: "Foam on spa water surface caused by body oils, lotions, soaps, detergents, and high TDS. Indicates water quality issues that may require treatment or a complete drain and refill.",
    category: "spa",
    idealRange: "None visible",
    relatedTerms: ["TDS", "Drain & Refill"]
  },
  {
    term: "Ozone (O₃)",
    definition: "Supplemental sanitizer using ozone gas to oxidize contaminants. Reduces chemical demand significantly but doesn't provide residual protection—must be used with chlorine or bromine.",
    category: "spa",
    idealRange: "System-dependent (supplemental only)",
    relatedTerms: ["Sanitizer", "Oxidation"]
  },

  // General Water Chemistry Terms
  {
    term: "Alkalinity",
    definition: "Water's buffering capacity against pH changes. Not the same as pH itself—alkalinity measures the ability to resist pH swings. Critical for all water bodies.",
    category: "general",
    idealRange: "80–120 ppm pools, 3–8 dKH freshwater aquarium",
    relatedTerms: ["pH", "KH", "Total Alkalinity"]
  },
  {
    term: "dGH (Degrees of General Hardness)",
    definition: "German measurement unit for general hardness measuring calcium and magnesium. Common in aquarium hobby. 1 dGH ≈ 17.9 ppm CaCO₃ equivalent.",
    category: "general",
    relatedTerms: ["GH", "dKH"]
  },
  {
    term: "dKH (Degrees of Carbonate Hardness)",
    definition: "German measurement unit for carbonate hardness. Standard in aquarium hobby. 1 dKH = 17.9 ppm CaCO₃. Also called 'degrees KH' or simply 'KH.'",
    category: "general",
    relatedTerms: ["KH", "dGH"]
  },
  {
    term: "Liquid Test Kit",
    definition: "Reagent-based testing using drops and color comparison charts. More accurate and reliable than test strips for most parameters, especially ammonia and pH.",
    category: "general",
    relatedTerms: ["Test Strip", "Water Testing"]
  },
  {
    term: "Oxidation",
    definition: "Chemical reaction that removes electrons from contaminants, neutralizing them. Chlorine, bromine, ozone, and hydrogen peroxide all sanitize through oxidation.",
    category: "general",
    relatedTerms: ["Sanitizer", "Shock Treatment"]
  },
  {
    term: "pH",
    definition: "Logarithmic measure of hydrogen ion concentration indicating acidity (0–6.9) or alkalinity (7.1–14). 7.0 is neutral. Each whole number represents a 10x change in acidity.",
    category: "general",
    idealRange: "6.5–7.5 freshwater, 7.8–8.4 saltwater, 7.2–7.8 pools",
    relatedTerms: ["Alkalinity", "KH"]
  },
  {
    term: "ppm (Parts Per Million)",
    definition: "Standard unit of concentration measurement equivalent to mg/L (milligrams per liter). One ppm = 1 milligram of substance in 1 liter of water.",
    category: "general",
    relatedTerms: ["dKH", "dGH"]
  },
  {
    term: "Sanitizer",
    definition: "Chemical that kills bacteria, viruses, algae, and other pathogens in water. Common sanitizers include chlorine, bromine, and ozone. Essential for safe water.",
    category: "general",
    relatedTerms: ["Chlorine", "Bromine", "Ozone"]
  },
  {
    term: "Temperature",
    definition: "Water temperature affects organism metabolism, oxygen solubility, chemical reaction rates, and sanitizer effectiveness. Stable temperatures reduce stress on aquatic life.",
    category: "general",
    idealRange: "72–78°F freshwater, 76–80°F reef, 78–84°F pools, 100–104°F spas",
    relatedTerms: ["Oxygen", "Metabolism"]
  },
  {
    term: "Test Strip",
    definition: "Paper strips with reagent pads that change color to indicate parameter levels. Fast and convenient but generally less accurate than liquid test kits.",
    category: "general",
    relatedTerms: ["Liquid Test Kit", "Water Testing"]
  },
  {
    term: "Water Change",
    definition: "Removing and replacing a portion of water to dilute pollutants, remove nitrates, and replenish minerals. Frequency depends on bioload, test results, and water body type.",
    category: "general",
    idealRange: "Weekly 10–25% aquariums, as needed pools/spas",
    relatedTerms: ["Nitrate", "TDS"]
  }
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case "aquarium":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "pool":
      return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
    case "spa":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    case "general":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "aquarium":
      return <Fish className="h-3.5 w-3.5" />;
    case "pool":
      return <Droplets className="h-3.5 w-3.5" />;
    case "spa":
      return <Waves className="h-3.5 w-3.5" />;
    case "general":
      return <FlaskConical className="h-3.5 w-3.5" />;
    default:
      return null;
  }
};

const Glossary = () => {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const filteredTerms = useMemo(() => {
    let terms = glossaryTerms;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      terms = terms.filter(
        (term) =>
          term.term.toLowerCase().includes(query) ||
          term.definition.toLowerCase().includes(query) ||
          term.category.toLowerCase().includes(query)
      );
    }
    
    if (selectedLetter) {
      terms = terms.filter((term) =>
        term.term.toUpperCase().startsWith(selectedLetter)
      );
    }
    
    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }, [selectedLetter, searchQuery]);

  const availableLetters = useMemo(() => {
    const letters = new Set(glossaryTerms.map(term => term.term[0].toUpperCase()));
    return letters;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Water Chemistry Glossary"
        description="Comprehensive glossary of water chemistry terms for aquariums, pools, and spas. Learn about pH, ammonia, nitrite, nitrate, chlorine, alkalinity, and more with ideal ranges."
        path="/glossary"
      />
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Water Chemistry Glossary</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Water Testing Terms Explained
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Comprehensive definitions and ideal ranges for aquarium, pool, and spa water parameters
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search terms (pH, ammonia, chlorine...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedLetter(null);
                }}
                className="pl-12 h-14 text-lg rounded-full border-2 focus:border-primary"
              />
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Found {filteredTerms.length} term{filteredTerms.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* A-Z Navigation */}
            <div className="flex flex-wrap justify-center gap-1 md:gap-2">
              <Button
                variant={selectedLetter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLetter(null)}
                className="w-10 h-10"
              >
                All
              </Button>
              {alphabet.map((letter) => (
                <Button
                  key={letter}
                  variant={selectedLetter === letter ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedLetter(letter);
                    setSearchQuery("");
                  }}
                  disabled={!availableLetters.has(letter)}
                  className="w-8 h-8 md:w-10 md:h-10 p-0 text-xs md:text-sm"
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Category Legend */}
        <section className="container mx-auto px-4 mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { key: "aquarium", label: "Aquarium", icon: Fish },
              { key: "pool", label: "Pool", icon: Droplets },
              { key: "spa", label: "Spa", icon: Waves },
              { key: "general", label: "General", icon: FlaskConical },
            ].map(({ key, label, icon: Icon }) => (
              <Badge
                key={key}
                variant="outline"
                className={`${getCategoryColor(key)} gap-1.5 px-3 py-1.5`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Badge>
            ))}
          </div>
        </section>

        {/* Terms Grid */}
        <section className="container mx-auto px-4">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No terms found matching "{searchQuery || selectedLetter}"
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLetter(null);
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTerms.map((item) => (
                <Card
                  key={item.term}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">
                        {item.term}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`${getCategoryColor(item.category)} shrink-0 gap-1`}
                      >
                        {getCategoryIcon(item.category)}
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="text-sm leading-relaxed">
                      {item.definition}
                    </CardDescription>
                    {item.idealRange && (
                      <div className="bg-muted/50 rounded-md px-3 py-2">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Ideal Range
                        </p>
                        <p className="text-sm font-medium">{item.idealRange}</p>
                      </div>
                    )}
                    {item.relatedTerms && item.relatedTerms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.relatedTerms.slice(0, 3).map((related) => (
                          <Badge
                            key={related}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-secondary/80"
                            onClick={() => {
                              setSearchQuery(related);
                              setSelectedLetter(null);
                            }}
                          >
                            {related}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Help Center CTA */}
        <section className="container mx-auto px-4 mt-16">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Need more help?</h3>
              <p className="text-muted-foreground mb-6">
                Check out our Help Center for guides, tutorials, and articles about water testing and maintenance.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link to="/help">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Visit Help Center
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">
                    Suggest a Term
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Glossary;
