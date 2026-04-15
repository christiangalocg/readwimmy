import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user!.id)
      .single();
    if (data?.display_name) setDisplayName(data.display_name);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Update display name
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);

    if (profileError) {
      toast.error("Failed to update profile");
      setSaving(false);
      return;
    }

    // Update email if changed
    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        toast.error(emailError.message);
        setSaving(false);
        return;
      }
      toast.success("Confirmation email sent to your new address");
    } else {
      toast.success("Profile updated");
    }

    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    // Delete all user data first
    await Promise.all([
      supabase.from("ai_analyses").delete().eq("user_id", user!.id),
      supabase.from("reading_progress").delete().eq("user_id", user!.id),
    ]);
    // Delete books (which will cascade analyses)
    const { data: books } = await supabase.from("books").select("id, file_url").eq("user_id", user!.id);
    if (books) {
      // Delete files from storage
      const filePaths = books.filter(b => b.file_url).map(b => b.file_url!);
      if (filePaths.length > 0) {
        await supabase.storage.from("books").remove(filePaths);
      }
      await supabase.from("books").delete().eq("user_id", user!.id);
    }
    await supabase.from("profiles").delete().eq("user_id", user!.id);
    await signOut();
    toast.success("Account deleted");
    navigate("/");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-6 h-16">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Library</span>
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Readwimmy</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-lg">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "var(--font-display)" }}>
          Account Settings
        </h1>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
          <div>
            <Label className="text-foreground">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <Button onClick={handleSignOut} variant="outline" className="w-full border-border">
            Log Out
          </Button>
        </div>

        <div className="bg-card border border-destructive/30 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, all your books, reading progress, and analyses. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground"
                >
                  {deleting ? "Deleting..." : "Yes, delete my account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default Settings;
