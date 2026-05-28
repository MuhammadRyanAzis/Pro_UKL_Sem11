"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { apiRequest, getToken, getUser } from "../../../lib/api";
import Link from "next/link";
import { BookOpen, Lock, Unlock, Play, ShieldAlert, Award, ChevronRight } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  position: number;
  isFree: boolean;
}

interface Category {
  name: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  categoryId: string;
  category: Category;
  chapters: Chapter[];
  isEnrolled: boolean;
  progressPercentage: number;
}

export default function CourseDetails() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoggedIn(!!getToken());

    async function loadCourse() {
      try {
        const data = await apiRequest(`/courses/${courseId}`);
        setCourse(data);
      } catch (err) {
        console.error("Failed to load course details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push(`/auth?redirect=/courses/${courseId}`);
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      // Checkout API
      const result = await apiRequest("/transactions/checkout", {
        method: "POST",
        body: JSON.stringify({
          courseId: courseId,
          paymentMethod: "QRIS", // Default method
        }),
      });

      if (course?.price === 0 || result.status === "SUCCESS") {
        // Free course or instantly enrolled
        router.push(`/courses/${courseId}/learn`);
      } else {
        // Redirect to checkout page for payment simulation
        router.push(`/checkout/${result.id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate enrollment");
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center py-40 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">Loading course information...</p>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center py-40 text-center px-4">
          <ShieldAlert size={48} className="text-red-500" />
          <h2 className="text-xl font-bold mt-4">Course Not Found</h2>
          <p className="text-zinc-500 text-sm mt-1">The course you are looking for does not exist or has been removed.</p>
          <Link href="/" className="mt-6 text-sm text-violet-400 font-bold hover:underline">
            Back to Catalog
          </Link>
        </div>
      </>
    );
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 text-white pb-20">
        {/* Banner Section */}
        <div className="relative border-b border-zinc-900 bg-zinc-950 py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_50%)]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-widest">
              <span>Courses</span>
              <ChevronRight size={12} />
              <span>{course.category?.name}</span>
            </div>
            <h1 className="text-3xl font-extrabold sm:text-5xl mt-4 leading-tight max-w-4xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              {course.title}
            </h1>
            <p className="text-zinc-455 mt-4 text-base max-w-3xl leading-relaxed">
              {course.description}
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Course details and syllabus */}
            <div className="lg:col-span-2 space-y-10">
              {/* Syllabus / Chapters */}
              <div>
                <h3 className="text-xl font-bold border-b border-zinc-900 pb-4">
                  Course Syllabus ({course.chapters.length} material)
                </h3>
                <div className="mt-6 space-y-3">
                  {course.chapters.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">No syllabus material uploaded yet.</p>
                  ) : (
                    course.chapters.map((chapter, index) => (
                      <div
                        key={chapter.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          course.isEnrolled || chapter.isFree
                            ? "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                            : "bg-zinc-950 border-zinc-900/60 opacity-70"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                            {index + 1}
                          </span>
                          <div>
                            <span className="text-sm font-semibold text-white">
                              {chapter.title}
                            </span>
                            {chapter.isFree && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400 border border-green-500/25">
                                FREE PREVIEW
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center">
                          {course.isEnrolled ? (
                            <Link
                              href={`/courses/${course.id}/learn?chapter=${chapter.id}`}
                              className="flex items-center gap-1 rounded bg-violet-600/10 hover:bg-violet-600 border border-violet-500/20 px-2.5 py-1 text-xs font-bold text-violet-400 hover:text-white transition-all"
                            >
                              <Play size={12} />
                              Start
                            </Link>
                          ) : chapter.isFree ? (
                            <Link
                              href={`/courses/${course.id}/learn?chapter=${chapter.id}`}
                              className="flex items-center gap-1 rounded bg-green-500/10 hover:bg-green-600 border border-green-500/25 px-2.5 py-1 text-xs font-bold text-green-400 hover:text-white transition-all"
                            >
                              <Unlock size={12} />
                              Preview
                            </Link>
                          ) : (
                            <span className="text-zinc-650 flex items-center gap-1 text-xs font-medium">
                              <Lock size={12} />
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* What you will learn card */}
              <div className="p-6 rounded-2xl glass-panel border border-zinc-850">
                <h4 className="text-base font-bold flex items-center gap-2 mb-4">
                  <Award size={18} className="text-violet-500" />
                  What you will get:
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400">✓</span> Full lifetime access to all learning materials
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400">✓</span> Self-paced curriculum with hands-on examples
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400">✓</span> Dynamic progress tracking tool
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400">✓</span> Interactive dashboard statistics
                  </li>
                </ul>
              </div>
            </div>

            {/* Right side: Purchase Box */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex flex-col justify-between overflow-hidden relative">
                {/* Visual glow background */}
                <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-violet-600/10 blur-xl" />

                {/* Thumbnail */}
                <div className="aspect-video w-full rounded-xl bg-zinc-950 border border-zinc-850 overflow-hidden flex items-center justify-center">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpen size={44} className="text-violet-600/40" />
                  )}
                </div>

                <div className="mt-6 text-center">
                  <span className="text-sm font-extrabold text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                    Cost: {formatPrice(course.price)}
                  </span>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-950/40 border border-red-900/50 p-3 text-xs text-red-400">
                    {error}
                  </div>
                )}

                {/* CTA Action */}
                <div className="mt-6 space-y-3">
                  {course.isEnrolled ? (
                    <Link
                      href={`/courses/${course.id}/learn`}
                      className="flex w-full items-center justify-center rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all"
                    >
                      Go to Course Player
                    </Link>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={purchasing}
                      className="flex w-full items-center justify-center rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all disabled:opacity-50"
                    >
                      {purchasing ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : course.price === 0 ? (
                        <span>Enroll for Free</span>
                      ) : (
                        <span>Unlock with Rp {course.price.toLocaleString('id-ID')}</span>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-6 border-t border-zinc-850 pt-4 text-center">
                  <p className="text-xs text-zinc-550 font-medium">
                    {course.price === 0 
                      ? "Start learning instantly without payments." 
                      : "Complete simulated transaction to gain access."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
