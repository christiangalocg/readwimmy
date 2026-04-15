import { useEffect, useState, lazy, Suspense, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, BookOpen, Loader2, Sparkles, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import TextSelectionPopover, { type TextSelectionPayload } from "@/components/TextSelectionPopover";
import ReaderAnalysisPanel from "@/components/ReaderAnalysisPanel";

type Book = Tables<"books">;
type Progress = Tables<"reading_progress">;

const EpubReader = lazy(() => import("@/components/EpubReader"));
const PdfReader = lazy(() => import("@/components/PdfReader"));

const Reader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  const [lookupCharacter, setLookupCharacter] = useState<string | undefined>();
  const [characterLookupNonce, setCharacterLookupNonce] = useState(0);
  const [selectedExpression, setSelectedExpression] = useState<string | undefined>();
  const [expressionLookupNonce, setExpressionLookupNonce] = useState(0);
  const [vocabTerm, setVocabTerm] = useState<string | undefined>();
  const [vocabNonce, setVocabNonce] = useState(0);
  const [selection, setSelection] = useState<TextSelectionPayload | null>(null);
  const [currentPassage, setCurrentPassage] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const currentPageRef = useRef(0);
  const [totalPages, setTotalPages] = useState(0);
  const totalPagesRef = useRef(0);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) loadBook();
  }, [user, id]);

  const loadBook = async () => {
    const [bookRes, progressRes] = await Promise.all([
      supabase.from("books").select("*").eq("id", id!).single(),
      supabase.from("reading_progress").select("*").eq("book_id", id!).single(),
    ]);

    if (bookRes.error || !bookRes.data) {
      toast.error("Book not found");
      navigate("/dashboard");
      return;
    }

    setBook(bookRes.data);
    setProgress(progressRes.data || null);

    const savedPage = progressRes.data?.current_page;
    if (typeof savedPage === "number" && savedPage > 0) {
      setCurrentPage(savedPage);
      currentPageRef.current = savedPage;
    }

    const savedTotalPages = bookRes.data.total_pages;
    if (typeof savedTotalPages === "number" && savedTotalPages > 0) {
      setTotalPages(savedTotalPages);
      totalPagesRef.current = savedTotalPages;
    }

    if (!bookRes.data.file_url) {
      toast.error("No file uploaded for this book");
      navigate(`/book/${id}`);
      return;
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("books")
      .createSignedUrl(bookRes.data.file_url, 3600);

    if (signedError || !signedData?.signedUrl) {
      toast.error("Failed to load book file");
      navigate(`/book/${id}`);
      return;
    }

    setFileUrl(signedData.signedUrl);
    setLoading(false);
  };

  const handleLocationChange = useCallback((cfi: string) => {
    if (!user || !id) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const tp = totalPagesRef.current;
      const cp = currentPageRef.current;
      const percentage = tp > 0 ? Math.min((cp / tp) * 100, 100) : 0;
      await supabase.from("reading_progress").upsert({
        user_id: user.id, book_id: id, location_cfi: cfi, status: "reading",
        current_page: cp,
        percentage,
      } as any, { onConflict: "user_id,book_id" });
      if (tp > 0) {
        await supabase.from("books").update({ total_pages: tp }).eq("id", id);
      }
    }, 2000);
  }, [user, id]);

  const handlePageChange = useCallback((page: number) => {
    if (!user || !id || !book) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const tp = totalPagesRef.current || book.total_pages || 1;
      const percentage = (page / tp) * 100;
      await supabase.from("reading_progress").upsert({
        user_id: user.id, book_id: id, current_page: page,
        percentage: Math.min(percentage, 100), status: "reading",
      } as any, { onConflict: "user_id,book_id" });
    }, 2000);
  }, [user, id, book]);

  const handlePageInfo = useCallback((info: { currentPage: number; totalPages: number }) => {
    setCurrentPage(info.currentPage);
    currentPageRef.current = info.currentPage;
    setTotalPages(info.totalPages);
    totalPagesRef.current = info.totalPages;
  }, []);

  const handleCharacterLookup = useCallback((name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    setLookupCharacter(normalized);
    setCharacterLookupNonce(Date.now());
    setPanelOpen(true);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleExplainPhrase = useCallback((text: string) => {
    const normalized = text.trim();
    if (!normalized) return;
    setSelectedExpression(normalized);
    setExpressionLookupNonce(Date.now());
    setPanelOpen(true);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleAddToVocab = useCallback((text: string) => {
    const normalized = text.trim();
    if (!normalized) return;
    setVocabTerm(normalized);
    setVocabNonce(Date.now());
    setPanelOpen(true);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleTextSelect = useCallback((payload: TextSelectionPayload) => {
    const text = payload.text.trim();
    if (!text || text.length < 2) { setSelection(null); return; }
    setSelection(payload);
  }, []);

  const handleVisibleTextChange = useCallback((text: string) => {
    setCurrentPassage(text);
  }, []);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book || !fileUrl || !user) return null;

  const isEpub = book.file_type === "epub";
  const isPdf = book.file_type === "pdf";
  const savedLocation = (progress as any)?.location_cfi || undefined;
  const savedPage = progress?.current_page || 1;
  const progressPct = totalPages > 0 ? Math.min(Math.round((currentPage / totalPages) * 100), 100) : 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-xl flex-shrink-0 z-50">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/book/${id}`)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Dashboard</span>
            </button>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-foreground truncate max-w-[30%]">
              {book.title}
            </span>
            {totalPages > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {progressPct}% complete · Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                panelOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Insights
            </button>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Readwimmy
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 relative overflow-hidden">
        <div className="w-full h-full overflow-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            }
          >
            {isEpub && (
              <EpubReader
                fileUrl={fileUrl}
                onLocationChange={handleLocationChange}
                savedLocation={savedLocation}
                onTextSelect={handleTextSelect}
                onVisibleTextChange={handleVisibleTextChange}
                onPageInfo={handlePageInfo}
              />
            )}
            {isPdf && (
              <PdfReader
                fileUrl={fileUrl}
                onPageChange={handlePageChange}
                savedPage={savedPage}
                onTextSelect={handleTextSelect}
                onVisibleTextChange={handleVisibleTextChange}
                onPageInfo={handlePageInfo}
              />
            )}
          </Suspense>

          {!isEpub && !isPdf && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Unsupported format: {book.file_type}</p>
            </div>
          )}

          <TextSelectionPopover
            selection={selection}
            onCharacterLookup={handleCharacterLookup}
            onExplainPhrase={handleExplainPhrase}
            onAddToVocabulary={handleAddToVocab}
            onDismiss={() => setSelection(null)}
          />
        </div>

        {panelOpen && (
          <div className="absolute right-0 top-0 bottom-0 z-40">
            <ReaderAnalysisPanel
              open={panelOpen}
              onClose={() => setPanelOpen(false)}
              userId={user.id}
              bookId={book.id}
              bookTitle={book.title}
              bookAuthor={book.author}
              currentPage={currentPage}
              totalPages={totalPages}
              initialCharacterName={lookupCharacter}
              characterLookupNonce={characterLookupNonce}
              initialSelectionText={selectedExpression}
              selectionLookupNonce={expressionLookupNonce}
              currentPassage={currentPassage}
              vocabTermToAdd={vocabTerm}
              vocabAddNonce={vocabNonce}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Reader;
