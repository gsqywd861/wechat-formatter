/**
 * 公众号原始内容处理模块
 */

import { useCallback, useMemo } from "react";

type UseOriginalContentParams = {
  pastedHtml: string | null;
  previewMode: "template" | "original";
};

/**
 * 提取 <body> 内部的内容，剥离 <meta>/<html>/<head>/<body> 等外层包装标签。
 * 这些标签在 dangeroulySetInnerHTML 注入到 <div> 中时会干扰浏览器解析，
 * 导致表格等复杂元素无法正确渲染。
 */
function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) return bodyMatch[1].trim();
  // 没有 <body> 时，移除 <!DOCTYPE>/<html>/<head>/<meta> 等顶层标签
  return html
    .replace(/^<!DOCTYPE[^>]*>/i, "")
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .trim();
}

/**
 * 处理 HTML：确保每个 img 标签都有有效的 src，添加 data-src 保底
 * 微信 HTML 常使用 data-src 存储真实 URL，src 为空或占位
 */
function processAllImages(html: string): string {
  // 先剥离外层包装标签
  const cleaned = extractBodyContent(html);

  return cleaned.replace(/<img\s([^>]*?)>/gi, (match, attrs) => {
    const hasDataSrc = /data-src\s*=/.test(attrs);
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']*)["']/);
    const currentSrc = srcMatch ? srcMatch[1] : "";
    const dataSrcMatch = attrs.match(/data-src\s*=\s*["']([^"']*)["']/);
    const currentDataSrc = dataSrcMatch ? dataSrcMatch[1] : "";

    // 添加 referrerpolicy 跳过防盗链检查
    const hasReferrerPolicy = /referrerpolicy\s*=/.test(attrs);

    let newAttrs = attrs;
    if (!hasReferrerPolicy) {
      newAttrs += ` referrerpolicy="no-referrer"`;
    }

    if (!hasDataSrc && currentSrc) {
      // 没有 data-src 但有 src → 把 src 拷贝到 data-src
      newAttrs += ` data-src="${currentSrc}"`;
    } else if (hasDataSrc && (!currentSrc || currentSrc === "" || currentSrc === "about:blank") && currentDataSrc) {
      // 有 data-src 但 src 为空 → 把 data-src 拷贝到 src
      newAttrs = newAttrs.replace(/\bsrc\s*=\s*["'][^"']*["']/i, `src="${currentDataSrc}"`);
    }

    return `<img ${newAttrs}>`;
  });
}

export function useOriginalContent({
  pastedHtml,
  previewMode,
}: UseOriginalContentParams) {
  const previewHtml = useMemo(() => {
    if (previewMode !== "original" || !pastedHtml) return null;
    console.log("[OriginalContent] pastedHtml length:", pastedHtml.length);
    console.log("[OriginalContent] has <table>:", /<table[^>]*>/i.test(pastedHtml));
    console.log("[OriginalContent] pastedHtml snippet:", pastedHtml.slice(0, 2000));
    // 只做很小的处理：确保 data-src 存在
    const processed = processAllImages(pastedHtml);
    console.log("[OriginalContent] processed has <table>:", /<table[^>]*>/i.test(processed));
    console.log("[OriginalContent] processed snippet:", processed.slice(0, 2000));
    return processed;
  }, [pastedHtml, previewMode]);

  const copyHtml = useMemo(() => {
    if (!pastedHtml) return null;
    return processAllImages(pastedHtml);
  }, [pastedHtml]);

  /**
   * 处理预览区域中的图片：确保 data-src 已复制到 src
   */
  const processPreviewImages = useCallback(async (container: HTMLElement | null) => {
    if (!container) return;

    const allImages = container.querySelectorAll<HTMLImageElement>("img[data-src]");
    const imageArray = Array.from(allImages).filter(img => {
      const ds = img.getAttribute("data-src");
      return ds && ds.trim().length > 0;
    });

    for (const img of imageArray) {
      const dataSrc = img.getAttribute("data-src")!;

      // 跳过 blob URL
      if (dataSrc.startsWith("blob:")) continue;

      if (!document.body.contains(img)) continue;

      // 如果当前 src 为空或与 data-src 不同，则设置为 data-src
      if (img.src === "" || img.src !== dataSrc) {
        img.src = dataSrc;
      }
    }
  }, []);

  const copyToClipboard = useCallback(
    async (callback: (html: string) => void) => {
      if (!copyHtml) return;
      callback(copyHtml);
    },
    [copyHtml],
  );

  return {
    previewHtml,
    copyHtml,
    copyToClipboard,
    processPreviewImages,
    isOriginalMode: previewMode === "original" && !!pastedHtml,
  };
}
