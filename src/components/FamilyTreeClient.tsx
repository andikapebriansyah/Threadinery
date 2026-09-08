"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ThreadinaryLogo } from "./ThreadinaryLogo";
import { ProjectNavbar } from "./ProjectNavbar";
import {
  ArrowLeft,
  Search,
  GitBranch,
  X,
  Eye,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Users,
  Heart,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EntityTypeItem { id: string; name: string; }
interface EntitySimple {
  id: string; name: string; typeId: string;
  type?: EntityTypeItem; description?: string | null;
  status?: string | null; tags?: string[];
}
interface RelationshipSimple {
  id: string; sourceEntityId: string; targetEntityId: string;
  label: string; description?: string | null;
  source: EntitySimple; target: EntitySimple;
}

// ─── Family Role Classification ───────────────────────────────────────────────
type FamilyRole = "parent" | "child" | "sibling" | "spouse" | "extended";

// Conservative keyword dictionary — only high-confidence family terms
const FAMILY_ROLE_RULES: {
  role: FamilyRole;
  keywords: string[];
  // Modifiers that are VALID for family context
  validModifiers: string[];
  // Modifiers that BREAK family context (non-family context words)
  invalidModifiers: string[];
}[] = [
  {
    role: "parent",
    keywords: ["ayah", "ibu", "bapak", "mama", "papa", "emak", "ummi", "abi",
      "induk", "orang tua", "orangtua", "father", "mother", "dad", "mom",
      "daddy", "mommy", "papa", "mami", "papi", "nene", "opa", "oma"],
    validModifiers: ["tiri", "angkat", "kandung", "biologis", "asuh", "mertua",
      "sambung", "pengganti", "dari pihak", "perempuan", "laki", "laki-laki"],
    invalidModifiers: ["di ", "dari grup", "dari tim", "satu tim", "satu guild",
      "guild", "party", "tim", "kelompok", "faksi", "organisasi"],
  },
  {
    role: "child",
    keywords: ["anak", "putra", "putri", "keturunan", "buah hati",
      "child", "son", "daughter", "kid", "cucu"],
    validModifiers: ["tiri", "angkat", "kandung", "biologis", "asuh",
      "pertama", "sulung", "bungsu", "tengah", "perempuan", "laki",
      "laki-laki", "kesayangan"],
    invalidModifiers: ["di ", "dari grup", "dari tim", "satu tim", "guild",
      "party", "tim", "kelompok", "pungut di jalan"],
  },
  {
    role: "sibling",
    keywords: ["saudara", "kakak", "abang", "adik", "abangda", "ayunda",
      "adinda", "kaka", "bang", "aa", "teteh", "mbak", "mas",
      "sibling", "brother", "sister", "bro", "sis"],
    validModifiers: ["tiri", "angkat", "kandung", "biologis", "ipar",
      "kembar", "perempuan", "laki", "laki-laki", "tertua", "termuda",
      "sulung", "bungsu", "jauh", "sepupu"],
    invalidModifiers: ["di party", "di guild", "di tim", "di kelompok",
      "satu party", "satu tim", "satu guild", "dari party",
      "angkat senjata", "angkat bicara", "angkat tangan"],
  },
  {
    role: "spouse",
    keywords: ["suami", "istri", "pasangan", "menikah", "tunangan",
      "spouse", "wife", "husband", "partner", "kekasih", "pacar",
      "fiancé", "fiance", "fiancée"],
    validModifiers: ["sah", "resmi", "tidak sah", "rahasia", "sebelumnya",
      "mantan", "calon", "mendiang", "almarhum", "almarhumah"],
    invalidModifiers: ["di party", "di tim", "satu tim", "dari guild",
      "bisnis", "kerja", "kerja sama"],
  },
  {
    role: "extended",
    keywords: ["paman", "bibi", "om", "tante", "pakde", "bude",
      "sepupu", "keponakan", "kakek", "nenek", "buyut",
      "uncle", "aunt", "cousin", "nephew", "niece",
      "grandfather", "grandmother", "grandpa", "grandma",
      "mertua", "ipar", "besan"],
    validModifiers: ["tiri", "angkat", "kandung", "jauh", "perempuan", "laki"],
    invalidModifiers: ["di party", "di tim", "satu tim"],
  },
];

function classifyRelationshipLabel(label: string): FamilyRole | null {
  const l = label.toLowerCase().trim();

  for (const rule of FAMILY_ROLE_RULES) {
    const hasKeyword = rule.keywords.some((kw) => l.includes(kw));
    if (!hasKeyword) continue;

    // Check for invalid modifiers that break family context
    const hasInvalidModifier = rule.invalidModifiers.some((inv) => l.includes(inv));
    if (hasInvalidModifier) continue;

    // Passed — high confidence family relationship
    return rule.role;
  }

  return null;
}

// ─── Tree Node Structure ──────────────────────────────────────────────────────
interface TreeNode {
  entity: EntitySimple;
  role: FamilyRole;
  label: string;
  relId: string;
}

interface FamilyTreeData {
  parents: TreeNode[];
  spouses: TreeNode[];
  siblings: TreeNode[];
  children: TreeNode[];
  extended: TreeNode[];
}

function buildFamilyTree(
  focusEntityId: string,
  relationships: RelationshipSimple[]
): FamilyTreeData {
  const result: FamilyTreeData = {
    parents: [], spouses: [], siblings: [], children: [], extended: [],
  };

  const seen = new Set<string>([focusEntityId]);

  for (const rel of relationships) {
    let other: EntitySimple | null = null;
    let label = rel.label;
    let isOutgoing = false;

    if (rel.sourceEntityId === focusEntityId) {
      other = rel.target;
      isOutgoing = true;
    } else if (rel.targetEntityId === focusEntityId) {
      other = rel.source;
      isOutgoing = false;
    }

    if (!other || seen.has(other.id)) continue;

    const role = classifyRelationshipLabel(label);
    if (!role) continue;

    // For directional roles, flip based on direction
    let finalRole: FamilyRole = role;
    if (role === "parent" && !isOutgoing) finalRole = "child";
    else if (role === "child" && !isOutgoing) finalRole = "parent";

    const node: TreeNode = { entity: other, role: finalRole, label, relId: rel.id };

    switch (finalRole) {
      case "parent": result.parents.push(node); break;
      case "child": result.children.push(node); break;
      case "spouse": result.spouses.push(node); break;
      case "sibling": result.siblings.push(node); break;
      case "extended": result.extended.push(node); break;
    }

    seen.add(other.id);
  }

  return result;
}

// ─── Individual Tree Node Card ────────────────────────────────────────────────
function TreeNodeCard({
  node,
  isFocus = false,
  onSetFocus,
  onPreview,
}: {
  node?: TreeNode;
  entity?: EntitySimple;
  isFocus?: boolean;
  onSetFocus?: () => void;
  onPreview?: () => void;
}) {
  const entity = node?.entity;
  if (!entity) return null;

  const isDeceased =
    entity.status &&
    ["deceased", "mati", "meninggal", "gugur", "tewas", "almarhum", "almarhumah"].includes(
      entity.status.toLowerCase()
    );

  return (
    <div
      className={`
        flex flex-col items-center gap-1.5 group cursor-pointer select-none
        ${isFocus ? "scale-105" : ""}
      `}
    >
      {/* Avatar Circle */}
      <div
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          font-serif font-bold text-xl shadow-md transition-all duration-300
          ${isFocus
            ? "bg-[var(--accent)] text-white ring-4 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]"
            : "bg-[var(--surface)] text-[var(--accent)] border-2 border-[var(--border)] group-hover:border-[var(--accent)] group-hover:shadow-lg"
          }
          ${isDeceased ? "opacity-60 grayscale" : ""}
        `}
        onClick={onPreview}
        title={entity.name}
      >
        {entity.name[0]?.toUpperCase()}
        {isDeceased && (
          <span className="absolute -bottom-1 -right-1 text-[10px] bg-[var(--rose)] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
            ✝
          </span>
        )}
      </div>

      {/* Name */}
      <div className="text-center max-w-[110px]">
        <p
          className={`font-serif font-bold text-[11px] leading-tight text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 ${isDeceased ? "line-through opacity-70" : ""}`}
        >
          {entity.name}
        </p>
        {node?.label && (
          <p className="text-[9.5px] text-[var(--accent)] font-semibold mt-0.5 italic line-clamp-1">
            {node.label}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      {!isFocus && (
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onSetFocus && (
            <button
              type="button"
              onClick={onSetFocus}
              className="text-[9px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full hover:bg-[var(--accent)] hover:text-white transition-all"
            >
              Fokus
            </button>
          )}
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="text-[9px] font-semibold text-[var(--text-secondary)] bg-[var(--bg)] border border-[var(--border)] px-2 py-0.5 rounded-full hover:text-[var(--text)] transition-all"
            >
              Detail
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SVG Tree Connector Lines ─────────────────────────────────────────────────
function HorizontalBranchConnector({ count }: { count: number }) {
  if (count === 0) return null;
  const spread = Math.min(count * 90, 400);
  const halfSpread = spread / 2;

  return (
    <svg
      width={spread + 40}
      height={40}
      viewBox={`${-halfSpread - 20} 0 ${spread + 40} 40`}
      className="overflow-visible"
    >
      {/* Vertical stem from above */}
      <line x1="0" y1="0" x2="0" y2="20" stroke="var(--border)" strokeWidth="2" />
      {/* Horizontal bar */}
      {count > 1 && (
        <line
          x1={-halfSpread}
          y1="20"
          x2={halfSpread}
          y2="20"
          stroke="var(--border)"
          strokeWidth="2"
        />
      )}
      {/* Vertical stems down to each node */}
      {Array.from({ length: count }).map((_, i) => {
        const x = count === 1 ? 0 : -halfSpread + (spread / (count - 1)) * i;
        return (
          <line key={i} x1={x} y1="20" x2={x} y2="40" stroke="var(--border)" strokeWidth="2" />
        );
      })}
    </svg>
  );
}

function VerticalConnector() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32" className="overflow-visible">
      <line
        x1="20" y1="0" x2="20" y2="32"
        stroke="var(--border)" strokeWidth="2"
        strokeDasharray="4 3"
      />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface FamilyTreeClientProps {
  projectId: string; projectName: string;
  user: { id: string; name: string; email: string; };
  initialFocus?: string;
}

export function FamilyTreeClient({
  projectId, projectName, user, initialFocus,
}: FamilyTreeClientProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entities, setEntities] = useState<EntitySimple[]>([]);
  const [relationships, setRelationships] = useState<RelationshipSimple[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeItem[]>([]);

  const [focusEntityId, setFocusEntityId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [previewEntityId, setPreviewEntityId] = useState<string | null>(null);

  const [activeBookId, setActiveBookId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`threadinery_active_book_${projectId}`) || "ALL";
    }
    return "ALL";
  });

  useEffect(() => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");
    fetchData();

    const handleBookChange = (e: any) => {
      const bId = e.detail?.bookId || "ALL";
      setActiveBookId(bId);
    };
    window.addEventListener("threadinery:book_change", handleBookChange);
    return () => {
      window.removeEventListener("threadinery:book_change", handleBookChange);
    };
  }, [projectId]);

  useEffect(() => {
    if (initialFocus && entities.some((e) => e.id === initialFocus)) {
      const e = entities.find((ent) => ent.id === initialFocus)!;
      setFocusEntityId(e.id);
      setSearchQuery(e.name);
    }
  }, [initialFocus, entities]);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [entRes, relRes, typeRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/entities`),
        fetch(`/api/projects/${projectId}/relationships`),
        fetch(`/api/projects/${projectId}/entity-types`),
      ]);

      const entData: EntitySimple[] = entRes.ok ? await entRes.json() : [];
      const relData: RelationshipSimple[] = relRes.ok ? await relRes.json() : [];
      const typeData: EntityTypeItem[] = typeRes.ok ? await typeRes.json() : [];

      setEntities(entData);
      setRelationships(relData);
      setEntityTypes(typeData);

      // Auto-select focus
      if (initialFocus && entData.some((e) => e.id === initialFocus)) {
        const e = entData.find((e) => e.id === initialFocus)!;
        setFocusEntityId(e.id);
        setSearchQuery(e.name);
      } else {
        const charType = typeData.find((t) => t.name.toLowerCase() === "character");
        const chars = charType ? entData.filter((e) => e.typeId === charType.id) : entData;
        // Pick character that has classified family relationships
        const candidate = chars.find((c) =>
          relData.some((r) =>
            (r.sourceEntityId === c.id || r.targetEntityId === c.id) &&
            classifyRelationshipLabel(r.label) !== null
          )
        ) || chars[0] || entData[0];
        if (candidate) { setFocusEntityId(candidate.id); setSearchQuery(candidate.name); }
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data silsilah");
    } finally { setLoading(false); }
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // Searchable character list
  const charType = useMemo(() =>
    entityTypes.find((t) => t.name.toLowerCase() === "character"), [entityTypes]);
  const characterList = useMemo(() => {
    const list = charType ? entities.filter((e) => e.typeId === charType.id) : entities;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((e) => e.name.toLowerCase().includes(q));
  }, [entities, charType, searchQuery]);

  const focusEntity = useMemo(() => entities.find((e) => e.id === focusEntityId) || null, [entities, focusEntityId]);

  const treeData = useMemo(() =>
    focusEntityId ? buildFamilyTree(focusEntityId, relationships)
      : { parents: [], spouses: [], siblings: [], children: [], extended: [] },
    [focusEntityId, relationships]);

  const previewEntity = useMemo(() => entities.find((e) => e.id === previewEntityId) || null, [entities, previewEntityId]);

  const hasAnyFamily = treeData.parents.length + treeData.spouses.length +
    treeData.siblings.length + treeData.children.length + treeData.extended.length > 0;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "RA";

  const handleSetFocus = useCallback((entity: EntitySimple) => {
    setFocusEntityId(entity.id);
    setSearchQuery(entity.name);
    setIsPickerOpen(false);
    setPreviewEntityId(null);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Unified Project Navbar */}
      <ProjectNavbar projectId={projectId} projectName={projectName} user={user} />

      <main className="wrap py-8">
        {/* Header + Smart Search Picker */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[var(--text)] flex items-center gap-2.5 mb-1">
                <GitBranch size={26} className="text-[var(--accent)]" />
                <span>Pohon Silsilah Keluarga</span>
              </h1>
              <p className="text-xs text-[var(--text-secondary)] max-w-md">
                Bagan silsilah diturunkan otomatis dari relasi yang Anda definisikan.
                Hanya relasi keluarga yang terdeteksi dengan kepastian tinggi yang akan ditampilkan.
              </p>
            </div>

            {/* Smart Searchable Picker */}
            <div className="relative w-full md:w-72 shrink-0" onClick={(e) => e.stopPropagation()}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
                Karakter Fokus Silsilah:
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                <input
                  type="text"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-medium rounded-xl pl-8 pr-8 py-2.5 outline-none focus:border-[var(--accent)] transition-all"
                  placeholder="Cari karakter..."
                  value={isPickerOpen ? searchQuery : (focusEntity?.name || searchQuery)}
                  onFocus={() => { setIsPickerOpen(true); setSearchQuery(""); }}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsPickerOpen(true); }}
                />
                {isPickerOpen && (
                  <button type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                    onClick={() => { setIsPickerOpen(false); setSearchQuery(focusEntity?.name || ""); }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {isPickerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setIsPickerOpen(false); setSearchQuery(focusEntity?.name || ""); }} />
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto flex flex-col">
                    <div className="sticky top-0 bg-[var(--surface)] text-[9.5px] uppercase font-bold text-[var(--text-secondary)] px-3 py-1.5 border-b border-[var(--border)]">
                      {characterList.length} Karakter
                    </div>
                    {characterList.length > 0 ? characterList.map((c) => (
                      <button key={c.id} type="button"
                        className={`flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-all ${c.id === focusEntityId ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold" : "hover:bg-[var(--bg)] text-[var(--text)]"}`}
                        onClick={() => handleSetFocus(c)}>
                        <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center font-bold font-serif text-xs shrink-0">
                          {c.name[0]}
                        </div>
                        <span className="truncate">{c.name}</span>
                        {c.status && <span className="ml-auto text-[9px] text-[var(--text-secondary)] shrink-0">{c.status}</span>}
                      </button>
                    )) : (
                      <div className="px-3 py-4 text-center text-xs text-[var(--text-secondary)] italic">Karakter tidak ditemukan</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── TREE DIAGRAM ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-16 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-secondary)]">Memuat bagan silsilah...</span>
          </div>
        ) : error ? (
          <div className="bg-[var(--surface)] border border-rose-300 p-6 rounded-2xl text-xs text-rose-600">{error}</div>
        ) : !focusEntity ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-14 flex flex-col items-center gap-3">
            <Users size={40} className="text-[var(--accent)] opacity-30" />
            <p className="text-sm font-serif font-bold text-[var(--text)]">Pilih karakter untuk melihat silsilahnya</p>
            <p className="text-xs text-[var(--text-secondary)]">Gunakan pencarian di atas untuk memilih karakter fokus</p>
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden">
            {/* Tree board header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <span className="font-serif font-bold text-base text-[var(--text)] flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--accent)]" />
                Silsilah {focusEntity.name}
              </span>
              <span className="text-[10px] italic text-[var(--text-secondary)]">
                {hasAnyFamily
                  ? "Relasi yang tidak terdeteksi otomatis tidak ditampilkan di sini"
                  : "Belum ada relasi keluarga terdeteksi"}
              </span>
            </div>

            {/* Tree canvas */}
            <div className="p-8 md:p-12 overflow-x-auto">
              {!hasAnyFamily ? (
                <div className="flex flex-col items-center gap-5 py-8">
                  {/* Focus node alone */}
                  <TreeNodeCard
                    node={{ entity: focusEntity, role: "sibling", label: "", relId: "" }}
                    isFocus
                    onPreview={() => setPreviewEntityId(focusEntity.id)}
                  />
                  <div className="mt-4 text-center max-w-sm">
                    <p className="text-xs text-[var(--text-secondary)] italic mb-3">
                      Tidak ada relasi keluarga yang terdeteksi otomatis untuk <strong>{focusEntity.name}</strong>.
                    </p>
                    <Link href={`/project/${projectId}/entities/${focusEntity.id}`}
                      className="btn btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                      Tambah relasi keluarga <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0 min-w-[500px]">

                  {/* ── LEVEL 1: PARENTS ─────────────────────────────────── */}
                  {treeData.parents.length > 0 && (
                    <>
                      <div className="flex justify-center gap-10 md:gap-16">
                        {treeData.parents.map((node) => (
                          <TreeNodeCard key={node.entity.id} node={node}
                            onSetFocus={() => handleSetFocus(node.entity)}
                            onPreview={() => setPreviewEntityId(node.entity.id)} />
                        ))}
                      </div>

                      {/* Connector from parents down */}
                      <div className="flex justify-center mt-3">
                        <svg width="160" height="40" viewBox="0 0 160 40" fill="none">
                          {/* Horizontal bar connecting parents */}
                          {treeData.parents.length > 1 && (
                            <line x1="20" y1="0" x2="140" y2="0" stroke="var(--border)" strokeWidth="1.5" />
                          )}
                          {/* Vertical stem down */}
                          <line x1="80" y1="0" x2="80" y2="40" stroke="var(--border)" strokeWidth="1.5" />
                        </svg>
                      </div>
                    </>
                  )}

                  {/* ── LEVEL 2: FOCUS ROW (siblings + focus + spouses) ──── */}
                  <div className={`flex items-start justify-center gap-6 md:gap-10 ${treeData.parents.length > 0 ? "" : "mt-2"}`}>

                    {/* Siblings on LEFT */}
                    {treeData.siblings.length > 0 && (
                      <div className="flex items-start gap-4 md:gap-6">
                        {treeData.siblings.map((node) => (
                          <TreeNodeCard key={node.entity.id} node={node}
                            onSetFocus={() => handleSetFocus(node.entity)}
                            onPreview={() => setPreviewEntityId(node.entity.id)} />
                        ))}
                        {/* Sibling horizontal line to focus */}
                        <div className="flex items-center self-center">
                          <svg width="30" height="4" viewBox="0 0 30 4">
                            <line x1="0" y1="2" x2="30" y2="2" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 2" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* FOCUS ENTITY (center) */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`
                        relative w-20 h-20 rounded-full flex items-center justify-center
                        font-serif font-bold text-2xl shadow-xl
                        bg-[var(--accent)] text-white ring-4 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]
                      `}
                        onClick={() => setPreviewEntityId(focusEntity.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {focusEntity.name[0]?.toUpperCase()}
                      </div>
                      <div className="text-center">
                        <p className="font-serif font-bold text-sm text-[var(--text)]">{focusEntity.name}</p>
                        <span className="text-[9.5px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full">
                          Fokus Silsilah
                        </span>
                      </div>
                      <button type="button"
                        onClick={() => setPreviewEntityId(focusEntity.id)}
                        className="text-[9px] text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center gap-0.5 mt-0.5">
                        <Eye size={10} /> Profil
                      </button>
                    </div>

                    {/* Spouse connector + Spouse on RIGHT */}
                    {treeData.spouses.length > 0 && (
                      <div className="flex items-start gap-4 md:gap-6">
                        <div className="flex items-center self-center">
                          <svg width="36" height="20" viewBox="0 0 36 20">
                            <line x1="0" y1="10" x2="36" y2="10" stroke="var(--rose)" strokeWidth="1.5" />
                            <text x="18" y="8" textAnchor="middle" fill="var(--rose)" fontSize="10">♥</text>
                          </svg>
                        </div>
                        {treeData.spouses.map((node) => (
                          <TreeNodeCard key={node.entity.id} node={node}
                            onSetFocus={() => handleSetFocus(node.entity)}
                            onPreview={() => setPreviewEntityId(node.entity.id)} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Connector to children ─────────────────────────────── */}
                  {treeData.children.length > 0 && (
                    <div className="flex justify-center mt-3">
                      <svg width="160" height="40" viewBox="0 0 160 40" fill="none">
                        <line x1="80" y1="0" x2="80" y2="20" stroke="var(--border)" strokeWidth="1.5" />
                        {treeData.children.length > 1 && (
                          <line
                            x1={80 - (treeData.children.length - 1) * 40}
                            y1="20"
                            x2={80 + (treeData.children.length - 1) * 40}
                            y2="20"
                            stroke="var(--border)" strokeWidth="1.5"
                          />
                        )}
                        {treeData.children.map((_, i) => {
                          const n = treeData.children.length;
                          const x = n === 1 ? 80 : 80 - (n - 1) * 40 + i * 80;
                          return <line key={i} x1={x} y1="20" x2={x} y2="40" stroke="var(--border)" strokeWidth="1.5" />;
                        })}
                      </svg>
                    </div>
                  )}

                  {/* ── LEVEL 3: CHILDREN ────────────────────────────────── */}
                  {treeData.children.length > 0 && (
                    <div className="flex justify-center gap-10 md:gap-16">
                      {treeData.children.map((node) => (
                        <TreeNodeCard key={node.entity.id} node={node}
                          onSetFocus={() => handleSetFocus(node.entity)}
                          onPreview={() => setPreviewEntityId(node.entity.id)} />
                      ))}
                    </div>
                  )}

                  {/* ── Extended family section (separate, below) ─────────── */}
                  {treeData.extended.length > 0 && (
                    <div className="mt-10 pt-8 border-t border-dashed border-[var(--border)] w-full">
                      <p className="text-[10px] uppercase font-bold text-[var(--sage)] text-center mb-5">
                        Kerabat / Keluarga Besar
                      </p>
                      <div className="flex flex-wrap justify-center gap-8">
                        {treeData.extended.map((node) => (
                          <TreeNodeCard key={node.entity.id} node={node}
                            onSetFocus={() => handleSetFocus(node.entity)}
                            onPreview={() => setPreviewEntityId(node.entity.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-3 text-[10px] text-[var(--text-secondary)]">
              <span className="italic">
                💡 Pohon ini dibaca otomatis dari label relasi Anda. Label seperti "kakak", "ibu", "anak" otomatis terdeteksi.
              </span>
              <Link href={`/project/${projectId}/entities/${focusEntity?.id}`}
                className="text-[var(--accent)] hover:underline font-semibold flex items-center gap-1 shrink-0">
                Edit Relasi <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ── SIDE DRAWER PREVIEW ──────────────────────────────────────────────── */}
      {previewEntity && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setPreviewEntityId(null)}>
          <div
            className="w-full max-w-sm bg-[var(--surface)] h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <span className="font-serif font-bold text-sm text-[var(--accent)]">Detail Karakter</span>
              <button type="button" onClick={() => setPreviewEntityId(null)}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center font-serif font-bold text-xl shrink-0">
                  {previewEntity.name[0]}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[var(--text)]">{previewEntity.name}</h3>
                  {previewEntity.type && <p className="text-xs text-[var(--text-secondary)]">{previewEntity.type.name}</p>}
                  {previewEntity.status && (
                    <span className="text-[10px] bg-[var(--rose-soft)] text-[var(--rose)] px-2 py-0.5 rounded-full font-semibold capitalize mt-1 inline-block">
                      {previewEntity.status}
                    </span>
                  )}
                </div>
              </div>

              {previewEntity.description && (
                <p className="text-xs text-[var(--text)] leading-relaxed bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] whitespace-pre-line">
                  {previewEntity.description}
                </p>
              )}
            </div>

            <div className="p-5 border-t border-[var(--border)] flex gap-2">
              <button type="button"
                className="btn btn-secondary text-xs flex-1"
                onClick={() => handleSetFocus(previewEntity)}>
                Jadikan Fokus Silsilah
              </button>
              <Link href={`/project/${projectId}/entities/${previewEntity.id}`}
                className="btn btn-primary text-xs flex-1 text-center">
                Profil Penuh
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
