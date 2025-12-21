import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { BookOpen, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Glossary = () => {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const glossaryTerms = [
    {
      term: "Alkalinity",
      category: "General",
      definition: "[PLACEHOLDER: The measure of water's ability to neutralize acids, important for pH stability]",
      idealRange: "[IDEAL RANGE - e.g., 80-120 ppm for pools]",
    },
    {
      term: "Ammonia",
      category: "Aquarium",
      definition: "[PLACEHOLDER: A toxic compound produced by fish waste, uneaten food, and decaying matter]",
      idealRange: "[IDEAL RANGE - e.g., 0 ppm]",
    },
    {
      term: "Bromine",
      category: "Spa",
      definition: "[PLACEHOLDER: A sanitizer commonly used in hot tubs as an alternative to chlorine]",
      idealRange: "[IDEAL RANGE - e.g., 3-5 ppm]",
    },
    {
      term: "Calcium Hardness",
      category: "Pool",
      definition: "[PLACEHOLDER: The measure of dissolved calcium in water, affects water balance]",
      idealRange: "[IDEAL RANGE - e.g., 200-400 ppm]",
    },
    {
      term: "Chlorine",
      category: "Pool",
      definition: "[PLACEHOLDER: Primary sanitizer for pools, kills bacteria and algae]",
      idealRange: "[IDEAL RANGE - e.g., 1-3 ppm free chlorine]",
    },
    {
      term: "Cyanuric Acid",
      category: "Pool",
      definition: "[PLACEHOLDER: A stabilizer that protects chlorine from UV degradation]",
      idealRange: "[IDEAL RANGE - e.g., 30-50 ppm]",
    },
    {
      term: "Denitrification",
      category: "Aquarium",
      definition: "[PLACEHOLDER: The biological process of converting nitrates to nitrogen gas]",
      idealRange: "N/A",
    },
    {
      term: "GH (General Hardness)",
      category: "Aquarium",
      definition: "[PLACEHOLDER: Measure of calcium and magnesium ions in water]",
      idealRange: "[IDEAL RANGE - varies by species]",
    },
    {
      term: "KH (Carbonate Hardness)",
      category: "Aquarium",
      definition: "[PLACEHOLDER: Measure of carbonate and bicarbonate ions, affects pH stability]",
      idealRange: "[IDEAL RANGE - varies by species]",
    },
    {
      term: "Nitrate",
      category: "Aquarium",
      definition: "[PLACEHOLDER: End product of the nitrogen cycle, less toxic but should be controlled]",
      idealRange: "[IDEAL RANGE - e.g., <20 ppm for freshwater]",
    },
    {
      term: "Nitrite",
      category: "Aquarium",
      definition: "[PLACEHOLDER: Intermediate product of nitrogen cycle, toxic to fish]",
      idealRange: "[IDEAL RANGE - e.g., 0 ppm]",
    },
    {
      term: "pH",
      category: "General",
      definition: "[PLACEHOLDER: Measure of acidity or alkalinity on a scale of 0-14]",
      idealRange: "[IDEAL RANGE - varies by water body type]",
    },
    {
      term: "Phosphates",
      category: "General",
      definition: "[PLACEHOLDER: Nutrients that can promote algae growth when elevated]",
      idealRange: "[IDEAL RANGE - e.g., <100 ppb]",
    },
    {
      term: "Salinity",
      category: "Aquarium",
      definition: "[PLACEHOLDER: The concentration of dissolved salts in water]",
      idealRange: "[IDEAL RANGE - e.g., 1.024-1.026 sg for reef tanks]",
    },
    {
      term: "TDS (Total Dissolved Solids)",
      category: "General",
      definition: "[PLACEHOLDER: Total amount of dissolved substances in water]",
      idealRange: "[IDEAL RANGE - varies by application]",
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Aquarium":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "Pool":
        return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30";
      case "Spa":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
    }
  };

  const filteredTerms = glossaryTerms.filter((item) => {
    const matchesLetter = !selectedLetter || item.term.startsWith(selectedLetter);
    const matchesSearch = !searchQuery || 
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLetter && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <SEO 
        title="Glossary"
        description="Water care terminology from A-Z. Learn about aquarium, pool, and spa water chemistry terms, ideal ranges, and definitions."
        path="/glossary"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Water Care Glossary
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive guide to water chemistry terms for aquariums, pools, and spas.
          </p>
        </div>

        {/* Placeholder Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-12">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>PLACEHOLDER:</strong> Add complete definitions, ideal ranges, and expand the term list. Consider adding related terms and links to relevant articles.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* A-Z Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            variant={selectedLetter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLetter(null)}
          >
            All
          </Button>
          {alphabet.map((letter) => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLetter(letter)}
              className="w-9 h-9 p-0"
            >
              {letter}
            </Button>
          ))}
        </div>

        {/* Terms List */}
        <section className="mb-16">
          <div className="space-y-4">
            {filteredTerms.length > 0 ? (
              filteredTerms.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">{item.term}</h3>
                          <Badge variant="outline" className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{item.definition}</p>
                        {item.idealRange !== "N/A" && (
                          <p className="text-sm">
                            <span className="font-medium text-foreground">Ideal Range:</span>{" "}
                            <span className="text-muted-foreground">{item.idealRange}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No terms found matching your criteria.</p>
              </div>
            )}
          </div>
        </section>

        {/* Category Legend */}
        <section className="mb-16">
          <h2 className="text-xl font-bold mb-4 text-foreground">Categories</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className={getCategoryColor("Aquarium")}>Aquarium</Badge>
            <Badge variant="outline" className={getCategoryColor("Pool")}>Pool</Badge>
            <Badge variant="outline" className={getCategoryColor("Spa")}>Spa</Badge>
            <Badge variant="outline" className={getCategoryColor("General")}>General</Badge>
          </div>
        </section>

        {/* Suggest a Term */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Missing a Term?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Help us expand our glossary by suggesting terms that should be included.
          </p>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add contact form or email for term suggestions.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Glossary;
