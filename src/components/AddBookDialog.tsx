import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, BookOpen, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extractBookMetadata } from "@/lib/bookMetadata";

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAdded: () => void;
}

const AddBookDialog = ({ open, onOpenChange, onBookAdded }: AddBookDialogProps) => {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalChapters, setTotalChapters] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setTotalChapters("");
    setTotalPages("");
    setTotalCharacters(0);
    setFile(null);
    setPendingFile(null);
    setOwnershipConfirmed(false);
    setConsentOpen(false);
    setMetadataLoading(false);
  };

  const applyFileMetadata = async (uploadedFile: File) => {
    setMetadataLoading(true);

    try {
      const metadata = await extractBookMetadata(uploadedFile);

      if (metadata.title) setTitle(metadata.title);
      if (metadata.author) setAuthor(metadata.author);
      if (typeof metadata.totalChapters === "number" && metadata.totalChapters > 0) {
        setTotalChapters(String(metadata.totalChapters));
      }
      if (typeof metadata.totalPages === "number" && metadata.totalPages > 0) {
        setTotalPages(String(metadata.totalPages));
      }
      if (typeof metadata.totalCharacters === "number" && metadata.totalCharacters > 0) {
        setTotalCharacters(metadata.totalCharacters);
      }
    } catch {
      toast.error("Could not read file metadata automatically. You can still enter details manually.");
    } finally {
      setMetadataLoading(false);
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0] || null;
    if (!uploadedFile) return;

    setPendingFile(uploadedFile);
    setFile(null);
    setOwnershipConfirmed(false);
    setConsentOpen(true);

    await applyFileMetadata(uploadedFile);
  };

  const confirmOwnership = () => {
    if (!pendingFile) return;
    setFile(pendingFile);
    setPendingFile(null);
    setOwnershipConfirmed(true);
    setConsentOpen(false);
  };

  const cancelFileSelection = () => {
    setPendingFile(null);
    setFile(null);
    setOwnershipConfirmed(false);
    setConsentOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (file && !ownershipConfirmed) {
      toast.error("Please confirm your upload rights before submitting.");
      return;
    }

    setLoading(true);

    try {
      let fileUrl: string | null = null;
      let fileType: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        fileType = ext === "epub" ? "epub" : ext === "pdf" ? "pdf" : "other";
        const safeName = file.name.replace(/\s+/g, "-");
        const filePath = `${user.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("books")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        fileUrl = filePath;
      }

      const { data: book, error } = await supabase
        .from("books")
        .insert({
          user_id: user.id,
          title,
          author: author || null,
          file_url: fileUrl,
          file_type: fileType,
          total_chapters: totalChapters ? parseInt(totalChapters, 10) : 0,
          total_pages: totalPages ? parseInt(totalPages, 10) : 0,
          total_characters: totalCharacters || 0,
        } as any)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("reading_progress").insert({
        user_id: user.id,
        book_id: book.id,
        status: "not_started",
      });

      toast.success("Book added!");
      resetForm();
      onOpenChange(false);
      onBookAdded();
    } catch (err: any) {
      toast.error(err.message || "Failed to add book");
    } finally {
      setLoading(false);
    }
  };

  const activeFile = file || pendingFile;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
              <BookOpen className="w-5 h-5 text-primary" />
              Add a Book
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-foreground">Title *</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. The Great Gatsby"
                className="mt-1 bg-secondary border-border"
                required
              />
            </div>

            <div>
              <Label className="text-foreground">Author</Label>
              <Input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="e.g. F. Scott Fitzgerald"
                className="mt-1 bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Total Chapters</Label>
                <Input
                  type="number"
                  value={totalChapters}
                  onChange={(event) => setTotalChapters(event.target.value)}
                  placeholder="Auto-filled when possible"
                  className="mt-1 bg-secondary border-border"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-foreground">Total Pages</Label>
                <Input
                  type="number"
                  value={totalPages}
                  onChange={(event) => setTotalPages(event.target.value)}
                  placeholder="Auto-filled when possible"
                  className="mt-1 bg-secondary border-border"
                  min={0}
                />
              </div>
            </div>

            {totalCharacters > 0 && (
              <p className="text-xs text-muted-foreground">
                Detected {totalCharacters.toLocaleString()} characters — used for precise progress tracking.
              </p>
            )}

            <div>
              <Label className="text-foreground">Upload File (optional)</Label>
              <div className="mt-1">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border bg-secondary cursor-pointer hover:border-primary/30 transition-colors">
                  {metadataLoading ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  )}

                  <span className="text-sm text-muted-foreground">
                    {activeFile
                      ? activeFile.name
                      : "EPUB, PDF — metadata auto-fills when detected"}
                  </span>

                  <input
                    type="file"
                    accept=".epub,.pdf"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {activeFile && (
              <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground text-sm">Upload Rights Confirmation</p>
                    <p>
                      {ownershipConfirmed
                        ? "Rights acknowledged for this file. You can now submit your book."
                        : "Please confirm ownership in the popup before this file can be uploaded."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-warm text-accent-foreground font-semibold hover:opacity-90"
              disabled={loading || metadataLoading || !title || (!!file && !ownershipConfirmed)}
            >
              {loading ? "Adding..." : "Add Book"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={consentOpen} onOpenChange={setConsentOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm upload rights</AlertDialogTitle>
            <AlertDialogDescription>
              You're uploading <strong>{pendingFile?.name}</strong>. Please confirm you own this file or have the legal right to upload it for personal reading and analysis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelFileSelection} className="border-border">Cancel file</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOwnership} className="bg-primary text-primary-foreground">
              I confirm upload rights
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddBookDialog;
