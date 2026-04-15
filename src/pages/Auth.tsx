import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const planLabels: Record<string, string> = {
  free: "Free",
  basic: "Basic – $6/mo",
  student: "Student – $8/mo",
  pro: "Pro – $12/mo",
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan");
  const [isLogin, setIsLogin] = useState(!selectedPlan);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // If user just signed up with a plan, store it
      if (selectedPlan && selectedPlan !== "free") {
        storePlanSignup(user.id, user.email || email, selectedPlan);
      }
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const storePlanSignup = async (userId: string, userEmail: string, plan: string) => {
    try {
      await supabase.from("plan_signups" as any).insert({
        user_id: userId,
        email: userEmail,
        plan,
      } as any);

      // Notify via edge function
      await supabase.functions.invoke("notify-plan-signup", {
        body: { email: userEmail, plan },
      });
    } catch (e) {
      console.error("Failed to store plan signup", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin + (selectedPlan ? `/auth?plan=${selectedPlan}` : ""),
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Readwimmy
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          {selectedPlan && planLabels[selectedPlan] && (
            <div className="text-center mb-4 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm text-primary font-medium">
                Signing up for the {planLabels[selectedPlan]} plan
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 justify-center mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {isLogin ? "Welcome back, reader" : "Join thousands of smarter readers"}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: "var(--font-display)" }}>
            {isLogin ? "Sign In" : "Create Account"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 bg-secondary border-border"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 bg-secondary border-border"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
