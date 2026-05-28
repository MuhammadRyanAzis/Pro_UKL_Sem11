"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { apiRequest, getUser } from "../../lib/api";
import { 
  Shield, 
  LayoutDashboard, 
  BookOpen, 
  Tags, 
  Users,
  Plus, 
  Trash2,
  ListVideo,
  Download,
  X
} from "lucide-react";

interface Category { id: string; name: string; }
interface Course { id: string; title: string; price: number; category: Category; _count: { chapters: number }; thumbnail: string | null; }
interface User { id: string; name: string; email: string; role: string; createdAt: string; }

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "categories" | "courses" | "users">("overview");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Add Course
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: 0, categoryId: '' });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, crs, usrs] = await Promise.all([
        apiRequest("/categories"),
        apiRequest("/courses"),
        apiRequest("/users")
      ]);
      setCategories(cats);
      setCourses(crs);
      setUsersList(usrs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Category Handlers ---
  const handleAddCategory = async () => {
    const name = prompt("Enter new category name:");
    if (!name) return;
    try {
      await apiRequest("/categories", { method: "POST", body: JSON.stringify({ name }) });
      fetchData();
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await apiRequest(`/categories/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) { alert("Error: " + err.message); }
  };

  // --- Course Handlers with File Upload ---
  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.categoryId) {
      alert("Please select a category");
      return;
    }

    setIsSubmitting(true);
    try {
      let thumbnailUrl = null;
      
      // Upload file first if exists
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        
        const uploadRes = await apiRequest("/uploads", {
          method: "POST",
          body: formData, // apiRequest will skip setting Content-Type to allow multipart/form-data boundary
        });
        thumbnailUrl = `http://localhost:8000${uploadRes.url}`;
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
      
      setShowCourseModal(false);
      setNewCourse({ title: '', description: '', price: 0, categoryId: '' });
      setThumbnailFile(null);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    try {
      await apiRequest(`/courses/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleManageChapters = async (course: Course) => {
    const title = prompt(`Add a new chapter to ${course.title}:\\nEnter Chapter Title:`);
    if (!title) return;
    const positionStr = prompt("Enter position number (e.g. 1, 2):", "1");
    const position = parseInt(positionStr || "1");
    
    try {
      await apiRequest(`/courses/${course.id}/chapters`, {
        method: "POST",
        body: JSON.stringify({
          title,
          position,
          videoUrl: null,
          isFree: true,
        }),
      });
      alert("Chapter added successfully!");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // --- Users Handlers ---
  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiRequest(`/users/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('devacademy_token');
      const res = await fetch("http://localhost:8000/api/reports/users", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to generate PDF");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Users-Report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    }
  };

  const handleExportTransactions = async () => {
    try {
      const token = localStorage.getItem('devacademy_token');
      const res = await fetch("http://localhost:8000/api/reports/transactions", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to generate PDF");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Transactions-Report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    }
  };

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
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-900 bg-zinc-950/50 flex flex-col hidden md:flex">
          <div className="p-6 border-b border-zinc-900">
            <h2 className="text-sm font-black tracking-widest text-zinc-500 uppercase flex items-center gap-2">
              <Shield size={16} className="text-violet-500" />
              Admin Area
            </h2>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "overview" ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "users" ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <Users size={18} />
              Manage Users
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "courses" ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <BookOpen size={18} />
              Manage Courses
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "categories" ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <Tags size={18} />
              Manage Categories
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <div className="flex gap-3">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 px-4 py-2 text-sm font-semibold hover:bg-red-600/30 transition-all"
                  >
                    <Download size={16} /> Users PDF
                  </button>
                  <button
                    onClick={handleExportTransactions}
                    className="flex items-center gap-2 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30 px-4 py-2 text-sm font-semibold hover:bg-violet-600/30 transition-all"
                  >
                    <Download size={16} /> Transactions PDF
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-zinc-850">
                  <div className="text-zinc-500 text-sm font-bold uppercase">Total Users</div>
                  <div className="text-4xl font-black text-white mt-2">{usersList.length}</div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-zinc-850">
                  <div className="text-zinc-500 text-sm font-bold uppercase">Total Courses</div>
                  <div className="text-4xl font-black text-white mt-2">{courses.length}</div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-zinc-850">
                  <div className="text-zinc-500 text-sm font-bold uppercase">Total Categories</div>
                  <div className="text-4xl font-black text-white mt-2">{categories.length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Manage Users</h1>
              </div>

              <div className="glass-panel rounded-xl border border-zinc-850 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/80 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Join Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-zinc-900/30">
                        <td className="px-6 py-4 font-medium text-zinc-200">{usr.name}</td>
                        <td className="px-6 py-4 text-zinc-400">{usr.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${usr.role === 'ADMIN' ? 'bg-violet-500/20 text-violet-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{new Date(usr.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 flex items-center justify-end gap-3">
                          <button onClick={() => handleDeleteUser(usr.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Manage Categories</h1>
                <button
                  onClick={handleAddCategory}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  <Plus size={16} /> Add Category
                </button>
              </div>

              <div className="glass-panel rounded-xl border border-zinc-850 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/80 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Category Name</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-zinc-900/30">
                        <td className="px-6 py-4 font-medium text-zinc-200">{cat.name}</td>
                        <td className="px-6 py-4 flex items-center justify-end gap-3">
                          <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "courses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Manage Courses</h1>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  <Plus size={16} /> Add Course
                </button>
              </div>

              <div className="glass-panel rounded-xl border border-zinc-850 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/80 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Image</th>
                      <th className="px-6 py-4 font-semibold">Title</th>
                      <th className="px-6 py-4 font-semibold">Category</th>
                      <th className="px-6 py-4 font-semibold text-center">Price</th>
                      <th className="px-6 py-4 font-semibold text-center">Modules</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-zinc-900/30">
                        <td className="px-6 py-4">
                           {course.thumbnail ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={course.thumbnail} alt="thumb" className="w-12 h-8 object-cover rounded bg-zinc-800" />
                           ) : (
                             <div className="w-12 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">None</div>
                           )}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-200">{course.title}</td>
                        <td className="px-6 py-4 text-zinc-400">
                          <span className="bg-zinc-800 px-2 py-1 rounded text-xs">{course.category?.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-yellow-400">Rp {course.price.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-center text-zinc-400">{course._count.chapters}</td>
                        <td className="px-6 py-4 flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleManageChapters(course)}
                            title="Add Chapter"
                            className="text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 p-1.5 rounded"
                          >
                            <ListVideo size={16} />
                          </button>
                          <button onClick={() => handleDeleteCourse(course.id)} className="text-red-400 hover:text-red-300 bg-red-400/10 p-1.5 rounded">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No courses found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Create New Course</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                <input 
                  type="text" required
                  value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
                <select 
                  required
                  value={newCourse.categoryId} onChange={e => setNewCourse({...newCourse, categoryId: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Price (Rp)</label>
                <input 
                  type="number" required min="0"
                  value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: parseInt(e.target.value) || 0})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Thumbnail Image (Upload)</label>
                <input 
                  type="file" accept="image/*"
                  onChange={e => setThumbnailFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-400 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                <textarea 
                  required rows={4}
                  value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg py-2.5 text-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Uploading..." : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
