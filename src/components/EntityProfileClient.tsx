"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { EditEntityModal } from "./EditEntityModal";
import { SmartEntityPickerWithFilters } from "./SmartEntityPickerWithFilters";
import {
  ArrowLeft,
  Trash2,
  Network,
  Plus,
  Share2,
  PlusCircle,
  Edit,
  ArrowRight,
  User,
  Heart,
  KeyRound,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface EntityTypeItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface EntitySimple {
  id: string;
  name: string;
  typeId: string;
  type?: EntityTypeItem;
}

interface RelationshipItem {
  id: string;
  label: string;
  description?: string | null;
  target?: EntitySimple;
  source?: EntitySimple;
}

interface EntityProfileData {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  typeId: string;
  type: EntityTypeItem;
  tags: string[];
  metadata?: Record<string, any> | null;
  imageUrl?: string | null;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
  relationshipsFrom?: RelationshipItem[];
  relationshipsTo?: RelationshipItem[];
}

interface EntityProfileClientProps {
  projectId: string;
  entityId: string;
  projectName: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

// Quick Chip Labels (§7.5)
const QUICK_CHIP_LABELS = [
  "Ibu",
  "Ayah",
  "Anak",
  "Saudara",
  "Teman",
  "Musuh",
  "Member of",
  "Studies at",
  "Mentor",
  "Partner",
];

// Long narrative keys that need full-width display
const LONG_TEXT_KEYS = [
  "Motivasi",
  "Rahasia Kelam",
  "Penampilan Fisik",
  "Aturan Utama",
  "Kekuatan",
  "Ideologi",
  "Kesukaan",
  "Ketakutan",
  "Kepribadian",
];

const PERSONAL_PHYSICAL_KEYS = [
  "Usia",
  "Pekerjaan",
  "Penampilan Fisik",
  "Hobi",
  "Benda favorit",
  "Lokasi Induk",
  "Iklim",
  "Penguasa",
  "Pemimpin",
  "Didirikan",
  "Pemilik Saat Ini",
  "Pencipta",
];

const PSYCHOLOGICAL_KEYS = [
  "Kepribadian",
  "Kesukaan",
  "Ketakutan",
  "Motivasi",
  "Kelemahan",
  "Ideologi",
];

const PLOT_SECRET_KEYS = [
  "Rahasia Kelam",
  "Kekuatan",
  "Aturan Utama",
  "Pengguna",
];

export function EntityProfileClient({
  projectId,
  entityId,
  projectName,
  user,
}: EntityProfileClientProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [entity, setEntity] = useState<EntityProfileData | null>(null);
  const [allEntities, setAllEntities] = useState<EntitySimple[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Single-Submit Relationship Form State (§7.5 & §7.6)
  const [isAddRelModalOpen, setIsAddRelModalOpen] = useState(false);
  const [relLabel, setRelLabel] = useState("");
  const [targetMode, setTargetMode] = useState<"select" | "create">("select");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [newTargetName, setNewTargetName] = useState("");
  const [newTargetTypeId, setNewTargetTypeId] = useState("");
  const [relSubmitting, setRelSubmitting] = useState(false);
  const [relError, setRelError] = useState<string | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    fetchProfileAndAllEntities();
  }, [projectId, entityId]);

  const fetchProfileAndAllEntities = async () => {
    try {
      setLoading(true);
      const [profileRes, entitiesRes, typesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/entities/${entityId}`),
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/entity-types`),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setEntity(data);
      }

      if (entitiesRes.ok) {
        const entData = await entitiesRes.json();
        if (Array.isArray(entData)) setAllEntities(entData);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        if (Array.isArray(typesData)) setEntityTypes(typesData);
        if (typesData.length > 0) {
          setNewTargetTypeId(typesData[0].id);
        }
      }
    } catch (err) {
      console.warn("Fetch entity profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Confirm Delete Entity
  const handleConfirmDeleteEntity = async () => {
    if (!entity) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/projects/${projectId}/entities/${entityId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/project/${projectId}/entities`);
      }
    } catch (err) {
      console.error("Delete entity error:", err);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Single Seamless Relationship Submit (§7.5 & §7.6)
  const handleSaveRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relLabel.trim()) {
      setRelError("Pilih atau ketik label relasi terlebih dahulu");
      return;
    }

    setRelError(null);
    setRelSubmitting(true);

    try {
      let finalTargetId = selectedTargetId;

      if (targetMode === "create") {
        if (!newTargetName.trim() || !newTargetTypeId) {
          throw new Error("Nama dan tipe target entitas baru wajib diisi");
        }

        const createRes = await fetch(`/api/projects/${projectId}/entities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newTargetName.trim(),
            typeId: newTargetTypeId,
            description: "Entitas baru (dibuat via relasi)",
          }),
        });

        if (!createRes.ok) {
          const createData = await createRes.json();
          throw new Error(createData.error || "Gagal membuat entitas target baru");
        }

        const createdEntity = await createRes.json();
        finalTargetId = createdEntity.id;
      }

      if (!finalTargetId) {
        throw new Error("Pilih atau buat target entitas terlebih dahulu");
      }

      const relRes = await fetch(`/api/projects/${projectId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceEntityId: entityId,
          targetEntityId: finalTargetId,
          label: relLabel.trim(),
        }),
      });

      if (!relRes.ok) {
        const relData = await relRes.json();
        throw new Error(relData.error || "Gagal membuat relasi");
      }

      await fetchProfileAndAllEntities();
      setIsAddRelModalOpen(false);
      setRelLabel("");
      setSelectedTargetId("");
      setNewTargetName("");
      setTargetMode("select");
    } catch (err: any) {
      console.error("Save relationship error:", err);
      setRelError(err.message || "Gagal menyimpan relasi");
    } finally {
      setRelSubmitting(false);
    }
  };

  // Delete Relationship
  const handleDeleteRelationship = async (e: React.MouseEvent, relId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(
        `/api/projects/${projectId}/relationships/${relId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        fetchProfileAndAllEntities();
      }
    } catch (err) {
      console.error("Delete relationship error:", err);
    }
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RA";

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <div className="text-center text-[var(--text-secondary)] text-sm">
          Memuat profil entitas...
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center gap-4">
        <div className="text-center text-[var(--text-secondary)]">
          Entitas tidak ditemukan.
        </div>
        <Link
          href={`/project/${projectId}/entities`}
          className="btn btn-primary text-xs"
        >
          Kembali ke Daftar Entity
        </Link>
      </div>
    );
  }

  const outgoingRel = entity.relationshipsFrom || [];
  const incomingRel = entity.relationshipsTo || [];
  const totalRelationships = outgoingRel.length + incomingRel.length;

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

  const metadataObj = entity.metadata || {};
  const candidateTargets = allEntities.filter((e) => e.id !== entityId);

  // Separate Short Key-Values vs Long Narrative Fields
  const personalItems = Object.entries(metadataObj).filter(([k]) =>
    PERSONAL_PHYSICAL_KEYS.includes(k)
  );
  const psychItems = Object.entries(metadataObj).filter(([k]) =>
    PSYCHOLOGICAL_KEYS.includes(k)
  );
  const plotItems = Object.entries(metadataObj).filter(([k]) =>
    PLOT_SECRET_KEYS.includes(k)
  );
  const otherItems = Object.entries(metadataObj).filter(
    ([k]) =>
      !PERSONAL_PHYSICAL_KEYS.includes(k) &&
      !PSYCHOLOGICAL_KEYS.includes(k) &&
      !PLOT_SECRET_KEYS.includes(k)
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Topbar Navigation */}
      <header className="topbar">
        <div className="topbar-inner flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/project/${projectId}/entities`}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Daftar Entities</span>
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

            {/* LINK TO GRAPH WITH FOCUS PARAM */}
            <Link
              href={`/project/${projectId}/graph?focus=${entity.id}`}
              className="btn btn-ghost text-xs px-3.5 py-2 flex items-center gap-1.5 text-[var(--accent)] border border-[var(--accent-soft)] hover:bg-[var(--accent-soft)] transition-colors"
              title="Buka entitas ini sebagai pusat di Relationship Graph"
            >
              <Network size={14} />
              <span>Lihat di Mind-Map 🌐</span>
            </Link>

            {/* EDIT ENTITY BUTTON */}
            <button
              className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit size={14} />
              <span>Edit Entity</span>
            </button>

            <button
              className="btn btn-ghost text-xs text-[var(--rose)] border-[var(--border)] hover:border-[var(--rose)] flex items-center gap-1.5"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 size={14} />
              <span>Hapus</span>
            </button>

            <div className="avatar" title={user.name || "User"}>
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Profile Wrap */}
      <main className="wrap py-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          {/* Header Card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full"
                  style={{ backgroundColor: bgBadge, color: colorBadge }}
                >
                  {typeName}
                </span>
                {entity.status && (
                  <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg)] px-2.5 py-0.5 rounded-full border border-[var(--border)]">
                    {entity.status}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[var(--text)] mb-3">
                {entity.name}
              </h1>

              <p className="text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-line mb-4">
                {entity.description || "Belum ada deskripsi."}
              </p>

              {/* Tags Chips (§7.2) */}
              {entity.tags && entity.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entity.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {entity.imageUrl && (
              <img
                src={entity.imageUrl}
                alt={entity.name}
                className="w-32 h-32 object-cover rounded-xl border border-[var(--border)] shrink-0"
              />
            )}
          </div>

          {/* ELEGANT & ULTRA-NEAT CHARACTER REFERENCE DOSSIER SHEET */}
          {Object.keys(metadataObj).length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
              {/* Dossier Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <FileText size={20} className="text-[var(--accent)]" />
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-[var(--text)]">
                      {typeName === "Character" ? "Character Reference Sheet" : "Sheet Desain Entitas"}
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Biodata &amp; dokumen referensi desain resmi penulis
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-ghost text-xs text-[var(--accent)] border-[var(--border)] hover:border-[var(--accent)] px-3.5 py-1.5 flex items-center gap-1.5"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit size={13} />
                  <span>Edit Biodata</span>
                </button>
              </div>

              {/* Dossier Sections */}
              <div className="flex flex-col gap-7">
                {/* 1. PROFIL & FISIK */}
                {personalItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User size={14} className="text-[var(--accent)]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] font-serif">
                        PROFIL &amp; FISIK
                      </h3>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 md:p-5 flex flex-col gap-3">
                      {personalItems.map(([key, val]) => {
                        const isLong = LONG_TEXT_KEYS.includes(key) || String(val).length > 40;
                        return (
                          <div
                            key={key}
                            className={`flex ${
                              isLong ? "flex-col gap-1" : "flex-col sm:flex-row sm:items-center gap-2"
                            } pb-2.5 border-b border-[var(--border)] last:border-none last:pb-0`}
                          >
                            <span className="text-xs font-semibold text-[var(--text-secondary)] w-36 shrink-0 font-serif">
                              {key}
                            </span>
                            {!isLong && <span className="hidden sm:inline text-xs font-bold text-[var(--border)]">:</span>}
                            <span className="text-sm font-medium text-[var(--text)] leading-relaxed">
                              {String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. KEPRIBADIAN & MOTIVASI */}
                {psychItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart size={14} className="text-[var(--accent)]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] font-serif">
                        KEPRIBADIAN &amp; MOTIVASI
                      </h3>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 md:p-5 flex flex-col gap-3">
                      {psychItems.map(([key, val]) => {
                        const isLong = LONG_TEXT_KEYS.includes(key) || String(val).length > 40;
                        return (
                          <div
                            key={key}
                            className={`flex ${
                              isLong ? "flex-col gap-1.5" : "flex-col sm:flex-row sm:items-center gap-2"
                            } pb-3 border-b border-[var(--border)] last:border-none last:pb-0`}
                          >
                            <span className="text-xs font-semibold text-[var(--text-secondary)] w-36 shrink-0 font-serif">
                              {key}
                            </span>
                            {!isLong && <span className="hidden sm:inline text-xs font-bold text-[var(--border)]">:</span>}
                            <span className={`text-sm font-medium text-[var(--text)] leading-relaxed ${isLong ? "bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)]" : ""}`}>
                              {String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. KUNCI PLOT & RAHASIA */}
                {plotItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <KeyRound size={14} className="text-[var(--accent)]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] font-serif">
                        KUNCI PLOT &amp; RAHASIA
                      </h3>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 md:p-5 flex flex-col gap-3">
                      {plotItems.map(([key, val]) => (
                        <div
                          key={key}
                          className="flex flex-col gap-1.5 pb-3 border-b border-[var(--border)] last:border-none last:pb-0"
                        >
                          <span className="text-xs font-semibold text-[var(--accent)] font-serif">
                            {key}
                          </span>
                          <div className="text-sm font-medium text-[var(--text)] leading-relaxed italic bg-[var(--accent-soft)] p-3.5 rounded-xl border border-[var(--accent)] border-opacity-30">
                            "{String(val)}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. CATATAN & ATRIBUT KHUSUS */}
                {otherItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={14} className="text-[var(--text-secondary)]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-serif">
                        CATATAN &amp; ATRIBUT KHUSUS
                      </h3>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 md:p-5 flex flex-col gap-3">
                      {otherItems.map(([key, val]) => {
                        const isLong = LONG_TEXT_KEYS.includes(key) || String(val).length > 40;
                        return (
                          <div
                            key={key}
                            className={`flex ${
                              isLong ? "flex-col gap-1" : "flex-col sm:flex-row sm:items-center gap-2"
                            } pb-2.5 border-b border-[var(--border)] last:border-none last:pb-0`}
                          >
                            <span className="text-xs font-semibold text-[var(--text-secondary)] w-36 shrink-0 font-serif">
                              {key}
                            </span>
                            {!isLong && <span className="hidden sm:inline text-xs font-bold text-[var(--border)]">:</span>}
                            <span className="text-sm font-medium text-[var(--text)] leading-relaxed">
                              {String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RELATIONSHIPS SECTION — SELALU TAMPIL DI PROFILE (§7.5) DENGAN LINK NAVIGASI (§8.6) */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[var(--text)] flex items-center gap-2">
                  <Network size={20} className="text-[var(--accent)]" />
                  <span>RELATIONSHIPS ({totalRelationships})</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Klik pada nama entitas untuk berpindah ke profilnya langsung (§8.6)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                  onClick={() => setIsAddRelModalOpen(true)}
                >
                  <Plus size={14} />
                  <span>Tambah relationship</span>
                </button>
                <Link
                  href={`/project/${projectId}/graph`}
                  className="btn btn-ghost text-xs text-[var(--accent)] border-[var(--border)] hover:border-[var(--accent)] px-3 py-2 flex items-center gap-1.5"
                >
                  <Share2 size={14} />
                  <span>Graph</span>
                </Link>
              </div>
            </div>

            {totalRelationships === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)] text-xs bg-[var(--bg)] rounded-xl border border-[var(--border)] p-6 flex flex-col items-center gap-3">
                <p>
                  Belum ada hubungan relasi yang terhubung dengan <strong>{entity.name}</strong>.
                </p>
                <button
                  className="btn btn-ghost text-xs text-[var(--accent)] border-[var(--border)] hover:border-[var(--accent)] flex items-center gap-1.5"
                  onClick={() => setIsAddRelModalOpen(true)}
                >
                  <Plus size={14} />
                  <span>Hubungkan dengan entity lain</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {outgoingRel.map((rel) => {
                  const targetId = rel.target?.id;
                  const targetName = rel.target?.name || "Target Entity";
                  return (
                    <div
                      key={rel.id}
                      className="group flex items-center justify-between p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm hover:border-[var(--accent)] hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => {
                        if (targetId) {
                          router.push(`/project/${projectId}/entities/${targetId}`);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-md">
                          {rel.label}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] font-medium">→</span>
                        <span className="font-serif font-semibold text-[var(--text)] group-hover:text-[var(--accent)] group-hover:underline flex items-center gap-1.5">
                          <span>{targetName}</span>
                          <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]" />
                        </span>
                      </div>

                      <button
                        type="button"
                        className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-1 text-xs"
                        onClick={(e) => handleDeleteRelationship(e, rel.id)}
                        title="Hapus relasi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}

                {incomingRel.map((rel) => {
                  const sourceId = rel.source?.id;
                  const sourceName = rel.source?.name || "Source Entity";
                  return (
                    <div
                      key={rel.id}
                      className="group flex items-center justify-between p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm hover:border-[var(--sage)] hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => {
                        if (sourceId) {
                          router.push(`/project/${projectId}/entities/${sourceId}`);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-serif font-semibold text-[var(--text)] group-hover:text-[var(--sage)] group-hover:underline flex items-center gap-1.5">
                          <span>{sourceName}</span>
                          <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--sage)]" />
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] font-medium">→</span>
                        <span className="text-xs font-bold text-[var(--sage)] bg-[var(--sage-soft)] px-2.5 py-1 rounded-md">
                          {rel.label}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="text-[var(--text-secondary)] hover:text-[var(--rose)] p-1 text-xs"
                        onClick={(e) => handleDeleteRelationship(e, rel.id)}
                        title="Hapus relasi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* EDIT ENTITY MODAL */}
      {isEditModalOpen && (
        <EditEntityModal
          projectId={projectId}
          entity={entity}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => {
            setEntity({ ...entity, ...updated });
            fetchProfileAndAllEntities();
          }}
          entityTypes={entityTypes}
        />
      )}

      {/* CONFIRM DELETE ENTITY MODAL (WARM ROSE/TERRACOTTA TONE) */}
      {isDeleteModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
          }}
          style={{ zIndex: 110 }}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px", width: "100%" }}
          >
            <div className="modal-header border-b border-[var(--border)] pb-3">
              <h2 className="text-[var(--rose)] flex items-center gap-2">
                <AlertTriangle size={20} />
                <span>Hapus Entitas {entity.name}?</span>
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
                Apakah Anda yakin ingin menghapus entitas <strong>"{entity.name}"</strong>?
              </p>

              <div className="p-3.5 rounded-xl bg-[var(--rose-soft)] border border-[var(--rose)] text-[var(--rose)] flex flex-col gap-1">
                <span className="font-bold">⚠️ Peringatan:</span>
                <span>
                  Entitas ini beserta seluruh relasinya dengan entitas lain akan terhapus secara permanen.
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-3">
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
                  onClick={handleConfirmDeleteEntity}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus Entitas Ini"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE-SUBMIT RELATIONSHIP MODAL FORM (§7.5 & §7.6) */}
      {isAddRelModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddRelModalOpen(false);
            }
          }}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content overflow-y-auto max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", width: "100%" }}
          >
            <div className="modal-header">
              <h2>Tambah Relationship untuk {entity.name}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsAddRelModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {relError && (
              <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3.5 py-2.5 rounded-xl text-xs font-medium mb-3">
                {relError}
              </div>
            )}

            <form onSubmit={handleSaveRelationship} className="flex flex-col gap-4">
              {/* 1. Quick Chip Labels (§7.5) */}
              <div className="form-group">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Pilih Cepat Label Relasi (§7.5)
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {QUICK_CHIP_LABELS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                        relLabel === chip
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent)]"
                      }`}
                      onClick={() => setRelLabel(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Label Input (§7.5) */}
              <div className="form-group">
                <label>Atau Ketik Label Custom Bebas *</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder='Misal: "Adik Perempuan", "secretly hates", "mentor"...'
                  value={relLabel}
                  onChange={(e) => setRelLabel(e.target.value)}
                  required
                />
              </div>

              {/* Target Entity Mode Selector (§7.5 vs §7.6) */}
              <div className="form-group pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-xs text-[var(--text)]">Target Entity *</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                        targetMode === "select"
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                      }`}
                      onClick={() => setTargetMode("select")}
                    >
                      Pilih yang Ada
                    </button>
                    <button
                      type="button"
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                        targetMode === "create"
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                      }`}
                      onClick={() => setTargetMode("create")}
                    >
                      <PlusCircle size={12} />
                      <span>Buat Baru Inline (§7.6)</span>
                    </button>
                  </div>
                </div>

                {targetMode === "select" ? (
                  <SmartEntityPickerWithFilters
                    entities={allEntities}
                    entityTypes={entityTypes}
                    selectedEntityId={selectedTargetId}
                    onSelectEntity={(id) => setSelectedTargetId(id)}
                    placeholder="Cari Target Entity..."
                    excludeEntityId={entityId}
                  />
                ) : (
                  <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col gap-3">
                    <div className="form-group">
                      <label className="text-[11px] font-semibold text-[var(--accent)]">
                        Nama Target Entity Baru (§7.6)
                      </label>
                      <input
                        type="text"
                        className="form-input text-xs"
                        placeholder="Misal: Yanay, Menara Barat..."
                        value={newTargetName}
                        onChange={(e) => setNewTargetName(e.target.value)}
                        required={targetMode === "create"}
                      />
                    </div>
                    <div className="form-group">
                      <label className="text-[11px]">Tipe Entity</label>
                      <select
                        className="form-input text-xs"
                        value={newTargetTypeId}
                        onChange={(e) => setNewTargetTypeId(e.target.value)}
                      >
                        {entityTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Single Clear Form Action */}
              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setIsAddRelModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-6"
                  disabled={relSubmitting}
                >
                  {relSubmitting ? "Menyimpan..." : "Simpan Relationship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
