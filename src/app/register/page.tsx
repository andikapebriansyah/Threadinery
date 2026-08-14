"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThreadinaryLogo } from "@/components/ThreadinaryLogo";
import { useTheme } from "@/components/ThemeProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const pwStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Auto-login after register
      await signIn("credentials", { email, password, redirect: false });
      setTimeout(() => router.push("/dashboard"), 800);
    } catch {
      setError("Terjadi kesalahan koneksi");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-[var(--bg)] bg-parchment">
      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        aria-label="Ganti tema"
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
        )}
      </button>

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <Link href="/" className="flex justify-center mb-8">
          <ThreadinaryLogo size="md" animated />
        </Link>

        <h1 className="font-serif text-2xl font-semibold text-[var(--ink)] mb-1.5">
          Mulai bangun duniamu
        </h1>
        <p className="text-[var(--ink-muted)] text-sm mb-8">
          Gratis selamanya untuk satu dunia. Tidak perlu kartu kredit.
        </p>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--sage-soft)] flex items-center justify-center">
                <Check size={32} className="text-[var(--sage)]" />
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-[var(--ink)]">Akun berhasil dibuat!</p>
                <p className="text-sm text-[var(--ink-muted)] mt-1">Mengarahkan ke dashboard...</p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
              exit={{ opacity: 0 }}
            >
              <Input
                label="Nama (opsional)"
                id="register-name"
                type="text"
                placeholder="Nama penamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User size={16} />}
              />

              <Input
                label="Email"
                id="register-email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16} />}
                required
              />

              <div className="flex flex-col gap-2">
                <Input
                  label="Password"
                  id="register-password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={16} />}
                  required
                />
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background:
                            pwStrength >= level
                              ? level === 1
                                ? "var(--rose)"
                                : level === 2
                                ? "var(--accent)"
                                : "var(--sage)"
                              : "var(--border)",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--rose-soft)] text-[var(--rose)] text-sm"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" loading={loading} className="w-full mt-1" size="lg" id="register-submit">
                Buat akun
                {!loading && <ArrowRight size={16} />}
              </Button>

              <p className="text-xs text-center text-[var(--ink-muted)]">
                Dengan mendaftar, kamu menyetujui syarat penggunaan kami.
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
          <p className="text-sm text-[var(--ink-muted)]">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[var(--accent)] font-medium hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
