"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser, logout, User, setUser, apiRequest } from "../lib/api";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, Shield, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const [user, setUserState] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const localUser = getUser();
    if (localUser) {
      setUserState(localUser);
      // Fetch fresh data
      apiRequest('/auth/me').then(freshUser => {
        setUser(freshUser);
        setUserState(freshUser);
      }).catch(() => {
        // Ignore or handle logout if token expired
      });
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUserState(null);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white">
                <BookOpen size={20} />
              </div>
              <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-xl font-bold text-transparent">
                DevAcademy
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Catalog
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  My Learning
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    <Shield size={14} className="text-violet-400" />
                    Admin Panel
                  </Link>
                )}
                
                <Link href="/settings" className="flex items-center gap-2 rounded-full bg-zinc-900/50 border border-zinc-850 px-3 py-1 hover:bg-zinc-800 transition-all cursor-pointer">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-900/60 text-violet-300 text-xs font-bold">
                    <UserIcon size={12} />
                  </div>
                  <span className="text-sm font-medium text-zinc-300">
                    {user.name}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1 text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth"
                  className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?tab=register"
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500 hover:shadow-violet-600/35 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
