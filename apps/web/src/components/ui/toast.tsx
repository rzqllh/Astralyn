import * as React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "warning" | "danger" | "info";
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-sm border shadow-lg animate-in slide-in-from-bottom-3 duration-150",
              toast.variant === "success" &&
                "bg-[#0b1b17] border-[#34d399]/40 text-[#34d399]",
              toast.variant === "warning" &&
                "bg-[#1f190b] border-[#fbbf24]/40 text-[#fbbf24]",
              toast.variant === "danger" &&
                "bg-[#240e0e] border-[#f87171]/40 text-[#f87171]",
              (!toast.variant || toast.variant === "info") &&
                "bg-[#0e1628] border-[#38bdf8]/40 text-[#38bdf8]"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {toast.variant === "success" && <CheckCircle2 className="h-4 w-4" />}
              {toast.variant === "warning" && <AlertTriangle className="h-4 w-4" />}
              {toast.variant === "danger" && <AlertCircle className="h-4 w-4" />}
              {(!toast.variant || toast.variant === "info") && (
                <Info className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#f0f3fa]">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="mt-0.5 text-xs text-[#9ba5be]">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#9ba5be] hover:text-[#f0f3fa] cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
