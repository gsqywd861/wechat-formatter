"use client";

import { Check, Palette, X } from "lucide-react";
import { useState } from "react";
import type { TemplateConfig } from "../template-engine";

type TemplateEditorProps = {
  template: TemplateConfig;
  open: boolean;
  onClose: () => void;
  onSave: (updated: TemplateConfig) => void;
  onDelete?: () => void;
};

export function TemplateEditor({
  template,
  open,
  onClose,
  onSave,
  onDelete,
}: TemplateEditorProps) {
  const [name, setName] = useState(template.name);
  const [desc, setDesc] = useState(template.desc);
  const [themeColor, setThemeColor] = useState(template.themeColor);
  const [bgColor, setBgColor] = useState(template.backgroundColor);

  if (!open) return null;

  const handleSave = () => {
    onSave({
      ...template,
      name,
      desc,
      themeColor,
      backgroundColor: bgColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg flex flex-col">
        {/* Header */}
        <div className="neo-strip px-5 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-(--neo-ink) flex items-center gap-2 uppercase">
            <Palette className="w-4 h-4" />
            编辑模板
          </h2>
          <button onClick={onClose} className="neo-button neo-button-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* 名称 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-(--neo-ink)">模板名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 border border-(--neo-line) bg-(--neo-surface) text-sm font-bold text-(--neo-ink) focus:outline-none focus:bg-(--neo-yellow)/10"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-(--neo-ink)">描述</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full h-10 px-3 border border-(--neo-line) bg-(--neo-surface) text-sm text-(--neo-ink) focus:outline-none focus:bg-(--neo-yellow)/10"
            />
          </div>

          {/* 颜色 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-(--neo-ink)">主题色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-10 h-10 p-0 border border-(--neo-line) cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="flex-1 h-10 px-2 border border-(--neo-line) bg-(--neo-surface) text-xs font-mono text-(--neo-ink) focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-(--neo-ink)">背景色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 p-0 border border-(--neo-line) cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 h-10 px-2 border border-(--neo-line) bg-(--neo-surface) text-xs font-mono text-(--neo-ink) focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 预览色块 */}
          <div className="border border-(--neo-line) p-4 space-y-2">
            <p className="text-[10px] font-semibold text-(--neo-ink)/50 uppercase">样式预览</p>
            <div
              className="w-full p-3 space-y-2"
              style={{ backgroundColor: bgColor }}
            >
              <p style={{ fontSize: "18px", fontWeight: "bold", color: themeColor }}>
                一级标题预览
              </p>
              <p style={{ fontSize: "16px", fontWeight: "bold", color: themeColor }}>
                二级标题预览
              </p>
              <p style={{ fontSize: "14px", color: "#37474f", lineHeight: "1.8" }}>
                正文段落预览，展示文字阅读效果。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-(--neo-line) p-4 flex gap-3">
          {onDelete && (
            <button
              onClick={() => {
                // 添加确认对话框，防止误删
                if (window.confirm("确定要删除这个模板吗？此操作不可撤销。")) {
                  onDelete();
                  onClose();
                }
              }}
              className="neo-button px-4 py-2 text-xs font-semibold border-2 border-(--neo-red) text-(--neo-red) hover:bg-(--neo-red)/10"
            >
              删除模板
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="neo-button neo-button-ghost px-4 py-2 text-xs font-semibold"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="neo-button neo-button-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}