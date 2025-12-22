import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "How accurate is Ally's AI analysis?",
    answer: "Ally achieves 98% accuracy in interpreting water test results when readings are entered correctly or photos are clear. Our AI is trained on thousands of test results and professional recommendations.",
  },
  {
    question: "Which test kits work with Ally?",
    answer: "Ally supports both test strips and liquid reagent kits from any standard brand. Popular options include API Master Kits, Tetra EasyStrips, AquaChek, and Taylor test kits for pools and spas.",
  },
  {
    question: "Can I use Ally without an internet connection?",
    answer: "Yes! Ally caches your data locally so you can view your tanks, test history, and tasks offline. AI features require a connection, but previously loaded data remains accessible.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. All data is encrypted in transit and at rest. We're GDPR compliant and never sell your data. You can export or delete your data at any time from settings.",
  },
  {
    question: "What devices does Ally work on?",
    answer: "Ally is a Progressive Web App that works on any device with a browser—iPhone, Android, tablet, or desktop. Install it to your home screen for a native app experience.",
  },
];

const FAQ = () => {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-3xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Quick answers to common questions about Ally
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index}
                value={`item-${index}`} 
                className="border border-border/50 rounded-xl px-6 bg-card/50"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div 
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Button variant="ghost" asChild className="group">
            <Link to="/faq">
              View All FAQs
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
