"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, Tag, User, MapPin, Building, Package, Sparkles } from "lucide-react";

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
  selectedEntityId: string;
  onSelectEntity: (entityId: string) => void;
  placeholder?: string;
  excludeEntityId?: string;
  onOpenQuickCreate?: () => void;
}

export function SmartEntityPickerWithFilters({
  entities,
  entityTypes = [],
  selectedEntityId,
  onSelectEntity,
  placeholder = "Cari nama entitas...",
  excludeEntityId,
  onOpenQuickCreate,
}: SmartEntityPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId),
    [entities, selectedEntityId]
  );

  useEffect(() => {
    if (selectedEntity) {
      setQuery(selectedEntity.name);
    } else if (!selectedEntityId) {
      setQuery("");
    }
  }, [selectedEntityId, selectedEntity]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Collect unique tags from entities list
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    entities.forEach((e) => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [entities]);

  // Filtered entities based on Search Query, Selected Type, and Selected Tag
  const filtered = useMemo(() => {
    let list = excludeEntityId
      ? entities.filter((e) => e.id !== excludeEntityId)
      : entities;

    if (selectedTypeFilter !== "ALL") {
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
  }, [entities, query, selectedTypeFilter, selectedTagFilter, excludeEntityId]);

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          className="form-input text-xs w-full pr-7"
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onSelectEntity("");
          }}
        />
        {query ? (
          <button
            type="button"
            className="absolute right-2 top-2 text-[var(--text-secondary)] hover:text-[var(--text)]"
            onClick={() => {
              setQuery("");
              onSelectEntity("");
            }}
          >
            <X size={13} />
          </button>
        ) : (
          <Search size={13} className="absolute right-2.5 top-2.5 text-[var(--text-secondary)] pointer-events-none" />
        )}
      </div>

      {/* Auto-Suggest Dropdown Popup with Type & Tag Filters */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-10 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-2.5 z-[150] max-h-64 overflow-y-auto flex flex-col gap-2 text-xs animate-fadeIn">
          {/* Filter Bar: Type Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[var(--border)] scrollbar-none">
            <button
              type="button"
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors shrink-0 ${
                selectedTypeFilter === "ALL"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text)]"
              }`}
              onClick={() => setSelectedTypeFilter("ALL")}
            >
              Semua Tipe
            </button>
            {["Character", "Location", "Organization", "Object", "Concept"].map((t) => (
              <button
                key={t}
                type="button"
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors shrink-0 ${
                  selectedTypeFilter.toLowerCase() === t.toLowerCase()
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
                onClick={() =>
                  setSelectedTypeFilter(
                    selectedTypeFilter.toLowerCase() === t.toLowerCase() ? "ALL" : t
                  )
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* Optional Tag Filter Bar if tags exist */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[var(--border)] text-[10.5px]">
              <span className="text-[var(--text-secondary)] shrink-0 flex items-center gap-0.5">
                <Tag size={10} /> Tag:
              </span>
              <button
                type="button"
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0 ${
                  selectedTagFilter === "ALL"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
                onClick={() => setSelectedTagFilter("ALL")}
              >
                Semua
              </button>
              {availableTags.slice(0, 5).map((tg) => (
                <button
                  key={tg}
                  type="button"
                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0 ${
                    selectedTagFilter === tg
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                  }`}
                  onClick={() =>
                    setSelectedTagFilter(selectedTagFilter === tg ? "ALL" : tg)
                  }
                >
                  #{tg}
                </button>
              ))}
            </div>
          )}

          {/* Filtered Entity List Results */}
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((ent) => (
                <div
                  key={ent.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
                    ent.id === selectedEntityId
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "hover:bg-[var(--bg)] text-[var(--text)]"
                  }`}
                  onClick={() => {
                    onSelectEntity(ent.id);
                    setQuery(ent.name);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{ent.name}</span>
                    {Array.isArray(ent.tags) && ent.tags.length > 0 && (
                      <span className="text-[9px] text-[var(--accent)] bg-[var(--accent-soft)] px-1 rounded">
                        #{ent.tags[0]}
                      </span>
                    )}
                  </div>
                  <span className="text-[9.5px] uppercase font-bold text-[var(--text-secondary)] bg-[var(--bg)] px-1.5 py-0.2 rounded border border-[var(--border)] shrink-0">
                    {ent.type?.name || "Entity"}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-2.5 text-center text-[11px] text-[var(--text-secondary)] flex flex-col items-center gap-1">
                <span>Tidak ditemukan entitas {query ? `"${query}"` : ""}</span>
                {onOpenQuickCreate && (
                  <button
                    type="button"
                    className="mt-1 text-[var(--accent)] font-semibold hover:underline text-xs"
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
