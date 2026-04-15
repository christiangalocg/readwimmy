import { BookOpen } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Readwimmy</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Readwimmy. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
