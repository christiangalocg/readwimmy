import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WaitlistDialog from "@/components/WaitlistDialog";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Get started with the basics",
    features: [
      "3 books",
      "Basic summaries",
      "Character list",
      "5,000 AI tokens/month",
    ],
    cta: "Start Free",
    highlighted: false,
    paid: false,
  },
  {
    name: "Basic",
    price: "$6",
    period: "/month",
    desc: "For regular readers",
    features: [
      "Unlimited books",
      "Spoiler-safe summaries",
      "Character tracking",
      "Plot recaps",
      "Reading progress sync",
      "50,000 AI tokens/month",
    ],
    cta: "Join Waitlist",
    highlighted: false,
    paid: true,
  },
  {
    name: "Student",
    price: "$8",
    period: "/month",
    desc: "For students & academics",
    features: [
      "Everything in Basic",
      "Theme & symbol tracking",
      "Literary device analysis",
      "Essay prompts & study questions",
      "Chapter breakdowns",
      "Vocabulary extraction",
      "150,000 AI tokens/month",
    ],
    cta: "Join Waitlist",
    highlighted: false,
    paid: true,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    desc: "For power readers & professionals",
    features: [
      "Everything in Student",
      "Nonfiction argument mapping",
      "Individual character deep-dives",
      "Export notes & highlights",
      "Priority processing",
      "500,000 AI tokens/month",
      "Buy more tokens as needed",
    ],
    cta: "Join Waitlist",
    highlighted: false,
    paid: true,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistPlan, setWaitlistPlan] = useState("");

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (plan.paid) {
      setWaitlistPlan(plan.name);
      setWaitlistOpen(true);
    } else {
      navigate("/auth");
    }
  };

  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, <span className="text-gradient-warm">Honest</span> Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Token-based usage so you only pay for what you need. No hidden fees.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl p-7 border flex flex-col border-border bg-gradient-card shadow-card"
            >
              <h3 className="text-xl font-bold text-foreground font-sans">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-secondary-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-5 font-semibold ${
                  plan.paid
                    ? "bg-gradient-warm text-accent-foreground hover:opacity-90"
                    : "bg-secondary text-foreground hover:bg-muted"
                }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        <WaitlistDialog
          open={waitlistOpen}
          onOpenChange={setWaitlistOpen}
          planName={waitlistPlan}
        />
      </div>
    </section>
  );
};

export default Pricing;
