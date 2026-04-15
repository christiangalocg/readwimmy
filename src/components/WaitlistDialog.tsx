import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName?: string;
  featureContext?: string;
}

const WaitlistDialog = ({ open, onOpenChange, planName, featureContext }: WaitlistDialogProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [currentBook, setCurrentBook] = useState("");
  const [featureInterest, setFeatureInterest] = useState(featureContext || "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);

    try {
      const message = [
        `📋 WAITLIST SIGNUP`,
        `Plan interest: ${planName || "General Premium"}`,
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        currentBook.trim() ? `Currently reading: ${currentBook.trim()}` : null,
        featureInterest.trim() ? `Features they care about: ${featureInterest.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      // Store as feedback entry (same mechanism as feedback form)
      const userId = user?.id || "00000000-0000-0000-0000-000000000000";

      if (user) {
        await supabase.from("feedback" as any).insert({
          user_id: userId,
          type: "waitlist",
          message,
        } as any);
      }

      // Also notify via edge function
      await supabase.functions.invoke("notify-plan-signup", {
        body: { email: email.trim(), plan: `waitlist-${planName || "premium"}` },
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Waitlist signup error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setSubmitted(false);
      setName("");
      setCurrentBook("");
      setFeatureInterest("");
    }, 300);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-card border-border max-w-md text-center">
          <div className="py-6 flex flex-col items-center gap-4">
            <PartyPopper className="w-12 h-12 text-primary" />
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              You're on the list!
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              We'll notify you when Readwimmy Premium launches. Thanks for your interest!
            </p>
            <Button onClick={handleClose} className="mt-2 bg-gradient-warm text-accent-foreground hover:opacity-90">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
            {planName ? `Join the ${planName} Waitlist` : "Join the Waitlist"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Readwimmy Premium is coming soon. Be the first to know when it launches.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="wl-name">Name *</Label>
            <Input
              id="wl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wl-email">Email *</Label>
            <Input
              id="wl-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wl-book">What are you reading? <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="wl-book"
              value={currentBook}
              onChange={(e) => setCurrentBook(e.target.value)}
              placeholder="e.g. Wuthering Heights"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wl-features">
              What features matter most to you? <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="wl-features"
              value={featureInterest}
              onChange={(e) => setFeatureInterest(e.target.value)}
              placeholder="e.g. spoiler-safe summaries, theme tracking, trivia…"
              className="h-20 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90 py-5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Join the Waitlist
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistDialog;
