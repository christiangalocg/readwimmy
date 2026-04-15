import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  X, User, Search, Loader2, Sparkles, FileText, Users, Lightbulb,
  BookMarked, GraduationCap, MessageCircleQuestion, ChevronDown, ChevronUp,
  Plus, Target, Trash2, HelpCircle, BookOpen, History,
} from "lucide-react";
import { toast } from "sonner";

interface ReaderAnalysisPanelProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  currentPage: number;
  totalPages: number;
  initialCharacterName?: string;
  characterLookupNonce?: number;
  initialSelectionText?: string;
  selectionLookupNonce?: number;
  currentPassage?: string;
  vocabTermToAdd?: string;
  vocabAddNonce?: number;
}

const analysisTabs = [
  { key: "character_lookup", label: "Character", icon: User },
  { key: "expression_explainer", label: "Explain Text", icon: Sparkles },
  { key: "summary", label: "Summary", icon: FileText },
  { key: "recap", label: "Recap", icon: History },
  { key: "characters", label: "All Characters", icon: Users },
  { key: "themes", label: "Themes", icon: Lightbulb },
  { key: "vocabulary", label: "Vocabulary", icon: BookMarked },
  { key: "user_vocabulary", label: "Your Vocab", icon: BookOpen },
  { key: "discussion_questions", label: "Discussion", icon: MessageCircleQuestion },
  { key: "essay_prompts", label: "Essay Ideas", icon: GraduationCap },
  { key: "trivia", label: "Trivia", icon: HelpCircle },
  { key: "theme_tracker", label: "Track Theme", icon: Target },
] as const;

type AnalysisTabKey = (typeof analysisTabs)[number]["key"];

type UserVocabItem = { term: string; definition: string; id?: string };

/* ── Discussion Item ── */
const DiscussionItem = ({
  item,
  index,
  onGenerateAnswer,
  generatingAnswer,
}: {
  item: { name: string; description?: string; prompt?: string; answer?: string };
  index: number;
  onGenerateAnswer: (question: string, index: number) => void;
  generatingAnswer: number | null;
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const isGenerating = generatingAnswer === index;
  const questionText = item.prompt || item.description || "";

  return (
    <li className="text-sm border border-border rounded-lg p-3 bg-background/50 space-y-2">
      <p className="font-semibold text-foreground">{index + 1}. {item.name}</p>
      <p className="text-foreground/80 text-[13px] leading-relaxed italic">{questionText}</p>
      {item.answer ? (
        <>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            {showAnswer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showAnswer ? "Hide AI answer" : "Show AI answer"}
          </button>
          {showAnswer && (
            <div className="text-foreground/80 text-xs mt-1 pl-2 border-l-2 border-primary/30 whitespace-pre-wrap">
              {stripBold(item.answer)}
            </div>
          )}
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7"
          disabled={isGenerating}
          onClick={() => onGenerateAnswer(questionText, index)}
        >
          {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Generating...</> : "Generate AI Answer"}
        </Button>
      )}
    </li>
  );
};

/* ── Essay Item ── */
const EssayItem = ({
  item,
  index,
  onGenerateResponse,
  generatingEssay,
}: {
  item: { name: string; description: string; answer?: string };
  index: number;
  onGenerateResponse: (prompt: string, index: number, length: string) => void;
  generatingEssay: number | null;
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [length, setLength] = useState("quick");
  const isGenerating = generatingEssay === index;

  return (
    <li className="text-sm border border-border rounded-lg p-3 bg-background/50 space-y-2">
      <p className="font-semibold text-foreground">{index + 1}. {item.name}</p>
      <p className="text-foreground/80 text-[13px] leading-relaxed">{item.description}</p>
      {!item.answer && (
        <div className="flex items-center gap-2">
          <select
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="text-xs bg-secondary text-foreground border border-border rounded px-2 py-1"
          >
            <option value="quick">Quick (3-5 sentences)</option>
            <option value="1page">1 page</option>
            <option value="3page">3 pages</option>
            <option value="5page">5 pages</option>
            <option value="10page">10 pages</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            disabled={isGenerating}
            onClick={() => onGenerateResponse(item.description, index, length)}
          >
            {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Writing...</> : "Generate Response"}
          </Button>
        </div>
      )}
      {item.answer && (
        <>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            {showAnswer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showAnswer ? "Hide response" : "Show response"}
          </button>
          {showAnswer && (
            <div className="text-foreground/80 text-xs mt-1 pl-2 border-l-2 border-primary/30 whitespace-pre-wrap">
              {stripBold(item.answer)}
            </div>
          )}
        </>
      )}
    </li>
  );
};

/* ── Trivia Item ── */
const TriviaItem = ({ item, index }: { item: { name: string; description: string }; index: number }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <li className="text-sm border border-border rounded-lg p-3 bg-background/50 space-y-2">
      <p className="font-medium text-foreground">{index + 1}. {item.name}</p>
      <button
        onClick={() => setShowAnswer(!showAnswer)}
        className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
      >
        {showAnswer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showAnswer ? "Hide answer" : "Reveal answer"}
      </button>
      {showAnswer && (
        <p className="text-foreground/80 text-xs pl-2 border-l-2 border-primary/30">{item.description}</p>
      )}
    </li>
  );
};

/* ── Helper: strip markdown bold ── */
const stripBold = (text: string) => text.replace(/\*\*/g, "");

/* ── Main Panel ── */
const ReaderAnalysisPanel = ({
  open,
  onClose,
  userId,
  bookId,
  bookTitle,
  bookAuthor,
  currentPage,
  totalPages,
  initialCharacterName,
  characterLookupNonce,
  initialSelectionText,
  selectionLookupNonce,
  currentPassage,
  vocabTermToAdd,
  vocabAddNonce,
}: ReaderAnalysisPanelProps) => {
  const [activeTab, setActiveTab] = useState<AnalysisTabKey>("character_lookup");
  const [characterName, setCharacterName] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [resultsByType, setResultsByType] = useState<Record<string, any>>({});
  const [loadingType, setLoadingType] = useState<AnalysisTabKey | null>(null);
  const lastGeneratedAtRef = useRef<Record<string, number>>({});
  const insightsLoadedRef = useRef(false);

  const [generatingAnswer, setGeneratingAnswer] = useState<number | null>(null);
  const [generatingEssay, setGeneratingEssay] = useState<number | null>(null);

  const [userVocab, setUserVocab] = useState<UserVocabItem[]>([]);
  const [vocabInput, setVocabInput] = useState("");
  const [addingVocab, setAddingVocab] = useState(false);

  // Page-based progress percentage (0-100)
  const progressPct = totalPages > 0 ? Math.min(Math.round((currentPage / totalPages) * 100), 100) : 0;

  const persistAnalysis = useCallback(async (analysisType: string, analysis: any) => {
    await supabase.from("ai_analyses").insert({
      user_id: userId,
      book_id: bookId,
      analysis_type: analysisType,
      chapter_number: null,
      spoiler_safe_until: currentPage,
      content: analysis,
    });
  }, [userId, bookId, currentPage]);

  const callEdgeFunction = useCallback(async (type: string, extra: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke("analyze-book", {
      body: {
        bookId,
        bookTitle,
        bookAuthor,
        analysisType: type,
        currentPage,
        totalPages,
        currentPassage: currentPassage || "",
        ...extra,
      },
    });
    if (error) {
      const msg = typeof error === "object" && "message" in error ? error.message : String(error);
      throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
    return data?.analysis || null;
  }, [bookId, bookTitle, bookAuthor, currentPage, totalPages, currentPassage]);

  const runAnalysis = useCallback(async (
    type: Exclude<AnalysisTabKey, "theme_tracker" | "user_vocabulary">,
    overrides: { characterName?: string; selectedText?: string } = {},
  ) => {
    const selectedCharacter = overrides.characterName || characterName;
    const excerpt = overrides.selectedText || selectedText;

    if (type === "character_lookup" && !selectedCharacter.trim()) {
      toast.error("Select or enter a character name first.");
      return;
    }
    if (type === "expression_explainer" && !excerpt.trim()) {
      toast.error("Select or paste a phrase first.");
      return;
    }

    setLoadingType(type);
    try {
      const analysis = await callEdgeFunction(type, {
        ...(type === "character_lookup" ? { characterName: selectedCharacter.trim() } : {}),
        ...(type === "expression_explainer" ? { selectedText: excerpt.trim() } : {}),
      });
      setResultsByType((prev) => ({ ...prev, [type]: analysis }));
      lastGeneratedAtRef.current[type] = progressPct;
      void persistAnalysis(type, analysis);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setLoadingType(null);
    }
  }, [callEdgeFunction, characterName, selectedText, persistAnalysis, progressPct]);

  /* ── Discussion answer ── */
  const generateDiscussionAnswer = useCallback(async (question: string, index: number) => {
    setGeneratingAnswer(index);
    try {
      const analysis = await callEdgeFunction("discussion_answer", { selectedText: question });
      setResultsByType((prev) => {
        const disc = { ...prev.discussion_questions };
        if (disc?.items?.[index]) {
          disc.items = [...disc.items];
          disc.items[index] = { ...disc.items[index], answer: analysis?.text || "No answer generated." };
        }
        return { ...prev, discussion_questions: disc };
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate answer");
    } finally {
      setGeneratingAnswer(null);
    }
  }, [callEdgeFunction]);

  /* ── Essay response ── */
  const generateEssayResponse = useCallback(async (prompt: string, index: number, length: string) => {
    setGeneratingEssay(index);
    try {
      const analysis = await callEdgeFunction("essay_answer", { selectedText: prompt, responseLength: length });
      setResultsByType((prev) => {
        const essay = { ...prev.essay_prompts };
        if (essay?.items?.[index]) {
          essay.items = [...essay.items];
          essay.items[index] = { ...essay.items[index], answer: analysis?.text || "No response generated." };
        }
        return { ...prev, essay_prompts: essay };
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate essay");
    } finally {
      setGeneratingEssay(null);
    }
  }, [callEdgeFunction]);

  /* ── User vocabulary ── */
  const loadUserVocab = useCallback(async () => {
    const { data } = await supabase
      .from("ai_analyses")
      .select("id, content")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .eq("analysis_type", "user_vocabulary")
      .order("created_at", { ascending: true });

    if (data) {
      setUserVocab(data.map((row) => {
        const c = row.content as any;
        return { id: row.id, term: c?.term || "", definition: c?.definition || c?.text || "" };
      }));
    }
  }, [bookId, userId]);

  const addVocabTerm = useCallback(async (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    if (userVocab.some((v) => v.term.toLowerCase() === normalized.toLowerCase())) {
      toast.error("Term already in your vocabulary.");
      return;
    }

    setAddingVocab(true);
    try {
      const analysis = await callEdgeFunction("vocabulary_define", { selectedText: normalized });
      const parts: string[] = [];
      if (analysis?.explanation) parts.push(analysis.explanation);
      if (analysis?.figurative_meaning) parts.push(`Figurative: ${analysis.figurative_meaning}`);
      if (analysis?.context) parts.push(`In the book: ${analysis.context}`);
      if (analysis?.cultural_reference) parts.push(`Note: ${analysis.cultural_reference}`);
      const definition = parts.length > 0 ? parts.join(" · ") : (analysis?.text || "Definition not available.");

      const { data: inserted } = await supabase.from("ai_analyses").insert({
        user_id: userId,
        book_id: bookId,
        analysis_type: "user_vocabulary",
        chapter_number: null,
        spoiler_safe_until: currentPage,
        content: { term: normalized, definition },
      }).select("id").single();

      setUserVocab((prev) => [...prev, { term: normalized, definition, id: inserted?.id }]);
      setVocabInput("");
      toast.success(`"${normalized}" added to your vocabulary.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add term");
    } finally {
      setAddingVocab(false);
    }
  }, [callEdgeFunction, userId, bookId, currentPage, userVocab]);

  const removeVocabTerm = useCallback(async (item: UserVocabItem) => {
    if (item.id) {
      await supabase.from("ai_analyses").delete().eq("id", item.id);
    }
    setUserVocab((prev) => prev.filter((v) => v.term !== item.term));
    toast.success(`"${item.term}" removed.`);
  }, []);

  /* ── Theme tracking ── */
  const [themeInput, setThemeInput] = useState("");
  const [trackedThemes, setTrackedThemes] = useState<string[]>([]);
  const [themeFindings, setThemeFindings] = useState<Record<string, { name: string; description: string }[]>>({});
  const [trackingTheme, setTrackingTheme] = useState<string | null>(null);
  const themesLoadedRef = useRef(false);

  const persistThemeData = useCallback(async (themes: string[], findings: Record<string, any[]>) => {
    await supabase.from("ai_analyses").delete().eq("book_id", bookId).eq("user_id", userId).eq("analysis_type", "tracked_themes");
    await supabase.from("ai_analyses").insert({
      user_id: userId,
      book_id: bookId,
      analysis_type: "tracked_themes",
      chapter_number: null,
      spoiler_safe_until: currentPage,
      content: { themes, findings } as any,
    });
  }, [userId, bookId, currentPage]);

  const scanTheme = useCallback(async (theme: string): Promise<{ name: string; description: string }[]> => {
    setTrackingTheme(theme);
    try {
      const analysis = await callEdgeFunction("theme_tracking", { themeName: theme });
      return Array.isArray(analysis?.items) ? analysis.items : [];
    } catch (err: any) {
      toast.error(err.message || "Theme tracking failed");
      return [];
    } finally {
      setTrackingTheme(null);
    }
  }, [callEdgeFunction]);

  const addTrackedTheme = useCallback(async () => {
    const normalized = themeInput.trim();
    if (!normalized) return;
    if (trackedThemes.includes(normalized)) { toast.error("Already tracking."); return; }

    const newThemes = [...trackedThemes, normalized];
    setTrackedThemes(newThemes);
    setThemeInput("");

    const items = await scanTheme(normalized);
    setThemeFindings((prev) => {
      const updated = { ...prev, [normalized]: items };
      void persistThemeData(newThemes, updated);
      return updated;
    });
  }, [themeInput, trackedThemes, scanTheme, persistThemeData]);

  const regenerateTheme = useCallback(async (theme: string) => {
    const items = await scanTheme(theme);
    setThemeFindings((prev) => {
      const updated = { ...prev, [theme]: items };
      void persistThemeData(trackedThemes, updated);
      return updated;
    });
  }, [scanTheme, trackedThemes, persistThemeData]);

  const removeTrackedTheme = useCallback((theme: string) => {
    const newThemes = trackedThemes.filter((t) => t !== theme);
    setTrackedThemes(newThemes);
    setThemeFindings((prev) => {
      const c = { ...prev }; delete c[theme];
      void persistThemeData(newThemes, c);
      return c;
    });
  }, [trackedThemes, persistThemeData]);

  useEffect(() => {
    if (!open || themesLoadedRef.current) return;
    themesLoadedRef.current = true;
    const load = async () => {
      const { data } = await supabase
        .from("ai_analyses")
        .select("content, spoiler_safe_until")
        .eq("book_id", bookId)
        .eq("user_id", userId)
        .eq("analysis_type", "tracked_themes")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data?.[0]) {
        const c = data[0].content as any;
        if (Array.isArray(c?.themes)) setTrackedThemes(c.themes);
        if (c?.findings && typeof c.findings === "object") setThemeFindings(c.findings);
      }
    };
    void load();
  }, [open, bookId, userId]);

  useEffect(() => {
    if (!characterLookupNonce || !initialCharacterName?.trim()) return;
    setCharacterName(initialCharacterName.trim());
    setActiveTab("character_lookup");
    const timer = setTimeout(() => {
      void runAnalysis("character_lookup", { characterName: initialCharacterName.trim() });
    }, 50);
    return () => clearTimeout(timer);
  }, [characterLookupNonce]);

  useEffect(() => {
    if (!selectionLookupNonce || !initialSelectionText?.trim()) return;
    setSelectedText(initialSelectionText.trim());
    setActiveTab("expression_explainer");
    const timer = setTimeout(() => {
      void runAnalysis("expression_explainer", { selectedText: initialSelectionText.trim() });
    }, 50);
    return () => clearTimeout(timer);
  }, [selectionLookupNonce]);

  useEffect(() => {
    if (!vocabAddNonce || !vocabTermToAdd?.trim()) return;
    setActiveTab("user_vocabulary");
    void addVocabTerm(vocabTermToAdd.trim());
  }, [vocabAddNonce]);

  useEffect(() => {
    if (!open || insightsLoadedRef.current) return;
    insightsLoadedRef.current = true;

    const persistedTypes = [
      "summary", "characters", "themes", "vocabulary",
      "discussion_questions", "essay_prompts", "trivia",
      "character_lookup", "expression_explainer",
    ];

    const load = async () => {
      const promises = persistedTypes.map(async (type) => {
        const { data } = await supabase
          .from("ai_analyses")
          .select("content, spoiler_safe_until")
          .eq("book_id", bookId)
          .eq("user_id", userId)
          .eq("analysis_type", type)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data?.[0]) {
          return { type, content: data[0].content, generatedAt: data[0].spoiler_safe_until || 0 };
        }
        return null;
      });

      const results = await Promise.all(promises);
      const restored: Record<string, any> = {};
      const generatedAtMap: Record<string, number> = {};

      for (const r of results) {
        if (r) {
          restored[r.type] = r.content;
          generatedAtMap[r.type] = r.generatedAt;
        }
      }

      setResultsByType((prev) => ({ ...restored, ...prev }));
      for (const [k, v] of Object.entries(generatedAtMap)) {
        if (!lastGeneratedAtRef.current[k]) lastGeneratedAtRef.current[k] = v;
      }
    };
    void load();
  }, [open, bookId, userId]);

  useEffect(() => {
    if (open) void loadUserVocab();
  }, [open, loadUserVocab]);

  /* ── Render helpers ── */
  const renderResult = (type: AnalysisTabKey, analysis: any) => {
    if (!analysis) return null;

    if (type === "character_lookup") {
      if (analysis.not_found) {
        return <p className="text-sm text-muted-foreground">{analysis.summary || "Character not found at your current position."}</p>;
      }
      return (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-xs font-semibold text-primary mb-0.5">{analysis.name || characterName}</h4>
            {analysis.role && <p className="text-foreground/80 text-[13px]">{analysis.role}</p>}
          </div>
          {analysis.traits?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1">Traits</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.traits.map((t: string, i: number) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}
          {analysis.relationships?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1">Relationships</h4>
              <ul className="space-y-1">
                {analysis.relationships.map((r: { name: string; relation: string }, i: number) => (
                  <li key={i} className="text-xs text-foreground/80">
                    <span className="font-medium text-foreground">{r.name}</span> — {r.relation}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.summary && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1">Summary</h4>
              <p className="text-foreground/80 text-[13px] whitespace-pre-wrap">{stripBold(analysis.summary)}</p>
            </div>
          )}
        </div>
      );
    }

    if (type === "expression_explainer") {
      const examples = Array.isArray(analysis.examples) ? analysis.examples : [];
      return (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-1">Simple explanation</h4>
            <p className="text-foreground/90 whitespace-pre-wrap">
              {stripBold(analysis.explanation || analysis.text || "No explanation generated.")}
            </p>
          </div>
          {analysis.literal_meaning && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1">Literal meaning</h4>
              <p className="text-foreground/80">{analysis.literal_meaning}</p>
            </div>
          )}
          {analysis.figurative_meaning && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1">Figurative meaning</h4>
              <p className="text-foreground/80">{analysis.figurative_meaning}</p>
            </div>
          )}
          {examples.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1">Examples</h4>
              <ul className="list-disc pl-4 space-y-1 text-foreground/80">
                {examples.map((ex: string, i: number) => <li key={i}>{ex}</li>)}
              </ul>
            </div>
          )}
          {analysis.context && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1">Context in the book</h4>
              <p className="text-foreground/80 whitespace-pre-wrap">{analysis.context}</p>
            </div>
          )}
          {analysis.cultural_reference && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1">Cultural / historical reference</h4>
              <p className="text-foreground/80">{analysis.cultural_reference}</p>
            </div>
          )}
        </div>
      );
    }

    if (typeof analysis === "string") {
      return <p className="text-sm text-foreground/90 whitespace-pre-wrap">{stripBold(analysis)}</p>;
    }

    if (analysis.text) {
      return <p className="text-sm text-foreground/90 whitespace-pre-wrap">{stripBold(analysis.text)}</p>;
    }

    if (analysis.items && Array.isArray(analysis.items)) {
      if (type === "discussion_questions") {
        return (
          <ul className="space-y-3">
            {analysis.items.map((item: any, i: number) => (
              <DiscussionItem key={i} item={item} index={i} onGenerateAnswer={generateDiscussionAnswer} generatingAnswer={generatingAnswer} />
            ))}
          </ul>
        );
      }
      if (type === "essay_prompts") {
        return (
          <ul className="space-y-3">
            {analysis.items.map((item: any, i: number) => (
              <EssayItem key={i} item={item} index={i} onGenerateResponse={generateEssayResponse} generatingEssay={generatingEssay} />
            ))}
          </ul>
        );
      }
      if (type === "trivia") {
        return (
          <ul className="space-y-3">
            {analysis.items.map((item: any, i: number) => <TriviaItem key={i} item={item} index={i} />)}
          </ul>
        );
      }
      return (
        <ul className="space-y-3">
          {analysis.items.map((item: any, i: number) => (
            <li key={i} className="text-sm">
              {item.name && <strong className="text-foreground">{item.name}: </strong>}
              <span className="text-foreground/80">{stripBold(item.description || item.text || JSON.stringify(item))}</span>
            </li>
          ))}
        </ul>
      );
    }

    return <pre className="text-xs text-foreground/80 whitespace-pre-wrap">{JSON.stringify(analysis, null, 2)}</pre>;
  };

  if (!open) return null;

  const activeResult = resultsByType[activeTab];
  const isLoading = loadingType === activeTab;

  // Stale check: if reader has moved 3+ percentage points since last generation
  const isStale = (() => {
    if (!activeResult || totalPages <= 0) return false;
    const generatedAt = lastGeneratedAtRef.current[activeTab] ?? 0;
    return (progressPct - generatedAt) >= 3;
  })();

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full animate-in slide-in-from-right-5 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">AI Insights</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-2 bg-primary/5 border-b border-border">
        <p className="text-[10px] text-muted-foreground">
          {totalPages > 0
            ? `${progressPct}% complete · Page ${currentPage} of ${totalPages}`
            : "Loading progress..."
          }
        </p>
      </div>

      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border">
        {analysisTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "character_lookup" && (
          <>
            <div className="flex gap-2">
              <Input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Character name..."
                className="bg-secondary border-border text-sm h-8"
                onKeyDown={(e) => e.key === "Enter" && void runAnalysis("character_lookup")}
              />
              <Button size="sm" onClick={() => void runAnalysis("character_lookup")} disabled={isLoading || !characterName.trim()} className="h-8 shrink-0">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Tip: highlight a name while reading and select "Who is this character?"</p>
          </>
        )}

        {activeTab === "expression_explainer" && (
          <>
            <Textarea
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              placeholder="Highlight or paste a phrase to explain..."
              className="bg-secondary border-border text-sm min-h-20"
            />
            <Button size="sm" onClick={() => void runAnalysis("expression_explainer")} disabled={isLoading || !selectedText.trim()} className="w-full">
              {isLoading ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Explaining...</> : <><Sparkles className="w-3 h-3 mr-1" /> Explain phrase</>}
            </Button>
          </>
        )}

        {activeTab === "user_vocabulary" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={vocabInput}
                onChange={(e) => setVocabInput(e.target.value)}
                placeholder="Add a word or phrase..."
                className="h-8"
                onKeyDown={(e) => e.key === "Enter" && void addVocabTerm(vocabInput)}
              />
              <Button size="sm" className="h-8 px-2" onClick={() => void addVocabTerm(vocabInput)} disabled={addingVocab}>
                {addingVocab ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Add words while reading. Tip: highlight text and select "Add to vocabulary."
            </p>
            {userVocab.length > 0 ? (
              <ul className="space-y-2">
                {userVocab.map((item) => (
                  <li key={item.term} className="rounded-lg border border-border bg-secondary/50 p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{item.term}</span>
                      <button onClick={() => removeVocabTerm(item)} className="text-[11px] text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-foreground/80">{item.definition}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-4">No terms added yet.</p>
            )}
          </div>
        )}

        {activeTab === "theme_tracker" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                placeholder="e.g. identity, isolation, class"
                className="h-8"
                onKeyDown={(e) => e.key === "Enter" && void addTrackedTheme()}
              />
              <Button size="sm" className="h-8 px-2" onClick={() => void addTrackedTheme()} disabled={!!trackingTheme}>
                {trackingTheme ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Add a theme, motif, or symbol. Readwimmy will find examples from everything you've read so far.
            </p>
            {trackedThemes.length > 0 && (
              <div className="space-y-2">
                {trackedThemes.map((theme) => (
                  <div key={theme} className="rounded-lg border border-border bg-secondary/50 p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">{theme}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void regenerateTheme(theme)}
                          disabled={trackingTheme === theme}
                          className="text-[11px] text-primary hover:underline font-medium disabled:opacity-50"
                        >
                          {trackingTheme === theme ? "Scanning..." : "Refresh"}
                        </button>
                        <button onClick={() => removeTrackedTheme(theme)} className="text-[11px] text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {themeFindings[theme]?.length ? (
                      <ul className="space-y-2">
                        {themeFindings[theme].map((item, i) => (
                          <li key={`${theme}-${i}`} className="text-xs text-foreground/80 border-l-2 border-primary/30 pl-2">
                            <p className="font-medium text-foreground">"{item.name}"</p>
                            <p>{item.description}</p>
                          </li>
                        ))}
                      </ul>
                    ) : trackingTheme === theme ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Scanning the book for examples...
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">No evidence found yet. Try refreshing after reading more.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!(["character_lookup", "expression_explainer", "theme_tracker", "user_vocabulary"] as AnalysisTabKey[]).includes(activeTab) && (
          <div className="space-y-2">
            {isStale && activeResult && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                You've progressed further since this was generated. Regenerate for updated insights.
              </p>
            )}
            <Button
              size="sm"
              onClick={() => void runAnalysis(activeTab as any)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Analyzing...</>
              ) : activeResult ? (
                <><Sparkles className="w-3 h-3 mr-1" /> {isStale ? "Regenerate (updated progress)" : "Regenerate"}</>
              ) : (
                <><Sparkles className="w-3 h-3 mr-1" />
                  {activeTab === "discussion_questions"
                    ? "Generate Discussion Questions"
                    : activeTab === "trivia"
                    ? "Generate Trivia Questions"
                    : activeTab === "summary"
                    ? "Generate Summary"
                    : activeTab === "recap"
                    ? "Recap Last 15 Pages"
                    : activeTab === "characters"
                    ? "Generate Character List"
                    : activeTab === "themes"
                    ? "Generate Themes"
                    : activeTab === "vocabulary"
                    ? "Generate Vocabulary"
                    : activeTab === "essay_prompts"
                    ? "Generate Essay Ideas"
                    : "Generate"}
                </>
              )}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {activeResult && !["theme_tracker", "user_vocabulary"].includes(activeTab) && (
          <div className="bg-secondary/50 rounded-lg p-3 border border-border">
            {renderResult(activeTab, activeResult)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReaderAnalysisPanel;
