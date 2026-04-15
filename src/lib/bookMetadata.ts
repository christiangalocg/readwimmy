import * as pdfjsLib from "pdfjs-dist";
import ePub from "epubjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedBookMetadata {
  detectedType: "pdf" | "epub" | "other";
  title?: string;
  author?: string;
  totalChapters?: number;
  totalPages?: number;
  totalCharacters?: number;
}

const cleanText = (value?: string | null) => {
  const cleaned = value?.trim();
  if (!cleaned) return undefined;
  if (["untitled", "unknown", "null"].includes(cleaned.toLowerCase())) return undefined;
  return cleaned;
};

const stripExtension = (filename: string) => filename.replace(/\.[^/.]+$/, "").trim();

const extractPdfMetadata = async (file: File): Promise<ParsedBookMetadata> => {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  try {
    const [metadata, outline] = await Promise.all([
      pdf.getMetadata().catch(() => null),
      pdf.getOutline().catch(() => null),
    ]);

    const info = metadata?.info as Record<string, string> | undefined;
    const title = cleanText(info?.Title) || stripExtension(file.name);
    const author = cleanText(info?.Author);
    // For PDFs, numPages is the real page count
    const totalPages = pdf.numPages || undefined;
    // For PDFs, outline length is a reasonable chapter count
    const totalChapters = outline?.length || undefined;

    // Count total characters across all pages
    let totalCharacters = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = (textContent.items as any[])
        .map((item) => ("str" in item ? item.str : ""))
        .join("");
      totalCharacters += pageText.length;
    }

    return {
      detectedType: "pdf",
      title,
      author,
      totalPages,
      totalChapters,
      totalCharacters,
    };
  } finally {
    await pdf.destroy();
  }
};

const extractEpubMetadata = async (file: File): Promise<ParsedBookMetadata> => {
  const buffer = await file.arrayBuffer();
  const book: any = ePub(buffer as any);

  try {
    const [metadata, navigation] = await Promise.all([
      book.loaded.metadata.catch(() => null),
      book.loaded.navigation.catch(() => null),
    ]);

    const title = cleanText(metadata?.title) || stripExtension(file.name);
    const author = cleanText(metadata?.creator || metadata?.author);

    // TOC length is a reasonable chapter count — but only if it looks real
    // (some EPUBs have 1 TOC entry per spine item which is meaningless)
    const tocItems = navigation?.toc || [];
    const spineItems = book?.spine?.spineItems || [];

    // Only trust TOC as chapter count if it's meaningfully different from spine count
    // and looks like real chapters (between 2 and 200)
    const tocCount = tocItems.length;
    const spineCount = spineItems.length;
    const chaptersLookReal = tocCount >= 2 && tocCount <= 200 && tocCount !== spineCount;
    const totalChapters = chaptersLookReal ? tocCount : undefined;

    // DO NOT set totalPages for EPUBs at upload time.
    // EPUB "pages" are render-dependent and can only be known after
    // epubjs paginates the book in the reader. The Reader component
    // sets this automatically via onPageInfo when the book is first opened.

    // Count total characters by loading each spine section
    // This is used for progress tracking
    let totalCharacters = 0;
    try {
      await book.loaded.spine;
      const loadableSpineItems = book.spine?.spineItems || [];
      for (const item of loadableSpineItems) {
        try {
          await item.load(book.load.bind(book));
          const doc = item.document;
          if (doc?.body) {
            totalCharacters += (doc.body.textContent || "").length;
          }
          item.unload();
        } catch {
          // skip unloadable sections
        }
      }
    } catch {
      // fallback: no character count
    }

    return {
      detectedType: "epub",
      title,
      author,
      totalChapters,
      totalPages: undefined, // intentionally blank — set by reader on first open
      totalCharacters: totalCharacters || undefined,
    };
  } finally {
    book.destroy?.();
  }
};

export const extractBookMetadata = async (file: File): Promise<ParsedBookMetadata> => {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return extractPdfMetadata(file);
  }

  if (ext === "epub") {
    return extractEpubMetadata(file);
  }

  return {
    detectedType: "other",
    title: stripExtension(file.name),
  };
};
