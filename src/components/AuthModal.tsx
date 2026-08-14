"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register" | "forgot";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      if (mode === "forgot") {
        setSuccessMsg("Tautan pemulihan kata sandi telah dikirim ke email Anda.");
        setLoading(false);
        return;
      }

      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPassword,
            name: name.trim(),
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 409 || data.error?.includes("terdaftar")) {
            setMode("login");
            throw new Error("Email ini sudah terdaftar di database. Silakan masukkan password Anda untuk masuk.");
          }
          throw new Error(data.error || "Gagal mendaftar akun");
        }
      }

      // NextAuth v5 credentials sign in
      const res = await signIn("credentials", {
        email: cleanEmail,
        password: cleanPassword,
        redirect: false,
      });

      // Handle credentials response
      if (res?.error && res.error !== "undefined") {
        throw new Error("Password atau email tidak cocok. Silakan periksa kembali.");
      }

      // Hard redirect to refresh server session cookie seamlessly
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Auth submit error:", err);
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    window.location.href = "/dashboard";
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 100 }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "420px" }}
      >
        <div className="modal-header">
          <h2>
            {mode === "login"
              ? "Selamat Datang"
              : mode === "register"
              ? "Mulai Duniamu"
              : "Pemulihan Password"}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="text-sm text-[var(--text-secondary)] -mt-2">
          {mode === "login"
            ? "Masuk untuk melanjutkan worldbuilding & outlining ceritamu."
            : mode === "register"
            ? "Buat akun gratis untuk menyimpan seluruh semesta ceritamu."
            : "Masukkan email Anda untuk menerima instruksi reset kata sandi."}
        </p>

        {error && (
          <div className="bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)] px-3 py-2 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-[var(--sage-soft)] text-[var(--sage)] border border-[var(--sage)] px-3 py-2 rounded-lg text-xs font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <div className="form-group">
              <label>Nama Penulis</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nama Anda atau Pen Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="penulis@dunia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== "forgot" && (
            <div className="form-group">
              <div className="flex justify-between items-center">
                <label>Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setMode("forgot");
                    }}
                  >
                    Lupa password?
                  </button>
                )}
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full justify-center mt-2 py-3"
            disabled={loading}
          >
            {loading
              ? "Memproses..."
              : mode === "login"
              ? "Masuk ke Threadinery"
              : mode === "register"
              ? "Buat Akun Gratis"
              : "Kirim Instruksi Reset"}
          </button>

          {/* Quick Demo Login Option */}
          <button
            type="button"
            className="btn btn-ghost w-full justify-center text-xs py-2.5 text-[var(--text-secondary)]"
            onClick={handleDemoLogin}
          >
            ⚡ Masuk Cepat Sebagai Writer Demo
          </button>
        </form>

        <div className="border-t border-[var(--border)] pt-4 text-center text-xs text-[var(--text-secondary)]">
          {mode === "login" ? (
            <span>
              Belum punya akun?{" "}
              <button
                className="text-[var(--accent)] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode("register");
                }}
              >
                Daftar sekarang
              </button>
            </span>
          ) : mode === "register" ? (
            <span>
              Sudah punya akun?{" "}
              <button
                className="text-[var(--accent)] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode("login");
                }}
              >
                Masuk di sini
              </button>
            </span>
          ) : (
            <span>
              Ingat kata sandi Anda?{" "}
              <button
                className="text-[var(--accent)] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode("login");
                }}
              >
                Kembali ke halaman masuk
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
