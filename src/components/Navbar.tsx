import { Button } from "@/components/ui/button";
import { BookOpen, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Readwimmy
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90">
                <LayoutDashboard className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
