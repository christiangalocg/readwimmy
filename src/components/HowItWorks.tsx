import { motion } from "framer-motion";
import { Upload, BookOpen, Sparkles } from "lucide-react";

const steps = [
  { icon: Upload, step: "01", title: "Upload or Connect", desc: "Add your book via Kindle, EPUB, or PDF. We meet you where you read." },
  { icon: BookOpen, step: "02", title: "Set Your Progress", desc: "Tell us where you are — we'll never spoil what's ahead." },
  { icon: Sparkles, step: "03", title: "Get Smart Insights", desc: "Summaries, character maps, themes, and study tools — all in real time." },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="text-gradient-warm">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground">Three steps to never forget what you read.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto mb-5">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary tracking-widest uppercase">Step {s.step}</span>
              <h3 className="text-xl font-bold text-foreground mt-2 mb-3 font-sans">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
