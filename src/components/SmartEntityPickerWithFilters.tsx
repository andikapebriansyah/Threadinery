"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, SlidersHorizontal, Check, Tag } from "lucide-react";

interface EntityTypeItem {
  id: string;
  name: string;
}

interface EntitySimple {
  id: string;
  name: string;
  status?: string | null;
  tags?: string[];
  type?: EntityTypeItem;
}

interface SmartEntityPickerProps {
  entities: EntitySimple[];
  entityTypes?: EntityTypeItem[];
  selectedEntityId?: string;
  onSelectEntity?: (entityId: string) => void;
  // Multi-select support
  isMulti?: boolean;
  selectedEntityIds?: string[];
  onToggleEntity?: (entityId: string) => void;
  // Filter restrictions
  typeRestriction?: string; // e.g. "Location" or "Character"
  placeholder?: string;
  excludeEntityId?: string;
  onOpenQuickCreate?: () => void;
}

export function SmartEntityPickerWithFilters({
  entities,
  entityTypes = [],
  selectedEntityId = "",
  onSelectEntity,
  isMulti = false,
  selectedEntityIds = [],
  onToggleEntity,
  typeRestriction,
  placeholder = "Cari nama entitas...",
  excludeEntityId,
  onOpenQuickCreate,
}: SmartEntityPickerProps) {
  const [query, setQuery] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId),
    [entities, selectedEntityId]
  );

  useEffect(() => {
    if (!isMulti) {
      if (selectedEntity) {
        setQuery(selectedEntity.name);
      } else if (!selectedEntityId) {
        setQuery("");
      }
    }
  }, [selectedEntityId, selectedEntity, isMulti]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowFilterPanel(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Collect unique tags
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    entities.forEach((e) => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [entities]);

  // Filtered entities list
  const filtered = useMemo(() => {
    let list = excludeEntityId
      ? entities.filter((e) => e.id !== excludeEntityId)
      : entities;

    if (typeRestriction) {
      list = list.filter(
        (e) => e.type?.name?.toLowerCase() === typeRestriction.toLowerCase()
      );
    } else if (selectedTypeFilter !== "ALL") {
      list = list.filter(
        (e) =>
          e.type?.name?.toLowerCase() === selectedTypeFilter.toLowerCase() ||
          e.type?.id === selectedTypeFilter
      );
    }

    if (selectedTagFilter !== "ALL") {
      list = list.filter(
        (e) => Array.isArray(e.tags) && e.tags.includes(selectedTagFilter)
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.type?.name && e.type.name.toLowerCase().includes(q)) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [entities, query, selectedTypeFilter, selectedTagFilter, excludeEntityId, typeRestriction]);

  const hasActiveFilters = selectedTypeFilter !== "ALL" || selectedTagFilter !== "ALL";

  return (
    <div className="relative flex-1 min-w-[200px]" ref={containerRef}>
      {/* ── CLEAN SEARCH INPUT BAR ── */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none flex items-center z-10">
          <Search size={14} />
        </div>

        <input
          type="text"
          className="form-input text-xs w-full font-medium bg-[var(--bg)] border-[var(--border)] focus:border-[var(--accent)] transition-colors"
          style={{ paddingLeft: "34px", paddingRight: "60px" }}
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!isMulti && !e.target.value && onSelectEntity) {
              onSelectEntity("");
            }
          }}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {query && (
            <button
              type="button"
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              onClick={() => {
                setQuery("");
                if (!isMulti && onSelectEntity) onSelectEntity("");
              }}
              title="Hapus pencarian"
            >
              <X size={13} />
            </button>
          )}

          {!typeRestriction && (
            <button
              type="button"
              className={`p-1.5 rounded-lg border transition-all ${
                showFilterPanel || hasActiveFilters
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)] border-[var(--border)]"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterPanel(!showFilterPanel);
                setIsOpen(true);
              }}
              title="Filter Kategori & Tag"
            >
              <SlidersHorizontal size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── DROPDOWN RESULTS (CLEAN, MINIMALIST & FAST) ── */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-2.5 z-[999] w-full min-w-[320px] max-w-[95vw] flex flex-col gap-2 text-xs animate-fadeIn"
          style={{ boxShadow: "0 12px 36px rgba(0,0,0,0.25)" }}
        >
          {/* Optional Collapsible Filter Bar (Only shown when user clicks Filter icon) */}
          {showFilterPanel && !typeRestriction && (
            <div className="p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex flex-col gap-2 animate-fadeIn">
              {/* Type Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                <button
                  type="button"
                  className={`px-2.5 py-0.5 rounded-full font-bold transition-colors shrink-0 ${
                    selectedTypeFilter === "ALL"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text)]"
                  }`}
                  onClick={() => setSelectedTypeFilter("ALL")}
                >
                  Semua Tipe
                </button>
                {["Character", "Location", "Organization", "Object", "Concept"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`px-2.5 py-0.5 rounded-full font-bold transition-colors shrink-0 ${
                      selectedTypeFilter.toLowerCase() === t.toLowerCase()
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text)]"
                    }`}
                    onClick={() =>
                      setSelectedTypeFilter(selectedTypeFilter.toLowerCase() === t.toLowerCase() ? "ALL" : t)
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tag Filter */}
              {availableTags.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto text-[10px] pt-1 border-t border-[var(--border)]">
                  <span className="text-[var(--text-secondary)] font-bold shrink-0 flex items-center gap-0.5">
                    <Tag size={10} /> Tag:
                  </span>
                  <button
                    type="button"
                    className={`px-2 py-0.5 rounded font-semibold shrink-0 ${
                      selectedTagFilter === "ALL"
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                    }`}
                    onClick={() => setSelectedTagFilter("ALL")}
                  >
                    Semua
                  </button>
                  {availableTags.map((tg) => (
                    <button
                      key={tg}
                      type="button"
                      className={`px-2 py-0.5 rounded font-semibold shrink-0 ${
                        selectedTagFilter === tg
                          ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold border border-[var(--accent)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                      }`}
                      onClick={() => setSelectedTagFilter(selectedTagFilter === tg ? "ALL" : tg)}
                    >
                      #{tg}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Result Rows */}
          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
            {filtered.length > 0 ? (
              filtered.map((ent) => {
                const isSelected = isMulti
                  ? selectedEntityIds.includes(ent.id)
                  : ent.id === selectedEntityId;

                return (
                  <div
                    key={ent.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold border border-[var(--accent)]"
                        : "hover:bg-[var(--bg)] text-[var(--text)]"
                    }`}
                    onClick={() => {
                      if (isMulti) {
                        if (onToggleEntity) onToggleEntity(ent.id);
                      } else {
                        if (onSelectEntity) onSelectEntity(ent.id);
                        setQuery(ent.name);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isMulti && (
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                              : "border-[var(--border)] bg-[var(--surface)]"
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>
                      )}
                      <span className="font-semibold text-xs truncate">{ent.name}</span>
                      {Array.isArray(ent.tags) && ent.tags.length > 0 && (
                        <span className="text-[9px] text-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.2 rounded font-medium">
                          #{ent.tags[0]}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border)] shrink-0 ml-2">
                      {ent.type?.name || "Entity"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-[11px] text-[var(--text-secondary)] flex flex-col items-center gap-1.5">
                <span>Tidak ditemukan entitas {query ? `"${query}"` : ""}</span>
                {onOpenQuickCreate && (
                  <button
                    type="button"
                    className="mt-1 text-[var(--accent)] font-bold hover:underline text-xs bg-[var(--accent-soft)] px-3 py-1 rounded-xl"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenQuickCreate();
                    }}
                  >
                    + Buat Entitas Baru
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
