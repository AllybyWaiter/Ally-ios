import { Camera, Sparkles, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Camera,
    number: "01",
    title: "Test Your Water",
    description: "Use any standard test kit and snap a photo of your results.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "AI Does the Work",
    description: "Ally analyzes your water chemistry in seconds using advanced AI.",
  },
  {
    icon: CheckCircle2,
    number: "03",
    title: "Follow the Plan",
    description: "Get clear, actionable steps to achieve and maintain perfect water.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Three Steps to Perfect Water
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Maintaining your aquarium has never been easier. No chemistry degree required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-secondary" />
                )}
                
                <div className="text-center relative">
                  <div className="inline-flex w-24 h-24 rounded-full bg-gradient-water items-center justify-center mb-6 relative z-10">
                    <Icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div className="absolute top-0 right-0 text-6xl font-bold text-muted/20">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
