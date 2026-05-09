"use client";

import { X } from "lucide-react";

type RewardModalProps = {
  open: boolean;
  onClose: () => void;
};

export function RewardModal({ open, onClose }: RewardModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-center mb-4">
          💖 赞赏支持
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          如果这个工具对你有帮助，欢迎赞赏支持
        </p>
        <div className="flex justify-center">
          <img
            src="https://api.placeholder.com/200/200"
            alt="赞赏码"
            className="w-40 h-40 rounded-lg border border-gray-200"
          />
        </div>
      </div>
    </div>
  );
}
