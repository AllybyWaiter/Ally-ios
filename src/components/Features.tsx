import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Camera, LineChart, Bell, Mic, Smartphone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  {
    icon: Brain,
    title: "Smart AI Assistant",
    description: "Ask anything about water care. Ally understands your setup and gives personalized advice instantly.",
  },
  {
    icon: Camera,
    title: "Photo Intelligence",
    description: "Snap a photo of your test strip or livestock. Ally reads results and tracks changes over time.",
  },
  {
    icon: Mic,
    title: "Voice Enabled",
    description: "Talk to Ally hands-free. Ask questions, log results, and get spoken responses while your hands are busy.",
  },
  {
    icon: LineChart,
    title: "Proactive Alerts",
    description: "AI watches your water data and warns you before small issues become big problems.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Never miss a water change. Get push notifications for tasks, alerts, and personalized tips.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description: "Install on any device. Works offline, syncs automatically, and feels like a native app.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const Features = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Everything You Need, Nothing You Don't
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sophisticated technology, simple experience. For aquariums, pools, and spas.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Button variant="outline" size="lg" asChild className="group">
            <Link to="/features">
              View All Features
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
