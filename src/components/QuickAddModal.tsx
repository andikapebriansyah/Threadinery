"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface QuickAddModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  activeBookId?: string | null;
}

interface EntityType {
  id: string;
  name: string;
}

interface BookOption {
  id: string;
  title: string;
}

interface ChapterOption {
  id: string;
  title: string;
  bookId: string;
}

export function QuickAddModal({
  projectId,
  isOpen,
  onClose,
  activeBookId,
}: QuickAddModalProps) {
  const [activeTab, setActiveTab] = useState<"entity" | "event" | "chapter">("entity");

  // Options
  const [types, setTypes] = useState<EntityType[]>([]);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);

  // Entity Form State
  const [entityName, setEntityName] = useState("");
  const [entityTypeId, setEntityTypeId] = useState("");

  // Event Form State
  const [eventName, setEventName] = useState("");
  const [eventWorldDate, setEventWorldDate] = useState("");
  const [eventBookId, setEventBookId] = useState("");
  const [eventChapterId, setEventChapterId] = useState("");

  // Chapter Form State
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterBookId, setChapterBookId] = useState("");

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<{
    type: "entity" | "event" | "chapter";
    title: string;
    url: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load project prerequisites when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSuccessItem(null);
      setError(null);
      return;
    }

    const loadMeta = async () => {
      try {
        const [typeRes, bookRes, chRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/entity-types`),
          fetch(`/api/projects/${projectId}/books`),
          fetch(`/api/projects/${projectId}/chapters`),
        ]);

        if (typeRes.ok) {
          const tData: EntityType[] = await typeRes.json();
          setTypes(tData);
          if (tData.length > 0 && !entityTypeId) {
            // Default to Character if exists
            const charType = tData.find((t) => t.name.toLowerCase() === "character");
            setEntityTypeId(charType ? charType.id : tData[0].id);
          }
        }

        let bData: BookOption[] = [];
        if (bookRes.ok) {
          bData = await bookRes.json();
          setBooks(bData);
        }

        if (chRes.ok) {
          const cData: ChapterOption[] = await chRes.json();
          setChapters(cData);
        }

        // Determine active book for defaults
        const currentActive =
          activeBookId && activeBookId !== "ALL"
            ? activeBookId
            : typeof window !== "undefined"
            ? localStorage.getItem(`threadinery_active_book_${projectId}`)
            : null;

        const validBookId =
          currentActive && currentActive !== "ALL" && bData.some((b) => b.id === currentActive)
            ? currentActive
            : bData.length > 0
            ? bData[0].id
            : "";

        setEventBookId(validBookId);
        setChapterBookId(validBookId);
      } catch (err) {
        console.error("Failed to load metadata for Quick Add:", err);
      }
    };

    loadMeta();

    // Auto-focus input after slight delay for modal mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, projectId, activeBookId]);

  if (!isOpen) return null;

  // Resolved Book Name for pill
  const activeBookObj = books.find(
    (b) =>
      b.id ===
      (activeBookId && activeBookId !== "ALL"
        ? activeBookId
        : eventBookId)
  );

  // Submit Entity Form
  const handleSaveEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName.trim()) {
      setError("Nama entitas wajib diisi.");
      return;
    }
    if (!entityTypeId) {
      setError("Pilih tipe entitas.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const activeBook =
        typeof window !== "undefined"
          ? localStorage.getItem(`threadinery_active_book_${projectId}`)
          : null;

      const payload: any = {
        name: entityName.trim(),
        typeId: entityTypeId,
        description: "",
      };

      if (activeBook && activeBook !== "ALL") {
        payload.bookId = activeBook;
      }

      const res = await fetch(`/api/projects/${projectId}/entities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan entitas");
      }

      const created = await res.json();

      // Dispatch global event so current page updates live
      window.dispatchEvent(
        new CustomEvent("threadinery:quick_add_success", {
          detail: { type: "entity", item: created },
        })
      );

      setSuccessItem({
        type: "entity",
        title: created.name,
        url: `/project/${projectId}/entities/${created.id}`,
      });

      setEntityName("");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan entitas.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Event Form
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      setError("Nama event wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        name: eventName.trim(),
        worldDate: eventWorldDate.trim() || null,
        bookId: eventBookId || null,
        chapterId: eventChapterId || null,
      };

      const res = await fetch(`/api/projects/${projectId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan event");
      }

      const created = await res.json();

      window.dispatchEvent(
        new CustomEvent("threadinery:quick_add_success", {
          detail: { type: "event", item: created },
        })
      );

      setSuccessItem({
        type: "event",
        title: created.name,
        url: `/project/${projectId}/events`,
      });

      setEventName("");
      setEventWorldDate("");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan event.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Chapter Form
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim()) {
      setError("Judul bab wajib diisi.");
      return;
    }
    if (!chapterBookId) {
      setError("Pilih buku untuk bab ini.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: chapterTitle.trim(),
        bookId: chapterBookId,
      };

      const res = await fetch(`/api/projects/${projectId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan bab");
      }

      const created = await res.json();

      window.dispatchEvent(
        new CustomEvent("threadinery:quick_add_success", {
          detail: { type: "chapter", item: created },
        })
      );

      setSuccessItem({
        type: "chapter",
        title: created.title,
        url: `/project/${projectId}/outline/${created.id}`,
      });

      setChapterTitle("");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan bab.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredChapters = chapters.filter(
    (c) => !eventBookId || c.bookId === eventBookId
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-serif font-semibold text-base text-[var(--text)] flex items-center gap-2">
                <span>Quick Add</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
                  Instan
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Catat ide langsung tanpa memotong momentum menulis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface)] px-5 pt-3 gap-2">
          <button
            type="button"
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "entity"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
            onClick={() => {
              setActiveTab("entity");
              setError(null);
              setSuccessItem(null);
            }}
          >
            <Users size={14} />
            <span>Entitas Baru</span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "event"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
            onClick={() => {
              setActiveTab("event");
              setError(null);
              setSuccessItem(null);
            }}
          >
            <Calendar size={14} />
            <span>Event / Kejadian</span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "chapter"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
            onClick={() => {
              setActiveTab("chapter");
              setError(null);
              setSuccessItem(null);
            }}
          >
            <FileText size={14} />
            <span>Bab / Chapter</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {successItem && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-[var(--sage-soft)] border border-[var(--sage)]/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[var(--text)]">
              <CheckCircle2 size={16} className="text-[var(--sage)] shrink-0" />
              <span>
                <strong>{successItem.title}</strong> berhasil ditambahkan!
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={successItem.url}
                onClick={onClose}
                className="font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <span>Buka Detail</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-[var(--rose-soft)] border border-[var(--rose)]/40 flex items-center gap-2 text-xs text-[var(--rose)]">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 overflow-y-auto">
          {/* 1. ENTITY TAB (§7.7: Nama & Tipe, 2 field doang) */}
          {activeTab === "entity" && (
            <form onSubmit={handleSaveEntity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Nama Entitas <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-input text-sm w-full"
                  placeholder="Misal: Rara, Kerajaan Lunaris, Artefak Helios..."
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Tipe Entitas <span className="text-[var(--accent)]">*</span>
                </label>
                <select
                  className="form-input text-sm w-full"
                  value={entityTypeId}
                  onChange={(e) => setEntityTypeId(e.target.value)}
                  disabled={submitting}
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Book Scope Badge */}
              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[var(--accent)]" />
                  <span>Cakupan Buku:</span>
                </span>
                <span className="font-semibold text-[var(--text)]">
                  {activeBookObj ? activeBookObj.title : "Seluruh Dunia (Semua Buku)"}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary text-xs px-4"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5 flex items-center gap-1.5"
                  disabled={submitting || !entityName.trim()}
                >
                  {submitting ? "Menyimpan..." : "Simpan Entitas"}
                </button>
              </div>
            </form>
          )}

          {/* 2. EVENT TAB */}
          {activeTab === "event" && (
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Nama Event / Kejadian <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  type="text"
                  className="form-input text-sm w-full"
                  placeholder="Misal: Tragedi Lembah Hitam, Penobatan Raja..."
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Tanggal / Era Dunia (Opsional)
                </label>
                <input
                  type="text"
                  className="form-input text-sm w-full"
                  placeholder='Misal: "Musim Gugur Era 3" atau "15 Agustus 1420"...'
                  value={eventWorldDate}
                  onChange={(e) => setEventWorldDate(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Buku (Opsional)
                  </label>
                  <select
                    className="form-input text-xs w-full"
                    value={eventBookId}
                    onChange={(e) => {
                      setEventBookId(e.target.value);
                      setEventChapterId("");
                    }}
                    disabled={submitting}
                  >
                    <option value="">(Tanpa Buku Khusus)</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Bab / Chapter (Opsional)
                  </label>
                  <select
                    className="form-input text-xs w-full"
                    value={eventChapterId}
                    onChange={(e) => setEventChapterId(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="">(Belum ditugaskan ke bab)</option>
                    {filteredChapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary text-xs px-4"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5 flex items-center gap-1.5"
                  disabled={submitting || !eventName.trim()}
                >
                  {submitting ? "Menyimpan..." : "Simpan Event"}
                </button>
              </div>
            </form>
          )}

          {/* 3. CHAPTER TAB */}
          {activeTab === "chapter" && (
            <form onSubmit={handleSaveChapter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Judul Bab / Chapter <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  type="text"
                  className="form-input text-sm w-full"
                  placeholder="Misal: Bab 1: Kedatangan di Lunaris..."
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Buku Target <span className="text-[var(--accent)]">*</span>
                </label>
                <select
                  className="form-input text-sm w-full"
                  value={chapterBookId}
                  onChange={(e) => setChapterBookId(e.target.value)}
                  disabled={submitting}
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary text-xs px-4"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5 flex items-center gap-1.5"
                  disabled={submitting || !chapterTitle.trim()}
                >
                  {submitting ? "Menyimpan..." : "Simpan Bab"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
