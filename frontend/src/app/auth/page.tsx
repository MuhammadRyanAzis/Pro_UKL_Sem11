"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { apiRequest, setToken, setUser } from "../../lib/api";
import { Mail, Lock, User, LogIn, UserPlus } from "lucide-react";

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";

  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qTab = searchParams.get("tab");
    if (qTab === "register" || qTab === "login") {
      setTab(qTab);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (tab === "register") {
        if (!name || !email || !password) {
          throw new Error("All fields are required");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        });
        setSuccess("Registration successful! You can now log in.");
        setTab("login");
        setPassword("");
      } else {
        if (!email || !password) {
          throw new Error("Please enter your email and password");
        }
        const data = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(data.accessToken);
        setUser(data.user);
        router.push(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl relative z-10 border border-zinc-800">
      {/* Tab Selectors */}
      <div className="flex border-b border-zinc-800 mb-8">
        <button
          onClick={() => {
            setTab("login");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 pb-4 text-center text-sm font-semibold transition-all ${
            tab === "login"
              ? "border-b-2 border-violet-500 text-violet-400 font-bold"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setTab("register");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 pb-4 text-center text-sm font-semibold transition-all ${
            tab === "register"
              ? "border-b-2 border-violet-500 text-violet-400 font-bold"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-950/40 border border-red-900/50 p-4 text-xs font-semibold text-red-400">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg bg-green-950/40 border border-green-900/50 p-4 text-xs font-semibold text-green-400">
          ✅ {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {tab === "register" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Budi Santoso"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-650 focus:border-violet-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
              <Mail size={16} />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-650 focus:border-violet-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
              <Lock size={16} />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-650 focus:border-violet-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : tab === "login" ? (
            <>
              <LogIn size={16} />
              <span>Sign In</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 flex flex-col justify-center items-center py-20 px-4 relative min-h-[calc(100vh-4rem)]">
        {/* Glow backdrop decorative effects */}
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-violet-650/10 blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-650/10 blur-[100px] animate-pulse-glow" />

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <p className="text-sm text-zinc-400">Loading...</p>
          </div>
        }>
          <AuthFormContent />
        </Suspense>
      </main>
    </>
  );
}
