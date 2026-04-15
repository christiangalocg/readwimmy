import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, Target, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Never Forget What You Read
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI reading companion that understands where you are in every book—delivering smart insights without spoilers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/login")} className="w-full sm:w-auto">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="w-full sm:w-auto">
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">Upload Your Book</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload any PDF or EPUB. Start reading instantly in our clean, distraction-free reader.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">Read & Track Progress</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your reading position is automatically saved. Pick up exactly where you left off, every time.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">Get AI Insights</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Summaries, character profiles, themes, vocabulary—all tailored to your exact reading position.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Smart Features That Adapt to You
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="bg-card p-4 sm:p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Spoiler-Safe Summaries</h3>
              <p className="text-sm text-muted-foreground">
                Get recaps of what you've read so far—never what's ahead.
              </p>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Quick Recap</h3>
              <p className="text-sm text-muted-foreground">
                Forgot what happened last session? Get a "previously on..." style recap of your last 15 pages.
              </p>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Character Profiles</h3>
              <p className="text-sm text-muted-foreground">
                Lookup any character instantly. See who they are based on where you are in the story.
              </p>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Vocabulary Builder</h3>
              <p className="text-sm text-muted-foreground">
                Save unfamiliar words and phrases with context-aware definitions.
              </p>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Theme Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Explore major themes as they develop throughout your reading.
              </p>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Discussion & Study Tools</h3>
              <p className="text-sm text-muted-foreground">
                Generate thought-provoking questions and trivia perfect for book clubs or studying.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-center text-sm sm:text-base text-muted-foreground mb-12 px-4">
          Token-based usage means you only pay for the AI insights you use. No subscriptions, no hidden fees.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          <div className="bg-card p-4 sm:p-6 rounded-lg border text-center space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">Free</h3>
            <div className="text-2xl sm:text-3xl font-bold">$0</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              100 free AI requests to try out all features
            </p>
            <Button className="w-full" variant="outline" onClick={() => navigate("/login")}>
              Get Started
            </Button>
          </div>

          <div className="bg-card p-4 sm:p-6 rounded-lg border text-center space-y-4 ring-2 ring-primary">
            <h3 className="text-lg sm:text-xl font-semibold">Pay As You Go</h3>
            <div className="text-2xl sm:text-3xl font-bold">$10</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ~500 AI requests. Perfect for casual readers tackling 1-2 books per month.
            </p>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Buy Tokens
            </Button>
          </div>

          <div className="bg-card p-4 sm:p-6 rounded-lg border text-center space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">Power Reader</h3>
            <div className="text-2xl sm:text-3xl font-bold">$25</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ~1500 AI requests. Ideal for students and avid readers working through multiple books.
            </p>
            <Button className="w-full" variant="outline" onClick={() => navigate("/login")}>
              Buy Tokens
            </Button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Start Retaining More From Every Book
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto opacity-90">
            Join readers who never forget what they read. Upload your first book and see the difference AI-powered insights make.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
