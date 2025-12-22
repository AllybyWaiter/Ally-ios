import { motion } from "framer-motion";
import { Shield, Lock, CreditCard } from "lucide-react";

const testimonials = [
  {
    quote: "Ally caught a pH trend I would have missed. Saved my reef tank from a potential crash.",
    name: "Marcus T.",
    type: "Reef Aquarium",
    avatar: "M",
  },
  {
    quote: "Finally, a pool app that actually understands my setup. The voice commands are a game-changer.",
    name: "Sarah K.",
    type: "Pool Owner",
    avatar: "S",
  },
  {
    quote: "I went from testing once a month to weekly because Ally makes it so effortless.",
    name: "James R.",
    type: "Hot Tub Owner",
    avatar: "J",
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

const SocialProof = () => {
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

        {/* Testimonials */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-card border border-border/50 rounded-2xl p-6 relative"
            >
              <div className="absolute -top-3 left-6 text-4xl text-primary/20 font-serif">"</div>
              <p className="text-foreground mb-6 pt-2 leading-relaxed">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.type}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Badges */}
        <motion.div 
          className="flex flex-wrap justify-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div 
                key={index}
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

export default SocialProof;
