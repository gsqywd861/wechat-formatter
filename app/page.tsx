"use client";

import { Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExtractionResult } from "./_lib/template-extractor";
import { AiConfigModal } from "./_components/ai-config-modal";
import { AppHeader } from "./_components/app-header";
import { ImageInsertModal } from "./_components/image-insert-modal";
import { MarkdownEditorPane } from "./_components/markdown-editor-pane";
import { PreviewPane } from "./_components/preview-pane";
import { RewardModal } from "./_components/reward-modal";
import { SettingsPane } from "./_components/settings-pane";
import { TemplateEditorEnhanced } from "./_components/template-editor-enhanced";
import { TemplateImporter } from "./_components/template-importer";
import { Toast } from "./_components/toast";
import { sampleText } from "./_lib/formatter-constants";
import type { ActiveTab, FormatTweaks, PreviewMode } from "./_types/formatter";
import type { TemplateConfig } from "./template-engine";
import { useAiFormat } from "./_hooks/use-ai-format";
import { useAiSettings } from "./_hooks/use-ai-settings";
import { useClipboardCopy } from "./_hooks/use-clipboard-copy";
import { useMarkdownTools } from "./_hooks/use-markdown-tools";
import { useOriginalContent } from "./_hooks/use-original-content";
import { useScrollSync } from "./_hooks/use-scroll-sync";
import { useTheme } from "./_hooks/use-theme";
import { useToast } from "./_hooks/use-toast";
import { useWeChatSettings } from "./_hooks/use-wechat-settings";
import { useWordCount } from "./_hooks/use-word-count";
import { WeChatPublishModal } from "./_components/wechat-publish-modal";
import {
  allTemplates,
  groupedTemplates,
  mergeUserTemplates,
  renderArticle,
  USER_CATEGORY_ID,
} from "./template-engine";

const STORAGE_KEY = "wechat-formatter-user-templates";

function loadUserTemplates(): TemplateConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TemplateConfig[];
  } catch {
    return [];
  }
}

function saveUserTemplates(templates: TemplateConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Silently fail if localStorage is full
  }
}

const DEFAULT_FORMAT_TWEAKS: FormatTweaks = {
  fontSize: 16,
  lineHeight: 1.8,
  paragraphSpacing: 16,
  firstLineIndent: false,
  pagePaddingTop: 16,
  pagePaddingRight: 16,
  pagePaddingBottom: 16,
  pagePaddingLeft: 16,
  letterSpacing: 0,
  imageRadius: 8,
  themeColor: "#c53d43",
};

export default function Home() {
  const [inputText, setInputText] = useState(sampleText);
  const [activeTab, setActiveTab] = useState<ActiveTab>("input");
  const [currentTemplateId, setCurrentTemplateId] = useState<string>("neo-brutalism-0");
  const [currentCategory, setCurrentCategory] = useState<string>("neo-brutalism");
  const [formatTweaks, setFormatTweaks] = useState<FormatTweaks>(DEFAULT_FORMAT_TWEAKS);
  const { showReward, setShowReward } = { showReward: false, setShowReward: (_v: boolean) => {} };
  const [showImageModal, setShowImageModal] = useState(false);
  const [showWeChatModal, setShowWeChatModal] = useState(false);
  const [showTemplateImporter, setShowTemplateImporter] = useState(false);
  const [pastedHtml, setPastedHtml] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("template");
  const [userTemplates, setUserTemplates] = useState<TemplateConfig[]>(() => loadUserTemplates());
  const [editTemplate, setEditTemplate] = useState<TemplateConfig | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevInputRef = useRef(inputText);

  // 撤销/重做历史栈
  const historyRef = useRef<string[]>([sampleText]);
  const historyIdxRef = useRef(0);
  const isHistoryActionRef = useRef(false);

  const { toast, showToast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const aiSettings = useAiSettings(showToast);
  const weChatSettings = useWeChatSettings();
  const deviceIdRef = useRef<string | null>(null);

  // 页面加载时从云端加载配置（只执行一次）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { getDeviceId: getDid } = await import("./_lib/device-id");
      const { loadConfigFromCloud } = await import("./_lib/cloud-config");
      const did = getDid();
      deviceIdRef.current = did;
      const { config } = await loadConfigFromCloud(did);
      if (cancelled || !config) return;
      if (config.wechat) weChatSettings.applyCloudConfig(config.wechat);
      if (config.ai) aiSettings.applyCloudAiConfig(config.ai);
    })();
    return () => { cancelled = true; };
  }, []);
  const wordCount = useWordCount(inputText);
  const copyToClipboard = useClipboardCopy(showToast);
  const { syncScroll, setSyncScroll, previewRef, handleInputScroll, handlePreviewScroll } =
    useScrollSync(inputRef);

  const markdownTools = useMarkdownTools({
    inputText,
    setInputText,
    inputRef,
    fileInputRef,
    setShowImageModal,
    onPastedHtml: (html) => {
      setPastedHtml(html);
      setPreviewMode("original");
    },
  });

  // 公众号原始内容处理模块
  const { previewHtml: originalPreviewHtml, copyHtml: originalCopyHtml, isOriginalMode, processPreviewImages } =
    useOriginalContent({
      pastedHtml,
      previewMode,
    });

  // 当预览 HTML 变化时，处理微信图片（原始模式）
  useEffect(() => {
    if (isOriginalMode && previewRef.current) {
      // 延迟执行，确保 DOM 已经渲染
      const timer = setTimeout(() => {
        processPreviewImages(previewRef.current);

        // 调试：检查表格渲染状态
        const tables = previewRef.current?.querySelectorAll("table");
        if (tables && tables.length > 0) {
          console.log("[DOM Debug] Found tables in rendered DOM:", tables.length);
          tables.forEach((t, i) => {
            const display = getComputedStyle(t).display;
            const rowCount = t.querySelectorAll("tr").length;
            const cellCount = t.querySelectorAll("td, th").length;
            const firstRowDisplay = t.querySelector("tr") ? getComputedStyle(t.querySelector("tr")!).display : "N/A";
            const firstCellDisplay = t.querySelector("td, th") ? getComputedStyle(t.querySelector("td, th")!).display : "N/A";
            console.log(`[DOM Debug] table[${i}]: display=${display}, rows=${rowCount}, cells=${cellCount}, trDisplay=${firstRowDisplay}, tdDisplay=${firstCellDisplay}`);
          });
        } else {
          console.log("[DOM Debug] NO tables found in rendered DOM");
          const html = previewRef.current?.innerHTML || "";
          console.log("[DOM Debug] has <table> in innerHTML:", /<table[^>]*>/i.test(html));
          console.log("[DOM Debug] table tags count in innerHTML:", (html.match(/<table[^>]*>/gi) || []).length);
        }
      }, 500); // 延迟稍长确保样式已计算
      return () => clearTimeout(timer);
    }
  }, [isOriginalMode, originalPreviewHtml, processPreviewImages, previewMode]);

  const { isAiFormatting, handleAiFormat } = useAiFormat({
    inputText,
    setInputText,
    aiProviderType: aiSettings.aiProviderType,
    aiBaseUrl: aiSettings.aiBaseUrl,
    aiApiKey: aiSettings.aiApiKey,
    aiModel: aiSettings.aiModel,
    setShowAiConfigModal: aiSettings.setShowAiConfigModal,
    showToast,
  });

  // Handle template extraction result
  const handleTemplateExtracted = useCallback(
    async (extracted: ExtractionResult, htmlSnapshot?: string) => {
      const newTemplate: TemplateConfig = {
        id: `user-${Date.now()}`,
        name: extracted.name,
        desc: extracted.description,
        category: USER_CATEGORY_ID,
        themeColor: extracted.themeColor,
        backgroundColor: extracted.backgroundColor,
        baseStyle: extracted.baseStyle,
        containerStyle: extracted.containerStyle,
        h1Style: extracted.h1Style,
        h2Style: extracted.h2Style,
        h3Style: extracted.h3Style,
        h4Style: (extracted as any).h4Style || "",
        h5Style: (extracted as any).h5Style || "",
        h6Style: (extracted as any).h6Style || "",
        pStyle: extracted.pStyle,
        blockquoteStyle: extracted.blockquoteStyle,
        blockquoteInnerBefore: extracted.blockquoteInnerBefore,
        blockquoteInnerAfter: extracted.blockquoteInnerAfter,
        listStyle: extracted.listStyle,
        listItemStyle: extracted.listItemStyle,
        listIcon: extracted.listIcon,
        strongStyle: extracted.strongStyle,
        emStyle: extracted.emStyle,
        codeContainerStyle: extracted.codeContainerStyle,
        codeHeaderStyle: extracted.codeHeaderStyle,
        codeBlockStyle: extracted.codeBlockStyle,
        imgStyle: extracted.imgStyle,
        hrStyle: extracted.hrStyle,
        linkStyle: extracted.linkStyle,
        tableStyle: extracted.tableStyle,
        thStyle: extracted.thStyle,
        tdStyle: extracted.tdStyle,
        delStyle: extracted.delStyle,
      };

      const updated = [...userTemplates, newTemplate];
      setUserTemplates(updated);
      saveUserTemplates(updated);

      // Auto-switch to the user category and select the new template
      setCurrentCategory(USER_CATEGORY_ID);
      setCurrentTemplateId(newTemplate.id);
      setFormatTweaks((prev) => ({ ...prev, themeColor: newTemplate.themeColor }));

      // 报告修正数据到学习系统（异步，不阻塞）
      if (htmlSnapshot && deviceIdRef.current) {
        try {
          const { reportCorrectionToCloud } = await import("./_lib/template-learning");
          await reportCorrectionToCloud(
            deviceIdRef.current,
            htmlSnapshot,
            extracted,
            newTemplate as unknown as Record<string, string>,
          );
        } catch {
          // 学习系统报告失败不影响主流程
        }
      }

      showToast("模板已保存到「我的模板」", "success");
    },
    [userTemplates, showToast],
  );

  // Handle template edit (enhanced editor keeps editing after save)
  const handleEditTemplate = useCallback(
    (updated: TemplateConfig) => {
      const updatedList = userTemplates.map((t) =>
        t.id === updated.id ? updated : t,
      );
      setUserTemplates(updatedList);
      saveUserTemplates(updatedList);
      // 关键修复：同时更新 editTemplate，否则编辑器显示的永远是旧数据
      setEditTemplate(updated);
      showToast("模板样式已更新", "success");
    },
    [userTemplates, showToast],
  );

  // Handle template delete
  const handleDeleteTemplate = useCallback(
    (template: TemplateConfig) => {
      const updatedList = userTemplates.filter((t) => t.id !== template.id);
      setUserTemplates(updatedList);
      saveUserTemplates(updatedList);
      // If the deleted template was selected, switch to first built-in template
      if (currentTemplateId === template.id) {
        setCurrentTemplateId("neo-brutalism-0");
        setCurrentCategory("neo-brutalism");
      }
      showToast("模板已删除", "success");
    },
    [userTemplates, currentTemplateId, showToast],
  );

  // Merge user templates with built-in templates
  const mergedGroupedTemplates = useMemo(
    () => mergeUserTemplates(groupedTemplates, userTemplates),
    [userTemplates],
  );

  // All templates (built-in + user) for lookups
  const allTemplatesWithUser = useMemo(
    () => [...allTemplates, ...userTemplates],
    [userTemplates],
  );

  const currentTemplate =
    allTemplatesWithUser.find((template) => template.id === currentTemplateId) ||
    allTemplates[0];

  const outputHtml = useMemo(() => {
    // 原始模式 → 使用公众号原始内容模块渲染
    if (isOriginalMode && originalPreviewHtml) {
      console.log("[page] original mode, html length:", originalPreviewHtml.length);
      console.log("[page] original mode, has <table>:", /<table[^>]*>/i.test(originalPreviewHtml));
      console.log("[page] original mode html snippet:", originalPreviewHtml.slice(0, 3000));
      const tableMatches = originalPreviewHtml.match(/<table[\s\S]*?<\/table>/gi);
      console.log("[page] TABLE COUNT:", tableMatches?.length);
      if (tableMatches && tableMatches.length > 0) {
        tableMatches.forEach((t, i) => console.log(`[page] table[${i}] first 400 chars:`, t.slice(0, 400)));
        console.log("[page] FIRST FULL TABLE:", tableMatches[0].slice(0, 2000));
      }
      return originalPreviewHtml;
    }
    // 模板模式 → 正常 Markdown 渲染
    if (!inputText.trim()) return "";
    const rendered = renderArticle(inputText, currentTemplate, formatTweaks);
    return rendered;
  }, [inputText, currentTemplate, formatTweaks, isOriginalMode, originalPreviewHtml]);

  // 模板模式下确保微信图片加载：data-src 已直接在 HTML 中设为 src
  // 图片标签带有 referrerpolicy="no-referrer" 以规避防盗链
  // 无需额外代理加载

  // 编辑新内容时清理 blob URL，防止内存泄漏
  useEffect(() => {
    const prevText = prevInputRef.current;

    // 如果用户在原始模式下修改了编辑器内容，自动切回模板模式
    if (previewMode === "original" && pastedHtml && inputText !== prevInputRef.current) {
      const lenDiff = Math.abs(prevText.length - inputText.length);
      const maxLen = Math.max(prevText.length, inputText.length);
      // 只有用户主动编辑（非 50% 以上的大幅变化，那个是 paste/clear 场景），才回退
      if (maxLen > 0 && lenDiff / maxLen < 0.5 && lenDiff > 0) {
        setPreviewMode("template");
      }
    }

    // 检测内容变化，清理旧的 blob URL
    if (prevText.length > 100) {
      const lenDiff = Math.abs(prevText.length - inputText.length);
      const maxLen = Math.max(prevText.length, inputText.length);
      if (maxLen > 0 && lenDiff / maxLen > 0.5) {
        // 在旧文本中查找 blob: URL 并释放
        const blobUrls = prevText.match(/blob:[^\s)\]]+/g);
        if (blobUrls) {
          for (const url of blobUrls) {
            URL.revokeObjectURL(url);
          }
        }
      }
    }
    prevInputRef.current = inputText;
  }, [inputText]);

  // 撤销/重做历史栈跟踪 — 非撤销/重做操作时记录历史
  useEffect(() => {
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    const cur = historyRef.current;
    const idx = historyIdxRef.current;
    if (cur[idx] !== inputText) {
      historyRef.current = cur.slice(0, idx + 1);
      historyRef.current.push(inputText);
      historyIdxRef.current = historyRef.current.length - 1;
    }
  }, [inputText]);

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current -= 1;
      isHistoryActionRef.current = true;
      setInputText(historyRef.current[historyIdxRef.current]);
    }
  }, [setInputText]);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current += 1;
      isHistoryActionRef.current = true;
      setInputText(historyRef.current[historyIdxRef.current]);
    }
  }, [setInputText]);

  const handleCopy = async () => {
    // 原始模式 → 提取纯净的公众号内容 HTML
    if (isOriginalMode && originalCopyHtml) {
      // 原始模式 → 复制公众号原始内容（已处理好防盗链和清理）
      copyToClipboard(originalCopyHtml);
      return;
    }
    // 模板模式 → 检查 blob URL 并转 base64
    if (outputHtml.includes("blob:")) {
      // 找到所有 blob URL，逐个转 base64
      const blobPattern = /src="(blob:[^"]+)"/g;
      let replacements: Array<{ from: string; to: string }> = [];
      const promises: Promise<void>[] = [];
      let match;
      while ((match = blobPattern.exec(outputHtml)) !== null) {
        const blobUrl = match[1];
        const promise = fetch(blobUrl)
          .then((r) => r.blob())
          .then(
            (blob) =>
              new Promise<void>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                  replacements.push({ from: blobUrl, to: reader.result as string });
                  resolve();
                };
                reader.readAsDataURL(blob);
              }),
          )
          .catch(() => {});
        promises.push(promise);
      }
      await Promise.all(promises);
      let finalHtml = outputHtml;
      for (const r of replacements) {
        finalHtml = finalHtml.replaceAll(`src="${r.from}"`, `src="${r.to}"`);
      }
      copyToClipboard(finalHtml);
    } else {
      copyToClipboard(outputHtml);
    }
  };

  // 从 Markdown 中提取默认标题（第一个 # 标题或第一行文字）
  const extractDefaultTitle = useCallback(() => {
    const h1Match = inputText.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1].trim();
    const firstLine = inputText.split("\n")[0]?.trim();
    return firstLine || "未命名文章";
  }, [inputText]);

  // 稳定化回调引用，避免因重新创建导致子组件 re-render
  const handleCloseWeChat = useCallback(() => setShowWeChatModal(false), []);
  const handleWeChatResult = useCallback(
    (msg: string, type: "success" | "error") => showToast(msg, type),
    [showToast],
  );
  const handleCloseImage = useCallback(() => setShowImageModal(false), []);
  const handleCloseAi = useCallback(() => aiSettings.setShowAiConfigModal(false), []);
  const handleOpenAi = useCallback(() => aiSettings.setShowAiConfigModal(true), []);
  const handleRestoreSample = useCallback(() => setInputText(sampleText), []);
  const handleClearInput = useCallback(() => setInputText(""), []);
  const handleOpenImporter = useCallback(() => setShowTemplateImporter(true), []);
  const handlePublish = useCallback(() => setShowWeChatModal(true), []);
  const handleTogglePreview = useCallback(() => {
    setPreviewMode((prev) => (prev === "original" ? "template" : "original"));
  }, []);
  const handleResetTweaks = useCallback(() => setFormatTweaks(DEFAULT_FORMAT_TWEAKS), []);
  const handleCloseReward = useCallback(() => setShowReward(false), []);
  const handleCloseImporter = useCallback(() => setShowTemplateImporter(false), []);
  const handleCloseTemplateEditor = useCallback(() => setEditTemplate(null), []);
  const handleDeleteCurrentTemplate = useCallback(() => {
    if (editTemplate) handleDeleteTemplate(editTemplate);
  }, [editTemplate, handleDeleteTemplate]);
  const handleEditTemplateInstance = useCallback(
    (t: TemplateConfig) => setEditTemplate(t),
    [],
  );

  // 一键粘贴：从剪贴板读取内容并粘贴到编辑器
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // 如果编辑器有选中的内容，替换选中内容；否则追加到末尾
        const textarea = inputRef.current;
        if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
          // 替换选中的内容
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          setInputText(prev => prev.substring(0, start) + text + prev.substring(end));
        } else {
          // 追加到当前光标位置或末尾
          setInputText(text);
        }
        showToast(`已粘贴 ${text.length} 个字符`, "success");
      }
    } catch (error) {
      console.error("读取剪贴板失败:", error);
      showToast("无法读取剪贴板，请检查权限", "error");
    }
  }, [setInputText, inputRef, showToast]);

  return (
    <main className="h-screen overflow-hidden neo-app-bg flex flex-col font-sans relative">
      <Toast toast={toast} />

      <ImageInsertModal
        open={showImageModal}
        onConfirm={markdownTools.handleConfirmImage}
        onClose={handleCloseImage}
        onLocalImage={markdownTools.handleLocalImage}
      />

      <AiConfigModal
        open={aiSettings.showAiConfigModal}
        aiProviderType={aiSettings.aiProviderType}
        setAiProviderType={aiSettings.setAiProviderType}
        aiBaseUrl={aiSettings.aiBaseUrl}
        setAiBaseUrl={aiSettings.setAiBaseUrl}
        aiApiKey={aiSettings.aiApiKey}
        setAiApiKey={aiSettings.setAiApiKey}
        aiModel={aiSettings.aiModel}
        setAiModel={aiSettings.setAiModel}
        onClose={handleCloseAi}
        onSave={aiSettings.saveAiSettings}
        onClear={aiSettings.clearAiSettings}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={markdownTools.handleFileChange}
        className="hidden"
      />

      <RewardModal open={showReward} onClose={handleCloseReward} />

      <TemplateImporter
        open={showTemplateImporter}
        onClose={handleCloseImporter}
        onTemplateExtracted={handleTemplateExtracted}
        onAdvancedEdit={(result) => {
          setEditTemplate({
            id: `temp-${Date.now()}`,
            name: result.name || "新模板",
            desc: result.description || "",
            category: result.category || "custom",
            themeColor: result.themeColor || "#c53d43",
            backgroundColor: result.backgroundColor || "#ffffff",
            baseStyle: result.baseStyle || { color: "#374151", fontFamily: "system-ui, -apple-system, sans-serif" },
            containerStyle: result.containerStyle || "",
            h1Style: result.h1Style || "",
            h2Style: result.h2Style || "",
            h3Style: result.h3Style || "",
            h4Style: (result as any).h4Style || "",
            h5Style: (result as any).h5Style || "",
            h6Style: (result as any).h6Style || "",
            pStyle: result.pStyle || "",
            blockquoteStyle: result.blockquoteStyle || "",
            blockquoteInnerBefore: result.blockquoteInnerBefore || "",
            blockquoteInnerAfter: result.blockquoteInnerAfter || "",
            listStyle: result.listStyle || "",
            listItemStyle: result.listItemStyle || "",
            listIcon: result.listIcon || "",
            strongStyle: result.strongStyle || "",
            emStyle: result.emStyle || "",
            codeContainerStyle: result.codeContainerStyle || "",
            codeHeaderStyle: result.codeHeaderStyle || "",
            codeBlockStyle: result.codeBlockStyle || "",
            imgStyle: result.imgStyle || "",
            hrStyle: result.hrStyle || "",
            linkStyle: result.linkStyle || "",
            tableStyle: result.tableStyle || "",
            thStyle: result.thStyle || "",
            tdStyle: result.tdStyle || "",
            delStyle: result.delStyle || "",
          });
        }}
        deviceId={deviceIdRef.current || undefined}
      />

      {editTemplate && (
        <TemplateEditorEnhanced
          template={editTemplate}
          open
          onClose={handleCloseTemplateEditor}
          onSave={handleEditTemplate}
          onDelete={handleDeleteCurrentTemplate}
        />
      )}

      <WeChatPublishModal
        open={showWeChatModal}
        onClose={handleCloseWeChat}
        credentials={weChatSettings.credentials}
        onSave={weChatSettings.saveCredentials}
        onClear={weChatSettings.clearCredentials}
        content={outputHtml}
        defaultTitle={extractDefaultTitle()}
        onResult={handleWeChatResult}
      />

      <AppHeader
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onCopy={handleCopy}
        hasContent={Boolean(inputText.trim())}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTemplateImporter={handleOpenImporter}
        onPublish={handlePublish}
        previewMode={previewMode}
        hasPastedHtml={!!pastedHtml}
        onTogglePreviewMode={handleTogglePreview}
      />

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 h-full">
          <MarkdownEditorPane
            activeTab={activeTab}
            inputText={inputText}
            setInputText={setInputText}
            inputRef={inputRef}
            onInputScroll={handleInputScroll}
            onPaste={markdownTools.handlePaste}
            wordCount={wordCount}
            insertMarkdown={markdownTools.insertMarkdown}
            insertHeading={markdownTools.insertHeading}
            insertList={markdownTools.insertList}
            insertCodeBlock={markdownTools.insertCodeBlock}
            insertLink={markdownTools.insertLink}
            insertImage={markdownTools.insertImage}
            onAiFormat={handleAiFormat}
            isAiFormatting={isAiFormatting}
            onOpenAiConfig={handleOpenAi}
            onRestoreSample={handleRestoreSample}
            formatTweaks={formatTweaks}
            setFormatTweaks={setFormatTweaks}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClearInput}
            onPasteFromClipboard={handlePasteFromClipboard}
          />

          <PreviewPane
            activeTab={activeTab}
            previewRef={previewRef}
            onPreviewScroll={handlePreviewScroll}
            outputHtml={outputHtml}
          />

          <SettingsPane
            activeTab={activeTab}
            allTemplatesCount={allTemplates.length + userTemplates.length}
            groupedTemplates={mergedGroupedTemplates}
            currentCategory={currentCategory}
            setCurrentCategory={setCurrentCategory}
            currentTemplateId={currentTemplateId}
            setCurrentTemplateId={setCurrentTemplateId}
            formatTweaks={formatTweaks}
            setFormatTweaks={setFormatTweaks}
            onResetFormatTweaks={handleResetTweaks}
            syncScroll={syncScroll}
            setSyncScroll={setSyncScroll}
            onOpenTemplateImporter={handleOpenImporter}
            userTemplates={userTemplates}
            onEditTemplate={handleEditTemplateInstance}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </div>
      </div>
    </main>
  );
}
