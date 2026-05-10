import { Check, ExternalLink, Loader2, SendHorizonal, X } from "lucide-react";
import { startTransition, useCallback, useEffect, useState } from "react";
import type React from "react";
import type { WeChatCredentials } from "../_hooks/use-wechat-settings";

/** 将 blob URL 转为 base64 data URI，微信 API 无法访问浏览器 blob URL */
async function resolveBlobUrls(html: string): Promise<string> {
  const blobPattern = /src="(blob:[^"]+)"/g;
  const replacements: Array<{ from: string; to: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = blobPattern.exec(html)) !== null) {
    const blobUrl = match[1];
    try {
      const resp = await fetch(blobUrl);
      const blob = await resp.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      replacements.push({ from: blobUrl, to: base64 });
    } catch {
      replacements.push({ from: blobUrl, to: "" }); // 加载失败则移除
    }
  }
  if (replacements.length === 0) return html;
  let result = html;
  for (const r of replacements) {
    result = result.replaceAll(`src="${r.from}"`, `src="${r.to}"`);
  }
  return result;
}

type WeChatPublishModalProps = {
  open: boolean;
  onClose: () => void;
  credentials: WeChatCredentials;
  onSave: (creds: WeChatCredentials) => void;
  onClear: () => void;
  content: string;          // 当前文章的 HTML 内容
  defaultTitle: string;      // 默认标题（从文章摘要提取）
  onResult?: (message: string, type: "success" | "error") => void;
};

type PublishStatus = "idle" | "publishing" | "success" | "error";

export function WeChatPublishModal({
  open,
  onClose,
  credentials,
  onSave,
  onClear,
  content,
  defaultTitle,
  onResult,
}: WeChatPublishModalProps) {
  const [appId, setAppId] = useState(credentials.appId);
  const [appSecret, setAppSecret] = useState(credentials.appSecret);
  const [thumbMediaId, setThumbMediaId] = useState(credentials.thumbMediaId);
  const [author, setAuthor] = useState(credentials.author);
  const [title, setTitle] = useState(defaultTitle);
  const [digest, setDigest] = useState("");
  const [status, setStatus] = useState<PublishStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [showCredentials, setShowCredentials] = useState(!credentials.appId);

  // 同步 props 凭证到内部 state — 仅在弹窗打开时执行
  useEffect(() => {
    if (!open) return;
    setAppId(credentials.appId);
    setAppSecret(credentials.appSecret);
    setThumbMediaId(credentials.thumbMediaId);
    setAuthor(credentials.author);
    setTitle(defaultTitle);
  }, [open, credentials, defaultTitle]);

  // 保存配置回调
  const handleSaveCredentials = useCallback(() => {
    startTransition(() => {
      onSave({ appId, appSecret, thumbMediaId, author });
    });
    onResult?.("您的设置已成功保存，下次打开页面自动加载", "success");
  }, [appId, appSecret, thumbMediaId, author, onSave, onResult]);

  // 发布回调
  const handlePublish = useCallback(async () => {
    if (!appId || !appSecret) {
      setStatus("error");
      setStatusMessage("请先配置 AppID 和 AppSecret");
      onResult?.("请先配置 AppID 和 AppSecret", "error");
      return;
    }

    // 检查内容大小（微信限制约 20 万字符）
    const MAX_CONTENT_LENGTH = 200000;
    if (content.length > MAX_CONTENT_LENGTH) {
      setStatus("error");
      setStatusMessage(
        `文章内容过长（${content.length} 字符），微信限制 ${MAX_CONTENT_LENGTH} 字符以内。请缩短内容或减少图片。`,
      );
      onResult?.("文章内容过长，请缩短后重试", "error");
      return;
    }

    // 处理内容中的 blob URL（本地图片），转为 base64
    const resolvedContent = await resolveBlobUrls(content);

    setStatus("publishing");
    setStatusMessage("正在获取 access_token...");

    try {
      const res = await fetch("/api/wechat/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          appSecret,
          title: title || defaultTitle || "未命名文章",
          author,
          digest,
          thumbMediaId,
          content: resolvedContent,
        }),
      });

      const data = await res.json() as {
        success?: boolean;
        mediaId?: string;
        message?: string;
        error?: string;
      };

      if (data.success && data.mediaId) {
        setStatus("success");
        setMediaId(data.mediaId);
        setStatusMessage(data.message || "发布成功！");
        onResult?.("文章已成功发布到微信公众号草稿箱！", "success");
      } else {
        setStatus("error");
        const msg = data.error || "发布失败，请稍后重试";
        setStatusMessage(msg);
        onResult?.(msg, "error");
      }
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "网络请求失败";
      setStatusMessage(msg);
      onResult?.(msg, "error");
    }
  }, [appId, appSecret, author, content, defaultTitle, digest, onResult, thumbMediaId, title]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center neo-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="neo-panel flex flex-col max-w-lg w-full mx-4 shadow-(--neo-shadow-lg) transform transition-all max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="neo-strip px-5 py-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-(--neo-green)/15 border border-(--neo-line) flex items-center justify-center">
              <SendHorizonal className="w-4 h-4 text-(--neo-green)" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-(--neo-ink) leading-tight">
                发布到公众号
              </h3>
              <p className="text-[11px] neo-text-muted font-medium">
                通过微信 API 推送草稿到公众号后台
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto neo-scrollbar p-5 space-y-4">
          {/* 发布状态 */}
          {status === "success" && (
            <div className="border border-(--neo-green)/40 bg-(--neo-green)/8 rounded-lg p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-(--neo-green)/15 flex items-center justify-center">
                  <Check className="w-5 h-5 text-(--neo-green)" strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-sm font-bold text-(--neo-ink)">发布成功</p>
              <p className="text-xs text-(--neo-ink)/70">{statusMessage}</p>
              <p className="text-[10px] neo-text-muted font-mono break-all bg-(--neo-section-header) rounded px-2 py-1">
                media_id: {mediaId}
              </p>
              <p className="text-xs neo-text-muted font-medium">
                请登录 <span className="font-semibold text-(--neo-cyan) underline">mp.weixin.qq.com</span> → 草稿箱查看和编辑
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="border border-(--neo-pink)/40 bg-(--neo-pink)/8 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-(--neo-pink)/15 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-(--neo-pink)" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-bold text-(--neo-ink)">发布失败</p>
              </div>
              <p className="text-xs text-(--neo-ink)/70 ml-8">{statusMessage}</p>
            </div>
          )}

          {/* 微信配置 — 可折叠 */}
          <div className="border border-(--neo-line) rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full flex items-center justify-between px-4 py-3 bg-(--neo-section-header) text-sm font-semibold text-(--neo-ink) text-left hover:bg-(--neo-sub-header) transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded border border-(--neo-line) bg-(--neo-surface) flex items-center justify-center text-[10px] font-bold text-(--neo-muted)">信</span>
                公众号配置
              </span>
              <span className="text-xs text-(--neo-muted) font-medium">
                {showCredentials ? "收起" : "展开"}
              </span>
            </button>

            {showCredentials && (
              <div className="p-4 space-y-3.5 bg-(--neo-surface)">
                <div>
                  <label className="block text-xs font-semibold text-(--neo-ink) mb-1.5">
                    AppID
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="neo-input w-full px-3 py-2.5 text-sm"
                    placeholder="从公众号后台「设置与开发」获取"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-(--neo-ink) mb-1.5">
                    AppSecret
                  </label>
                  <input
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    className="neo-input w-full px-3 py-2.5 text-sm"
                    placeholder="从公众号后台「设置与开发」获取"
                    autoComplete="off"
                  />
                  <a
                    href="https://mp.weixin.qq.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-(--neo-muted) mt-1.5 hover:text-(--neo-ink) transition-colors"
                  >
                    去公众号后台 →
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-(--neo-ink) mb-1.5">
                    封面素材 media_id
                    <span className="text-(--neo-muted) font-normal ml-1">（留空自动生成默认封面）</span>
                  </label>
                  <input
                    type="text"
                    value={thumbMediaId}
                    onChange={(e) => setThumbMediaId(e.target.value)}
                    className="neo-input w-full px-3 py-2.5 text-sm"
                    placeholder="留空自动生成，或输入永久素材 media_id"
                    autoComplete="off"
                  />
                  <a
                    href="https://mp.weixin.qq.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-(--neo-muted) mt-1.5 hover:text-(--neo-ink) transition-colors"
                  >
                    去公众号后台上传封面 →
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-(--neo-ink) mb-1.5">
                    作者
                    <span className="text-(--neo-muted) font-normal ml-1">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="neo-input w-full px-3 py-2.5 text-sm"
                    placeholder="显示在文章标题下方"
                    autoComplete="off"
                    maxLength={16}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  className="neo-button neo-button-ghost w-full py-2.5 text-xs font-semibold"
                >
                  保存配置
                </button>
              </div>
            )}
          </div>

          {/* 文章信息 */}
          <div className="border border-(--neo-line) rounded-lg p-4 space-y-3.5 bg-(--neo-surface)">
            <p className="text-xs font-semibold text-(--neo-ink) flex items-center gap-1.5">
              <span className="w-1 h-4 rounded-full bg-(--neo-yellow)" />
              文章信息
            </p>

            <div>
              <label className="block text-xs font-semibold text-(--neo-ink) mb-1.5">
                标题 <span className="text-(--neo-pink)">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="neo-input w-full px-3 py-2.5 text-sm"
                placeholder="文章标题"
                autoComplete="off"
                maxLength={64}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-(--neo-ink) mb-1.5">
                摘要
                <span className="text-(--neo-muted) font-normal ml-1">(可选，不填则自动抓取正文前54字)</span>
              </label>
              <textarea
                value={digest}
                onChange={(e) => setDigest(e.target.value)}
                className="neo-input w-full px-3 py-2.5 resize-none text-sm"
                rows={2}
                placeholder="文章摘要"
                autoComplete="off"
                maxLength={128}
              />
            </div>
          </div>

          <p className="text-[10px] leading-relaxed neo-text-muted font-medium bg-(--neo-section-header) rounded-lg px-3 py-2">
            AppID 和 AppSecret 仅保存在你的浏览器本地，发布时临时发送到服务端调用微信 API。
            配置信息不会上传到其他第三方服务。
          </p>
        </div>

        {/* 底栏按钮 */}
        <div className="flex gap-3 p-5 pt-4 shrink-0 border-t border-(--neo-line)">
          {status === "success" ? (
            <button onClick={onClose} className="neo-button neo-button-primary flex-1 py-2.5 text-sm font-semibold">
              完成
            </button>
          ) : (
            <>
              <button
                onClick={handlePublish}
                disabled={status === "publishing" || !title.trim()}
                className="neo-button neo-button-primary flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {status === "publishing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <SendHorizonal className="w-4 h-4" />
                    发布到草稿箱
                  </>
                )}
              </button>
              <button onClick={onClose} className="neo-button neo-button-ghost px-5 py-2.5 text-sm font-semibold">
                取消
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
