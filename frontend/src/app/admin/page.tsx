"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useToast, ToastContainer } from "../../components/Toast";
import { apiRequest, getUser } from "../../lib/api";
import {
  Shield, LayoutDashboard, BookOpen, Tags, Users,
  Plus, Trash2, ListVideo, Download, X,
  Pencil, FileText, CheckSquare, Square, Save, RefreshCw,
  AlertTriangle,
} from "lucide-react";

// ---------- Interfaces ----------
interface Category { id: string; name: string; }

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  categoryId: string;
  category: Category;
  isPublished: boolean;
  thumbnail: string | null;
  _count: { chapters: number };
}

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  position: number;
  isFree: boolean;
}

interface UserItem { id: string; name: string; email: string; role: string; createdAt: string; }

interface ConfirmState { title: string; message: string; onConfirm: () => void; }

const EMPTY_CHAPTER_FORM = { title: "", position: 1, content: "", videoUrl: "", isFree: true };

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

// ---------- Component ----------
export default function AdminDashboard() {
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState<"overview" | "categories" | "courses" | "users">("overview");

  // Core data
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirm Dialog
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ title, message, onConfirm });
  };

  // ---- Add Category Modal ----
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // ---- Edit Category Modal ----
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  // ---- Add Course Modal ----
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", price: 0, categoryId: "" });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- Edit Course Modal ----
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseData, setEditCourseData] = useState({ title: "", description: "", price: 0, categoryId: "" });
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);

  // ---- Chapter Manager Modal ----
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [activeCourseForChapter, setActiveCourseForChapter] = useState<Course | null>(null);
  const [chapterList, setChapterList] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterForm, setChapterForm] = useState(EMPTY_CHAPTER_FORM);
  const [isSavingChapter, setIsSavingChapter] = useState(false);

  // ---------- Bootstrap ----------
  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "ADMIN") { router.push("/"); return; }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, crs, usrs] = await Promise.all([
        apiRequest("/categories"),
        apiRequest("/courses"),
        apiRequest("/users"),
      ]);
      setCategories(cats);
      setCourses(crs);
      setUsersList(usrs);
    } catch (err: any) {
      toast.error("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== CATEGORY HANDLERS ====================

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    try {
      await apiRequest("/categories", { method: "POST", body: JSON.stringify({ name: newCategoryName.trim() }) });
      toast.success(`Category "${newCategoryName.trim()}" created successfully!`);
      setShowAddCategoryModal(false);
      setNewCategoryName("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditCategoryName(cat.name);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;
    setIsUpdatingCategory(true);
    try {
      await apiRequest(`/categories/${editingCategory.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editCategoryName.trim() }),
      });
      toast.success(`Category updated to "${editCategoryName.trim()}"!`);
      setEditingCategory(null);
      setEditCategoryName("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    showConfirm(
      "Delete Category",
      `Are you sure you want to delete "${name}"? This may affect related courses.`,
      async () => {
        try {
          await apiRequest(`/categories/${id}`, { method: "DELETE" });
          toast.success(`Category "${name}" deleted.`);
          fetchData();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete category");
        }
      }
    );
  };

  // ==================== COURSE HANDLERS ====================

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.categoryId) { toast.warning("Please select a category first!"); return; }
    setIsSubmitting(true);
    try {
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        const uploadRes = await apiRequest("/uploads", { method: "POST", body: formData });
        thumbnailUrl = `${BACKEND_URL}${uploadRes.url}`;
      }
      await apiRequest("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: newCourse.title,
          description: newCourse.description,
          price: Number(newCourse.price),
          categoryId: newCourse.categoryId,
          thumbnail: thumbnailUrl,
          isPublished: true,
        }),
      });
      toast.success(`Course "${newCourse.title}" created successfully!`);
      setShowCourseModal(false);
      setNewCourse({ title: "", description: "", price: 0, categoryId: "" });
      setThumbnailFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditCourseData({
      title: course.title,
      description: course.description || "",
      price: course.price,
      categoryId: course.categoryId,
    });
    setEditThumbnailFile(null);
    setShowEditCourseModal(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setIsUpdatingCourse(true);
    try {
      let thumbnailUrl = editingCourse.thumbnail;
      if (editThumbnailFile) {
        const formData = new FormData();
        formData.append("file", editThumbnailFile);
        const uploadRes = await apiRequest("/uploads", { method: "POST", body: formData });
        thumbnailUrl = `${BACKEND_URL}${uploadRes.url}`;
      }
      await apiRequest(`/courses/${editingCourse.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editCourseData.title,
          description: editCourseData.description,
          price: Number(editCourseData.price),
          categoryId: editCourseData.categoryId,
          thumbnail: thumbnailUrl,
          isPublished: editingCourse.isPublished,
        }),
      });
      toast.success(`Course "${editCourseData.title}" updated successfully!`);
      setShowEditCourseModal(false);
      setEditingCourse(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update course");
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handleDeleteCourse = (id: string, title: string) => {
    showConfirm(
      "Delete Course",
      `Delete "${title}"? All its chapters and student progress will be permanently removed.`,
      async () => {
        try {
          await apiRequest(`/courses/${id}`, { method: "DELETE" });
          toast.success(`Course "${title}" deleted.`);
          fetchData();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete course");
        }
      }
    );
  };

  // ==================== CHAPTER MANAGER HANDLERS ====================

  const loadChapters = async (courseId: string) => {
    setIsLoadingChapters(true);
    try {
      const data = await apiRequest(`/courses/${courseId}`);
      const sorted = [...(data.chapters || [])].sort((a: Chapter, b: Chapter) => a.position - b.position);
      setChapterList(sorted);
    } catch (err: any) {
      toast.error("Failed to load chapters: " + err.message);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const handleOpenChapterManager = (course: Course) => {
    setActiveCourseForChapter(course);
    setChapterList([]);
    setEditingChapter(null);
    setChapterForm({ ...EMPTY_CHAPTER_FORM, position: 1 });
    setShowChapterModal(true);
    loadChapters(course.id);
  };

  const handleOpenEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterForm({
      title: chapter.title,
      position: chapter.position,
      content: chapter.content || "",
      videoUrl: chapter.videoUrl || "",
      isFree: chapter.isFree,
    });
    document.getElementById("chapter-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelEditChapter = () => {
    setEditingChapter(null);
    setChapterForm({ ...EMPTY_CHAPTER_FORM, position: chapterList.length + 1 });
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseForChapter || !chapterForm.title.trim()) return;
    setIsSavingChapter(true);
    const payload = {
      title: chapterForm.title.trim(),
      position: Number(chapterForm.position),
      content: chapterForm.content.trim() || null,
      videoUrl: chapterForm.videoUrl.trim() || null,
      isFree: chapterForm.isFree,
    };
    try {
      if (editingChapter) {
        await apiRequest(`/courses/${activeCourseForChapter.id}/chapters/${editingChapter.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success(`Chapter "${payload.title}" updated!`);
      } else {
        await apiRequest(`/courses/${activeCourseForChapter.id}/chapters`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success(`Chapter "${payload.title}" added!`);
      }
      setEditingChapter(null);
      setChapterForm({ ...EMPTY_CHAPTER_FORM, position: chapterList.length + 2 });
      await loadChapters(activeCourseForChapter.id);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save chapter");
    } finally {
      setIsSavingChapter(false);
    }
  };

  const handleDeleteChapter = (chapterId: string, title: string) => {
    if (!activeCourseForChapter) return;
    showConfirm(
      "Delete Chapter",
      `Delete chapter "${title}"? Student progress for this chapter will also be removed.`,
      async () => {
        try {
          await apiRequest(`/courses/${activeCourseForChapter.id}/chapters/${chapterId}`, { method: "DELETE" });
          toast.success(`Chapter "${title}" deleted.`);
          await loadChapters(activeCourseForChapter.id);
          fetchData();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete chapter");
        }
      }
    );
  };

  // ==================== USER HANDLERS ====================

  const handleDeleteUser = (id: string, name: string) => {
    showConfirm(
      "Delete User",
      `Delete user "${name}"? All their enrollment and progress data will be permanently removed.`,
      async () => {
        try {
          await apiRequest(`/users/${id}`, { method: "DELETE" });
          toast.success(`User "${name}" deleted.`);
          fetchData();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete user");
        }
      }
    );
  };

  const handleExportPDF = async () => {
    toast.info("Generating Users PDF report...");
    try {
      const token = localStorage.getItem("devacademy_token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiBase}/reports/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "Users-Report.pdf";
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Users PDF exported successfully!");
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    }
  };

  const handleExportTransactions = async () => {
    toast.info("Generating Transactions PDF report...");
    try {
      const token = localStorage.getItem("devacademy_token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiBase}/reports/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "Transactions-Report.pdf";
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Transactions PDF exported successfully!");
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    }
  };

  // ---------- Shared Styles ----------
  const inputClass = "w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none transition-colors placeholder:text-zinc-600";
  const labelClass = "block text-sm font-medium text-zinc-400 mb-1";

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 bg-zinc-950 flex justify-center py-40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-950 text-white flex">

        {/* ===== Sidebar ===== */}
        <aside className="w-64 border-r border-zinc-900 bg-zinc-950/50 flex-col hidden md:flex shrink-0">
          <div className="p-6 border-b border-zinc-900">
            <h2 className="text-sm font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
              <Shield size={16} className="text-violet-500" /> Admin Area
            </h2>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: "overview",    label: "Overview",           Icon: LayoutDashboard },
              { id: "users",       label: "Manage Users",       Icon: Users           },
              { id: "courses",     label: "Manage Courses",     Icon: BookOpen        },
              { id: "categories",  label: "Manage Categories",  Icon: Tags            },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === id ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ===== Main Content ===== */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">

          {/* ---- OVERVIEW ---- */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 px-4 py-2 text-sm font-semibold hover:bg-red-600/30 transition-all">
                    <Download size={16} /> Users PDF
                  </button>
                  <button onClick={handleExportTransactions} className="flex items-center gap-2 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30 px-4 py-2 text-sm font-semibold hover:bg-violet-600/30 transition-all">
                    <Download size={16} /> Transactions PDF
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: "Total Users",      value: usersList.length  },
                  { label: "Total Courses",    value: courses.length    },
                  { label: "Total Categories", value: categories.length },
                ].map(({ label, value }) => (
                  <div key={label} className="glass-panel p-6 rounded-2xl border border-zinc-800">
                    <div className="text-zinc-500 text-sm font-bold uppercase tracking-wide">{label}</div>
                    <div className="text-4xl font-black text-white mt-2">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- USERS ---- */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Manage Users</h1>
              <div className="glass-panel rounded-xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-zinc-900/80 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Join Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-200">{usr.name}</td>
                        <td className="px-6 py-4 text-zinc-400">{usr.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${usr.role === "ADMIN" ? "bg-violet-500/20 text-violet-400" : "bg-zinc-800 text-zinc-400"}`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{new Date(usr.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 flex justify-end">
                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.name)}
                            className="text-red-400 hover:text-red-300 bg-red-400/10 p-1.5 rounded hover:bg-red-400/20 transition-all"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- CATEGORIES ---- */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Manage Categories</h1>
                <button onClick={() => { setShowAddCategoryModal(true); setNewCategoryName(""); }} className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-all">
                  <Plus size={16} /> Add Category
                </button>
              </div>
              <div className="glass-panel rounded-xl border border-zinc-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/80 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Category Name</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-200">{cat.name}</td>
                        <td className="px-6 py-4 flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEditCategory(cat)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 p-1.5 rounded hover:bg-emerald-400/20 transition-all" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-red-400 hover:text-red-300 bg-red-400/10 p-1.5 rounded hover:bg-red-400/20 transition-all" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr><td colSpan={2} className="px-6 py-8 text-center text-zinc-500">No categories found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- COURSES ---- */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Manage Courses</h1>
                <button onClick={() => setShowCourseModal(true)} className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-all">
                  <Plus size={16} /> Add Course
                </button>
              </div>
              <div className="glass-panel rounded-xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-zinc-900/80 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Image</th>
                      <th className="px-6 py-4 font-semibold">Title</th>
                      <th className="px-6 py-4 font-semibold">Category</th>
                      <th className="px-6 py-4 font-semibold text-center">Price</th>
                      <th className="px-6 py-4 font-semibold text-center">Chapters</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-4">
                          {course.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={course.thumbnail} alt="thumb" className="w-14 h-9 object-cover rounded bg-zinc-800" />
                          ) : (
                            <div className="w-14 h-9 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-600">None</div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-200 max-w-[200px]">
                          <p className="truncate">{course.title}</p>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          <span className="bg-zinc-800 px-2 py-1 rounded text-xs">{course.category?.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold">
                          {course.price === 0
                            ? <span className="text-green-400 text-xs font-bold">FREE</span>
                            : <span className="text-yellow-400">Rp {course.price.toLocaleString("id-ID")}</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-center text-zinc-400 font-semibold">{course._count.chapters}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenChapterManager(course)} title="Manage Chapters" className="text-blue-400 hover:text-blue-300 bg-blue-400/10 p-1.5 rounded hover:bg-blue-400/20 transition-all">
                              <ListVideo size={15} />
                            </button>
                            <button onClick={() => handleOpenEditCourse(course)} title="Edit Course" className="text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 p-1.5 rounded hover:bg-emerald-400/20 transition-all">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDeleteCourse(course.id, course.title)} title="Delete Course" className="text-red-400 hover:text-red-300 bg-red-400/10 p-1.5 rounded hover:bg-red-400/20 transition-all">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No courses found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================== CONFIRM DIALOG ==================== */}
      {confirmState && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-red-500/30 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 h-10 w-10 rounded-full bg-red-500/15 flex items-center justify-center border border-red-500/30">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{confirmState.title}</h4>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{confirmState.message}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmState(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { confirmState.onConfirm(); setConfirmState(null); }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg py-2.5 text-sm transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD CATEGORY ==================== */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-violet-500/30 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Tags size={18} className="text-violet-400" /> Add Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Category Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAddCategory(); }}
                  placeholder="e.g. Fundamental Web Programming"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddCategoryModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={handleAddCategory} disabled={isAddingCategory || !newCategoryName.trim()} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isAddingCategory ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Category</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT CATEGORY ==================== */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Pencil size={18} className="text-emerald-400" /> Edit Category</h3>
              <button onClick={() => setEditingCategory(null)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Category Name</label>
                <input
                  type="text"
                  autoFocus
                  value={editCategoryName}
                  onChange={e => setEditCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleUpdateCategory(); }}
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingCategory(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg py-2.5 text-sm">Cancel</button>
                <button onClick={handleUpdateCategory} disabled={isUpdatingCategory || !editCategoryName.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isUpdatingCategory ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Update</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD COURSE ==================== */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Create New Course</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCourseSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input type="text" required value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="Course title" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <select required value={newCourse.categoryId} onChange={e => setNewCourse({ ...newCourse, categoryId: e.target.value })} className={inputClass}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Price (Rp) — 0 for Free *</label>
                <input type="number" required min="0" value={newCourse.price} onChange={e => setNewCourse({ ...newCourse, price: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Thumbnail Image <span className="text-zinc-600 font-normal">(Optional)</span></label>
                <input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files ? e.target.files[0] : null)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-400 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer" />
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea required rows={4} value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Course description..." className={`${inputClass} resize-none`} />
              </div>
              <div className="pt-1">
                <button type="submit" disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg py-2.5 text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Create Course</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT COURSE ==================== */}
      {showEditCourseModal && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Pencil size={18} className="text-emerald-400" /> Edit Course</h3>
                <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[280px]">{editingCourse.title}</p>
              </div>
              <button onClick={() => setShowEditCourseModal(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input type="text" required value={editCourseData.title} onChange={e => setEditCourseData({ ...editCourseData, title: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <select required value={editCourseData.categoryId} onChange={e => setEditCourseData({ ...editCourseData, categoryId: e.target.value })} className={inputClass}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Price (Rp) — 0 for Free *</label>
                <input type="number" required min="0" value={editCourseData.price} onChange={e => setEditCourseData({ ...editCourseData, price: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>New Thumbnail <span className="text-zinc-600 font-normal">(leave empty to keep current)</span></label>
                <input type="file" accept="image/*" onChange={e => setEditThumbnailFile(e.target.files ? e.target.files[0] : null)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-400 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer" />
                {editingCourse.thumbnail && !editThumbnailFile && (
                  <p className="text-xs text-zinc-600 mt-1">✓ Current thumbnail will be kept.</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea required rows={4} value={editCourseData.description} onChange={e => setEditCourseData({ ...editCourseData, description: e.target.value })} className={`${inputClass} resize-none`} />
              </div>
              <div className="pt-1 flex gap-3">
                <button type="button" onClick={() => setShowEditCourseModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg py-2.5 text-sm">Cancel</button>
                <button type="submit" disabled={isUpdatingCourse} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {isUpdatingCourse ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Update Course</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CHAPTER MANAGER ==================== */}
      {showChapterModal && activeCourseForChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-zinc-950 border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] animate-fade-in">

            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-zinc-800 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ListVideo size={20} className="text-blue-400" /> Chapter Manager
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5 truncate max-w-[400px]">{activeCourseForChapter.title}</p>
              </div>
              <button onClick={() => { setShowChapterModal(false); setEditingChapter(null); }} className="text-zinc-500 hover:text-zinc-300 mt-1"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">

              {/* Chapter List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Current Chapters ({chapterList.length})</h4>
                  <button onClick={() => loadChapters(activeCourseForChapter.id)} className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 transition-colors">
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>

                {isLoadingChapters ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : chapterList.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl">
                    <FileText size={28} className="mx-auto text-zinc-600 mb-2" />
                    <p className="text-xs text-zinc-500">No chapters yet. Add the first one below.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chapterList.map((ch) => (
                      <div
                        key={ch.id}
                        className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                          editingChapter?.id === ch.id ? "border-emerald-500/40 bg-emerald-950/15" : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">#{ch.position}</span>
                            <span className="text-sm font-semibold text-zinc-200 truncate">{ch.title}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ch.isFree ? "text-green-400 bg-green-500/10" : "text-orange-400 bg-orange-500/10"}`}>
                              {ch.isFree ? "Free" : "Locked"}
                            </span>
                            {ch.content && (
                              <span className="text-xs text-zinc-600 truncate max-w-[220px]">
                                {ch.content.substring(0, 55)}{ch.content.length > 55 ? "..." : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          <button onClick={() => handleOpenEditChapter(ch)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 p-1.5 rounded hover:bg-emerald-400/20 transition-all" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteChapter(ch.id, ch.title)} className="text-red-400 hover:text-red-300 bg-red-400/10 p-1.5 rounded hover:bg-red-400/20 transition-all" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chapter Form */}
              <div id="chapter-form-section" className={`rounded-xl border p-5 transition-all ${editingChapter ? "border-emerald-500/40 bg-emerald-950/10" : "border-zinc-800 bg-zinc-900/20"}`}>
                <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  {editingChapter
                    ? <><Pencil size={14} className="text-emerald-400" /> Editing: {editingChapter.title}</>
                    : <><Plus size={14} className="text-blue-400" /> Add New Chapter</>
                  }
                </h4>

                <form onSubmit={handleSaveChapter} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Chapter Title *</label>
                      <input type="text" required value={chapterForm.title} onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })} placeholder="e.g. Bagian 1: Konsep Dasar" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Position *</label>
                      <input type="number" required min="1" value={chapterForm.position} onChange={e => setChapterForm({ ...chapterForm, position: parseInt(e.target.value) || 1 })} className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Learning Material Content (Materi Teks)</label>
                    <textarea
                      rows={8}
                      value={chapterForm.content}
                      onChange={e => setChapterForm({ ...chapterForm, content: e.target.value })}
                      placeholder="Tulis materi pembelajaran di sini. Anda bisa menulis teks panjang, penjelasan konsep, contoh kode, dll..."
                      className={`${inputClass} resize-y leading-relaxed`}
                    />
                    <p className="text-xs text-zinc-600 mt-1">Materi teks yang akan dibaca oleh siswa.</p>
                  </div>

                  <div>
                    <label className={labelClass}>Video URL <span className="text-zinc-600 font-normal">(Opsional)</span></label>
                    <input type="text" value={chapterForm.videoUrl} onChange={e => setChapterForm({ ...chapterForm, videoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/... (kosongkan jika tidak ada video)" className={inputClass} />
                  </div>

                  <div>
                    <button type="button" onClick={() => setChapterForm({ ...chapterForm, isFree: !chapterForm.isFree })} className={`flex items-center gap-2 text-sm font-semibold transition-colors py-1 ${chapterForm.isFree ? "text-green-400" : "text-zinc-500 hover:text-zinc-300"}`}>
                      {chapterForm.isFree ? <CheckSquare size={18} /> : <Square size={18} />}
                      Free Access (dapat diakses tanpa enrollment)
                    </button>
                  </div>

                  <div className="flex gap-3 pt-1">
                    {editingChapter && (
                      <button type="button" onClick={handleCancelEditChapter} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-all">
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSavingChapter || !chapterForm.title.trim()}
                      className={`flex-1 font-bold rounded-lg py-2.5 text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-white ${editingChapter ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"}`}
                    >
                      {isSavingChapter
                        ? <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                        : editingChapter
                          ? <><Save size={14} /> Update Chapter</>
                          : <><Plus size={14} /> Add Chapter</>
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST CONTAINER ==================== */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
