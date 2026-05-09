import { useRef } from "react";
import type { ActiveTab } from "../_types/formatter";

type PreviewPaneProps = {
  activeTab: ActiveTab;
  previewRef: React.RefObject<HTMLDivElement | null>;
  onPreviewScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  outputHtml: string;
};

const emptyPreviewHtml = `
  <div class="neo-preview-empty">
    <div class="neo-preview-empty-icon">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="6" width="32" height="38" rx="4" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="16" y1="18" x2="32" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="16" y1="26" x2="28" y2="26" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
        <line x1="16" y1="32" x2="24" y2="32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      </svg>
    </div>
    <p class="neo-preview-empty-text">在左侧编辑区输入内容</p>
    <p class="neo-preview-empty-hint">支持 Markdown 语法，实时预览效果</p>
  </div>
`;

export function PreviewPane({
  activeTab,
  previewRef,
  onPreviewScroll,
  outputHtml,
}: PreviewPaneProps) {
  return (
    <div
      ref={previewRef}
      onScroll={onPreviewScroll}
      className={`flex-[1.2] flex-col overflow-y-auto ${activeTab === "preview" ? "flex" : "hidden md:flex"} custom-scrollbar`}
    >
      <div className="flex-1 flex justify-center py-6 px-4 md:py-10">
        <div className="neo-phone-shell w-full max-w-[375px] h-fit relative">
          {/* 顶部极简指示条 */}
          <div className="neo-phone-top-bar" />

          {/* 内容区 */}
          <div className="neo-phone-content">
            <div
              className="w-full prose-img:max-w-full original-content"
              dangerouslySetInnerHTML={{
                __html: outputHtml || emptyPreviewHtml,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
