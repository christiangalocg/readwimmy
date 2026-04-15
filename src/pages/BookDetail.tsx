import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  BookOpen, ArrowLeft, Sparkles, Users, BookMarked, FileText,
  Lightbulb, GraduationCap, Loader2, Search, User
} from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Book = Tables<"books">;
type Progress = Tables<"reading_progress">;
type Analysis = Tables<"ai_analyses">;

const analysisTypes = [
  { key: "summary", label: "Summary", icon: FileText, description: "Spoiler-safe recap of what you've read" },
  { key: "characters", label: "Characters", icon: Users, description: "Who's who and what they've done so far" },
  { key: "themes", label: "Themes", icon: Lightbulb, description: "Themes, symbols, and motifs" },
  { key: "vocabulary", label: "Vocabulary", icon: BookMarked, description: "Key terms and concepts" },
  { key: "discussion_questions", label: "Discussion", icon: Search, description: "Book-club discussion questions" },
  { key: "essay_prompts", label: "Essay Ideas", icon: GraduationCap, description: "Study prompts and essay topics" },
  { key: "trivia", label: "Trivia", icon: Search, description: "Test your knowledge with trivia questions" },
] as const;

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [chapterInput, setChapterInput] = useState<number[]>([1]);

  // Character lookup state
  const [characterName, setCharacterName] = useState("");
  const [characterAnalysis, setCharacterAnalysis] = useState<any>(null);
  const [analyzingCharacter, setAnalyzingCharacter] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) fetchBookData();
  }, [user, id]);

  const fetchBookData = async () => {
    const [bookRes, progressRes, analysesRes] = await Promise.all([
      supabase.from("books").select("*").eq("id", id!).single(),
      supabase.from("reading_progress").select("*").eq("book_id", id!).single(),
      supabase.from("ai_analyses").select("*").eq("book_id", id!).order("created_at", { ascending: false }),
    ]);

    if (bookRes.error) {
      toast.error("Book not found");
      navigate("/dashboard");
      return;
    }

    setBook(bookRes.data);
    if (progressRes.data) {
      setProgress(progressRes.data);
      setChapterInput([progressRes.data.current_chapter || 1]);
    }
    setAnalyses(analysesRes.data || []);
    setLoading(false);
  };

  const updateProgress = async (chapter: number) => {
    if (!book || !user) return;
    const totalChars = (book as any).total_characters || 0;
    const percentage = totalChars > 0
      ? 0 // character-based progress is tracked in the reader
      : book.total_chapters ? (chapter / book.total_chapters) * 100 : 0;
    const status = percentage >= 100 ? "finished" : chapter > 0 ? "reading" : "not_started";

    const { error } = await supabase
      .from("reading_progress")
      .upsert({
        user_id: user.id,
        book_id: book.id,
        current_chapter: chapter,
        percentage: Math.min(percentage, 100),
        status,
        ...(status === "finished" ? { finished_at: new Date().toISOString() } : {}),
      }, { onConflict: "user_id,book_id" });

    if (error) {
      toast.error("Failed to update progress");
    } else {
      toast.success(`Progress updated — Chapter ${chapter}`);
      fetchBookData();
    }
  };

  const requestAnalysis = async (type: string) => {
    if (!book || !user) return;
    setAnalyzing(type);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-book", {
        body: {
          bookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
          analysisType: type,
          currentChapter: progress?.current_chapter || 1,
          totalChapters: book.total_chapters || 0,
          currentCharIndex: (progress as any)?.current_character_index || 0,
          totalCharacters: (book as any).total_characters || 0,
        },
      });

      if (error) throw error;

      await supabase.from("ai_analyses").insert({
        user_id: user.id,
        book_id: book.id,
        analysis_type: type,
        chapter_number: progress?.current_chapter || 1,
        content: data.analysis,
        spoiler_safe_until: progress?.current_chapter || 1,
      });

      toast.success("Analysis complete!");
      fetchBookData();
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
    } finally {
      setAnalyzing(null);
    }
  };

  const lookupCharacter = async () => {
    if (!book || !user || !characterName.trim()) return;
    setAnalyzingCharacter(true);
    setCharacterAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-book", {
        body: {
          bookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
          analysisType: "character_lookup",
          currentChapter: progress?.current_chapter || 1,
          totalChapters: book.total_chapters || 0,
          currentCharIndex: (progress as any)?.current_character_index || 0,
          totalCharacters: (book as any).total_characters || 0,
          characterName: characterName.trim(),
        },
      });

      if (error) throw error;
      setCharacterAnalysis(data.analysis);
      toast.success(`Analysis for "${characterName}" complete!`);
    } catch (error: any) {
      toast.error(error.message || "Character lookup failed");
    } finally {
      setAnalyzingCharacter(false);
    }
  };

  const getLatestAnalysis = (type: string) => {
    return analyses.find((a) => a.analysis_type === type);
  };

  const renderAnalysisContent = (analysis: Analysis | undefined) => {
    if (!analysis) return null;
    const content = analysis.content as any;

    if (typeof content === "string") {
      return <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap">{content}</div>;
    }

    if (content?.text) {
      return <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap">{content.text}</div>;
    }

    if (content?.items && Array.isArray(content.items)) {
      return (
        <ul className="space-y-3">
          {content.items.map((item: any, i: number) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                {item.name && <strong className="text-foreground">{item.name}: </strong>}
                <span className="text-foreground/80">{item.description || item.text || JSON.stringify(item)}</span>
              </div>
            </li>
          ))}
        </ul>
      );
    }

    return <pre className="text-sm text-foreground/80 whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
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

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        {/* Book header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
            {book.title}
          </h1>
         {book.author && <p className="text-lg text-muted-foreground">{book.author}</p>}
          {book.file_url && (
            <Button
              onClick={() => navigate(`/book/${book.id}/read`)}
              className="mt-4 bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Read Book
            </Button>
          )}
        </div>

        {/* Progress tracker */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <BookMarked className="w-5 h-5 text-primary" />
            Reading Progress
          </h2>
          <div className="space-y-4">
            {(() => {
              const savedPage = progress?.current_page || 0;
              const tp = book.total_pages || 0;
              const pagePct = tp > 0 ? Math.min(Math.round((savedPage / tp) * 100), 100) : null;

              return (
                <>
                  {pagePct !== null ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Page {savedPage} of {tp}
                        </span>
                        <span className="text-primary font-medium">{pagePct}% complete</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-warm transition-all" style={{ width: `${pagePct}%` }} />
                      </div>
                      {book.total_chapters ? (
                        <p className="text-xs text-muted-foreground">
                          Chapter {progress?.current_chapter || 1} of {book.total_chapters}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Open the book to start tracking progress
                      </span>
                      <span className="text-primary font-medium">
                        {progress?.percentage ? `${Math.round(Number(progress.percentage))}%` : "0%"}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Character Lookup */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <User className="w-5 h-5 text-primary" />
            Character Lookup
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Type or paste a character's name to get a spoiler-safe deep-dive based on your current reading progress.
          </p>
          <div className="flex gap-2">
            <Input
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="e.g. Jay Gatsby"
              className="bg-secondary border-border"
              onKeyDown={(e) => e.key === "Enter" && lookupCharacter()}
            />
            <Button
              onClick={lookupCharacter}
              disabled={analyzingCharacter || !characterName.trim()}
              className="bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90 shrink-0"
            >
              {analyzingCharacter ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Looking up...</>
              ) : (
                <><Search className="w-4 h-4 mr-1" /> Look Up</>
              )}
            </Button>
          </div>

          {characterAnalysis && (
            <div className="mt-4 bg-secondary/50 rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{characterName}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Spoiler-safe to your current progress
                </span>
              </div>
              <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap text-sm">
                {characterAnalysis?.text || JSON.stringify(characterAnalysis, null, 2)}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis tabs */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <Sparkles className="w-5 h-5 text-primary" />
            AI Insights
            <span className="text-xs text-muted-foreground font-normal ml-2">
              {book.total_pages && progress?.current_page
                ? `Page ${progress.current_page} of ${book.total_pages} · ${Math.min(Math.round((progress.current_page / book.total_pages) * 100), 100)}%`
                : `Up to Chapter ${progress?.current_chapter || 1}`
              }
            </span>
          </h2>

          <Tabs defaultValue="summary">
            <TabsList className="bg-secondary border border-border mb-6 flex-wrap h-auto gap-1 p-1">
              {analysisTypes.map(({ key, label, icon: Icon }) => (
                <TabsTrigger key={key} value={key} className="text-xs gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Icon className="w-3 h-3" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {analysisTypes.map(({ key, label, description }) => {
              const analysis = getLatestAnalysis(key);
              return (
                <TabsContent key={key} value={key}>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{description}</p>

                    {analysis ? (
                      <div className="bg-secondary/50 rounded-xl p-5 border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-muted-foreground">
                            Generated for Chapter {analysis.spoiler_safe_until || "?"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestAnalysis(key)}
                            disabled={analyzing === key}
                            className="text-xs border-border"
                          >
                            {analyzing === key ? (
                              <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Regenerating...</>
                            ) : (
                              "Regenerate"
                            )}
                          </Button>
                        </div>
                        {renderAnalysisContent(analysis)}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Button
                          onClick={() => requestAnalysis(key)}
                          disabled={analyzing === key}
                          className="bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90"
                        >
                          {analyzing === key ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</>
                          ) : (
                            <><Sparkles className="w-4 h-4 mr-2" /> Generate {label}</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
