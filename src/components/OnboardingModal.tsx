import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: BookOpen,
    title: "Welcome to Readwimmy",
    description: "Your AI-powered reading companion. Upload any book and get spoiler-safe summaries, character tracking, theme analysis, and study tools — personalized to your exact reading progress.",
  },
  {
    icon: Upload,
    title: "Upload Your Book",
    description: "Add a book by clicking \"Add Book\" in your library. Upload an EPUB or PDF file, enter the title, author, and total chapters. We'll take care of the rest.",
  },
  {
    icon: ShieldCheck,
    title: "Spoiler-Safe Insights",
    description: "Set your current chapter using the progress slider. All AI analysis is generated only from what you've read so far — we never spoil what's ahead. Select any character name in the text for a quick reminder of who they are.",
  },
];

const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("readwimmy-onboarding-seen");
    if (!seen) setOpen(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem("readwimmy-onboarding-seen", "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const current = steps[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="bg-card border-border max-w-md p-0 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <current.icon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
            {current.title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            {current.description}
          </p>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            {step < steps.length - 1 && (
              <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">
                Skip
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90"
            >
              {step < steps.length - 1 ? (
                <>Next <ArrowRight className="w-4 h-4 ml-1" /></>
              ) : (
                "Get Started"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
