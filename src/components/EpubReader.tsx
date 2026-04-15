import React, { useEffect, useRef, useState } from "react";
import ePub, { Book, Rendition } from "epubjs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Minus, Plus, Loader2 } from "lucide-react";

interface EpubReaderProps {
  fileUrl: string;
  onLocationChange?: (cfi: string) => void;
  onPageInfo?: (current: number, total: number) => void;
  onPassageChange?: (passage: string) => void;
  initialLocation?: string;
}

const EpubReader: React.FC<EpubReaderProps> = ({
  fileUrl,
  onLocationChange,
  onPageInfo,
  onPassageChange,
  initialLocation,
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    if (!viewerRef.current) return;

    const initBook = async () => {
      try {
        setIsLoading(true);
        const book = ePub(fileUrl);
        bookRef.current = book;

        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
        });
        renditionRef.current = rendition;

        rendition.themes.fontSize(`${fontSize}%`);

        // Display initial location or start of book
        if (initialLocation) {
          await rendition.display(initialLocation);
        } else {
          await rendition.display();
        }

        // Wait for book to be ready and calculate sequential pages
        await book.ready;
        await book.locations.generate(1024); // Generate location points
        
        const locations = book.locations;
        const totalPageCount = locations.length();
        setTotalPages(totalPageCount);

        // Track page changes with sequential numbering
        rendition.on("relocated", (location: any) => {
          const currentCfi = location.start.cfi;
          onLocationChange?.(currentCfi);

          // Get sequential page number from locations
          const pageNum = locations.locationFromCfi(currentCfi);
          const sequentialPage = pageNum ? pageNum + 1 : 1; // 1-indexed
          setCurrentPage(sequentialPage);
          onPageInfo?.(sequentialPage, totalPageCount);

          // Extract passage text
          const range = location.start.cfi ? rendition.getRange(location.start.cfi) : null;
          if (range) {
            const passage = range.toString().slice(0, 3000);
            onPassageChange?.(passage);
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading EPUB:", error);
        setIsLoading(false);
      }
    };

    initBook();

    return () => {
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
    };
  }, [fileUrl]);

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}%`);
    }
  }, [fontSize]);

  const goToNextPage = () => renditionRef.current?.next();
  const goToPrevPage = () => renditionRef.current?.prev();
  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 10, 200));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 10, 50));

  const jumpToPage = (pageNumber: number) => {
    if (!bookRef.current?.locations || pageNumber < 1 || pageNumber > totalPages) return;
    const cfi = bookRef.current.locations.cfiFromLocation(pageNumber - 1); // 0-indexed internally
    if (cfi) {
      renditionRef.current?.display(cfi);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevPage}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextPage}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={decreaseFontSize}>
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm">{fontSize}%</span>
          <Button variant="outline" size="sm" onClick={increaseFontSize}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div ref={viewerRef} className="flex-1 overflow-hidden" />
    </div>
  );
};

export default EpubReader;
