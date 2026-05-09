import { Copy, Download, FileText, Moon, Palette, SendHorizonal, Sun } from "lucide-react";
import type React from "react";
import type { ActiveTab, PreviewMode } from "../_types/formatter";

type AppHeaderProps = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onCopy: () => void;
  hasContent: boolean;
  activeTab: ActiveTab;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  onOpenTemplateImporter?: () => void;
  onPublish?: () => void;
  previewMode?: PreviewMode;
  hasPastedHtml?: boolean;
  onTogglePreviewMode?: () => void;
};

const tabs = [
  { id: "input" as ActiveTab, label: "编辑" },
  { id: "preview" as ActiveTab, label: "预览" },
  { id: "settings" as ActiveTab, label: "样式" },
];

export function AppHeader({
  isDarkMode,
  toggleDarkMode,
  onCopy,
  hasContent,
  activeTab,
  setActiveTab,
  onOpenTemplateImporter,
  onPublish,
  previewMode,
  hasPastedHtml,
  onTogglePreviewMode,
}: AppHeaderProps) {
  return (
    <header className="bg-(--neo-app-header) border-b border-(--neo-line) sticky top-0 z-20 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* 第一行：品牌标题居中（移动端紧凑） */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-center">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <img
            src="/logo.png"
            alt="公众号AI排版助手"
            className="w-7 h-7 sm:w-9 sm:h-9 p-0.5 border border-(--neo-line) rounded-lg bg-white"
          />
          <h1 className="text-sm sm:text-xl font-bold tracking-tight text-(--neo-on-header)">
            公众号AI排版助手
          </h1>
        </div>
      </div>

      {/* 第二行：工具按钮 — 文字形式横排（移动端紧凑，溢出可左右滑动） */}
      <div className="border-t border-(--neo-line) bg-(--neo-sub-header) overflow-x-auto scrollbar-hide">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 flex items-center gap-1 sm:gap-3 py-1.5 sm:py-2 flex-nowrap w-max sm:w-auto sm:justify-center">
          {/* 浅色/深色 */}
          <button
            onClick={toggleDarkMode}
            className="neo-button neo-button-ghost px-3 py-1.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? "亮色" : "深色"}</span>
          </button>

          <div className="w-px h-4 bg-(--neo-line)" />

          {/* 导入模板 */}
          {onOpenTemplateImporter && (
            <>
              <button
                onClick={onOpenTemplateImporter}
                className="neo-button neo-button-ghost px-3 py-1.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>导入模板</span>
              </button>
              <span className="w-px h-4 bg-(--neo-line)" />
            </>
          )}

          {/* 发布到公众号 */}
          {onPublish && (
            <>
              <button
                onClick={onPublish}
                disabled={!hasContent}
                className="neo-button neo-button-secondary px-3 py-1.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap disabled:opacity-40"
              >
                <SendHorizonal className="w-4 h-4" />
                <span>发布公众号</span>
              </button>
              <span className="w-px h-4 bg-(--neo-line)" />
            </>
          )}

          {/* 原始样式/模板样式切换 — 仅在有粘贴的公众号 HTML 时显示 */}
          {hasPastedHtml && onTogglePreviewMode && (
            <>
              <button
                onClick={onTogglePreviewMode}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap rounded-lg border transition-all ${
                  previewMode === "original"
                    ? "bg-(--neo-green) text-white border-(--neo-green)"
                    : "bg-(--neo-sub-header) text-(--neo-on-header)/70 border-(--neo-line) hover:bg-(--neo-line)"
                }`}
                title={previewMode === "original" ? "当前：原始样式，点击切换模板样式" : "当前：模板样式，点击切换原始样式"}
              >
                <FileText className="w-4 h-4" />
                <span>{previewMode === "original" ? "原始样式" : "模板样式"}</span>
              </button>
              <span className="w-px h-4 bg-(--neo-line)" />
            </>
          )}

          {/* 一键复制 — 突出 */}
          <button
            onClick={onCopy}
            disabled={!hasContent}
            className="neo-button neo-button-primary px-4 py-1.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Copy className="w-4 h-4" />
            <span>一键复制</span>
          </button>
        </div>
      </div>

      {/* 第三行：导航标签（移动端紧凑） */}
      <div className="border-t border-(--neo-line) bg-(--neo-app-header)">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 flex items-center overflow-x-auto scrollbar-hide">
          <nav className="flex items-center gap-1 py-1.5 sm:py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-(--neo-green) text-white shadow-[0_1px_6px_rgba(95,159,127,0.3)]"
                    : "bg-(--neo-sub-header) text-(--neo-on-header)/70 hover:bg-(--neo-line) hover:text-(--neo-on-header)"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}