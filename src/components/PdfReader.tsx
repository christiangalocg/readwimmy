import React, { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Minus, Plus, Loader2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfReaderProps {
  fileUrl: string;
  onPageChange?: (page: number) => void;
  savedPage?: number;
  onTextSelect?: (selection: { text: string; x: number; y: number }) => void;
  onVisibleTextChange?: (text: string) => void;
  onCharacterIndexChange?: (charIndex: number) => void;
  onPageInfo?: (info: { currentPage: number; totalPages: number }) => void;
  onJumpToPage?: (page: number) => void;
  onRequestBookmark?: (page: number, preview: string, memo?: string) => void;
}

const PdfReader: React.FC<PdfReaderProps> = ({
  fileUrl,
  onPageChange,
  savedPage,
  onTextSelect,
  onVisibleTextChange,
  onCharacterIndexChange,
  onPageInfo,
  onJumpToPage,
  onRequestBookmark,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderCycleRef = useRef(0);

  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(savedPage || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [renderingPage, setRenderingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jumpInput, setJumpInput] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);

      try {
        const doc = await pdfjsLib.getDocument(fileUrl).promise;
        if (cancelled) return;

        const initialPage = Math.min(Math.max(savedPage || 1, 1), doc.numPages);
        setPdf(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(initialPage);

        onPageInfo?.({ currentPage: initialPage, totalPages: doc.numPages });

        // Build character offset map per page for potential future use
        const offsets: number[] = [];
        let cumulative = 0;
        for (let i = 1; i <= doc.numPages; i++) {
          offsets.push(cumulative);
          try {
            const page = await doc.getPage(i);
            const tc = await page.getTextContent();
            const items = tc.items as any[];
            const text = items.map((it) => ("str" in it ? it.str : "")).join("");
            cumulative += text.length;
          } catch {
            // skip
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load PDF");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPdf();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, savedPage, onPageInfo]);

  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdf || !canvasRef.current || !textLayerRef.current) return;

      const cycle = ++renderCycleRef.current;
      setRenderingPage(true);

      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        await page.render({ canvasContext: context, viewport }).promise;

        if (cycle !== renderCycleRef.current) return;

        const textLayer = textLayerRef.current;
        textLayer.innerHTML = "";
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;

        const textContent = await page.getTextContent();
        const passage = (textContent.items as any[])
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        if (passage) {
          onVisibleTextChange?.(passage.slice(0, 5000));
        }

        const renderTextLayer = (pdfjsLib as any).renderTextLayer;
        if (renderTextLayer) {
          const task = renderTextLayer({
            textContentSource: textContent,
            container: textLayer,
            viewport,
          });
          await (task?.promise ?? task);
        }
      } catch (err: any) {
        setError(err.message || "Failed to render page");
      } finally {
        if (cycle === renderCycleRef.current) {
          setRenderingPage(false);
        }
      }
    },
    [pdf, scale, onVisibleTextChange],
  );

  useEffect(() => {
    if (!pdf) return;
    void renderPage(currentPage);
  }, [pdf, currentPage, scale, renderPage]);

  const emitPageInfo = useCallback(
    (page: number) => {
      onPageInfo?.({ currentPage: page, totalPages });
    },
    [onPageInfo, totalPages],
  );

  const goNext = useCallback(() => {
    if (currentPage >= totalPages) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    onPageChange?.(next);
    emitPageInfo(next);
  }, [currentPage, totalPages, onPageChange, emitPageInfo]);

  const goPrev = useCallback(() => {
    if (currentPage <= 1) return;
    const prev = currentPage - 1;
    setCurrentPage(prev);
    onPageChange?.(prev);
    emitPageInfo(prev);
  }, [currentPage, onPageChange, emitPageInfo]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || text.length < 2) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    onTextSelect?.({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  }, [onTextSelect]);

  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };

    document.addEventListener("keyup", handleKeyUp);
    return () => document.removeEventListener("keyup", handleKeyUp);
  }, [goPrev, goNext]);

  // Jump to page handler
  const jumpToPage = async (page: number) => {
    if (!pdf) return;
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    onPageChange?.(page);
    emitPageInfo(page);
    onJumpToPage?.(page);
  };

  // Bookmark current page
  const handleBookmarkCurrent = async () => {
    // Use visible text as preview
    const preview = textLayerRef.current?.innerText?.slice(0, 200) ?? "";
    await onRequestBookmark?.(currentPage, preview);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setScale((value) => Math.max(0.75, value - 0.2))}>
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale((value) => Math.min(3, value + 0.2))}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Jump to page</label>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="w-20 text-sm px-2 py-1 border border-border rounded bg-background text-foreground"
            />
            <Button
              size="sm"
              onClick={() => {
                const n = parseInt(jumpInput, 10);
                if (!isNaN(n)) void jumpToPage(n);
                setJumpInput("");
              }}
            >
              Go
            </Button>
          </div>

          <Button size="sm" onClick={handleBookmarkCurrent}>Bookmark this page</Button>
        </div>

        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="flex-1 overflow-auto relative flex justify-center bg-secondary/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          disabled={currentPage <= 1}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-card/80 hover:bg-card"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <div className="pdf-page my-4 relative">
          <canvas ref={canvasRef} className="block" />
          <div ref={textLayerRef} className="pdf-text-layer" onMouseUp={handleTextSelection} />

          {renderingPage && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/30">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          disabled={currentPage >= totalPages}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-card/80 hover:bg-card"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default PdfReader;
