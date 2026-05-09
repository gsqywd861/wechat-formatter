"use client";

import { useEffect, useState } from "react";
import type { ToastState } from "../_types/formatter";

type ToastProps = {
  toast: ToastState;
};

export function Toast({ toast }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (toast) {
      setMessage(toast.message);
      setType(toast.type);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 animate-fade-in">
      <div
        className={`px-5 py-3 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-sm font-medium flex items-center gap-2 ${
          type === "success"
            ? "bg-[#4a8c6f] text-white"
            : "bg-[#d4687a] text-white"
        }`}
      >
        {type === "success" ? "✓" : "✕"}
        {message}
      </div>
    </div>
  );
}
