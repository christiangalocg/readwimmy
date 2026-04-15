import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBook from "@/assets/hero-book.png";
import { BookOpen, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-secondary-foreground">AI-Powered Reading Companion</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
            Never Forget
            <br />
            <span className="text-gradient-warm">What You Read</span>
            <br />
            Again.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed">
            Spoiler-safe summaries, character tracking, theme analysis, and essay-ready insights — personalized to your exact reading progress.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-warm text-accent-foreground font-semibold text-base px-8 py-6 shadow-glow hover:opacity-90 transition-opacity">
                <BookOpen className="w-5 h-5 mr-2" />
                Start Reading Smarter
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-border text-foreground font-medium text-base px-8 py-6 hover:bg-secondary">
              See How It Works
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Works with Kindle, EPUB, PDF & more. Free to start.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="hidden lg:flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-[60px]" />
            <img
              src={heroBook}
              alt="AI Reading Companion - glowing book with literary analysis"
              className="relative w-[480px] h-[480px] object-cover rounded-3xl shadow-card"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
