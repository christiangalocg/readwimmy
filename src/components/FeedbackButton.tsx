import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const FeedbackButton = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("feedback" as any).insert({
      user_id: user.id,
      type,
      message: message.trim(),
    } as any);
    setLoading(false);
    if (error) {
      toast.error("Failed to submit feedback");
    } else {
      toast.success("Thank you for your feedback!");
      setMessage("");
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Feedback
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
              Give Feedback
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              {(["bug", "feature"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "bug" ? "🐛 Bug Report" : "💡 Feature Request"}
                </button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === "bug" ? "Describe the bug..." : "Describe your idea..."}
              className="w-full h-32 rounded-xl bg-secondary border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
            <Button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Feedback
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackButton;
