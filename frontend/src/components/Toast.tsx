"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ---------- Types ----------
export interface ToastItem {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

// ---------- Styles ----------
const toastStyles: Record<ToastItem["type"], string> = {
  success: "border-green-500/40 bg-green-950/80 text-green-200",
  error:   "border-red-500/40 bg-red-950/80 text-red-200",
  warning: "border-yellow-500/40 bg-yellow-950/80 text-yellow-200",
  info:    "border-blue-500/40 bg-blue-950/80 text-blue-200",
};

const iconStyles: Record<ToastItem["type"], string> = {
  success: "text-green-400",
  error:   "text-red-400",
  warning: "text-yellow-400",
  info:    "text-blue-400",
};

const IconMap = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

// ---------- ToastContainer Component ----------
interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = IconMap[t.type];
        return (
          <div
            key={t.id}
            className={`
              flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl
              pointer-events-auto animate-toast-in
              ${toastStyles[t.type]}
            `}
          >
            <Icon size={17} className={`shrink-0 mt-0.5 ${iconStyles[t.type]}`} />
            <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => onRemove(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------- useToast Hook ----------
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastItem["type"], message: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg: string, ms?: number) => addToast("success", msg, ms),
    error:   (msg: string, ms?: number) => addToast("error",   msg, ms),
    warning: (msg: string, ms?: number) => addToast("warning", msg, ms),
    info:    (msg: string, ms?: number) => addToast("info",    msg, ms),
  };

  return { toasts, toast, removeToast };
}
