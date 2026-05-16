"use client";

import { Download, Link, Loader2, Palette, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { ExtractionResult } from "../_lib/template-extractor";
import { LearningProgress } from "./learning-progress";

type TemplateImporterProps = {
  open: boolean;
  onClose: () => void;
  onTemplateExtracted: (result: ExtractionResult, htmlSnapshot?: string) => void;
  onAdvancedEdit?: (result: ExtractionResult) => void;
  deviceId?: string;
};

export function TemplateImporter({
  open,
  onClose,
  onTemplateExtracted,
  onAdvancedEdit,
  deviceId,
}: TemplateImporterProps) {
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [htmlInput, setHtmlInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [lastHtmlSnapshot, setLastHtmlSnapshot] = useState<string>("");

  if (!open) return null;

  const handleExtract = async () => {
    setError(null);
    setResult(null);

    const body: Record<string, string> = {};
    if (mode === "paste") {
      if (!htmlInput.trim()) {
        setError("请粘贴文章 HTML 内容");
        return;
      }
      body.html = htmlInput.trim();
    } else {
      if (!urlInput.trim()) {
        setError("请输入文章链接");
        return;
      }
      body.url = urlInput.trim();
    }

    setIsLoading(true);
    try {
      // 保存HTML快照用于后续学习
      const htmlSnapshot = mode === "paste" ? htmlInput.trim() : "";
      setLastHtmlSnapshot(htmlSnapshot);

      const resp = await fetch("/api/extract-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, deviceId }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "提取失败，请稍后重试");
        return;
      }

      if (!data.success || !data.template) {
        setError("未能提取到有效的样式模板");
        return;
      }

      setResult(data.template);
      
      // 记录提取结果到学习系统（异步）
      if (deviceId && htmlSnapshot) {
        try {
          const { reportExtractionToCloud } = await import("../_lib/template-learning");
          await reportExtractionToCloud(deviceId, htmlSnapshot, data.template);
        } catch {
          // 学习系统报告失败不影响主流程
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "网络请求失败，请稍后重试",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (result) {
      onTemplateExtracted(result, lastHtmlSnapshot);
      setResult(null);
      setHtmlInput("");
      setUrlInput("");
      setLastHtmlSnapshot("");
      onClose();
    }
  };

  const handleClose = () => {
    setResult(null);
    setHtmlInput("");
    setUrlInput("");
    setLastHtmlSnapshot("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xl neo-panel max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="neo-strip px-5 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-(--neo-ink) flex items-center gap-2 uppercase">
            <Sparkles className="w-5 h-5" />
            导入公众号排版模板
          </h2>
          <button
            onClick={handleClose}
            className="neo-button neo-button-ghost p-1.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 学习进度面板 */}
          {!result && deviceId && (
            <LearningProgress deviceId={deviceId} />
          )}

          {result ? (
            /* 提取成功预览 */
            <div className="space-y-5">
              <div className="border-2 border-(--neo-green) bg-(--neo-green)/10 p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-(--neo-green) flex items-center justify-center">
                  <Sparkles className="w-5 h-5 " />
                </div>
                <div>
                  <p className="font-semibold text-sm text-(--neo-ink)">
                    样式提取成功！
                  </p>
                  <p className="text-xs text-(--neo-ink)/70">
                    已识别 {result.category === "neo-brutalism" ? "中国风" :
                      result.category === "minimalist" ? "极简风" :
                      result.category === "business" ? "商务风" :
                      result.category === "literary" ? "文艺风" :
                      result.category === "tech" ? "科技风" :
                      result.category === "festive" ? "节庆风" : result.category} 风格
                  </p>
                </div>
              </div>

              {/* 预览色块 */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-(--neo-ink) uppercase tracking-wider">
                  颜色预览
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 border border-(--neo-line)"
                    style={{ backgroundColor: result.themeColor }}
                    title={`主题色: ${result.themeColor}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">
                      主题色 {result.themeColor}
                    </span>
                    <span className="text-xs text-(--neo-ink)/60">
                      背景色 {result.backgroundColor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-(--neo-ink)/60 bg-(--neo-yellow)/20 border border-(--neo-line) p-3">
                <p className="font-bold">
                  模板将保存到「我的模板」列表中，可在右侧设置面板查看和使用。
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 模式切换 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("paste")}
                  className={`flex-1 py-2.5 text-sm font-semibold neo-tab ${
                    mode === "paste" ? "neo-tab-active" : ""
                  }`}
                >
                  粘贴 HTML
                </button>
                <button
                  onClick={() => setMode("url")}
                  className={`flex-1 py-2.5 text-sm font-semibold neo-tab ${
                    mode === "url" ? "neo-tab-active" : ""
                  }`}
                >
                  文章链接
                </button>
              </div>

              {/* 输入区域 */}
              {mode === "paste" ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-(--neo-ink)">
                    从微信公众号后台复制文章 HTML，粘贴到下方
                  </label>
                  <textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    placeholder={`<!DOCTYPE html>\n<html>\n...`}
                    className="w-full h-48 p-3 border border-(--neo-line) bg-(--neo-surface) text-xs font-mono text-(--neo-ink) resize-none focus:outline-none focus:bg-(--neo-yellow)/10 custom-scrollbar"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-(--neo-ink)">
                    输入微信公众号文章链接
                  </label>
                  <div className="flex items-center gap-2 border border-(--neo-line) bg-(--neo-surface) px-3">
                    <Link className="w-4 h-4 shrink-0 text-(--neo-ink)/50" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://mp.weixin.qq.com/s/..."
                      className="flex-1 py-3 text-sm bg-transparent text-(--neo-ink) focus:outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <p className="text-xs text-(--neo-ink)/50">
                    部分公众号文章需要登录访问，如抓取失败请改用粘贴 HTML 模式
                  </p>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="border-2 border-(--neo-red) bg-(--neo-red)/10 p-3">
                  <p className="text-xs font-bold text-(--neo-red)">{error}</p>
                </div>
              )}

              {/* 提取按钮 */}
              <button
                onClick={handleExtract}
                disabled={isLoading}
                className="neo-button neo-button-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    正在提取样式...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    提取样式 → 生成模板
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        {result && (
          <div className="border-t border-(--neo-line) p-4 flex gap-2">
            <button
              onClick={() => setResult(null)}
              className="neo-button neo-button-ghost flex-1 py-2.5 text-sm font-semibold"
            >
              重新提取
            </button>
            {onAdvancedEdit && (
              <button
                onClick={() => {
                  onAdvancedEdit(result);
                  handleClose();
                }}
                className="neo-button flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <Palette className="w-4 h-4" />
                高级编辑
              </button>
            )}
            <button
              onClick={handleSave}
              className="neo-button neo-button-primary flex-1 py-2.5 text-sm font-semibold"
            >
              保存为自定义模板
            </button>
          </div>
        )}
      </div>
    </div>
  );
}