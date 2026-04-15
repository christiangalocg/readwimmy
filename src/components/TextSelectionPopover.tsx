import { useEffect, useRef } from "react";
import { Sparkles, User, BookMarked, X } from "lucide-react";

export interface TextSelectionPayload {
  text: string;
  x: number;
  y: number;
}

interface TextSelectionPopoverProps {
  selection: TextSelectionPayload | null;
  onExplainPhrase: (text: string) => void;
  onCharacterLookup: (name: string) => void;
  onAddToVocabulary: (text: string) => void;
  onDismiss: () => void;
}

const TextSelectionPopover = ({
  selection,
  onExplainPhrase,
  onCharacterLookup,
  onAddToVocabulary,
  onDismiss,
}: TextSelectionPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selection) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Small delay to prevent immediate dismissal
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selection, onDismiss]);

  if (!selection) return null;

  const shortText = selection.text.length > 70
    ? `${selection.text.slice(0, 70)}…`
    : selection.text;

  return (
    <div
      ref={popoverRef}
      className="fixed z-[100] animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: selection.x,
        top: selection.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="rounded-xl border border-border bg-card shadow-card p-2 min-w-[220px]">
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-border">
          <p className="text-[11px] text-muted-foreground px-1 flex-1">
            "{shortText}"
          </p>
          <button
            onClick={onDismiss}
            className="p-0.5 hover:bg-secondary rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        <div className="pt-2 space-y-1">
          <button
            onClick={() => {
              onExplainPhrase(selection.text);
              onDismiss();
            }}
            className="w-full text-left text-xs rounded-md px-2 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Explain phrase
          </button>

          <button
            onClick={() => {
              onCharacterLookup(selection.text);
              onDismiss();
            }}
            className="w-full text-left text-xs rounded-md px-2 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground transition-colors flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-primary" />
            Who is this character?
          </button>

          <button
            onClick={() => {
              onAddToVocabulary(selection.text);
              onDismiss();
            }}
            className="w-full text-left text-xs rounded-md px-2 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground transition-colors flex items-center gap-1.5"
          >
            <BookMarked className="w-3.5 h-3.5 text-primary" />
            Add to vocabulary
          </button>
        </div>
      </div>

      <div className="w-2 h-2 bg-card border-r border-b border-border rotate-45 mx-auto -mt-1" />
    </div>
  );
};

export default TextSelectionPopover;
