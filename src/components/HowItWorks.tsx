import { Camera, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Camera,
    number: "01",
    title: "Test Your Water",
    description: "Use any standard test kit and snap a photo — or speak to Ally hands-free.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "AI Does the Work",
    description: "Ally analyzes your water chemistry in seconds with proactive trend detection.",
  },
  {
    icon: CheckCircle2,
    number: "03",
    title: "Follow the Plan",
    description: "Get clear, actionable steps with voice responses and push notifications.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Three Steps to Perfect Water
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Maintaining your aquarium, pool, or spa has never been easier.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, stepIndex) => {
            const Icon = step.icon;
            return (
              <motion.div 
                key={step.number} 
                className="relative"
                variants={stepVariants}
              >
                {/* Connector Line - Desktop */}
                {stepIndex < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-border" />
                )}
                
                <div className="text-center relative">
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {stepIndex + 1}
                    </span>
                  </div>
                  
                  <motion.div 
                    className="inline-flex w-24 h-24 rounded-full bg-muted items-center justify-center mb-6 relative z-10 border border-border"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon className="w-10 h-10 text-primary" />
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
