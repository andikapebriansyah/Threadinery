"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { CreateEntityModal } from "./CreateEntityModal";
import {
  Users,
  Search,
  Plus,
  ArrowLeft,
  ChevronDown,
  Tag as TagIcon,
} from "lucide-react";

interface EntityTypeItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface EntityItem {
  id: string;
  name: string;
  description: string | null;
  typeId: string;
  type?: EntityTypeItem | null;
  tags: string[];
  metadata?: Record<string, any> | null;
  imageUrl?: string | null;
  status?: string | null;
  updatedAt: string;
}

interface EntitiesListClientProps {
  projectId: string;
  projectName: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  initialEntities?: EntityItem[];
  initialEntityTypes?: EntityTypeItem[];
}

const DEFAULT_TYPE_NAMES = [
  "Character",
  "Location",
  "Organization",
  "Object",
  "Concept",
];

export function EntitiesListClient({
  projectId,
  projectName,
  user,
  initialEntities = [],
  initialEntityTypes = [],
}: EntitiesListClientProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [entities, setEntities] = useState<EntityItem[]>(initialEntities);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>(initialEntityTypes);
  const [loading, setLoading] = useState(initialEntities.length === 0);

  // Filters (§7.2)
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchTypesAndEntities();
  }, [projectId]);

  const fetchTypesAndEntities = async () => {
    try {
      const [typesRes, entitiesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/entity-types`),
        fetch(`/api/projects/${projectId}/entities`),
      ]);

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setEntityTypes(typesData);
      }

      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json();
        if (Array.isArray(entitiesData)) {
          setEntities(entitiesData);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch entities data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Collect all unique tags used across entities (§7.2)
  const allUsedTags = Array.from(
    new Set(entities.flatMap((e) => e.tags || []))
  ).sort();

  // Filtered entities (§7.2 & §7.3)
  const filteredEntities = entities.filter((e) => {
    if (selectedTypeFilter !== "all" && e.typeId !== selectedTypeFilter) {
      return false;
    }
    if (selectedTagFilter !== "all" && !e.tags?.includes(selectedTagFilter)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.name?.toLowerCase().includes(q);
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchTag = e.tags?.some((t) => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchTag;
    }
    return true;
  });

  // Filter type tabs: strictly 5 default types + active custom types
  const visibleTypeTabs = entityTypes.filter((t) => {
    const isBuiltIn = DEFAULT_TYPE_NAMES.includes(t.name);
    const count = entities.filter((e) => e.typeId === t.id).length;
    return isBuiltIn || count > 0;
  });

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RA";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-inner flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/project/${projectId}`}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>{projectName}</span>
            </Link>
            <div className="w-px h-5 bg-[var(--border)]" />
            <ThreadinaryLogo size="sm" href="/dashboard" />
          </div>

          <div className="topbar-right flex items-center gap-3">
            <button
              className="theme-toggle"
              aria-label="Ganti tema"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>

            <button
              className="btn btn-primary whitespace-nowrap shrink-0"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Entity baru</span>
            </button>

            <div className="avatar" title={user.name || "User"}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="wrap py-10">
        <div className="page-head mb-8">
          <div>
            <h1>Entities</h1>
            <p className="sub">
              {entities.length} entitas tercatat di {projectName}
            </p>
          </div>
        </div>

        {/* Filter & Search Bar (§7.2) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Entity Type Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTypeFilter === "all"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)]"
              }`}
              onClick={() => setSelectedTypeFilter("all")}
            >
              Semua Tipe ({entities.length})
            </button>

            {visibleTypeTabs.map((t) => {
              const count = entities.filter((e) => e.typeId === t.id).length;
              return (
                <button
                  key={t.id}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedTypeFilter === t.id
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)]"
                  }`}
                  onClick={() => setSelectedTypeFilter(t.id)}
                >
                  {t.name} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Tag Filter Dropdown (§7.2) */}
            {allUsedTags.length > 0 && (
              <div className="relative">
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  className="appearance-none bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs font-medium rounded-xl pl-8 py-2 pr-7 cursor-pointer outline-none hover:border-[var(--accent)] transition-colors"
                >
                  <option value="all">Semua Tag</option>
                  {allUsedTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>
                <TagIcon
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
                />
                <ChevronDown
                  size={13}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
                />
              </div>
            )}

            {/* Search Input */}
            <div className="search flex-1 md:w-64">
              <Search size={14} className="text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Cari entity atau tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Entities Grid Section */}
        {loading ? (
          <div className="text-center py-20 text-[var(--text-secondary)]">
            Memuat daftar entitas...
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center max-w-md mx-auto my-8 flex flex-col items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <Users size={22} />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-lg mb-1">
                {searchQuery || selectedTypeFilter !== "all" || selectedTagFilter !== "all"
                  ? "Entitas Tidak Ditemukan"
                  : "Belum Ada Entity"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {searchQuery || selectedTypeFilter !== "all" || selectedTagFilter !== "all"
                  ? "Coba ubah kriteria pencarian atau filter yang kamu pilih."
                  : "Tambahkan karakter, lokasi, organisasi, objek, atau konsep pertama di duniamu."}
              </p>
            </div>
            <button
              className="btn btn-primary text-xs px-5 py-2.5 mt-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={14} />
              <span>Buat Entity Baru</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEntities.map((entity) => {
              const typeName = entity.type?.name || "Generic";

              const bgBadge =
                typeName === "Character"
                  ? "var(--accent-soft)"
                  : typeName === "Location"
                  ? "var(--sage-soft)"
                  : typeName === "Concept"
                  ? "var(--rose-soft)"
                  : "var(--accent-soft)";

              const colorBadge =
                typeName === "Character"
                  ? "var(--accent)"
                  : typeName === "Location"
                  ? "var(--sage)"
                  : typeName === "Concept"
                  ? "var(--rose)"
                  : "var(--accent)";

              return (
                <div
                  key={entity.id}
                  className="group bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow)] transition-all duration-200 cursor-pointer min-h-[160px]"
                  onClick={() =>
                    router.push(`/project/${projectId}/entities/${entity.id}`)
                  }
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: bgBadge, color: colorBadge }}
                      >
                        {typeName}
                      </span>
                      {entity.status && (
                        <span className="text-[10.5px] font-medium text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                          {entity.status}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-semibold text-lg text-[var(--text)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                      {entity.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                      {entity.description || "Belum ada deskripsi."}
                    </p>
                  </div>

                  {/* Tags Footer (§7.2) */}
                  {entity.tags && entity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-[var(--border)]">
                      {entity.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10.5px] font-medium text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-0.5 rounded-md border border-[var(--border)]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entity.tags.length > 3 && (
                        <span className="text-[10.5px] text-[var(--text-secondary)] self-center ml-1">
                          +{entity.tags.length - 3} lagi
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Entity Modal */}
      <CreateEntityModal
        projectId={projectId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setSelectedTypeFilter("all");
          setSelectedTagFilter("all");
          fetchTypesAndEntities();
        }}
        entityTypes={entityTypes}
      />
    </div>
  );
}
