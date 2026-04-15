"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Trash, ArrowRight, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Bookmark = {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  preview_text: string | null;
  memo: string | null;
  created_at: string;
};

interface BookmarkPanelProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  bookId: string;
  onJumpToPage: (page: number) => void;
}

const BookmarkPanel: React.FC<BookmarkPanelProps> = ({ open, onClose, userId, bookId, onJumpToPage }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});

  const loadBookmarks = async () => {
    if (!userId || !bookId) {
      setBookmarks([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from<Bookmark>("reading_bookmarks")
        .select("*")
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const list = data ?? [];
      setBookmarks(list);

      // initialize memo drafts
      const drafts: Record<string, string> = {};
      list.forEach((b) => {
        drafts[b.id] = b.memo ?? "";
      });
      setMemoDrafts(drafts);
    } catch (err) {
      // keep console error for debugging on Vercel logs
      // eslint-disable-next-line no-console
      console.error("loadBookmarks error", err);
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, bookId]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("reading_bookmarks").delete().eq("id", id);
      if (error) throw error;
      setBookmarks((s) => s.filter((b) => b.id !== id));
      setMemoDrafts((d) => {
        const copy = { ...d };
        delete copy[id];
        return copy;
      });
      toast.success("Bookmark removed");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("delete bookmark error", err);
      toast.error("Failed to remove bookmark");
    }
  };

  const handleJump = (page: number) => {
    onJumpToPage(page);
    onClose();
  };

  const startEdit = (id: string) => {
    setEditingId(id);
  };

  const cancelEdit = (id: string) => {
    setEditingId(null);
    const original = bookmarks.find((b) => b.id === id)?.memo ?? "";
    setMemoDrafts((d) => ({ ...d, [id]: original }));
  };

  const saveMemo = async (id: string) => {
    const memo = memoDrafts[id] ?? "";
    try {
      const { error } = await supabase.from("reading_bookmarks").update({ memo }).eq("id", id);
      if (error) throw error;
      setBookmarks((s) => s.map((b) => (b.id === id ? { ...b, memo } : b)));
      setEditingId(null);
      toast.success("Memo saved");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("save memo error", err);
      toast.error("Failed to save memo");
    }
  };

  return (
    <aside
      aria-hidden={!open}
      className={`fixed right-0 top-0 bottom-0 z-50 transform transition-transform duration-200 ${
        open ? "translate-x-0" : "translate-x-full"
      } w-[420px] bg-card border-l border-border shadow-xl flex flex-col`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Bookmarked Pages</h3>
          <span className="text-xs text-muted-foreground">{bookmarks.length} saved</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close bookmarks panel">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 overflow-auto flex-1">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && bookmarks.length === 0 && (
          <div className="text-sm text-muted-foreground">No bookmarks yet. Use "Bookmark this page" in the reader to save pages.</div>
        )}

        <div className="flex flex-col gap-3">
          {bookmarks.map((b) => (
            <div key={b.id} className="p-3 border border-border rounded bg-background">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Page {b.page_number}</span>
                    <span className="text-[11px] text-muted-foreground">· {new Date(b.created_at).toLocaleString()}</span>
                  </div>

                  <div className="mt-2">
                    {editingId === b.id ? (
                      <textarea
                        value={memoDrafts[b.id] ?? ""}
                        onChange={(e) => setMemoDrafts((d) => ({ ...d, [b.id]: e.target.value }))}
                        className="w-full text-sm p-2 border border-border rounded bg-background text-foreground"
                        rows={3}
                        placeholder="Add a short note about this page"
                      />
                    ) : (
                      <>
                        {b.memo ? <p className="text-sm">{b.memo}</p> : <p className="text-sm text-muted-foreground">No memo</p>}
                      </>
                    )}
                  </div>

                  {b.preview_text && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{b.preview_text}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    {editingId === b.id ? (
                      <>
                        <Button size="sm" onClick={() => saveMemo(b.id)}>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => cancelEdit(b.id)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => handleJump(b.page_number)} title="Jump to page">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(b.id)} title="Edit memo">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} title="Delete bookmark">
                          <Trash className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Bookmarks are saved to your account and will persist across devices.
        </p>
      </div>
    </aside>
  );
};

export default BookmarkPanel;
