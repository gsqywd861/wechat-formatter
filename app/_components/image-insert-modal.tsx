import { Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ImageInsertModalProps = {
  open: boolean;
  onConfirm: (md: string) => void;
  onClose: () => void;
  onLocalImage: () => void;
};

export function ImageInsertModal({
  open,
  onConfirm,
  onClose,
  onLocalImage,
}: ImageInsertModalProps) {
  const [localUrl, setLocalUrl] = useState("");
  const [localDesc, setLocalDesc] = useState("");

  useEffect(() => {
    if (open) {
      setLocalUrl("");
      setLocalDesc("");
    }
  }, [open]);

  const handleOnlineImage = useCallback(() => {
    const url = localUrl.trim();
    if (!url) return;
    const desc = localDesc || "图片";
    const md = `![${desc}](${url})`;
    // 先插入 Markdown，再关闭模态框，两个状态更新合并到同一 batch
    onConfirm(md);
    onClose();
  }, [localUrl, localDesc, onClose, onConfirm]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center neo-modal-backdrop"
      onClick={handleClose}
    >
      <div
        className="neo-modal p-6 max-w-md w-full mx-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ... 模板内容保持不变 ... */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-(--neo-ink) mb-2 uppercase">插入图片</h3>
          <p className="text-sm neo-text-muted font-bold">选择本地图片或输入在线图片地址</p>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-(--neo-ink) mb-1">图片描述</label>
            <input
              type="text"
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              className="neo-input w-full px-3 py-2"
              placeholder="输入图片描述（可选）"
            />
          </div>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-[3px] bg-(--neo-ink)" />
              <span className="text-xs font-semibold text-(--neo-ink)">或</span>
              <div className="flex-1 h-[3px] bg-(--neo-ink)" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-(--neo-ink) mb-1">在线图片地址</label>
            <input
              type="text"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              className="neo-input w-full px-3 py-2"
              placeholder="https://example.com/image.png"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLocalImage}
            className="neo-button neo-button-cyan flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            选择本地图片
          </button>
          <button
            onClick={handleOnlineImage}
            disabled={!localUrl.trim()}
            className="neo-button neo-button-primary flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            插入在线图片
          </button>
        </div>

        <button onClick={handleClose} className="neo-button neo-button-ghost w-full mt-3 py-2.5">
          取消
        </button>
      </div>
    </div>
  );
}