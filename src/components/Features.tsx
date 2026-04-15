import { motion } from "framer-motion";
import {
  BookOpen, Users, BarChart3, Lightbulb,
  FileText, Globe, Brain, Quote
} from "lucide-react";

const features = [
  { icon: BookOpen, title: "Spoiler-Safe Summaries", desc: "Recaps tailored to exactly where you are — never a word ahead." },
  { icon: Users, title: "Character Tracking", desc: "Instant reminders of who's who, their relationships, and arcs." },
  { icon: BarChart3, title: "Plot Recaps", desc: "Chapter-by-chapter breakdowns so you never lose the thread." },
  { icon: Lightbulb, title: "Theme & Motif Analysis", desc: "Track symbols, themes, and literary devices as they unfold." },
  { icon: FileText, title: "Essay-Ready Insights", desc: "Study questions, prompts, and structured analysis for papers." },
  { icon: Brain, title: "Vocabulary Extraction", desc: "Key terms, definitions, and concept mapping from any text." },
  { icon: Quote, title: "Nonfiction Argument Mapping", desc: "Follow the logic, claims, and evidence in any nonfiction work." },
  { icon: Globe, title: "Multilingual Support", desc: "Read and analyze in your language — globally accessible." },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Features = () => {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-background" />
      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="text-gradient-warm"> Read Deeper</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Like SparkNotes, CliffsNotes, and a personal tutor — but tailored to your reading, always spoiler-safe.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="bg-gradient-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors shadow-card group"
            >
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 font-sans">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
