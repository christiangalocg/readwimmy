import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, LogOut, Upload, BookMarked, Clock, Settings, Trash2, Home } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import AddBookDialog from "@/components/AddBookDialog";
import OnboardingModal from "@/components/OnboardingModal";
import FeedbackButton from "@/components/FeedbackButton";
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

type Book = Tables<"books">;
type Progress = Tables<"reading_progress">;

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<(Book & { progress?: Progress })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchBooks();
  }, [user]);

  const fetchBooks = async () => {
    const { data: booksData, error: booksError } = await supabase
      .from("books")
      .select("*")
      .order("updated_at", { ascending: false });

    if (booksError) {
      toast.error("Failed to load books");
      setLoading(false);
      return;
    }

    const { data: progressData } = await supabase
      .from("reading_progress")
      .select("*");

    const booksWithProgress = (booksData || []).map((book) => ({
      ...book,
      progress: progressData?.find((p) => p.book_id === book.id),
    }));

    setBooks(booksWithProgress);
    setLoading(false);
  };

  const deleteBook = async (bookId: string, fileUrl: string | null) => {
    // Delete file from storage
    if (fileUrl) {
      await supabase.storage.from("books").remove([fileUrl]);
    }
    // Delete analyses and progress
    await Promise.all([
      supabase.from("ai_analyses").delete().eq("book_id", bookId),
      supabase.from("reading_progress").delete().eq("book_id", bookId),
    ]);
    // Delete the book
    const { error } = await supabase.from("books").delete().eq("id", bookId);
    if (error) {
      toast.error("Failed to delete book");
    } else {
      toast.success("Book deleted");
      fetchBooks();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "reading": return "text-primary";
      case "finished": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "reading": return "Reading";
      case "finished": return "Finished";
      default: return "Not Started";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingModal />
      <FeedbackButton />

      {/* Top bar */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Readwimmy
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => setShowAddBook(true)}
              className="bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Book
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground" title="Homepage">
              <Home className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate("/settings")} className="text-muted-foreground">
              <Settings className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleSignOut} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Your Library
          </h1>
          <p className="text-muted-foreground">Track your reading and unlock AI-powered insights.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-card animate-pulse border border-border" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
              No books yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Add your first book to start getting AI-powered summaries, character tracking, and more.
            </p>
            <Button
              onClick={() => setShowAddBook(true)}
              className="bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Book
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-glow transition-all duration-300 group relative"
              >
                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-secondary/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{book.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this book, its reading progress, and all analyses.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteBook(book.id, book.file_url)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <button
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="text-left w-full"
                >
                  <div className="w-full h-32 rounded-xl bg-secondary flex items-center justify-center mb-4 overflow-hidden">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookMarked className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-2" style={{ fontFamily: "var(--font-display)" }}>
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-sm text-muted-foreground mb-3">{book.author}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${getStatusColor(book.progress?.status ?? undefined)}`}>
                      {getStatusLabel(book.progress?.status ?? undefined)}
                    </span>
                    {(() => {
                      const totalChars = (book as any).total_characters || 0;
                      const charIdx = (book.progress as any)?.current_character_index || 0;
                      if (totalChars > 0 && charIdx > 0) {
                        const pct = Math.min(Math.round((charIdx / totalChars) * 100), 100);
                        return (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {pct}%
                          </div>
                        );
                      }
                      if (book.progress && book.progress.current_chapter && book.total_chapters) {
                        return (
                          <span className="text-xs text-muted-foreground">
                            Ch. {book.progress.current_chapter}/{book.total_chapters}
                          </span>
                        );
                      }
                      if (book.progress?.percentage != null && Number(book.progress.percentage) > 0) {
                        return (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {Math.round(Number(book.progress.percentage))}%
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {book.progress?.percentage != null && Number(book.progress.percentage) > 0 && (
                    <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-warm transition-all"
                        style={{ width: `${book.progress.percentage}%` }}
                      />
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddBookDialog
        open={showAddBook}
        onOpenChange={setShowAddBook}
        onBookAdded={fetchBooks}
      />
    </div>
  );
};

export default Dashboard;
