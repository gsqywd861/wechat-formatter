import {
  Code2,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Palette,
  Quote,
  Redo2,
  Settings,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import React, { useEffect } from "react";
import type { ActiveTab, FormatTweaks, WordCount } from "../_types/formatter";

type MarkdownEditorPaneProps = {
  activeTab: ActiveTab;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputScroll: (e: React.UIEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  wordCount: WordCount;
  insertMarkdown: (prefix: string, suffix?: string, placeholder?: string) => void;
  insertHeading: (level: number) => void;
  insertList: (type: "ul" | "ol") => void;
  insertCodeBlock: () => void;
  insertLink: () => void;
  insertImage: () => void;
  onAiFormat: () => void;
  isAiFormatting: boolean;
  onOpenAiConfig: () => void;
  onRestoreSample: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  formatTweaks: FormatTweaks;
  setFormatTweaks: React.Dispatch<React.SetStateAction<FormatTweaks>>;
};

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (color: string) => void;
};

/** 小巧的快速调色控件 */
function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 p-0 border border-(--neo-line) cursor-pointer"
        title={`${label}颜色`}
      />
      <span className="text-[10px] font-bold text-(--neo-ink)/70">{label}</span>
    </div>
  );
}

export function MarkdownEditorPane({
  activeTab,
  inputText,
  setInputText,
  inputRef,
  onInputScroll,
  onPaste,
  wordCount,
  insertMarkdown,
  insertHeading,
  insertList,
  insertCodeBlock,
  insertLink,
  insertImage,
  onAiFormat,
  isAiFormatting,
  onOpenAiConfig,
  onRestoreSample,
  formatTweaks,
  setFormatTweaks,
  onUndo,
  onRedo,
  onClear,
}: MarkdownEditorPaneProps) {
  // 键盘快捷键：Cmd+Z 撤销，Cmd+Shift+Z 重做
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          onRedo();
        } else {
          e.preventDefault();
          onUndo();
        }
      }
      // Cmd+Y 重做（Windows 习惯）
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        onRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo]);

  return (
    <div
      className={`flex-[1.2] flex-col neo-panel overflow-hidden ${activeTab === "input" ? "flex" : "hidden md:flex"}`}
    >
      <div className="neo-strip px-3 py-2.5 sm:px-4 sm:py-3 shrink-0 flex flex-col gap-3">
        <span className="text-xs sm:text-sm font-bold text-(--neo-on-header) flex items-center gap-2">
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate">Markdown 输入</span>
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onAiFormat}
            className="neo-button neo-button-primary text-xs px-2 py-2 flex items-center justify-center gap-1.5 w-full"
            disabled={!inputText.trim() || isAiFormatting}
            title="使用 AI 一键优化当前 Markdown 排版结构"
          >
            {isAiFormatting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {isAiFormatting ? "AI 排版中..." : "AI 一键排版"}
            </span>
          </button>
          <button
            onClick={onOpenAiConfig}
            className="neo-button neo-button-ghost text-xs px-2 py-2 flex items-center justify-center gap-1.5 w-full"
            title="配置 AI 服务"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>AI 配置</span>
          </button>
          <button
            onClick={onRestoreSample}
            className="neo-button neo-button-ghost text-xs px-2 py-2 flex items-center justify-center gap-1.5 w-full"
            title="恢复示例 Markdown"
          >
            <span>恢复示例</span>
          </button>
        </div>
      </div>

      {/* 第一行：撤销 / 重做 + 标题 + 文字格式 */}
      <div className="bg-(--neo-section-header) px-3 py-2 border-b border-(--neo-line) flex flex-wrap items-center gap-1 shrink-0">
        <button onClick={onUndo} className="neo-toolbar-button p-1.5" title="撤销 (Cmd+Z)">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={onRedo} className="neo-toolbar-button p-1.5" title="重做 (Cmd+Shift+Z)">
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="w-[3px] h-6 bg-(--neo-ink) mx-1" />
        <button onClick={() => insertHeading(1)} className="neo-toolbar-button p-1.5 text-sm font-bold" title="一级标题">H1</button>
        <button onClick={() => insertHeading(2)} className="neo-toolbar-button p-1.5 text-sm font-bold" title="二级标题">H2</button>
        <button onClick={() => insertHeading(3)} className="neo-toolbar-button p-1.5 text-sm font-bold" title="三级标题">H3</button>
        <button onClick={() => insertMarkdown("**", "**", "加粗")} className="neo-toolbar-button p-1.5 font-bold text-sm" title="加粗 (Ctrl+B)">
          <span className="text-[13px]">B</span>
        </button>
        <button onClick={() => insertMarkdown("*", "*", "斜体")} className="neo-toolbar-button p-1.5 italic" title="斜体 (Ctrl+I)">
          <span className="text-[13px]" style={{ fontStyle: 'italic' }}>I</span>
        </button>
        <button onClick={() => insertMarkdown("<u>", "</u>", "下划线")} className="neo-toolbar-button p-1.5" title="下划线 (Ctrl+U)">
          <span className="text-[13px] underline">U</span>
        </button>
        <button onClick={() => insertMarkdown("~~", "~~", "删除线")} className="neo-toolbar-button p-1.5" title="删除线">
          <span className="text-[13px] line-through">S</span>
        </button>
      </div>

      {/* 第二行：列表、引用、代码、插入 */}
      <div className="bg-(--neo-section-header) px-3 py-2 border-b border-(--neo-line) flex flex-wrap items-center gap-1 shrink-0">
        <button onClick={() => insertList("ul")} className="neo-toolbar-button p-1.5" title="无序列表">
          <List className="w-4 h-4" />
        </button>
        <button onClick={() => insertList("ol")} className="neo-toolbar-button p-1.5" title="有序列表">
          <ListOrdered className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown("> ", "", "引用内容")} className="neo-toolbar-button p-1.5" title="引用">
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-[3px] h-6 bg-(--neo-ink) mx-1" />

        <button onClick={() => insertMarkdown("`", "`", "代码")} className="neo-toolbar-button p-1.5" title="行内代码">
          <span className="text-[12px] font-mono font-bold">{'</>'}</span>
        </button>
        <button onClick={insertCodeBlock} className="neo-toolbar-button p-1.5" title="代码块">
          <Code2 className="w-4 h-4" />
        </button>

        <div className="w-[3px] h-6 bg-(--neo-ink) mx-1" />

        <button onClick={insertLink} className="neo-toolbar-button p-1.5" title="链接">
          <LinkIcon className="w-4 h-4" />
        </button>
        <button onClick={insertImage} className="neo-toolbar-button p-1.5" title="图片">
          <ImageIcon className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown("---\n", "", "")} className="neo-toolbar-button p-1.5" title="分隔线">
          <Minus className="w-4 h-4" />
        </button>
        <button onClick={onClear} className="neo-toolbar-button p-1.5" title="清空编辑器">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 快速调色栏 */}
      <div className="bg-(--neo-section-header) px-3 py-1.5 border-b border-(--neo-line) flex flex-wrap items-center gap-2 shrink-0">
        <Palette className="w-3.5 h-3.5 text-(--neo-ink)/50 shrink-0" />
        <ColorPicker
          label="H1"
          value={formatTweaks.h1TextColor || ""}
          onChange={(color) =>
            setFormatTweaks((prev) => ({ ...prev, h1TextColor: color }))
          }
        />
        <ColorPicker
          label="H2"
          value={formatTweaks.h2TextColor || ""}
          onChange={(color) =>
            setFormatTweaks((prev) => ({ ...prev, h2TextColor: color }))
          }
        />
        <ColorPicker
          label="正文"
          value={formatTweaks.paragraphTextColor || ""}
          onChange={(color) =>
            setFormatTweaks((prev) => ({ ...prev, paragraphTextColor: color }))
          }
        />
        {/* 重置按钮 */}
        {(formatTweaks.h1TextColor ||
          formatTweaks.h2TextColor ||
          formatTweaks.paragraphTextColor) && (
          <button
            onClick={() =>
              setFormatTweaks((prev) => ({
                ...prev,
                h1TextColor: undefined,
                h2TextColor: undefined,
                paragraphTextColor: undefined,
              }))
            }
            className="text-[10px] font-bold text-(--neo-ink)/50 hover:text-(--neo-ink) underline ml-auto"
          >
            重置颜色
          </button>
        )}
      </div>

      <textarea
        ref={inputRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onScroll={onInputScroll}
        onPaste={onPaste}
        className="flex-1 w-full p-4 lg:p-6 resize-none focus:outline-none text-(--neo-ink) leading-relaxed font-mono text-[14px] bg-(--neo-surface) overflow-y-auto custom-scrollbar"
        placeholder="支持标准 Markdown 语法：&#10;# 标题支持1-6级&#10;> 引用内容&#10;- 列表项1&#10;- 列表项2&#10;**加粗文字**"
      />

      <div className="bg-(--neo-section-header) px-4 py-2 border-t border-(--neo-line) flex items-center justify-between text-xs text-(--neo-muted) shrink-0 font-medium">
        <div className="flex items-center gap-4">
          <span>
            字符: <strong>{wordCount.chars}</strong>
          </span>
          <span>
            字数: <strong>{wordCount.words}</strong>
          </span>
          <span>
            预计阅读:{" "}
            <strong>{wordCount.readTime}分钟</strong>
          </span>
        </div>
        <span>支持直接粘贴图片</span>
      </div>
    </div>
  );
}
