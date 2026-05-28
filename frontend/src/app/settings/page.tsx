"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { apiRequest, getUser, setUser } from "../../lib/api";
import { User as UserIcon, Lock, Save, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push("/auth");
      return;
    }
    setCurrentUser(currentUser);
    setFormData({ name: currentUser.name, email: currentUser.email, password: "" });
    setLoading(false);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
      };
      if (formData.password.trim() !== "") {
        payload.password = formData.password;
      }

      const updatedUser = await apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setUser(updatedUser); // Update local storage
      setCurrentUser(updatedUser);
      setFormData({ name: updatedUser.name, email: updatedUser.email, password: "" });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 text-white min-h-screen py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-zinc-400 mt-2">Manage your profile and account preferences.</p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-zinc-850">
            {message && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <AlertCircle size={18} />
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Change Password (Optional)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current password"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-500 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
