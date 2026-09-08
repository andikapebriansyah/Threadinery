"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { SmartEntityPickerWithFilters } from "./SmartEntityPickerWithFilters";
import { CreateEntityModal } from "./CreateEntityModal";
import { EditEntityModal } from "./EditEntityModal";
import {
  ArrowLeft,
  BookOpen,
  Save,
  Trash2,
  Zap,
  User,
  Plus,
  X,
  Sparkles,
  Link2,
  Clock,
  Check,
  Tag,
  AlertTriangle,
  UserPlus,
  PlusCircle,
  FileText,
  Edit,
  ExternalLink,
  Building,
  Package,
  MapPin,
  Eye,
  HardDrive,
  RotateCcw,
  RefreshCw,
  Shield,
} from "lucide-react";

interface BookData {
  id: string;
  title: string;
  orderIndex: number;
}

interface EntityTypeItem {
  id: string;
  name: string;
}

interface EntitySimple {
  id: string;
  name: string;
  typeId: string;
  type?: EntityTypeItem;
  tags?: string[];
  description?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
}

interface EventData {
  id: string;
  name: string;
  worldDate?: string | null;
  writingStatus?: string | null;
  description?: string | null;
  entitiesInvolved?: { entity: EntitySimple }[];
}

interface ChapterData {
  id: string;
  projectId: string;
  bookId: string;
  orderIndex: number;
  title: string;
  summary: string | null;
  book?: BookData;
  events?: EventData[];
}

interface ChapterDetailClientProps {
  projectId: string;
  projectName: string;
  chapterId: string; // "new" or cuid
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

function AdaptiveWorldDateInput({
  calendarType,
  worldDate,
  onChange,
  knownEras,
}: {
  calendarType: "fantasy" | "real" | "custom";
  worldDate: string;
  onChange: (val: string) => void;
  knownEras: string[];
}) {
  const [overrideFreeText, setOverrideFreeText] = React.useState(false);

  const parsedYear = React.useMemo(() => {
    const m = worldDate.match(/Tahun\s+(\d+)/i);
    return m ? m[1] : "";
  }, [worldDate]);

  const parsedEra = React.useMemo(() => {
    const m = worldDate.match(/(?:Era|Zaman)\s+[^,\)\)]+/i);
    if (m) return m[0].trim();
    const parts = worldDate.split(",");
    return parts.length > 1 ? parts[1].trim() : "";
  }, [worldDate]);

  const [inputYear, setInputYear] = React.useState(parsedYear);
  const [selectedEra, setSelectedEra] = React.useState(parsedEra || knownEras[0] || "Era Pertama");
  const [customEra, setCustomEra] = React.useState("");

  React.useEffect(() => {
    const y = worldDate.match(/Tahun\s+(\d+)/i)?.[1] || "";
    setInputYear(y);

    const eraM = worldDate.match(/(?:Era|Zaman)\s+[^,\)\)]+/i)?.[0]?.trim();
    if (eraM) {
      setSelectedEra(eraM);
      setCustomEra("");
    } else if (knownEras.length > 0 && !selectedEra) {
      setSelectedEra(knownEras[0]);
    }
  }, [worldDate, knownEras]);

  const updateFantasyDate = (yStr: string, eraStr: string, customEraStr: string) => {
    const activeEra = eraStr === "NEW_CUSTOM" ? customEraStr.trim() : eraStr;
    let finalVal = "";
    if (yStr.trim()) {
      finalVal = activeEra ? `Tahun ${yStr.trim()}, ${activeEra}` : `Tahun ${yStr.trim()}`;
    } else {
      finalVal = activeEra || "";
    }
    onChange(finalVal);
  };

  if (calendarType === "fantasy" && !overrideFreeText) {
    return (
      <div className="flex flex-col gap-2 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-[var(--accent)] flex items-center gap-1">
            <Shield size={12} /> Format Era Fantasi
          </span>
          <button
            type="button"
            className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent)] underline cursor-pointer"
            onClick={() => setOverrideFreeText(true)}
          >
            Teks Bebas Custom
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5 block">
              Pilih Era Dunia *
            </label>
            <select
              className="form-input text-xs"
              value={selectedEra}
              onChange={(e) => {
                const newEra = e.target.value;
                setSelectedEra(newEra);
                updateFantasyDate(inputYear, newEra, customEra);
              }}
            >
              {knownEras.map((era) => (
                <option key={era} value={era}>
                  {era}
                </option>
              ))}
              <option value="NEW_CUSTOM">+ Buat Era Kustom Baru...</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5 block">
              Angka Tahun *
            </label>
            <input
              type="number"
              className="form-input text-xs"
              placeholder="Misal: 1420"
              value={inputYear}
              onChange={(e) => {
                const newY = e.target.value;
                setInputYear(newY);
                updateFantasyDate(newY, selectedEra, customEra);
              }}
            />
          </div>
        </div>

        {selectedEra === "NEW_CUSTOM" && (
          <div className="mt-1">
            <label className="text-[10px] text-[var(--accent)] font-semibold mb-0.5 block">
              Nama Era Kustom Baru *
            </label>
            <input
              type="text"
              className="form-input text-xs"
              placeholder='Misal: "Era Kegelapan"...'
              value={customEra}
              onChange={(e) => {
                const newC = e.target.value;
                setCustomEra(newC);
                updateFantasyDate(inputYear, selectedEra, newC);
              }}
              autoFocus
            />
          </div>
        )}

        <div className="text-[10px] text-[var(--text-secondary)] font-serif bg-[var(--bg)] px-2 py-1 rounded border border-[var(--border)]">
          ⚡ Hasil: <strong className="text-[var(--accent)]">{worldDate || "(Belum diisi)"}</strong>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs">Tanggal / Era Dunia (Opsional)</label>
        {calendarType === "fantasy" && (
          <button
            type="button"
            className="text-[10px] text-[var(--accent)] font-semibold hover:underline cursor-pointer"
            onClick={() => setOverrideFreeText(false)}
          >
            ← Form Era Fantasi
          </button>
        )}
      </div>
      <input
        type="text"
        className="form-input text-xs"
        placeholder={
          calendarType === "real"
            ? 'Misal: "15 Agustus 1945"...'
            : 'Misal: "Musim Gugur Era 3"...'
        }
        value={worldDate}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ChapterDetailClient({
  projectId,
  projectName,
  chapterId,
  user,
}: ChapterDetailClientProps) {
  const router = useRouter();
  const isNew = chapterId === "new";

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MODE STATE: Existing chapters DEFAULT to 'read' mode! New chapters default to 'edit' mode.
  const [mode, setMode] = useState<"read" | "edit">(isNew ? "edit" : "read");

  // Core Chapter Data
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [bookId, setBookId] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [linkedEventIds, setLinkedEventIds] = useState<string[]>([]);
  const [linkedEntityIds, setLinkedEntityIds] = useState<string[]>([]);

  // Local Auto-Save Draft State
  const draftKey = `threadinery_draft_${projectId}_${chapterId}`;
  const [lastDraftTime, setLastDraftTime] = useState<string | null>(null);
  const [hasFoundDraft, setHasFoundDraft] = useState<boolean>(false);
  const [savedDraftData, setSavedDraftData] = useState<any>(null);

  // Project Master Data
  const [books, setBooks] = useState<BookData[]>([]);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [allEntities, setAllEntities] = useState<EntitySimple[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>([]);
  const [calendarType, setCalendarType] = useState<"fantasy" | "real" | "custom">("fantasy");

  const knownEras = useMemo(() => {
    const eraSet = new Set<string>();
    allEvents.forEach((evt) => {
      if (evt.worldDate) {
        const eraMatch = evt.worldDate.match(/(?:Era|Zaman)\s+[^,\)\)]+/i);
        if (eraMatch) {
          eraSet.add(eraMatch[0].trim());
        } else {
          const parts = evt.worldDate.split(",");
          if (parts.length > 1) eraSet.add(parts[1].trim());
        }
      }
    });

    if (eraSet.size === 0) {
      eraSet.add("Era Pertama");
      eraSet.add("Era Kedua");
      eraSet.add("Era Ketiga");
    }

    return Array.from(eraSet);
  }, [allEvents]);

  // Insertion Popups & Smart Pickers
  const [isInsertEventOpen, setIsInsertEventOpen] = useState(false);
  const [isInsertCharacterOpen, setIsInsertCharacterOpen] = useState(false);
  const [isInsertOtherEntityOpen, setIsInsertOtherEntityOpen] = useState(false);

  // Quick Create Modals
  const [isQuickCreateEventOpen, setIsQuickCreateEventOpen] = useState(false);
  const [isCreateEntityModalOpen, setIsCreateEntityModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Entity Side Drawer Quick Preview & Edit State
  const [previewEntityId, setPreviewEntityId] = useState<string | null>(null);
  const [editingEntityModal, setEditingEntityModal] = useState<EntitySimple | null>(null);

  // Quick Event Creation Inputs
  const [quickEventName, setQuickEventName] = useState("");
  const [quickEventWorldDate, setQuickEventWorldDate] = useState("");

  // Live Auto-Suggest Autocomplete State
  const [suggestedEntities, setSuggestedEntities] = useState<EntitySimple[]>([]);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState<number>(0);
  const [wordToReplace, setWordToReplace] = useState<{ word: string; startPos: number; endPos: number } | null>(null);

  // Textarea Ref for cursor manipulation
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchMasterAndChapterData();
  }, [projectId, chapterId]);

  // Check for existing Local Draft in localStorage on mount
  useEffect(() => {
    if (loading) return;
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed && (parsed.title || parsed.summary)) {
          // Only show recovery banner if draft has UNSAVED changes compared to server data!
          const draftTitle = (parsed.title || "").trim();
          const draftSummary = (parsed.summary || "").trim();
          const currentTitle = (title || "").trim();
          const currentSummary = (summary || "").trim();

          if (draftTitle !== currentTitle || draftSummary !== currentSummary) {
            setHasFoundDraft(true);
            setSavedDraftData(parsed);
          } else {
            // Clean identical draft
            localStorage.removeItem(draftKey);
          }
        }
      }
    } catch (e) {
      console.warn("Check local draft error:", e);
    }
  }, [draftKey, loading]);

  // Auto-Save Draft to localStorage whenever user types in edit mode
  useEffect(() => {
    if (loading || mode === "read") return;
    if (!title.trim() && !summary.trim()) return;

    const timer = setTimeout(() => {
      try {
        const nowTime = new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const draftObj = {
          title,
          summary,
          bookId,
          orderIndex,
          linkedEventIds,
          linkedEntityIds,
          timestamp: nowTime,
        };
        localStorage.setItem(draftKey, JSON.stringify(draftObj));
        setLastDraftTime(nowTime);
      } catch (e) {
        console.warn("Auto-save draft error:", e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, summary, bookId, orderIndex, linkedEventIds, linkedEntityIds, draftKey, loading, mode]);

  const fetchMasterAndChapterData = async () => {
    try {
      setLoading(true);
      const [booksRes, eventsRes, entitiesRes, typesRes, projRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/books`),
        fetch(`/api/projects/${projectId}/events`),
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/entity-types`),
        fetch(`/api/projects/${projectId}`),
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        if (pData.calendarType) setCalendarType(pData.calendarType);
      }

      let fetchedBooks: BookData[] = [];
      if (booksRes.ok) {
        fetchedBooks = await booksRes.json();
        setBooks(fetchedBooks);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setAllEvents(eventsData);
      }

      if (entitiesRes.ok) {
        const entData = await entitiesRes.json();
        setAllEntities(entData);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setEntityTypes(typesData);
      }

      // If editing existing chapter, fetch details
      if (!isNew) {
        const chRes = await fetch(`/api/projects/${projectId}/chapters/${chapterId}`);
        if (chRes.ok) {
          const chData: ChapterData = await chRes.json();
          setTitle(chData.title);
          setSummary(chData.summary || "");
          setBookId(chData.bookId);
          setOrderIndex(chData.orderIndex);

          if (chData.events) {
            const evIds = chData.events.map((e) => e.id);
            setLinkedEventIds(evIds);

            // Auto collect involved entities from events
            const entSet = new Set<string>();
            chData.events.forEach((evt) => {
              evt.entitiesInvolved?.forEach((ei) => entSet.add(ei.entity.id));
            });
            setLinkedEntityIds(Array.from(entSet));
          }
        }
      } else {
        const activeBookId = typeof window !== "undefined" ? localStorage.getItem(`threadinery_active_book_${projectId}`) : null;
        if (activeBookId && activeBookId !== "ALL" && fetchedBooks.some((b) => b.id === activeBookId)) {
          setBookId(activeBookId);
        } else if (fetchedBooks.length > 0) {
          setBookId(fetchedBooks[0].id);
        }
      }
    } catch (err) {
      console.warn("Fetch chapter detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Restore Local Draft
  const handleRestoreDraft = () => {
    if (!savedDraftData) return;
    if (savedDraftData.title) setTitle(savedDraftData.title);
    if (savedDraftData.summary) setSummary(savedDraftData.summary);
    if (savedDraftData.bookId) setBookId(savedDraftData.bookId);
    if (typeof savedDraftData.orderIndex === "number") setOrderIndex(savedDraftData.orderIndex);
    if (Array.isArray(savedDraftData.linkedEventIds)) setLinkedEventIds(savedDraftData.linkedEventIds);
    if (Array.isArray(savedDraftData.linkedEntityIds)) setLinkedEntityIds(savedDraftData.linkedEntityIds);

    setHasFoundDraft(false);
    setMode("edit");
  };

  // Ignore Local Draft
  const handleIgnoreDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {}
    setHasFoundDraft(false);
  };

  // Filter character entities only
  const characterEntities = useMemo(() => {
    return allEntities.filter((e) => e.type?.name?.toLowerCase() === "character");
  }, [allEntities]);

  // Insert Tag String directly at Cursor Position in Textarea
  const insertTagAtCursor = (tagText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setSummary((prev) => (prev ? `${prev} ${tagText}` : tagText));
      return;
    }

    const startPos = textarea.selectionStart || 0;
    const endPos = textarea.selectionEnd || 0;

    const newSummary =
      summary.substring(0, startPos) +
      tagText +
      summary.substring(endPos, summary.length);

    setSummary(newSummary);

    // Reposition cursor right after inserted tag
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + tagText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Live Auto-Suggest Autocomplete Helper
  const checkAutoSuggest = (textValue: string, cursorPos: number) => {
    if (!cursorPos || cursorPos === 0 || allEntities.length === 0) {
      setSuggestedEntities([]);
      return;
    }

    let startPos = cursorPos - 1;
    while (startPos >= 0 && !/[\s\n,.;:!?"'()\[\]{}]/.test(textValue[startPos])) {
      startPos--;
    }
    startPos++;

    const currentWord = textValue.substring(startPos, cursorPos);

    if (currentWord.length >= 2) {
      const q = currentWord.toLowerCase();
      const matches = allEntities.filter((e) => {
        if (!e.name?.trim()) return false;
        const nameLower = e.name.toLowerCase();
        return nameLower.includes(q) && nameLower !== q;
      });

      if (matches.length > 0) {
        setSuggestedEntities(matches.slice(0, 5));
        setActiveSuggestIndex(0);
        setWordToReplace({ word: currentWord, startPos, endPos: cursorPos });
        return;
      }
    }

    setSuggestedEntities([]);
    setWordToReplace(null);
  };

  // Apply selected suggestion to textarea
  const applySuggestion = (ent: EntitySimple) => {
    if (!wordToReplace) return;

    const newSummary =
      summary.substring(0, wordToReplace.startPos) +
      ent.name +
      summary.substring(wordToReplace.endPos);

    setSummary(newSummary);

    if (!linkedEntityIds.includes(ent.id)) {
      setLinkedEntityIds((prev) => [...prev, ent.id]);
    }

    setSuggestedEntities([]);
    setWordToReplace(null);

    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        const newPos = wordToReplace.startPos + ent.name.length;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  // Keydown Handler for Textarea to handle Tab/Enter/Arrow selection
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestedEntities.length > 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setActiveSuggestIndex((prev) => (prev + 1) % suggestedEntities.length);
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveSuggestIndex((prev) => (prev - 1 + suggestedEntities.length) % suggestedEntities.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const target = suggestedEntities[activeSuggestIndex] || suggestedEntities[0];
        if (target) applySuggestion(target);
        return;
      }
      if (e.key === "Escape") {
        setSuggestedEntities([]);
        return;
      }
    }
  };

  // Handle Save Chapter to Database
  const handleSave = async () => {
    if (!title.trim()) {
      setError("Judul bab wajib diisi");
      return;
    }

    setError(null);
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        title: title.trim(),
        bookId: bookId || (books.length > 0 ? books[0].id : undefined),
        summary: summary.trim() || null,
        orderIndex,
        eventIds: linkedEventIds,
      };

      const url = isNew
        ? `/api/projects/${projectId}/chapters`
        : `/api/projects/${projectId}/chapters/${chapterId}`;

      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan bab ke database");
      }

      const savedChapter = await res.json();

      // Clear local draft on success
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {}

      setSaveSuccess(true);
      setLastDraftTime(null);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Switch back to READ mode after saving!
      setMode("read");

      if (isNew) {
        router.replace(`/project/${projectId}/outline/${savedChapter.id}`);
      }
    } catch (err: any) {
      console.error("Save chapter error:", err);
      setError(
        `${err.message || "Gagal terhubung ke database"}. Draf Anda tetap AMAN tersimpan di browser ini!`
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Chapter
  const handleDelete = async () => {
    if (isNew) {
      router.push(`/project/${projectId}/outline`);
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        try {
          localStorage.removeItem(draftKey);
        } catch (e) {}
        router.push(`/project/${projectId}/outline`);
      }
    } catch (err) {
      console.error("Delete chapter error:", err);
    }
  };

  // Quick Create Event Inline
  const handleQuickCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEventName.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickEventName.trim(),
          worldDate: quickEventWorldDate.trim() || null,
          bookId: bookId || (books.length > 0 ? books[0].id : undefined),
        }),
      });

      if (res.ok) {
        const createdEvent: EventData = await res.json();
        setAllEvents((prev) => [createdEvent, ...prev]);
        setLinkedEventIds((prev) => [...prev, createdEvent.id]);

        insertTagAtCursor(` ⚡ ${createdEvent.name} `);

        setQuickEventName("");
        setQuickEventWorldDate("");
        setIsQuickCreateEventOpen(false);
      }
    } catch (err) {
      console.error("Quick create event error:", err);
    }
  };

  const previewEntity = allEntities.find((e) => e.id === previewEntityId);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RA";

  const currentBook = books.find((b) => b.id === bookId);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Topbar Navigation */}
      <header className="topbar">
        <div className="topbar-inner flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/project/${projectId}/outline`}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Outline</span>
            </Link>
            <div className="w-px h-5 bg-[var(--border)]" />
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-serif truncate">
              <span>{projectName}</span>
              <span>/</span>
              <span>{currentBook?.title || "Buku"}</span>
              <span>/</span>
              <span className="font-semibold text-[var(--text)] truncate">
                {title || "Bab Tanpa Judul"}
              </span>
            </div>
          </div>

          <div className="topbar-right flex items-center gap-3">
            {/* LOCAL DRAFT AUTO-SAVE INDICATOR */}
            {lastDraftTime && !saveSuccess && (
              <span
                className="text-[11px] text-[var(--accent)] font-semibold flex items-center gap-1 bg-[var(--accent-soft)] px-3 py-1 rounded-full border border-[var(--accent)] border-opacity-30"
                title="Tulisan Anda tersimpan otomatis di penyimpanan lokal browser"
              >
                <HardDrive size={13} />
                <span>Draf tersimpan di lokal ({lastDraftTime})</span>
              </span>
            )}

            {saveSuccess && (
              <span className="text-xs text-[var(--sage)] font-bold flex items-center gap-1 bg-[var(--sage-soft)] px-3 py-1.5 rounded-full animate-fadeIn">
                <Check size={14} /> Tersimpan!
              </span>
            )}

            {/* SWITCH MODE BUTTON: READ VS EDIT MODE (§7.8) */}
            {mode === "read" ? (
              <button
                type="button"
                className="btn btn-primary text-xs px-5 py-2 flex items-center gap-1.5 font-semibold"
                onClick={() => setMode("edit")}
              >
                <Edit size={15} />
                <span>Edit Bab Ini</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {!isNew && (
                  <button
                    type="button"
                    className="btn btn-ghost text-xs px-3 py-2 border border-[var(--border)] flex items-center gap-1"
                    onClick={() => setMode("read")}
                  >
                    <Eye size={14} />
                    <span>Mode Baca</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary text-xs px-5 py-2 flex items-center gap-1.5 font-semibold"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save size={15} />
                  <span>{saving ? "Menyimpan..." : "Simpan Bab"}</span>
                </button>
              </div>
            )}

            {!isNew && (
              <button
                type="button"
                className="btn btn-ghost text-xs text-[var(--rose)] border-[var(--border)] hover:border-[var(--rose)] p-2 flex items-center justify-center"
                onClick={() => setIsDeleteModalOpen(true)}
                title="Hapus Bab"
              >
                <Trash2 size={15} />
              </button>
            )}

            <button
              className="theme-toggle"
              aria-label="Ganti tema"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>

            <div className="avatar" title={user.name || "User"}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Full-Page Workspace Container */}
      <main className="wrap py-8">
        {/* RECOVERY BANNER FOR UNSAVED DRAFT FOUND */}
        {hasFoundDraft && savedDraftData && (
          <div className="bg-[var(--accent-soft)] border-2 border-[var(--accent)] text-[var(--text)] p-4 rounded-2xl mb-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <HardDrive size={22} className="text-[var(--accent)] shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-sm text-[var(--accent)]">
                  Draf Tulisan Lokal Ditemukan ({savedDraftData.timestamp || "Tersimpan"})
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Terdapat draf tulisan di browser Anda dari sesi sebelumnya. Apakah Anda ingin memulihkannya?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="btn btn-primary text-xs py-1.5 px-4 flex items-center gap-1"
                onClick={handleRestoreDraft}
              >
                <RotateCcw size={13} />
                <span>Pulihkan Draf</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost text-xs py-1.5 px-3 border border-[var(--border)]"
                onClick={handleIgnoreDraft}
              >
                Abaikan
              </button>
            </div>
          </div>
        )}

        {/* ERROR NOTIFICATION WITH RETRY SUPPORT */}
        {error && (
          <div className="bg-[var(--rose-soft)] text-[var(--rose)] border-2 border-[var(--rose)] p-4 rounded-2xl text-xs font-medium mb-6 shadow-md flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="btn text-xs px-4 py-1.5 bg-[var(--rose)] text-white hover:bg-opacity-90 shrink-0 flex items-center gap-1 font-semibold"
              onClick={handleSave}
              disabled={saving}
            >
              <RefreshCw size={13} className={saving ? "animate-spin" : ""} />
              <span>Coba Simpan Lagi</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* MAIN LEFT COLUMN: READ MODE VS EDIT MODE */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* 📖 MODE BACA (VIEW MODE - DEFAULT FOR SAVED CHAPTERS) */}
            {mode === "read" ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-10 shadow-sm flex flex-col gap-6 animate-fadeIn">
                {/* Header Information Bar */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-serif">
                      Bab {orderIndex + 1}
                    </span>
                    {currentBook && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--bg)] text-[var(--text-secondary)] border border-[var(--border)]">
                        {currentBook.title}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"
                    onClick={() => setMode("edit")}
                  >
                    <Edit size={14} />
                    <span>Edit Bab</span>
                  </button>
                </div>

                {/* Chapter Title */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--text)] leading-tight">
                    {title || "Bab Tanpa Judul"}
                  </h1>
                </div>

                {/* Rendered Summary Document Text with Interactive Clickable Entity Chips */}
                <div className="pt-2 border-t border-[var(--border)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-serif mb-3">
                    Ringkasan Sinopsis Bab (Klik nama entitas untuk preview profil di kanan)
                  </h3>
                  {summary ? (
                    <div className="text-base leading-relaxed text-[var(--text)] font-sans bg-[var(--bg)] p-6 rounded-2xl border border-[var(--border)] shadow-inner space-y-1">
                      {allEntities.length > 0 ? (
                        summary.split("\n").map((line, lineIdx) => {
                          const tokens: React.ReactNode[] = [];
                          let remaining = line;
                          let keyIdx = 0;

                          while (remaining.length > 0) {
                            let earliestMatch: {
                              index: number;
                              length: number;
                              entity: EntitySimple;
                            } | null = null;

                            for (const ent of allEntities) {
                              if (!ent.name?.trim()) continue;
                              const escaped = ent.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                              const regex = new RegExp(`(?:[👤📌]\\s*)?(${escaped})`, "i");
                              const m = regex.exec(remaining);
                              if (m) {
                                if (!earliestMatch || m.index < earliestMatch.index) {
                                  earliestMatch = {
                                    index: m.index,
                                    length: m[0].length,
                                    entity: ent,
                                  };
                                }
                              }
                            }

                            if (earliestMatch) {
                              if (earliestMatch.index > 0) {
                                tokens.push(remaining.substring(0, earliestMatch.index));
                              }

                              const ent = earliestMatch.entity;
                              const isChar = ent.type?.name?.toLowerCase() === "character";

                              tokens.push(
                                <button
                                  key={`chip-${lineIdx}-${keyIdx++}`}
                                  type="button"
                                  className={`inline font-bold transition-all cursor-pointer hover:underline mx-0.5 underline-offset-2 ${
                                    isChar
                                      ? "text-[var(--accent)] font-serif"
                                      : "text-[var(--sage)] font-serif"
                                  }`}
                                  onClick={() => setPreviewEntityId(ent.id)}
                                  title={`Klik untuk pratinjau profil ${ent.name} di panel kanan`}
                                >
                                  {ent.name}
                                </button>
                              );

                              remaining = remaining.substring(
                                earliestMatch.index + earliestMatch.length
                              );
                            } else {
                              tokens.push(remaining);
                              break;
                            }
                          }

                          return (
                            <div key={`line-${lineIdx}`} className="min-h-[1.5em]">
                              {tokens}
                            </div>
                          );
                        })
                      ) : (
                        <div className="whitespace-pre-line">{summary}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--text-secondary)] italic bg-[var(--bg)] p-6 rounded-2xl border border-[var(--border)] text-center">
                      (Belum ada ringkasan sinopsis tertulis untuk bab ini. Klik <strong>Edit Bab</strong> di atas untuk menulis sinopsis).
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ✏️ MODE EDIT (EDITOR MODE) */
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-5 animate-fadeIn">
                {/* Chapter Number Badge & Book Selector */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] font-bold text-xs flex items-center justify-center font-serif">
                      Bab
                    </span>
                    <select
                      className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-xl px-3 py-1.5 outline-none hover:border-[var(--accent)] cursor-pointer"
                      value={bookId}
                      onChange={(e) => setBookId(e.target.value)}
                    >
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                      <span>Nomor Urut Bab:</span>
                      <input
                        type="number"
                        min="0"
                        className="form-input text-xs w-16 text-center py-1 font-bold"
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                      />
                    </div>

                    {!isNew && (
                      <button
                        type="button"
                        className="btn btn-ghost text-xs py-1.5 px-3 border border-[var(--border)] flex items-center gap-1"
                        onClick={() => setMode("read")}
                      >
                        <Eye size={13} />
                        <span>Batal Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Judul Bab Input (Large 2XL Serif) */}
                <div className="form-group">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-1">
                    Judul Bab *
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--accent)] py-2 text-2xl md:text-3xl font-serif font-semibold text-[var(--text)] outline-none transition-colors"
                    placeholder="Ketik Judul Bab di sini..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Free-Text Markdown Summary Area + INLINE TOOLBAR WITH SMART SEARCH & FILTERS */}
                <div className="form-group flex flex-col gap-2 mt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 font-serif">
                      <FileText size={15} className="text-[var(--accent)]" />
                      <span>Ringkasan Sinopsis Bab (Free-Text Markdown)</span>
                    </label>

                    {/* INLINE TOOLBAR: CLEAN MINIMALIST EVENT & ENTITY CREATOR */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] font-bold text-xs flex items-center gap-1.5 hover:bg-opacity-80 transition-all border border-[var(--accent)] border-opacity-30 shadow-sm"
                        onClick={() => {
                          setIsInsertEventOpen(!isInsertEventOpen);
                        }}
                      >
                        <Zap size={13} />
                        <span>+ Sisipkan Event ⚡</span>
                      </button>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-[var(--sage-soft)] text-[var(--sage)] font-bold text-xs flex items-center gap-1.5 hover:bg-opacity-80 transition-all border border-[var(--sage)] border-opacity-30 shadow-sm"
                        onClick={() => setIsCreateEntityModalOpen(true)}
                      >
                        <UserPlus size={13} />
                        <span>+ Buat Entity Baru 👤</span>
                      </button>
                    </div>
                  </div>

                  {/* POPUP 1: SISIPKAN KARAKTER (SMART SEARCH FILTERED TO CHARACTER TYPE ONLY) */}
                  {isInsertCharacterOpen && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--sage)] flex flex-col gap-2.5 animate-fadeIn text-xs shadow-md">
                      <div className="flex items-center justify-between font-bold text-[var(--sage)]">
                        <span className="flex items-center gap-1">
                          <User size={14} /> Cari Karakter untuk Disisipkan di Posisi Kursor:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsInsertCharacterOpen(false)}
                          className="text-[var(--text-secondary)] hover:text-[var(--text)]"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <SmartEntityPickerWithFilters
                        entities={characterEntities}
                        selectedEntityId=""
                        onSelectEntity={(id) => {
                          const ent = allEntities.find((e) => e.id === id);
                          if (ent) {
                            insertTagAtCursor(` 👤 ${ent.name} `);
                            if (!linkedEntityIds.includes(ent.id)) {
                              setLinkedEntityIds((prev) => [...prev, ent.id]);
                            }
                            setIsInsertCharacterOpen(false);
                          }
                        }}
                        placeholder="Ketik nama karakter (misal: Samara, Yanay)..."
                        onOpenQuickCreate={() => {
                          setIsInsertCharacterOpen(false);
                          setIsCreateEntityModalOpen(true);
                        }}
                      />
                    </div>
                  )}

                  {/* POPUP 2: SISIPKAN ENTITAS LAIN (SMART SEARCH WITH ALL TYPE FILTERS & TAGS) */}
                  {isInsertOtherEntityOpen && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--accent)] flex flex-col gap-2.5 animate-fadeIn text-xs shadow-md">
                      <div className="flex items-center justify-between font-bold text-[var(--accent)]">
                        <span className="flex items-center gap-1">
                          <Package size={14} /> Cari Entitas (Lokasi, Objek, Organisasi, Konsep):
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsInsertOtherEntityOpen(false)}
                          className="text-[var(--text-secondary)] hover:text-[var(--text)]"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <SmartEntityPickerWithFilters
                        entities={allEntities}
                        entityTypes={entityTypes}
                        selectedEntityId=""
                        onSelectEntity={(id) => {
                          const ent = allEntities.find((e) => e.id === id);
                          if (ent) {
                            insertTagAtCursor(` 📌 ${ent.name} `);
                            if (!linkedEntityIds.includes(ent.id)) {
                              setLinkedEntityIds((prev) => [...prev, ent.id]);
                            }
                            setIsInsertOtherEntityOpen(false);
                          }
                        }}
                        placeholder="Cari lokasi, senjata, organisasi..."
                        onOpenQuickCreate={() => {
                          setIsInsertOtherEntityOpen(false);
                          setIsCreateEntityModalOpen(true);
                        }}
                      />
                    </div>
                  )}

                  {/* POPUP 3: SISIPKAN EVENT */}
                  {isInsertEventOpen && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg)] border border-[var(--accent)] flex flex-col gap-2.5 animate-fadeIn text-xs shadow-md">
                      <div className="flex items-center justify-between font-bold text-[var(--accent)]">
                        <span className="flex items-center gap-1">
                          <Zap size={14} /> Pilih Event untuk Disisipkan di Posisi Kursor:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsInsertEventOpen(false)}
                          className="text-[var(--text-secondary)] hover:text-[var(--text)]"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {allEvents.map((evt) => (
                          <button
                            key={evt.id}
                            type="button"
                            className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] font-semibold text-xs flex items-center gap-1"
                            onClick={() => {
                              insertTagAtCursor(` ⚡ ${evt.name} `);
                              if (!linkedEventIds.includes(evt.id)) {
                                setLinkedEventIds((prev) => [...prev, evt.id]);
                              }
                              setIsInsertEventOpen(false);
                            }}
                          >
                            <span>⚡ {evt.name}</span>
                          </button>
                        ))}

                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-[var(--accent)] text-white font-semibold text-xs flex items-center gap-1"
                          onClick={() => {
                            setIsInsertEventOpen(false);
                            setIsQuickCreateEventOpen(true);
                          }}
                        >
                          <span>+ Buat Event Baru Inline</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* LIVE ENTITY AUTO-SUGGEST FLOATING AUTOCOMPLETE BAR (§Autocomplete) */}
                  {suggestedEntities.length > 0 && (
                    <div className="bg-[var(--accent-soft)] border-2 border-[var(--accent)] p-3 rounded-2xl shadow-md flex items-center gap-2 flex-wrap text-xs animate-fadeIn">
                      <span className="font-bold text-[var(--accent)] flex items-center gap-1 font-serif shrink-0">
                        <Sparkles size={14} /> Sugesti Auto-Complete (Tekan Enter / Tab / Klik):
                      </span>
                      {suggestedEntities.map((ent, idx) => (
                        <button
                          key={ent.id}
                          type="button"
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                            idx === activeSuggestIndex
                              ? "bg-[var(--accent)] text-white scale-105 shadow-md"
                              : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)]"
                          }`}
                          onClick={() => applySuggestion(ent)}
                        >
                          {ent.type?.name?.toLowerCase() === "character" ? (
                            <User size={12} />
                          ) : (
                            <Package size={12} />
                          )}
                          <span>{ent.name}</span>
                          <span className="text-[9px] opacity-75">
                            ({ent.type?.name || "Entity"})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* SPACIOUS WRITING TEXTAREA EDITOR WITH LIVE AUTO-COMPLETE */}
                  <textarea
                    ref={textareaRef}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 md:p-5 text-sm leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)] font-sans transition-colors min-h-[380px] shadow-inner"
                    placeholder="Tulis ringkasan alur bab cerita secara bebas di sini...&#10;&#10;Ketik awalan nama karakter (misal: 'The Twin...', 'Sam...') lalu tekan ENTER atau TAB untuk otomatis melengkapi!"
                    value={summary}
                    onKeyDown={handleTextareaKeyDown}
                    onChange={(e) => {
                      setSummary(e.target.value);
                      checkAutoSuggest(e.target.value, e.target.selectionStart);
                    }}
                    onClick={(e) => {
                      checkAutoSuggest(summary, (e.target as HTMLTextAreaElement).selectionStart);
                    }}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  {!isNew && (
                    <button
                      type="button"
                      className="btn btn-ghost text-xs"
                      onClick={() => setMode("read")}
                    >
                      Batal Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary text-xs px-6 font-semibold"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Menyimpan..." : "Simpan Bab"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE PANEL: LINKED ENTITIES, EVENTS, & SIDE DRAWER QUICK PREVIEW (§7.8) */}
          <div className="flex flex-col gap-6">
            {/* ENTITY PROFILE SIDE DRAWER QUICK PREVIEW PANEL (§7.8) */}
            {previewEntity ? (
              <div className="bg-[var(--surface)] border-2 border-[var(--accent)] rounded-2xl p-6 shadow-lg flex flex-col justify-between animate-fadeIn relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                        {previewEntity.type?.name || "Entity"}
                      </span>
                      <h3 className="font-serif text-xl font-semibold text-[var(--text)] mt-1">
                        {previewEntity.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
                      onClick={() => setPreviewEntityId(null)}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Status & Tags */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {previewEntity.status && (
                      <span className="font-semibold text-[var(--sage)] bg-[var(--sage-soft)] px-2.5 py-0.5 rounded-md border border-[var(--sage)]">
                        Status: {previewEntity.status}
                      </span>
                    )}
                    {previewEntity.tags?.map((t) => (
                      <span key={t} className="text-[10px] text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-serif">
                      Deskripsi Profil
                    </h4>
                    <p className="text-xs text-[var(--text)] leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] whitespace-pre-line">
                      {previewEntity.description || "Belum ada deskripsi profil."}
                    </p>
                  </div>

                  {/* Quick Metadata preview */}
                  {previewEntity.metadata && Object.keys(previewEntity.metadata).length > 0 && (
                    <div>
                      <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--accent)] mb-1 font-serif">
                        Biodata Kunci
                      </h4>
                      <div className="bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] flex flex-col gap-1.5 text-xs max-h-52 overflow-y-auto">
                        {Object.entries(previewEntity.metadata).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2 border-b border-[var(--border)] pb-1 last:border-none">
                            <span className="text-[var(--text-secondary)] font-semibold font-serif">{k}:</span>
                            <span className="font-medium text-[var(--text)] truncate">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Side Drawer Actions: Edit Entity Inline without leaving Page */}
                <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                    onClick={() => setEditingEntityModal(previewEntity)}
                  >
                    <Edit size={13} />
                    <span>Edit Profil Entity</span>
                  </button>

                  <Link
                    href={`/project/${projectId}/entities/${previewEntity.id}`}
                    target="_blank"
                    className="text-xs text-[var(--accent)] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Penuh</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            ) : (
              /* DEFAULT SIDE PANEL: ENTITIES & EVENTS INVOLVED IN CHAPTER */
              <>
                {/* 1. ENTITAS / KARAKTER TERLIBAT DI BAB INI */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                        <User size={18} className="text-[var(--sage)]" />
                        <span>Karakter / Entitas Terlibat ({linkedEntityIds.length})</span>
                      </h3>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Klik entitas untuk quick-preview profil di kanan
                      </p>
                    </div>

                    <button
                      type="button"
                      className="text-xs text-[var(--sage)] font-bold flex items-center gap-1 hover:underline shrink-0"
                      onClick={() => setIsCreateEntityModalOpen(true)}
                    >
                      <UserPlus size={13} />
                      <span>+ Quick Create</span>
                    </button>
                  </div>

                  {/* Smart Entity Selector */}
                  <SmartEntityPickerWithFilters
                    entities={allEntities}
                    entityTypes={entityTypes}
                    selectedEntityId=""
                    onSelectEntity={(id) => {
                      if (id && !linkedEntityIds.includes(id)) {
                        setLinkedEntityIds((prev) => [...prev, id]);
                      }
                    }}
                    placeholder="Pilih & tambah entitas ke bab ini..."
                    onOpenQuickCreate={() => setIsCreateEntityModalOpen(true)}
                  />

                  {/* List of Linked Entities Badges with Clickable Quick Preview */}
                  <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                    {linkedEntityIds.map((id) => {
                      const ent = allEntities.find((e) => e.id === id);
                      if (!ent) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => setPreviewEntityId(id)}
                          title="Klik untuk membuka quick preview profil di kanan"
                        >
                          <User size={12} className="text-[var(--sage)]" />
                          <span>{ent.name}</span>
                          <Eye size={11} className="text-[var(--accent)] opacity-60 hover:opacity-100" />
                          {mode === "edit" && (
                            <button
                              type="button"
                              className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-0.5 ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLinkedEntityIds((prev) => prev.filter((item) => item !== id));
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </span>
                      );
                    })}

                    {linkedEntityIds.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] italic text-center py-2 w-full">
                        Belum ada entitas yang ditautkan ke bab ini.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. EVENT TERKAIT DI BAB INI */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                        <Zap size={18} className="text-[var(--accent)]" />
                        <span>Event Terkait di Bab Ini ({linkedEventIds.length})</span>
                      </h3>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Kejadian besar yang terjadi di bab ini
                      </p>
                    </div>

                    <button
                      type="button"
                      className="text-xs text-[var(--accent)] font-bold flex items-center gap-1 hover:underline shrink-0"
                      onClick={() => setIsQuickCreateEventOpen(true)}
                    >
                      <PlusCircle size={13} />
                      <span>+ Quick Event</span>
                    </button>
                  </div>

                  {/* Event Selector List */}
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2 max-h-56 overflow-y-auto">
                    {allEvents.map((evt) => {
                      const isChecked = linkedEventIds.includes(evt.id);
                      return (
                        <label
                          key={evt.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-[var(--surface)] border-[var(--accent)] text-[var(--text)] font-semibold shadow-sm"
                              : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={mode === "read"}
                              onChange={() => {
                                setLinkedEventIds((prev) =>
                                  isChecked
                                    ? prev.filter((id) => id !== evt.id)
                                    : [...prev, evt.id]
                                );
                              }}
                              className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
                            />
                            <span className="truncate">{evt.name}</span>
                          </div>

                          {evt.worldDate && (
                            <span className="text-[9.5px] font-medium px-2 py-0.5 rounded-md bg-[var(--sage-soft)] text-[var(--sage)] shrink-0">
                              {evt.worldDate}
                            </span>
                          )}
                        </label>
                      );
                    })}

                    {allEvents.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] italic text-center py-2">
                        Belum ada event tercatat di project ini.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* QUICK CREATE EVENT INLINE MODAL */}
      {isQuickCreateEventOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsQuickCreateEventOpen(false);
          }}
          style={{ zIndex: 110 }}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-2">
              <h2 className="font-serif font-semibold text-lg text-[var(--text)] flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--accent)]" />
                <span>+ Buat Event Baru Inline</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsQuickCreateEventOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickCreateEvent} className="flex flex-col gap-4 py-3">
              <div className="form-group">
                <label className="text-xs font-semibold">Nama Event Baru *</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder='Misal: "Pembantaian di Desa Rannfell", "Pertemuan Pertama"...'
                  value={quickEventName}
                  onChange={(e) => setQuickEventName(e.target.value)}
                  required
                />
              </div>

              <AdaptiveWorldDateInput
                calendarType={calendarType}
                worldDate={quickEventWorldDate}
                onChange={setQuickEventWorldDate}
                knownEras={knownEras}
              />

              <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsQuickCreateEventOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5"
                  disabled={!quickEventName.trim()}
                >
                  + Buat &amp; Link ke Bab Ini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ENTITY INLINE MODAL */}
      {isCreateEntityModalOpen && (
        <CreateEntityModal
          projectId={projectId}
          isOpen={true}
          onClose={() => setIsCreateEntityModalOpen(false)}
          onSuccess={(newEnt) => {
            setAllEntities((prev) => [newEnt, ...prev]);
            setLinkedEntityIds((prev) => [...prev, newEnt.id]);
            insertTagAtCursor(` 👤 ${newEnt.name} `);
            setIsCreateEntityModalOpen(false);
          }}
          entityTypes={entityTypes}
        />
      )}

      {/* EDIT ENTITY INLINE MODAL FOR QUICK EDIT FROM SIDE DRAWER */}
      {editingEntityModal && (
        <EditEntityModal
          projectId={projectId}
          isOpen={true}
          entity={editingEntityModal as any}
          onClose={() => setEditingEntityModal(null)}
          onSuccess={() => {
            fetchMasterAndChapterData();
            setEditingEntityModal(null);
          }}
          entityTypes={entityTypes}
        />
      )}

      {/* CONFIRM DELETE CHAPTER MODAL */}
      {isDeleteModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
          }}
          style={{ zIndex: 120 }}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "440px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-2">
              <h2 className="text-[var(--rose)] font-serif font-semibold text-lg flex items-center gap-2">
                <AlertTriangle size={20} />
                <span>Hapus Bab Ini?</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 py-3 text-xs leading-relaxed">
              <p className="text-sm font-medium text-[var(--text)]">
                Apakah Anda yakin ingin menghapus bab <strong>"{title}"</strong>?
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--border)]">
                💡 Event dan karakter yang ditautkan ke bab ini <strong>TIDAK akan terhapus</strong> dari dunia cerita.
              </p>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn text-xs px-5 text-white bg-[var(--rose)] hover:bg-opacity-90"
                  onClick={handleDelete}
                >
                  Ya, Hapus Bab Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
