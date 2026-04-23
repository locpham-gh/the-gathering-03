import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export interface ToastProps {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}

export function Toast({ message, type, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-medium text-sm animate-in slide-in-from-bottom duration-300 ${
        type === "success" ? "bg-teal-600" : "bg-red-600"
      }`}
    >
      <CheckCircle2 size={18} />
      {message}
    </div>
  );
}
