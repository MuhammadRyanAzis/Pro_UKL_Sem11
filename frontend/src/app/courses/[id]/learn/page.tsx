"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { apiRequest, getUser } from "../../../../lib/api";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  ChevronLeft, 
  Menu, 
  CheckCircle2, 
  Circle, 
  PlayCircle,
  FileText,
  Award,
  HelpCircle,
  Video,
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  position: number;
}

interface CourseData {
  id: string;
  title: string;
  isEnrolled: boolean;
  progressPercentage: number;
  completedChapters: string[];
  chapters: Chapter[];
}

export default function CoursePlayer() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const courseId = params.id as string;
  const initialChapterId = searchParams.get("chapter");

  const [course, setCourse] = useState<CourseData | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push(`/auth?redirect=/courses/${courseId}/learn`);
      return;
    }

    async function loadCourse() {
      try {
        const data = await apiRequest(`/courses/${courseId}`);
        if (!data.isEnrolled && !data.chapters.some((c: any) => c.isFree)) {
          router.push(`/courses/${courseId}`);
          return;
        }
        setCourse(data);
        
        if (data.chapters && data.chapters.length > 0) {
          if (initialChapterId) {
            const found = data.chapters.find((c: Chapter) => c.id === initialChapterId);
            setActiveChapter(found || data.chapters[0]);
          } else {
            setActiveChapter(data.chapters[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load course player:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [courseId, initialChapterId, router]);

  // Reset quiz when chapter changes
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  }, [activeChapter]);

  const toggleProgress = async (chapterId: string, currentStatus: boolean) => {
    if (!course?.isEnrolled || updatingProgress) return;
    setUpdatingProgress(true);
    
    try {
      const result = await apiRequest(`/courses/${courseId}/chapters/${chapterId}/progress`, {
        method: "POST",
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      
      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          progressPercentage: result.progressPercentage,
          completedChapters: result.completedChapters,
        };
      });
    } catch (err) {
      console.error("Failed to update progress:", err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const renderContent = () => {
    if (!activeChapter?.content) {
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Video size={36} className="text-zinc-700" />
          <p className="italic text-zinc-500 text-sm">Materi teks belum tersedia untuk bab ini.</p>
          {activeChapter?.videoUrl && <p className="text-xs text-violet-400">Silakan tonton video di atas.</p>}
        </div>
      );
    }

    // Try parsing as JSON (for Quiz)
    try {
      const parsed = JSON.parse(activeChapter.content);
      if (parsed && parsed.type === "quiz") {
        return renderQuiz(parsed);
      }
    } catch (e) {
      // Not JSON, render as Markdown
    }

    // Render as full Markdown with GFM support
    return (
      <div className="markdown-content leading-relaxed text-sm md:text-base text-zinc-300 max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-6 mb-3 border-b border-zinc-800 pb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-5 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold text-violet-300 mt-4 mb-2">{children}</h3>,
            h4: ({ children }) => <h4 className="text-base font-semibold text-zinc-200 mt-3 mb-1">{children}</h4>,
            p: ({ children }) => <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
            em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
            ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 mb-4 pl-2 text-zinc-300">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-4 pl-2 text-zinc-300">{children}</ol>,
            li: ({ children }) => <li className="text-zinc-300 leading-relaxed">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-violet-500 pl-4 py-1 my-4 bg-violet-500/5 rounded-r-lg text-zinc-400 italic">{children}</blockquote>
            ),
            code: ({ inline, children }: any) =>
              inline ? (
                <code className="bg-zinc-800 text-violet-300 px-1.5 py-0.5 rounded text-sm font-mono border border-zinc-700">{children}</code>
              ) : (
                <code className="block bg-zinc-900 border border-zinc-700 rounded-xl p-4 my-4 text-sm font-mono text-green-300 overflow-x-auto whitespace-pre leading-relaxed">{children}</code>
              ),
            pre: ({ children }) => <pre className="my-4 overflow-hidden rounded-xl">{children}</pre>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline transition-colors">{children}</a>
            ),
            hr: () => <hr className="border-zinc-800 my-6" />,
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="w-full text-sm border-collapse border border-zinc-700 rounded-lg overflow-hidden">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-zinc-800 text-zinc-300 font-semibold">{children}</thead>,
            tbody: ({ children }) => <tbody className="divide-y divide-zinc-700">{children}</tbody>,
            tr: ({ children }) => <tr className="hover:bg-zinc-800/50 transition-colors">{children}</tr>,
            th: ({ children }) => <th className="px-4 py-2 text-left border border-zinc-700">{children}</th>,
            td: ({ children }) => <td className="px-4 py-2 border border-zinc-700 text-zinc-400">{children}</td>,
          }}
        >
          {activeChapter.content}
        </ReactMarkdown>
      </div>
    );
  };

  const renderQuiz = (quizData: any) => {
    const handleOptionSelect = (qId: number, oIdx: number) => {
      if (quizSubmitted) return;
      setQuizAnswers(prev => ({ ...prev, [qId]: oIdx }));
    };

    const handleSubmitQuiz = async () => {
      let correct = 0;
      quizData.questions.forEach((q: any) => {
        if (quizAnswers[q.id] === q.correctAnswerIndex) {
          correct++;
        }
      });
      const finalScore = Math.round((correct / quizData.questions.length) * 100);
      setQuizScore(finalScore);
      setQuizSubmitted(true);

      // Save score to database
      if (activeChapter) {
        try {
          await apiRequest('/quiz', {
            method: 'POST',
            body: JSON.stringify({
              chapterId: activeChapter.id,
              score: finalScore
            })
          });
        } catch (err) {
          console.error("Failed to save quiz score", err);
        }
      }
    };

    return (
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 md:p-8">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-6">
          <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400">
            <HelpCircle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{quizData.title}</h2>
            <p className="text-sm text-zinc-400 mt-1">{quizData.description}</p>
          </div>
        </div>

        <div className="space-y-8">
          {quizData.questions.map((q: any, idx: number) => (
            <div key={q.id} className="bg-zinc-950 p-6 rounded-xl border border-zinc-850">
              <h3 className="text-base font-semibold text-zinc-200 mb-4">
                {idx + 1}. {q.question}
              </h3>
              <div className="space-y-3">
                {q.options.map((opt: string, optIdx: number) => {
                  const isSelected = quizAnswers[q.id] === optIdx;
                  const isCorrect = q.correctAnswerIndex === optIdx;
                  let btnClass = "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300";
                  
                  if (quizSubmitted) {
                    if (isCorrect) {
                      btnClass = "border-green-500 bg-green-500/20 text-green-300";
                    } else if (isSelected && !isCorrect) {
                      btnClass = "border-red-500 bg-red-500/20 text-red-300";
                    } else {
                      btnClass = "border-zinc-800 bg-zinc-950 opacity-50";
                    }
                  } else if (isSelected) {
                    btnClass = "border-violet-500 bg-violet-500/20 text-violet-300";
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleOptionSelect(q.id, optIdx)}
                      disabled={quizSubmitted}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium flex items-center gap-3 ${btnClass}`}
                    >
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-current' : 'border-zinc-600'}`}>
                        {isSelected && <div className="h-2 w-2 rounded-full bg-current" />}
                      </div>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!quizSubmitted ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={Object.keys(quizAnswers).length < quizData.questions.length}
            className="mt-8 w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answers
          </button>
        ) : (
          <div className={`mt-8 p-6 rounded-xl border flex flex-col items-center justify-center text-center ${quizScore >= 80 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <h3 className={`text-3xl font-black ${quizScore >= 80 ? 'text-green-400' : 'text-red-400'}`}>
              Score: {quizScore}
            </h3>
            <p className="text-zinc-400 mt-2 text-sm">
              {quizScore >= 80 
                ? "Excellent! You have a great understanding of the material. You can mark this chapter as complete!" 
                : "Keep practicing! Review the material and try again."}
            </p>
            {quizScore < 80 && (
              <button 
                onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                className="mt-4 px-6 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition-all"
              >
                Retake Quiz
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">Loading learning environment...</p>
        </div>
      </div>
    );
  }

  if (!course || !activeChapter) return null;

  const isCompleted = course.completedChapters.includes(activeChapter.id);

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Top Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-900 bg-zinc-950 px-4">
        <div className="flex items-center gap-4">
          <Link
            href={course.isEnrolled ? "/dashboard" : `/courses/${courseId}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest leading-none">
              Course Player
            </span>
            <span className="text-sm font-bold text-zinc-200 mt-1 line-clamp-1 max-w-[200px] sm:max-w-md">
              {course.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
            <Award size={16} className={course.progressPercentage === 100 ? "text-yellow-500" : "text-violet-400"} />
            <span className="text-xs font-bold text-zinc-300">
              {course.progressPercentage}% Completed
            </span>
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${course.progressPercentage === 100 ? 'bg-yellow-500' : 'bg-violet-500'}`}
                style={{ width: `${course.progressPercentage}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors lg:hidden"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto scroll-smooth pb-20">
          <div className="mx-auto max-w-5xl w-full">
            {/* Video Player Box - only show if there is a video */}
            {activeChapter.videoUrl && (
              <div className="w-full bg-black aspect-video flex items-center justify-center border-b border-zinc-900">
                <iframe
                  className="w-full h-full"
                  src={activeChapter.videoUrl}
                  title="Course Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Chapter Content below video */}
            <div className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-zinc-900 pb-8">
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">{activeChapter.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                    <FileText size={16} />
                    <span>Material {activeChapter.position}</span>
                  </div>
                </div>

                {course.isEnrolled && (
                  <button
                    onClick={() => toggleProgress(activeChapter.id, isCompleted)}
                    disabled={updatingProgress}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${
                      isCompleted
                        ? "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                        : "bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500"
                    } disabled:opacity-50`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Circle size={18} />
                        <span>Mark as Complete</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Dynamic Content (Markdown or Quiz) */}
              {renderContent()}

            </div>
          </div>
        </main>

        {/* Sidebar Syllabus */}
        <aside
          className={`shrink-0 border-l border-zinc-900 bg-zinc-950/50 backdrop-blur transition-all duration-300 lg:static absolute right-0 h-full z-40 flex flex-col ${
            sidebarOpen ? "w-80 translate-x-0" : "w-0 translate-x-full lg:w-0 lg:border-l-0"
          }`}
        >
          <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
            <h3 className="font-bold text-sm text-zinc-200">Syllabus</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {course.chapters.map((chapter) => {
              const isActive = activeChapter.id === chapter.id;
              const isChapCompleted = course.completedChapters.includes(chapter.id);

              // Detect chapter type accurately from data
              let chapterType: "quiz" | "video" | "text";
              try {
                const parsed = JSON.parse(chapter.content || "");
                chapterType = parsed?.type === "quiz" ? "quiz" : "text";
              } catch {
                chapterType = chapter.videoUrl ? "video" : "text";
              }

              const typeConfig = {
                quiz:  { Icon: HelpCircle, label: "Kuis",        cls: "text-yellow-500" },
                video: { Icon: PlayCircle, label: "Video + Teks", cls: "text-blue-400"   },
                text:  { Icon: FileText,   label: "Materi Teks",  cls: "text-zinc-500"   },
              }[chapterType];

              return (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapter(chapter)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                    isActive
                      ? "bg-violet-900/30 border border-violet-500/30"
                      : "hover:bg-zinc-900 border border-transparent"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isChapCompleted ? (
                      <CheckCircle2 size={16} className="text-green-400" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-zinc-600 flex items-center justify-center">
                        {isActive && <div className="h-2 w-2 rounded-full bg-violet-500" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium line-clamp-2 ${isActive ? "text-violet-100" : "text-zinc-300"}`}>
                      {chapter.position}. {chapter.title}
                    </p>
                    <div className={`flex items-center gap-1.5 mt-1 text-xs ${typeConfig.cls}`}>
                      <typeConfig.Icon size={12} />
                      <span>{typeConfig.label}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
