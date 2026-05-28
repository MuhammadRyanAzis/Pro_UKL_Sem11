"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { apiRequest, getUser } from "../../lib/api";
import Link from "next/link";
import { BookOpen, Play, CheckCircle2, AlertCircle } from "lucide-react";

interface Transaction {
  id: string;
  courseId: string;
  status: string;
  createdAt: string;
  course: {
    title: string;
    thumbnail: string | null;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getUser();

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }

    async function fetchDashboardData() {
      try {
        const [history, quizzes] = await Promise.all([
          apiRequest("/transactions"),
          apiRequest("/quiz/me")
        ]);

        const successful = history.filter((t: Transaction) => t.status === "SUCCESS");
        
        const uniqueCourses = [];
        const seen = new Set();
        for (const t of successful) {
          if (!seen.has(t.courseId)) {
            seen.add(t.courseId);
            uniqueCourses.push(t);
          }
        }
        
        setTransactions(uniqueCourses);
        setQuizResults(quizzes);
      } catch (err: any) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [router, user]);

  if (!user) return null; // Prevent flicker before redirect

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 text-white pb-20 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          
          <div className="flex items-center gap-4 border-b border-zinc-900 pb-8">
            <div className="h-16 w-16 rounded-full bg-violet-900/30 flex items-center justify-center border border-violet-500/20">
              <span className="text-2xl font-bold text-violet-400">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user.name.split(" ")[0]}!</h1>
              <p className="text-zinc-400 mt-1">Ready to continue your learning journey?</p>
            </div>
          </div>

          <div className="mt-8">
            {/* Main Content Area */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="text-violet-500" />
                My Learning Paths
              </h2>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-950/40 p-6 border border-red-900/50 flex flex-col items-center">
                <AlertCircle size={32} className="text-red-400 mb-3" />
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-900 rounded-2xl">
                <BookOpen size={40} className="mx-auto text-zinc-600" />
                <p className="text-zinc-400 mt-4 font-medium">You haven't enrolled in any courses yet.</p>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-all"
                >
                  Explore Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {transactions.map((tx) => (
                  <div key={tx.id} className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col transition-all">
                    <div className="aspect-video w-full bg-zinc-900 border-b border-zinc-850 flex items-center justify-center">
                      {tx.course.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tx.course.thumbnail} alt={tx.course.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen size={40} className="text-violet-600/30" />
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg text-white line-clamp-2">
                        {tx.course.title}
                      </h3>
                      
                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-green-400 bg-green-500/10 w-fit px-2.5 py-1 rounded border border-green-500/20">
                        <CheckCircle2 size={14} />
                        Enrolled
                      </div>

                      <div className="mt-auto pt-6">
                        <Link
                          href={`/courses/${tx.courseId}/learn`}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all border-glow border-violet-500/20"
                        >
                          <Play size={16} />
                          Continue Learning
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quiz Results Section */}
            {quizResults.length > 0 && (
              <div className="mt-16">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" />
                  My Quiz Scores
                </h2>
                <div className="glass-panel rounded-xl border border-zinc-850 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/80 text-zinc-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Course</th>
                        <th className="px-6 py-4 font-semibold">Chapter</th>
                        <th className="px-6 py-4 font-semibold">Score</th>
                        <th className="px-6 py-4 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {quizResults.map((result) => (
                        <tr key={result.id} className="hover:bg-zinc-900/30">
                          <td className="px-6 py-4 font-medium text-zinc-200">{result.chapter.course.title}</td>
                          <td className="px-6 py-4 text-zinc-400">{result.chapter.title}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${result.score >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {result.score}/100
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-400">{new Date(result.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
            
          </div>
        </div>
      </main>
    </>
  );
}
