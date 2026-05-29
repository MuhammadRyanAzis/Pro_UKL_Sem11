"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest } from "../lib/api";
import Link from "next/link";
import { Search, BookOpen, Clock, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  categoryId: string;
  isPublished: boolean;
  category: Category;
  _count: {
    chapters: number;
  };
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [coursesData, categoriesData] = await Promise.all([
          apiRequest("/courses"),
          apiRequest("/categories"),
        ]);
        // Filter only published courses for student view
        setCourses(coursesData.filter((c: Course) => c.isPublished));
        setCategories(categoriesData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory
      ? course.categoryId === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 text-white pb-20">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-zinc-900 bg-zinc-950 py-20 lg:py-32">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_50%)]" />
          <div className="absolute top-1/2 left-0 h-96 w-96 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px] animate-pulse-glow" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-900/30 border border-violet-800/50 px-3.5 py-1 text-xs font-semibold text-violet-400">
              ⚡ Upgrade Your Skills
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Master Modern Coding Skills
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              Interactive video courses, structured learning paths, and hands-on coding modules designed to take you from beginner to professional developer.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <a
                href="#courses"
                className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 hover:shadow-violet-600/30 transition-all"
              >
                Browse Courses
              </a>
              <Link
                href="/auth?tab=register"
                className="rounded-lg bg-zinc-900 border border-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>

        {/* Course Catalog */}
        <div id="courses" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
            <div>
              <h2 className="text-2xl font-bold">Explore Courses</h2>
              <p className="text-sm text-zinc-400 mt-1">Find the perfect course to kickstart your tech career</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                selectedCategory === null
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              All Topics
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                  selectedCategory === category.id
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p className="text-sm text-zinc-400">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-900 rounded-2xl mt-8">
              <BookOpen size={40} className="mx-auto text-zinc-600" />
              <p className="text-zinc-400 mt-4 font-medium">No courses found</p>
              <p className="text-xs text-zinc-600 mt-1">Try adjusted search queries or different category filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="glass-panel glass-panel-hover flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300"
                >
                  <div>
                    {/* Course Banner Image Placeholder */}
                    <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-850">
                      {course.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-600">
                          <BookOpen size={36} className="text-violet-500/60" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            {course.category?.name || "DevAcademy"}
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-xs text-zinc-300 font-medium">
                        <Tag size={12} className="text-violet-400" />
                        {course.category?.name}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-white hover:text-violet-400 transition-colors">
                        <Link href={`/courses/${course.id}`}>{course.title}</Link>
                      </h3>
                      <p className="text-sm text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-zinc-900 bg-zinc-950/40 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock size={14} className="text-zinc-500" />
                      <span>{course._count?.chapters || 0} Modules</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${course.price === 0 ? "text-green-400 bg-green-500/10" : "text-violet-400 bg-violet-500/10"}`}>
                        {formatPrice(course.price)}
                      </span>
                      <Link
                        href={`/courses/${course.id}`}
                        className="rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-violet-600 hover:border-violet-500 hover:text-white px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-all"
                      >
                        Start Learning
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
