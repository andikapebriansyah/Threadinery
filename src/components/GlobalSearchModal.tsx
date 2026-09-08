"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Users, Calendar, FileText, ArrowRight, CornerDownLeft } from "lucide-react";

interface SearchResultEntity {
  id: string;
  name: string;
  type?: { name: string };
  description?: string | null;
  tags?: string[];
}

interface SearchResultEvent {
  id: string;
  name: string;
  worldDate?: string | null;
}

interface SearchResultChapter {
  id: string;
  title: string;
  bookId: string;
}

interface GlobalSearchModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ projectId, isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<SearchResultEntity[]>([]);
  const [events, setEvents] = useState<SearchResultEvent[]>([]);
  const [chapters, setChapters] = useState<SearchResultChapter[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchAllSearchData();
    } else {
      setQuery("");
    }
  }, [isOpen, projectId]);

  const fetchAllSearchData = async () => {
    try {
      setLoading(true);
      const [entRes, evtRes, chRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/events`),
        fetch(`/api/projects/${projectId}/chapters`),
      ]);

      if (entRes.ok) setEntities(await entRes.json());
      if (evtRes.ok) setEvents(await evtRes.json());
      if (chRes.ok) setChapters(await chRes.json());
    } catch (err) {
      console.warn("Search fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredEntities = q
    ? entities.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q))) ||
          (e.type?.name && e.type.name.toLowerCase().includes(q))
      )
    : entities.slice(0, 5);

  const filteredEvents = q
    ? events.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.worldDate && e.worldDate.toLowerCase().includes(q))
      )
    : events.slice(0, 5);

  const filteredChapters = q
    ? chapters.filter((c) => c.title.toLowerCase().includes(q))
    : chapters.slice(0, 5);

  const totalResults = filteredEntities.length + filteredEvents.length + filteredChapters.length;

  return (
    <div
      className="modal-overlay animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ zIndex: 200 }}
    >
      <div
        className="modal-content overflow-hidden p-0 rounded-2xl shadow-2xl bg-[var(--surface)] border border-[var(--border)]"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px", width: "100%" }}
      >
        {/* Search Header Input */}
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--bg)]/50">
          <Search size={18} className="text-[var(--accent)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm font-medium text-[var(--text)] outline-none placeholder:text-[var(--text-secondary)]"
            placeholder="Cari entitas, event, chapter (ketik nama/tag)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="text-[var(--text-secondary)] hover:text-[var(--text)] text-xs px-1.5 py-0.5 rounded"
              onClick={() => setQuery("")}
            >
              Reset
            </button>
          )}
          <button
            type="button"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-5">
          {loading ? (
            <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
              Memuat data pencarian...
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
              Tidak ada hasil yang cocok dengan &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* ENTITIES CATEGORY */}
              {filteredEntities.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10.5px] uppercase font-bold tracking-wider text-[var(--accent)] mb-2 px-1">
                    <Users size={12} />
                    <span>Entitas ({filteredEntities.length})</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {filteredEntities.map((ent) => (
                      <div
                        key={ent.id}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--accent-soft)]/50 border border-transparent hover:border-[var(--accent)]/30 cursor-pointer transition-all group"
                        onClick={() => {
                          onClose();
                          router.push(`/project/${projectId}/entities/${ent.id}`);
                        }}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] shrink-0">
                            {ent.type?.name || "Entity"}
                          </span>
                          <span className="font-serif font-semibold text-xs text-[var(--text)] truncate group-hover:text-[var(--accent)]">
                            {ent.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
                          <span>Buka Profile</span>
                          <ArrowRight size={11} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EVENTS CATEGORY */}
              {filteredEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10.5px] uppercase font-bold tracking-wider text-[var(--rose)] mb-2 px-1">
                    <Calendar size={12} />
                    <span>Events ({filteredEvents.length})</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {filteredEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--rose-soft)]/50 border border-transparent hover:border-[var(--rose)]/30 cursor-pointer transition-all group"
                        onClick={() => {
                          onClose();
                          router.push(`/project/${projectId}/events`);
                        }}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="font-serif font-semibold text-xs text-[var(--text)] truncate group-hover:text-[var(--rose)]">
                            {evt.name}
                          </span>
                          {evt.worldDate && (
                            <span className="text-[10px] text-[var(--text-secondary)]">
                              ({evt.worldDate})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] group-hover:text-[var(--rose)]">
                          <span>Lihat Event</span>
                          <ArrowRight size={11} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CHAPTERS CATEGORY */}
              {filteredChapters.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10.5px] uppercase font-bold tracking-wider text-[var(--sage)] mb-2 px-1">
                    <FileText size={12} />
                    <span>Chapters / Outline ({filteredChapters.length})</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {filteredChapters.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--sage-soft)]/50 border border-transparent hover:border-[var(--sage)]/30 cursor-pointer transition-all group"
                        onClick={() => {
                          onClose();
                          router.push(`/project/${projectId}/outline`);
                        }}
                      >
                        <span className="font-serif font-semibold text-xs text-[var(--text)] truncate group-hover:text-[var(--sage)]">
                          {ch.title}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] group-hover:text-[var(--sage)]">
                          <span>Buka Outline</span>
                          <ArrowRight size={11} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)]/50 flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
          <span>Gunakan <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[9px]">ESC</kbd> untuk menutup</span>
          <span className="flex items-center gap-1"><CornerDownLeft size={10} /> Navigate</span>
        </div>
      </div>
    </div>
  );
}
