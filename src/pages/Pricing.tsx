import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Building2, Sparkles } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_DEFINITIONS, type PlanTier } from "@/lib/planConstants";

const PLAN_ORDER: PlanTier[] = ["free", "basic", "plus", "gold", "business"];

const formatPrice = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export default function Pricing() {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = useMemo(() => PLAN_ORDER.map((tier) => ({
    tier,
    definition: PLAN_DEFINITIONS[tier],
  })), []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 pt-24 pb-24 md:pb-8 mt-safe max-w-5xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Compare All Plans</h1>
          <p className="text-muted-foreground">
            Choose the plan that fits your aquatic spaces and workflow.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 w-fit">
          <Button
            size="sm"
            variant={!isAnnual ? "default" : "outline"}
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </Button>
          <Button
            size="sm"
            variant={isAnnual ? "default" : "outline"}
            onClick={() => setIsAnnual(true)}
            className="gap-2"
          >
            Annual
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Save 20%
            </Badge>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map(({ tier, definition }) => {
            const pricing = definition.pricing;
            const priceLabel = pricing
              ? `${formatPrice(isAnnual ? pricing.displayYearly : pricing.displayMonthly)}/${isAnnual ? "yr" : "mo"}`
              : tier === "business" || tier === "enterprise"
                ? "Contact sales"
                : "Free";

            return (
              <Card
                key={tier}
                className={tier === "plus" ? "border-primary/60 shadow-sm" : undefined}
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      {tier === "plus" && <Sparkles className="h-4 w-4 text-primary" />}
                      {tier === "gold" && <Crown className="h-4 w-4 text-amber-500" />}
                      {tier === "business" && <Building2 className="h-4 w-4 text-muted-foreground" />}
                      {definition.name}
                    </CardTitle>
                    {tier === "plus" && <Badge>Popular</Badge>}
                  </div>
                  <CardDescription>{definition.description}</CardDescription>
                  <p className="text-2xl font-bold tracking-tight">{priceLabel}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {definition.marketingFeatures.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
