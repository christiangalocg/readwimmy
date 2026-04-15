import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-background" />
      <div className="container relative z-10 mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            The AI Layer for
            <br />
            <span className="text-gradient-warm">Global Reading Comprehension</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of readers and students who never forget what they read.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-warm text-accent-foreground font-semibold text-base px-10 py-6 shadow-glow hover:opacity-90 transition-opacity">
              <BookOpen className="w-5 h-5 mr-2" />
              Get Started — It's Free
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
