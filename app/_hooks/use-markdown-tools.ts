import { useCallback } from "react";
import type React from "react";

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

/**
 * 将图片 Blob 转为 JPG/PNG 格式，并压缩到 MAX_IMAGE_SIZE 以内。
 * 返回 data:image/...;base64,... 字符串。
 */
async function processImageBlob(blob: Blob): Promise<string> {
  const isJpeg = blob.type === "image/jpeg" || blob.type === "image/jpg";
  const isPng = blob.type === "image/png";
  const useJpeg = !isPng;

  const img = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  if (!useJpeg) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  img.close();

  const initialSize = blob.size;
  if (initialSize <= MAX_IMAGE_SIZE && (isJpeg || isPng)) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target!.result as string);
      reader.readAsDataURL(blob);
    });
  }

  const mimeType = useJpeg ? "image/jpeg" : "image/png";
  let dataUrl = canvas.toDataURL(mimeType, 0.85);

  // 二分查找最佳质量，使输出 < 3MB
  let lo = 0.1, hi = 1.0;
  while (hi - lo > 0.05) {
    const mid = (lo + hi) / 2;
    dataUrl = canvas.toDataURL(mimeType, mid);
    const byteLen = Math.ceil((dataUrl.length - "data:;base64,".length) * 0.75);
    if (byteLen > MAX_IMAGE_SIZE) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return canvas.toDataURL(mimeType, hi);
}

/**
 * 处理 base64 / data: URL 图片。
 * - 非 JPG/PNG 格式统一转 JPG
 * - 大于 3MB 则压缩
 */
async function processBase64Image(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return dataUrl;
  const mimeType = match[1];
  const isJpeg = mimeType === "image/jpeg" || mimeType === "image/jpg";
  const isPng = mimeType === "image/png";
  if ((isJpeg || isPng) && dataUrl.length < MAX_IMAGE_SIZE * 1.4) return dataUrl;

  const binaryStr = atob(match[2]);
  const len = binaryStr.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) buf[i] = binaryStr.charCodeAt(i);
  const blob = new Blob([buf], { type: mimeType });
  return processImageBlob(blob);
}

type UseMarkdownToolsParams = {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setShowImageModal: React.Dispatch<React.SetStateAction<boolean>>;
  onPastedHtml?: (html: string) => void;
};

export function useMarkdownTools({
  inputText,
  setInputText,
  inputRef,
  fileInputRef,
  setShowImageModal,
  onPastedHtml,
}: UseMarkdownToolsParams) {

  // ═══════════════════════════════════════════════════════════
  // 工具栏插入函数（同步，闭包值在用户点击时已是最新的）
  // ═══════════════════════════════════════════════════════════

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = prefix, placeholder: string = "") => {
      const textarea = inputRef.current;
      if (!textarea) return;

      const scrollTop = textarea.scrollTop;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = inputText.substring(start, end);
      const textToInsert = selectedText || placeholder;
      const cursorOffset = prefix.length + textToInsert.length;

      setInputText(
        inputText.substring(0, start) + prefix + textToInsert + suffix + inputText.substring(end),
      );

      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }, 0);
    },
    [inputRef, inputText, setInputText],
  );

  const insertHeading = useCallback(
    (level: number) => {
      const textarea = inputRef.current;
      if (!textarea) return;

      const scrollTop = textarea.scrollTop;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = inputText.substring(start, end);
      const prefix = "#".repeat(level) + " ";
      const textToInsert = selectedText || "标题";
      const cursorOffset = prefix.length + textToInsert.length;

      setInputText(inputText.substring(0, start) + prefix + textToInsert + inputText.substring(end));

      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }, 0);
    },
    [inputRef, inputText, setInputText],
  );

  const insertList = useCallback(
    (type: "ul" | "ol") => {
      const textarea = inputRef.current;
      if (!textarea) return;

      const scrollTop = textarea.scrollTop;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = inputText.substring(start, end);
      const prefix = type === "ul" ? "- " : "1. ";
      const textToInsert = selectedText || "列表项";
      const cursorOffset = prefix.length + textToInsert.length;

      setInputText(inputText.substring(0, start) + prefix + textToInsert + inputText.substring(end));

      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }, 0);
    },
    [inputRef, inputText, setInputText],
  );

  const insertCodeBlock = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const scrollTop = textarea.scrollTop;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputText.substring(start, end);
    const codeBlock = "```javascript\n" + (selectedText || "代码") + "\n```";
    const newText = inputText.substring(0, start) + codeBlock + inputText.substring(end);

    setInputText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = scrollTop;
      const newCursorPos = start + 14 + (selectedText || "代码").length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [inputRef, inputText, setInputText]);

  const insertLink = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const scrollTop = textarea.scrollTop;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputText.substring(start, end);
    const linkText = selectedText || "链接文字";
    const linkMarkdown = `[${linkText}](url)`;
    const newText = inputText.substring(0, start) + linkMarkdown + inputText.substring(end);

    setInputText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = scrollTop;
      const urlStart = start + linkText.length + 3;
      textarea.setSelectionRange(urlStart, urlStart + 3);
    }, 0);
  }, [inputRef, inputText, setInputText]);

  const insertImage = useCallback(() => {
    setShowImageModal(true);
  }, [setShowImageModal]);

  const handleLocalImage = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  // ── 本地图片上传：用 createObjectURL 创建 blob URL，直接嵌入到 markdown 中 ──
  // ── 不再使用 __IMG_ 占位符和 imageMapRef，彻底消除状态不同步问题 ──
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      // 立即关闭模态框，防止异步加载期间用户重复操作
      setShowImageModal(false);

      // createObjectURL 是同步的，生成类似 blob:http://xxx 的短 URL（约50字节）
      // 直接拼接到 markdown 中，不做任何占位符替换
      const blobUrl = URL.createObjectURL(file);

      const textarea = inputRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      // 确保图片单独成段：前后加换行，避免和文字混在同一行产生多余 vertical gap
      const prefix = start > 0 && inputText[start - 1] !== "\n" ? "\n" : "";
      const imageMarkdown = `${prefix}![图片](${blobUrl})\n`;
      setInputText((prev) => prev.substring(0, start) + imageMarkdown + prev.substring(end));
    },
    [inputRef, setInputText, setShowImageModal],
  );

  // ─── 在线图片插入（从 ImageInsertModal 的 setTimeout 调用，模态框已卸载）
  const handleConfirmImage = useCallback(
    (md: string) => {
      setInputText((prev) => {
        const trimmed = prev.trimEnd();
        return trimmed ? `${trimmed}\n${md}` : md;
      });
    },
    [setInputText],
  );

  // ═══════════════════════════════════════════════════════════
  // 粘贴处理（HTML/Blob 严格互斥，无正则回退）
  // ═══════════════════════════════════════════════════════════

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (e.defaultPrevented) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const htmlContent = e.clipboardData.getData("text/html") || "";
      const textContent = e.clipboardData.getData("text/plain") || "";

      // ── 调试：打印 HTML 的前 2000 字符 ──
      console.log("[Paste Debug] htmlContent length:", htmlContent.length);
      console.log("[Paste Debug] textContent (preview):", textContent.slice(0, 300));
      if (htmlContent) {
        const tableTagFound = /<table[^>]*>/i.test(htmlContent);
        const tdTagFound = /<td[^>]*>/i.test(htmlContent);
        const displayTableFound = /display\s*:\s*table/i.test(htmlContent);
        console.log("[Paste Debug] has <table> tag:", tableTagFound, "has <td> tag:", tdTagFound, "has display:table:", displayTableFound);
        console.log("[Paste Debug] html snippet:", htmlContent.slice(0, 2000));
      }

      // 判断剪贴板是否包含图片
      let hasImage = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          hasImage = true;
          break;
        }
      }
      if (!hasImage && htmlContent) {
        hasImage =
          /<img[^>]*>/i.test(htmlContent) ||
          /data-src=["'][^"']+["']/i.test(htmlContent) ||
          /data-original=["'][^"']+["']/i.test(htmlContent) ||
          /data-wiz-src=["'][^"']+["']/i.test(htmlContent) ||
          /<v:imagedata\s/i.test(htmlContent) ||
          /<table[^>]*>/i.test(htmlContent) ||
          /<td[^>]*>/i.test(htmlContent) ||
          /<th[^>]*>/i.test(htmlContent);
      }
      console.log("[Paste Debug] hasImage:", hasImage, "htmlContent exists:", !!htmlContent);
      if (!hasImage) {
        console.log("[Paste Debug] hasImage is false, returning early");
        return;
      }

      e.preventDefault();

      const textarea = inputRef.current;
      if (!textarea) return;
      const scrollTop = textarea.scrollTop;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // ─── 判断是否走 DOMParser 路径：有 HTML 图片或表格结构 ───
      const hasStructuredHtml =
        /<img[^>]*>/i.test(htmlContent) ||
        /<v:imagedata\s/i.test(htmlContent) ||
        /<table[^>]*>/i.test(htmlContent) ||
        /<td[^>]*>/i.test(htmlContent) ||
        /<th[^>]*>/i.test(htmlContent);

      let markdown = "";
      const dataUrlMarkers: string[] = [];

      console.log("[Paste Debug] hasStructuredHtml:", hasStructuredHtml, "entering DOMParser path");

      if (hasStructuredHtml && htmlContent) {
        // ─── HTML 路径：DOMParser 解析图片和表格 ───
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, "text/html");

          const walk = (node: Node): string => {
            if (node.nodeType === Node.TEXT_NODE) {
              return (node.textContent || "").replace(/\r?\n/g, " ").trim();
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return "";

            const el = node as Element;
            const tag = el.tagName.toUpperCase();

            if (tag === "IMG" || tag === "AMP-IMG") {
              const srcAttrs = [
                el.getAttribute("data-src"),
                el.getAttribute("data-original"),
                el.getAttribute("data-wiz-src"),
                el.getAttribute("data-url"),
                el.getAttribute("data-img-url"),
                el.getAttribute("src"),
              ];
              let src = "";
              for (const attr of srcAttrs) {
                if (attr && attr.trim()) {
                  src = attr.trim();
                  break;
                }
              }
              const alt = el.getAttribute("alt") || "图片";
              if (!src) return "";
              if (src.startsWith("//")) src = "https:" + src;

              if (src.startsWith("data:")) {
                const marker = `__DATAIMG_${dataUrlMarkers.length}__`;
                dataUrlMarkers.push(src);
                return marker;
              }
              if (src.startsWith("http://") || src.startsWith("https://")) {
                return `![${alt}](${src})`;
              }
              return "";
            }

            if (
              tag === "V:IMAGEDATA" ||
              (el.localName === "imagedata" && el.namespaceURI?.includes("vml"))
            ) {
              let src = el.getAttribute("src") || el.getAttribute("r:id") || "";
              if (!src) return "";
              if (src.startsWith("//")) src = "https:" + src;
              if (src.startsWith("data:")) {
                const marker = `__DATAIMG_${dataUrlMarkers.length}__`;
                dataUrlMarkers.push(src);
                return marker;
              }
              if (src.startsWith("http://") || src.startsWith("https://")) {
                return `![图片](${src})`;
              }
              return "";
            }

            if (tag === "BR") return "\n";

            // 表格处理：将 HTML 表格转为 Markdown 表格
            if (tag === "TABLE") {
              console.log("[Paste Debug] TABLE handler triggered", el.outerHTML.slice(0, 500));
              // 获取单元格纯文本内容的辅助函数（在 skip TR/TD 之前运行）
              const getCellText = (cell: Element): string => {
                let text = "";
                for (const child of Array.from(cell.childNodes)) {
                  if (child.nodeType === Node.TEXT_NODE) {
                    text += (child.textContent || "").replace(/\r?\n/g, " ").trim();
                  } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const childEl = child as Element;
                    const ct = childEl.tagName.toUpperCase();
                    if (ct === "BR") {
                      text += "\n";
                    } else if (ct === "IMG" || ct === "AMP-IMG") {
                      // 提取图片
                      const srcAttrs = [
                        childEl.getAttribute("data-src"),
                        childEl.getAttribute("data-original"),
                        childEl.getAttribute("data-wiz-src"),
                        childEl.getAttribute("data-url"),
                        childEl.getAttribute("data-img-url"),
                        childEl.getAttribute("src"),
                      ];
                      let src = "";
                      for (const attr of srcAttrs) {
                        if (attr && attr.trim()) { src = attr.trim(); break; }
                      }
                      if (src) {
                        if (src.startsWith("//")) src = "https:" + src;
                        text += `![${childEl.getAttribute("alt") || "图片"}](${src})`;
                      }
                    } else {
                      // 递归处理内联元素（strong, em, a, span 等）
                      text += getCellText(childEl);
                    }
                  }
                }
                return text.trim();
              };

              // 收集所有行
              const rows: Element[] = [];
              const thead = el.querySelector(":scope > thead");
              const tbody = el.querySelector(":scope > tbody");
              if (thead) rows.push(...Array.from(thead.querySelectorAll(":scope > tr")));
              if (tbody) rows.push(...Array.from(tbody.querySelectorAll(":scope > tr")));
              if (rows.length === 0) rows.push(...Array.from(el.querySelectorAll(":scope > tr")));
              if (rows.length === 0) rows.push(...Array.from(el.querySelectorAll("tr")));
              if (rows.length === 0) return "\n\n";

              let maxCols = 0;
              for (const row of rows) {
                const cells = row.querySelectorAll("td, th");
                maxCols = Math.max(maxCols, cells.length);
              }
              if (maxCols === 0) return "\n\n";

              const mdRows: string[] = [];

              rows.forEach((row) => {
                const cells = Array.from(row.querySelectorAll("td, th"));
                const cellTexts = cells.map((cell) => getCellText(cell).replace(/\n+/g, " ") || " ");
                while (cellTexts.length < maxCols) cellTexts.push(" ");
                const escaped = cellTexts.map((t) => t.replace(/\|/g, "\\|"));
                mdRows.push(`| ${escaped.join(" | ")} |`);
              });

              const separatorRow = `| ${Array(maxCols).fill("---").join(" | ")} |`;

              // GFM 表格要求第二行为分隔线，始终将分隔线插在第二行
              mdRows.splice(1, 0, separatorRow);

              const tableResult = "\n" + mdRows.join("\n") + "\n\n";
              return tableResult;
            }

            // 跳过表格内部标签（由 TABLE 处理）
            if (["TR", "TD", "TH", "TBODY", "THEAD", "TFOOT", "COLGROUP", "COL"].includes(tag)) {
              return "";
            }

            let inner = "";
            for (const child of Array.from(el.childNodes)) {
              inner += walk(child);
            }

            const blockTags = [
              "P", "DIV", "SECTION", "BLOCKQUOTE", "LI",
              "H1", "H2", "H3", "H4", "H5", "H6",
            ];
            if (blockTags.includes(tag) && inner.trim()) {
              return inner + "\n\n";
            }
            return inner;
          };

          markdown = walk(doc.body).trim();
          console.log("[Paste Debug] hasTableInMarkdown:", /\|.*\|/.test(markdown));
          console.log("[Paste Debug] Final markdown length:", markdown.length);
          console.log("[Paste Debug] Final markdown (full):", markdown);
          console.log("[Paste Debug] Final markdown pipe part:", markdown.slice(markdown.indexOf("|")));
        } catch {
          markdown = textContent;
        }

        // VML 正则回退（仅 Word 文档，DOMParser 可能遗漏）
        if (/ <v:imagedata\s/i.test(htmlContent)) {
          const vmlMatches = htmlContent.matchAll(/<v:imagedata[^>]+>/gi);
          for (const match of vmlMatches) {
            const srcMatch = match[0].match(/src=["']([^"']+)["']/i);
            if (srcMatch) {
              let src = srcMatch[1];
              if (src.startsWith("//")) src = "https:" + src;
              const imgMd = `![图片](${src})`;
              if (!markdown.includes(imgMd)) markdown += "\n\n" + imgMd;
            }
          }
        }
      } else {
        // ─── Blob 路径：仅在没有 HTML img 时处理截图 ───
        const screenshotEntries: Array<{ index: number; dataUrl: string }> = [];
        let screenshotIdx = 0;
        const promises: Promise<void>[] = [];

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const idx = screenshotIdx++;
            const item = items[i];
            promises.push(
              new Promise<void>((resolve) => {
                item
                  .getAsFile()
                  ?.arrayBuffer()
                  .then((buf) => {
                    const blob = new Blob([buf], { type: item.type });
                    processImageBlob(blob)
                      .then((dataUrl) => {
                        screenshotEntries.push({ index: idx, dataUrl });
                        resolve();
                      })
                      .catch(() => resolve());
                  })
                  .catch(() => resolve());
              }),
            );
          }
        }

        await Promise.all(promises);
        screenshotEntries.sort((a, b) => a.index - b.index);
        for (const entry of screenshotEntries) {
          markdown += `\n\n![截图](${entry.dataUrl})`;
        }

        // 如果 blob 路径也没提取到内容，用纯文本
        if (!markdown.trim()) {
          markdown = textContent;
        }
      }

      // ── 批量处理 data: URL 图片 ──
      if (dataUrlMarkers.length > 0) {
        const processed = await Promise.all(
          dataUrlMarkers.map((url) => processBase64Image(url)),
        );
        for (let i = 0; i < dataUrlMarkers.length; i++) {
          markdown = markdown
            .split(`__DATAIMG_${i}__`)
            .join(`![图片](${processed[i]})`);
        }
      }

      // ── 替换编辑器全部内容（清除旧编辑内容，避免垃圾残留） ──
      const insertText = markdown.replace(/\n{3,}/g, "\n\n").trim();
      setInputText(insertText);

      // ── 检测粘贴内容是否包含富样式（section、带 style 的标签等），判断是否来自有排版的公众号文章 ──
      // ── 如果包含则通过 onPastedHtml 传出原始 HTML，用于预览区的原始样式渲染 ──
      if (onPastedHtml && htmlContent && hasStructuredHtml) {
        const hasRichStyle = /<section[^>]*>|<span[^>]*style|<p[^>]*style|<h[1-6][^>]*style/i.test(htmlContent);
        if (hasRichStyle) {
          // 先提取 <head> 中的 <style> 标签（微信表格样式可能在这里）
          const headStyles: string[] = [];
          const headStyleRegex = /<head[^>]*>([\s\S]*?)<\/head>/i;
          const headStyleMatch = htmlContent.match(headStyleRegex);
          if (headStyleMatch) {
            const styleInHead = headStyleMatch[1].match(/<style[^>]*>[\s\S]*?<\/style>/gi);
            if (styleInHead) headStyles.push(...styleInHead);
          }

          // 清理掉 Word/VML 残留，只保留有效内容
          let cleanedHtml = htmlContent
            .replace(/<o:[^>]+>[^<]*<\/o:[^>]*>/gi, "")
            .replace(/<!--\[if[^>]*>[\s\S]*?<!\[endif\]-->/gi, "")
            .replace(/<v:[^>]+>[\s\S]*?<\/v:[^>]*>/gi, "")
            .replace(/<xml[^>]*>[\s\S]*?<\/xml>/gi, "")
            .replace(/<w:[^>]+>[\s\S]*?<\/w:[^>]*>/gi, "")
            .trim();
          // 剥离 <html>/<head>/<body>/<meta>/<!DOCTYPE> 外层包装标签
          // 这些标签在 dangeroulySetInnerHTML 注入到 <div> 时会干扰浏览器解析
          const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          if (bodyMatch) {
            cleanedHtml = bodyMatch[1].trim();
          } else {
            cleanedHtml = cleanedHtml
              .replace(/^<!DOCTYPE[^>]*>/i, "")
              .replace(/<html[^>]*>/gi, "")
              .replace(/<\/html>/gi, "")
              .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
              .replace(/<meta[^>]*>/gi, "")
              .replace(/<body[^>]*>/gi, "")
              .replace(/<\/body>/gi, "")
              .trim();
          }
          // 将 <head> 中的样式追加到内容前面（保证表格样式有效）
          if (headStyles.length > 0) {
            cleanedHtml = headStyles.join("\n") + "\n" + cleanedHtml;
          }
          if (cleanedHtml.length > 100) {
            onPastedHtml(cleanedHtml);
          }
        }
      }

      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(start + insertText.length, start + insertText.length);
      }, 0);
    },
    [inputRef, setInputText],
  );

  return {
    insertMarkdown,
    insertHeading,
    insertList,
    insertCodeBlock,
    insertLink,
    insertImage,
    handleLocalImage,
    handleConfirmImage,
    handleFileChange,
    handlePaste,
  };
}
