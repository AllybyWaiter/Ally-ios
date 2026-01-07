import { motion } from "framer-motion";
import { Shield, Lock, CreditCard, Star, Fish, Waves, Droplets, Thermometer, Heart } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

interface Testimonial {
  quote: string;
  name: string;
  type: string;
  avatar: string;
  rating: number;
  metric?: string;
  metricLabel?: string;
  waterType: "reef" | "freshwater" | "pool" | "hottub" | "planted";
}

const testimonials: Testimonial[] = [
  {
    quote: "Ally caught a pH trend I would have missed. Saved my reef tank from a potential crash.",
    name: "Marcus T.",
    type: "Reef Aquarium",
    avatar: "M",
    rating: 5,
    metric: "3 months",
    metricLabel: "crash-free",
    waterType: "reef",
  },
  {
    quote: "Finally, a pool app that actually understands my setup. The voice commands are a game-changer.",
    name: "Sarah K.",
    type: "Pool Owner",
    avatar: "S",
    rating: 5,
    metric: "50%",
    metricLabel: "less time testing",
    waterType: "pool",
  },
  {
    quote: "I went from testing once a month to weekly because Ally makes it so effortless.",
    name: "James R.",
    type: "Hot Tub Owner",
    avatar: "J",
    rating: 5,
    metric: "4x",
    metricLabel: "more frequent testing",
    waterType: "hottub",
  },
  {
    quote: "My planted tank has never looked better. The AI suggestions for CO2 and ferts are spot on.",
    name: "Elena V.",
    type: "Planted Tank",
    avatar: "E",
    rating: 5,
    metric: "Zero",
    metricLabel: "algae outbreaks",
    waterType: "planted",
  },
  {
    quote: "As a beginner, having Ally explain what each parameter means saved me from so many mistakes.",
    name: "David L.",
    type: "Freshwater",
    avatar: "D",
    rating: 5,
    metric: "100%",
    metricLabel: "fish survival rate",
    waterType: "freshwater",
  },
  {
    quote: "The trend analysis predicted my chlorine would drop before a party. Ally had me prepared!",
    name: "Michelle B.",
    type: "Pool Owner",
    avatar: "M",
    rating: 5,
    metric: "$200+",
    metricLabel: "saved on chemicals",
    waterType: "pool",
  },
];

const trustBadges = [
  {
    icon: Lock,
    text: "Data Encrypted",
  },
  {
    icon: Shield,
    text: "GDPR Compliant",
  },
  {
    icon: CreditCard,
    text: "No Card Required",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

const getWaterTypeIcon = (type: Testimonial["waterType"]) => {
  switch (type) {
    case "reef":
    case "freshwater":
      return Fish;
    case "planted":
      return Heart;
    case "pool":
      return Waves;
    case "hottub":
      return Thermometer;
    default:
      return Droplets;
  }
};

const getWaterTypeColor = (type: Testimonial["waterType"]) => {
  switch (type) {
    case "reef":
      return "text-blue-500";
    case "freshwater":
      return "text-cyan-500";
    case "planted":
      return "text-green-500";
    case "pool":
      return "text-sky-500";
    case "hottub":
      return "text-orange-500";
    default:
      return "text-primary";
  }
};

const SocialProof = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-24 px-4 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Trusted by Water Care Enthusiasts
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of aquarium keepers, pool owners, and spa enthusiasts who trust Ally.
          </p>
        </motion.div>

        {/* Testimonials Carousel for mobile, Grid for desktop */}
        {isMobile ? (
          <Carousel className="w-full mb-16" opts={{ loop: true, align: "start" }}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.name} className="pl-2 md:pl-4 basis-[85%]">
                  <TestimonialCard testimonial={testimonial} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-2 mt-4">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        ) : (
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.name} variants={itemVariants}>
                <TestimonialCard testimonial={testimonial} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Trust Badges */}
        <motion.div 
          className="flex flex-wrap justify-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {trustBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div 
                key={badge.text}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const WaterIcon = getWaterTypeIcon(testimonial.waterType);
  const colorClass = getWaterTypeColor(testimonial.waterType);
  
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 relative h-full flex flex-col">
      {/* Quote mark */}
      <div className="absolute -top-3 left-6 text-4xl text-primary/20 font-serif">"</div>
      
      {/* Rating */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      
      {/* Quote */}
      <p className="text-foreground mb-4 pt-2 leading-relaxed flex-grow">
        {testimonial.quote}
      </p>
      
      {/* Metric highlight */}
      {testimonial.metric && (
        <div className="bg-primary/5 rounded-lg px-3 py-2 mb-4 inline-flex items-center gap-2 self-start">
          <span className="font-bold text-primary">{testimonial.metric}</span>
          <span className="text-sm text-muted-foreground">{testimonial.metricLabel}</span>
        </div>
      )}
      
      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/30">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {testimonial.avatar}
        </div>
        <div className="flex-grow">
          <p className="font-medium text-foreground">{testimonial.name}</p>
          <div className="flex items-center gap-1.5">
            <WaterIcon className={`w-3.5 h-3.5 ${colorClass}`} />
            <p className="text-sm text-muted-foreground">{testimonial.type}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialProof;
