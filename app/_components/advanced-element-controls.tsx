import { useState } from "react";

type AdvancedElementControlsProps = {
  // Border width
  borderWidth?: number;
  onBorderWidth: (v: number | undefined) => void;
  // Padding
  padding?: number;
  onPadding: (v: number | undefined) => void;
  // Margin
  margin?: number;
  onMargin: (v: number | undefined) => void;
  // Opacity
  opacity?: number;
  onOpacity: (v: number | undefined) => void;
  // Text shadow
  textShadow?: string;
  onTextShadow: (v: string | undefined) => void;
  // Box shadow
  boxShadow?: string;
  onBoxShadow: (v: string | undefined) => void;
  // Transform
  transform?: string;
  onTransform: (v: string | undefined) => void;
  // Transition
  transition?: string;
  onTransition: (v: string | undefined) => void;
  // Animation
  animation?: string;
  onAnimation: (v: string | undefined) => void;
  // Filter
  filter?: string;
  onFilter: (v: string | undefined) => void;
  // Mix blend mode
  mixBlendMode?: string;
  onMixBlendMode: (v: string | undefined) => void;
};

export function AdvancedElementControls(props: AdvancedElementControlsProps) {
  const {
    borderWidth, onBorderWidth,
    padding, onPadding,
    margin, onMargin,
    opacity, onOpacity,
    textShadow, onTextShadow,
    boxShadow, onBoxShadow,
    transform, onTransform,
    transition, onTransition,
    animation, onAnimation,
    filter, onFilter,
    mixBlendMode, onMixBlendMode,
  } = props;

  const hasChanges = borderWidth !== undefined ||
    padding !== undefined ||
    margin !== undefined ||
    textShadow ||
    boxShadow ||
    opacity !== undefined ||
    transform ||
    transition ||
    animation ||
    filter ||
    mixBlendMode;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2 pt-2 border-t border-(--neo-line)">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-(--neo-ink)">高级属性</span>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={() => {
                onBorderWidth(undefined);
                onPadding(undefined);
                onMargin(undefined);
                onTextShadow(undefined);
                onBoxShadow(undefined);
                onOpacity(undefined);
                onTransform(undefined);
                onTransition(undefined);
                onAnimation(undefined);
                onFilter(undefined);
                onMixBlendMode(undefined);
              }}
              className="text-[9px] font-semibold underline text-(--neo-muted) hover:text-(--neo-ink)"
            >
              重置
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[9px] font-semibold text-(--neo-accent) hover:underline"
          >
            {isOpen ? "收起" : "高级"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-(--neo-muted)">边框宽度</label>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={borderWidth ?? 0}
                  onChange={(e) => onBorderWidth(e.target.value === "0" ? undefined : Number(e.target.value))}
                  className="flex-1 h-1.5 accent-(--neo-ink) cursor-pointer"
                />
                <span className="text-[9px] font-bold text-(--neo-muted) w-6 text-right">
                  {borderWidth ?? 0}px
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-(--neo-muted)">内边距</label>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={padding ?? 0}
                  onChange={(e) => onPadding(e.target.value === "0" ? undefined : Number(e.target.value))}
                  className="flex-1 h-1.5 accent-(--neo-ink) cursor-pointer"
                />
                <span className="text-[9px] font-bold text-(--neo-muted) w-6 text-right">
                  {padding ?? 0}px
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-(--neo-muted)">外边距</label>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={margin ?? 0}
                  onChange={(e) => onMargin(e.target.value === "0" ? undefined : Number(e.target.value))}
                  className="flex-1 h-1.5 accent-(--neo-ink) cursor-pointer"
                />
                <span className="text-[9px] font-bold text-(--neo-muted) w-6 text-right">
                  {margin ?? 0}px
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-(--neo-muted)">透明度</label>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={opacity !== undefined ? opacity * 100 : 100}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onOpacity(val === 100 ? undefined : val / 100);
                  }}
                  className="flex-1 h-1.5 accent-(--neo-ink) cursor-pointer"
                />
                <span className="text-[9px] font-bold text-(--neo-muted) w-8 text-right">
                  {opacity !== undefined ? Math.round(opacity * 100) : 100}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-(--neo-muted)">文字阴影</label>
            <input
              type="text"
              value={textShadow || ""}
              onChange={(e) => onTextShadow(e.target.value || undefined)}
              placeholder="例: 2px 2px 4px rgba(0,0,0,0.5)"
              className="w-full h-8 px-2 border border-(--neo-line) bg-(--neo-bg) text-[10px] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-(--neo-muted)">盒子阴影</label>
            <input
              type="text"
              value={boxShadow || ""}
              onChange={(e) => onBoxShadow(e.target.value || undefined)}
              placeholder="例: 0 4px 12px rgba(0,0,0,0.15)"
              className="w-full h-8 px-2 border border-(--neo-line) bg-(--neo-bg) text-[10px] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-(--neo-muted)">变换 (Transform)</label>
            <input
              type="text"
              value={transform || ""}
              onChange={(e) => onTransform(e.target.value || undefined)}
              placeholder="例: rotate(5deg) scale(1.05)"
              className="w-full h-8 px-2 border border-(--neo-line) bg-(--neo-bg) text-[10px] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-(--neo-muted)">过渡 (Transition)</label>
            <input
              type="text"
              value={transition || ""}
              onChange={(e) => onTransition(e.target.value || undefined)}
              placeholder="例: all 0.3s ease"
              className="w-full h-8 px-2 border border-(--neo-line) bg-(--neo-bg) text-[10px] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-(--neo-muted)">动画 (Animation)</label>
            <input
              type="text"
              value={animation || ""}
              onChange={(e) => onAnimation(e.target.value || undefined)}
              placeholder="例: fadeIn 0.5s ease-out"
              className="w-full h-8 px-2 border border-(--neo-line) bg-(--neo-bg) text-[10px] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-(--neo-muted)">滤镜 (Filter)</label>
            <input
              type="text"
              value={filter || ""}
              onChange={(e) => onFilter(e.target.value || undefined)}
              placeholder="例: blur(2px) brightness(1.2)"
              className="w-full h-8 px-2 border border-(--neo-line) bg-(--neo-bg) text-[10px] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-(--neo-muted)">混合模式</label>
            <select
              value={mixBlendMode || ""}
              onChange={(e) => onMixBlendMode(e.target.value || undefined)}
              className="w-full h-8 px-2 border border-(--neo-line) bg-(--neo-bg) text-[10px] font-semibold appearance-none cursor-pointer"
            >
              <option value="">正常</option>
              <option value="multiply">正片叠底 (multiply)</option>
              <option value="screen">滤色 (screen)</option>
              <option value="overlay">叠加 (overlay)</option>
              <option value="darken">变暗 (darken)</option>
              <option value="lighten">变亮 (lighten)</option>
              <option value="color-dodge">颜色减淡 (color-dodge)</option>
              <option value="color-burn">颜色加深 (color-burn)</option>
              <option value="hard-light">强光 (hard-light)</option>
              <option value="soft-light">柔光 (soft-light)</option>
              <option value="difference">差值 (difference)</option>
              <option value="exclusion">排除 (exclusion)</option>
              <option value="hue">色相 (hue)</option>
              <option value="saturation">饱和度 (saturation)</option>
              <option value="color">颜色 (color)</option>
              <option value="luminosity">亮度 (luminosity)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
