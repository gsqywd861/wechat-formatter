import { Check, ExternalLink, Loader2, SendHorizonal } from "lucide-react";
import { useState } from "react";
import type React from "react";
import type { WeChatCredentials } from "../_hooks/use-wechat-settings";

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

  if (!open) return null;

  const handleSaveCredentials = () => {
    onSave({ appId, appSecret, thumbMediaId, author });
  };

  const handlePublish = async () => {
    if (!appId || !appSecret) {
      setStatus("error");
      setStatusMessage("请先配置 AppID 和 AppSecret");
      onResult?.("请先配置 AppID 和 AppSecret", "error");
      return;
    }

    // 先保存凭证
    onSave({ appId, appSecret, thumbMediaId, author });

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
          content,
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
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center neo-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="neo-modal flex flex-col max-w-lg w-full mx-4 transform transition-all max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="text-center p-6 pb-4 shrink-0 border-b-[3px] border-(--neo-ink)">
          <h3 className="text-xl font-semibold text-(--neo-ink) mb-1 flex items-center justify-center gap-2">
            <SendHorizonal className="w-5 h-5" />
            发布到公众号草稿箱
          </h3>
          <p className="text-xs neo-text-muted font-bold">
            通过微信官方 API，将文章草稿推送到你的公众号后台
          </p>
        </div>

        <div className="flex-1 overflow-y-auto neo-scrollbar p-6 py-4 space-y-4">
          {/* 发布状态 */}
          {status === "success" && (
            <div className="border-2 border-(--neo-green) bg-(--neo-green)/10 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Check className="w-6 h-6 text-(--neo-green)" />
                <span className="text-sm font-bold text-(--neo-ink)">发布成功</span>
              </div>
              <p className="text-xs text-(--neo-ink)">{statusMessage}</p>
              <p className="text-[10px] neo-text-muted font-mono break-all">
                media_id: {mediaId}
              </p>
              <p className="text-xs neo-text-muted font-bold">
                请登录 <span className="font-semibold underline">mp.weixin.qq.com</span> →
                草稿箱查看和编辑
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="border-2 border-(--neo-pink) bg-(--neo-pink)/10 p-3">
              <p className="text-sm font-bold text-(--neo-ink)">发布失败</p>
              <p className="text-xs text-(--neo-ink) mt-1">{statusMessage}</p>
            </div>
          )}

          {/* 微信配置 — 可折叠 */}
          <div className="border border-(--neo-line) overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full flex items-center justify-between px-4 py-3 bg-(--neo-sub-header) text-sm font-semibold text-(--neo-ink) text-left"
            >
              <span>公众号配置</span>
              <span className="text-xs text-(--neo-muted)">
                {showCredentials ? "收起" : "展开"}
              </span>
            </button>

            {showCredentials && (
              <div className="p-4 space-y-3 bg-(--neo-surface)">
                <div>
                  <label className="block text-xs font-semibold text-(--neo-ink) mb-1">
                    AppID
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="neo-input w-full px-3 py-2"
                    placeholder="从公众号后台「设置与开发」获取"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-(--neo-ink) mb-1">
                    AppSecret
                  </label>
                  <input
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    className="neo-input w-full px-3 py-2"
                    placeholder="从公众号后台「设置与开发」获取"
                    autoComplete="off"
                  />
                  <a
                    href="https://mp.weixin.qq.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-(--neo-muted) mt-1 hover:text-(--neo-ink)"
                  >
                    去公众号后台 →
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-(--neo-ink) mb-1">
                    封面素材 media_id
                    <span className="text-(--neo-muted) font-normal ml-1">（留空自动生成默认封面）</span>
                  </label>
                  <input
                    type="text"
                    value={thumbMediaId}
                    onChange={(e) => setThumbMediaId(e.target.value)}
                    className="neo-input w-full px-3 py-2"
                    placeholder="留空自动生成，或输入永久素材 media_id"
                    autoComplete="off"
                  />
                  <a
                    href="https://mp.weixin.qq.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-(--neo-muted) mt-1 hover:text-(--neo-ink)"
                  >
                    去公众号后台上传封面 →
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-(--neo-ink) mb-1">
                    作者
                    <span className="text-(--neo-muted) font-normal ml-1">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="neo-input w-full px-3 py-2"
                    placeholder="显示在文章标题下方"
                    autoComplete="off"
                    maxLength={16}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  className="neo-button neo-button-ghost w-full py-2 text-xs font-semibold"
                >
                  保存配置
                </button>
              </div>
            )}
          </div>

          {/* 文章信息 */}
          <div className="border border-(--neo-line) p-4 space-y-3 bg-(--neo-surface)">
            <p className="text-xs font-semibold text-(--neo-ink)">文章信息</p>

            <div>
              <label className="block text-xs font-semibold text-(--neo-ink) mb-1">
                标题 <span className="text-(--neo-pink)">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="neo-input w-full px-3 py-2"
                placeholder="文章标题"
                autoComplete="off"
                maxLength={64}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-(--neo-ink) mb-1">
                摘要
                <span className="text-(--neo-muted) font-normal ml-1">(可选，不填则自动抓取正文前54字)</span>
              </label>
              <textarea
                value={digest}
                onChange={(e) => setDigest(e.target.value)}
                className="neo-input w-full px-3 py-2 resize-none"
                rows={2}
                placeholder="文章摘要"
                autoComplete="off"
                maxLength={128}
              />
            </div>
          </div>

          <p className="text-[10px] leading-relaxed neo-text-muted font-bold">
            AppID 和 AppSecret 仅保存在你的浏览器本地，发布时临时发送到服务端调用微信 API。
            配置信息不会上传到其他第三方服务。
          </p>
        </div>

        {/* 底栏按钮 */}
        <div className="flex gap-3 p-6 pt-4 shrink-0 border-t border-(--neo-line)">
          {status === "success" ? (
            <button onClick={onClose} className="neo-button neo-button-primary flex-1 py-2.5">
              完成
            </button>
          ) : (
            <>
              <button
                onClick={handlePublish}
                disabled={status === "publishing" || !title.trim()}
                className="neo-button neo-button-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-40"
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
              <button onClick={onClose} className="neo-button neo-button-ghost px-4 py-2.5">
                取消
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
