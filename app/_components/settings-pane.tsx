import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Download,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type React from "react";
import type { ActiveTab, FormatTweaks } from "../_types/formatter";
import type { TemplateConfig } from "../template-engine";
import { AdvancedElementControls } from "./advanced-element-controls";

/** 从模板配置中提取预览样式 */
function usePreviewStyle(template: TemplateConfig) {
  return useMemo(() => {
    const hexColor = template.themeColor.startsWith("#")
      ? template.themeColor
      : `#${template.themeColor}`;

    const h1ColorMatch = template.h1Style.match(/color:\s*([^;]+)/i);
    const pColorMatch = template.pStyle.match(/color:\s*([^;]+)/i);
    const h1FontSize = template.h1Style.match(/font-size:\s*([^;]+)/i);
    const borderColorMatch = template.h1Style.match(/border(?:-color)?:\s*([^;]+)/i);
    const boxShadowMatch = template.h1Style.match(/box-shadow:\s*([^;]+)/i);

    // 从 h1Style 中提取实际背景色，确保缩略图与真实施一致
    const h1BgColorMatch = template.h1Style.match(/background-color:\s*([^;]+)/i);
    const h1BgShorthandMatch = template.h1Style.match(/(?<!\w)background:\s*([^;]+)/i);
    const headingBg = h1BgColorMatch?.[1]?.trim()
      || h1BgShorthandMatch?.[1]?.trim()
      || template.backgroundColor
      || "#ffffff";
    const headingHasBg = !!(h1BgColorMatch || h1BgShorthandMatch);

    return {
      bgColor: template.backgroundColor || "#ffffff",
      accentColor: hexColor,
      headingBg,
      headingHasBg,
      headingColor: h1ColorMatch?.[1]?.trim() || "#000000",
      textColor: pColorMatch?.[1]?.trim() || template.baseStyle.color,
      fontFamily: template.baseStyle.fontFamily,
      h1FontSize: h1FontSize?.[1]?.trim() || "1em",
      borderColor: borderColorMatch?.[1]?.trim() || "transparent",
      hasBoxShadow: !!boxShadowMatch,
    };
  }, [template]);
}

type TemplateGroup = {
  id: string;
  name: string;
  templates: TemplateConfig[];
};

type RangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  tone: "yellow" | "cyan";
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
};

const badgeClassNames = {
  yellow: "bg-(--neo-yellow)",
  cyan: "bg-(--neo-cyan)",
} as const;

type TemplateCardProps = {
  template: TemplateConfig;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: (template: TemplateConfig) => void;
  onDelete?: (template: TemplateConfig) => void;
};

/** 带迷你预览缩略图的模板卡片 */
function TemplateCard({ template, isSelected, onSelect, onEdit, onDelete }: TemplateCardProps) {
  const pv = usePreviewStyle(template);

  return (
    <button
      onClick={onSelect}
      className={`relative border border-(--neo-line) text-center transition-all duration-200 flex flex-col gap-0 overflow-hidden bg-(--neo-surface) ${
        isSelected ? "ring-2 ring-(--neo-green)" : "hover:ring-1 hover:ring-(--neo-cyan)"
      }`}
    >
      {/* 迷你预览缩略图 — 展示模板的实际背景色和标题样式 */}
      <div
        className="w-full h-12 flex flex-col items-start justify-center px-2.5 shrink-0"
        style={{ backgroundColor: pv.bgColor }}
      >
        {/* 标题横条 — 使用 accentColor 作左侧色条，确保不同配色可见 */}
        <div className="w-full flex items-center gap-1.5 rounded-[2px]">
          <div
            className="w-[3px] h-4 shrink-0 rounded-full"
            style={{ backgroundColor: pv.accentColor }}
          />
          <span
            className="text-[6px] font-bold leading-none truncate"
            style={{ color: pv.headingColor }}
          >
            {template.name}
          </span>
        </div>
        {/* 主题色装饰条 — 展示主色调区分不同模板 */}
        <div
          className="w-full h-[2px] mt-[3px]"
          style={{ backgroundColor: pv.accentColor }}
        />
        {/* 模拟正文文字线 */}
        <div className="w-full mt-[3px] space-y-[2px]">
          <div
            className="h-[3px] rounded-full opacity-30"
            style={{ backgroundColor: pv.textColor, width: "80%" }}
          />
          <div
            className="h-[3px] rounded-full opacity-20"
            style={{ backgroundColor: pv.textColor, width: "55%" }}
          />
        </div>
      </div>

      {/* 模板名称 */}
      <div className="w-full px-2 py-1.5">
        <span className="font-semibold text-[11px] text-(--neo-ink) truncate block leading-tight">
          {template.name}
        </span>
      </div>

      {/* 已选标记 */}
      {isSelected && (
        <div className="absolute top-1 right-1 bg-(--neo-green) text-[#111111] border border-(--neo-line) p-0.5">
          <Check className="w-2.5 h-2.5" strokeWidth={3} />
        </div>
      )}

      {/* 用户模板编辑和删除按钮 */}
      {template.id.startsWith("user-") && (onEdit || onDelete) && (
        <div className="absolute bottom-1 left-1 flex gap-0.5">
          {onEdit && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(template);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onEdit(template);
                }
              }}
              className="bg-(--neo-cyan) text-[#111] border border-(--neo-line) p-0.5 hover:bg-(--neo-yellow) text-[9px] font-semibold leading-none cursor-pointer select-none"
              title="编辑模板"
            >
              编辑
            </span>
          )}
          {onDelete && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`确定要删除模板"${template.name}"吗？此操作不可撤销。`)) {
                  onDelete(template);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  if (window.confirm(`确定要删除模板"${template.name}"吗？此操作不可撤销。`)) {
                    onDelete(template);
                  }
                }
              }}
              className="bg-(--neo-red) text-white border border-(--neo-line) p-0.5 hover:bg-red-700 text-[9px] font-semibold leading-none cursor-pointer select-none"
              title="删除模板"
            >
              删除
            </span>
          )}
        </div>
      )}
    </button>
  );
}

/** 元素级样式编辑区块 — 背景色/边框色/边框样式/圆角/边框宽度/内边距/外边距/文字阴影/盒子阴影/透明度/变换/过渡/动画/滤镜/混合模式 */
type ElementStyleSectionProps = {
  label: string;
  bgColor?: string;
  onBgColor: (v: string | undefined) => void;
  borderColor?: string;
  onBorderColor: (v: string | undefined) => void;
  borderStyle?: string;
  onBorderStyle: (v: string | undefined) => void;
  borderWidth?: number;
  onBorderWidth: (v: number | undefined) => void;
  borderRadius?: number;
  onBorderRadius: (v: number | undefined) => void;
  padding?: number;
  onPadding: (v: number | undefined) => void;
  margin?: number;
  onMargin: (v: number | undefined) => void;
  textShadow?: string;
  onTextShadow: (v: string | undefined) => void;
  boxShadow?: string;
  onBoxShadow: (v: string | undefined) => void;
  opacity?: number;
  onOpacity: (v: number | undefined) => void;
  transform?: string;
  onTransform: (v: string | undefined) => void;
  transition?: string;
  onTransition: (v: string | undefined) => void;
  animation?: string;
  onAnimation: (v: string | undefined) => void;
  filter?: string;
  onFilter: (v: string | undefined) => void;
  mixBlendMode?: string;
  onMixBlendMode: (v: string | undefined) => void;
};

function ElementStyleSection({
  label,
  bgColor,
  onBgColor,
  borderColor,
  onBorderColor,
  borderStyle,
  onBorderStyle,
  borderWidth,
  onBorderWidth,
  borderRadius,
  onBorderRadius,
  padding,
  onPadding,
  margin,
  onMargin,
  textShadow,
  onTextShadow,
  boxShadow,
  onBoxShadow,
  opacity,
  onOpacity,
  transform,
  onTransform,
  transition,
  onTransition,
  animation,
  onAnimation,
  filter,
  onFilter,
  mixBlendMode,
  onMixBlendMode,
}: ElementStyleSectionProps) {
  const hasChanges = bgColor || borderColor || borderStyle || borderRadius !== undefined ||
    borderWidth !== undefined || padding !== undefined || margin !== undefined ||
    textShadow || boxShadow || opacity !== undefined || transform || transition || animation || filter || mixBlendMode;
  
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  return (
    <div className="border border-(--neo-line) bg-(--neo-surface) p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-(--neo-ink)">{label}</span>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={() => {
                onBgColor(undefined);
                onBorderColor(undefined);
                onBorderStyle(undefined);
                onBorderRadius(undefined);
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
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="text-[9px] font-semibold text-(--neo-accent) hover:underline"
          >
            {isAdvancedOpen ? "收起" : "高级"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniColorPicker label="背景色" value={bgColor} onChange={onBgColor} />
        <MiniColorPicker label="边框色" value={borderColor} onChange={onBorderColor} />
      </div>

      <div className="grid grid-cols-2 gap-2 items-center">
        <select
          value={borderStyle || ""}
          onChange={(e) => onBorderStyle(e.target.value || undefined)}
          className="neo-input w-full px-2 py-1.5 text-[10px] font-semibold appearance-none cursor-pointer"
        >
          <option value="">无边</option>
          <option value="solid">实线</option>
          <option value="dashed">虚线</option>
          <option value="dotted">点线</option>
          <option value="double">双线</option>
        </select>

        <div className="flex items-center gap-1">
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={borderRadius ?? 0}
            onChange={(e) => onBorderRadius(e.target.value === "0" ? undefined : Number(e.target.value))}
            className="flex-1 h-1.5 accent-(--neo-pink) cursor-pointer"
          />
          <span className="text-[9px] font-bold text-(--neo-muted) w-6 text-right">
            {borderRadius ?? 0}px
          </span>
        </div>
      </div>
    </div>
  );
}

/** 极简色彩选择器 */
function MiniColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-(--neo-ink) cursor-pointer">
      <span className="relative w-5 h-5 shrink-0 border border-(--neo-line) overflow-hidden cursor-pointer">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value === "#000000" && !value ? undefined : e.target.value)}
          className="absolute -inset-1 w-[150%] h-[150%] cursor-pointer border-none p-0 m-0"
        />
      </span>
      <span className="truncate">{label}</span>
      {value && (
        <button
          onClick={(e) => { e.preventDefault(); onChange(undefined); }}
          className="text-[9px] text-(--neo-muted) hover:text-(--neo-ink) ml-auto"
          title="清除"
        >
          ✕
        </button>
      )}
    </label>
  );
}

/** 内置 CSS 预设（50+ 款） */
const BUILTIN_CSS_PRESETS: Record<string, { label: string; css: string }[]> = {
  h1: [
    { label: '无额外样式', css: '' },
    { label: '底部琥珀边框', css: 'border-bottom: 3px solid #e8a838; padding-bottom: 8px;' },
    { label: '左侧琥珀竖线', css: 'border-left: 4px solid #e8a838; padding-left: 12px;' },
    { label: '琥珀背景块', css: 'background-color: #fefaf0; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #e8a838;' },
    { label: '琥珀渐变色', css: 'background: linear-gradient(135deg, #e8a838 0%, #d4687a 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部天蓝边框', css: 'border-bottom: 3px solid #4a90d9; padding-bottom: 8px;' },
    { label: '左侧天蓝竖线', css: 'border-left: 4px solid #4a90d9; padding-left: 12px;' },
    { label: '天蓝背景块', css: 'background-color: #f0f6ff; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #4a90d9;' },
    { label: '天蓝渐变色', css: 'background: linear-gradient(135deg, #4a90d9 0%, #8b5cf6 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部翠绿边框', css: 'border-bottom: 3px solid #5cb85c; padding-bottom: 8px;' },
    { label: '左侧翠绿竖线', css: 'border-left: 4px solid #5cb85c; padding-left: 12px;' },
    { label: '翠绿背景块', css: 'background-color: #f0fff0; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #5cb85c;' },
    { label: '翠绿渐变色', css: 'background: linear-gradient(135deg, #5cb85c 0%, #06b6d4 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部粉红边框', css: 'border-bottom: 3px solid #d4687a; padding-bottom: 8px;' },
    { label: '左侧粉红竖线', css: 'border-left: 4px solid #d4687a; padding-left: 12px;' },
    { label: '粉红背景块', css: 'background-color: #fef0f0; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #d4687a;' },
    { label: '粉红渐变色', css: 'background: linear-gradient(135deg, #d4687a 0%, #f97316 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部紫色边框', css: 'border-bottom: 3px solid #8b5cf6; padding-bottom: 8px;' },
    { label: '左侧紫色竖线', css: 'border-left: 4px solid #8b5cf6; padding-left: 12px;' },
    { label: '紫色背景块', css: 'background-color: #f5f0ff; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #8b5cf6;' },
    { label: '紫色渐变色', css: 'background: linear-gradient(135deg, #8b5cf6 0%, #84cc16 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部青色边框', css: 'border-bottom: 3px solid #06b6d4; padding-bottom: 8px;' },
    { label: '左侧青色竖线', css: 'border-left: 4px solid #06b6d4; padding-left: 12px;' },
    { label: '青色背景块', css: 'background-color: #f0fdfe; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #06b6d4;' },
    { label: '青色渐变色', css: 'background: linear-gradient(135deg, #06b6d4 0%, #ec4899 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部橙色边框', css: 'border-bottom: 3px solid #f97316; padding-bottom: 8px;' },
    { label: '左侧橙色竖线', css: 'border-left: 4px solid #f97316; padding-left: 12px;' },
    { label: '橙色背景块', css: 'background-color: #fff7ed; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #f97316;' },
    { label: '橙色渐变色', css: 'background: linear-gradient(135deg, #f97316 0%, #14b8a6 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部草绿边框', css: 'border-bottom: 3px solid #84cc16; padding-bottom: 8px;' },
    { label: '左侧草绿竖线', css: 'border-left: 4px solid #84cc16; padding-left: 12px;' },
    { label: '草绿背景块', css: 'background-color: #f7fee7; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #84cc16;' },
    { label: '草绿渐变色', css: 'background: linear-gradient(135deg, #84cc16 0%, #f43f5e 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部玫红边框', css: 'border-bottom: 3px solid #ec4899; padding-bottom: 8px;' },
    { label: '左侧玫红竖线', css: 'border-left: 4px solid #ec4899; padding-left: 12px;' },
    { label: '玫红背景块', css: 'background-color: #fdf2f8; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #ec4899;' },
    { label: '玫红渐变色', css: 'background: linear-gradient(135deg, #ec4899 0%, #6366f1 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部青绿边框', css: 'border-bottom: 3px solid #14b8a6; padding-bottom: 8px;' },
    { label: '左侧青绿竖线', css: 'border-left: 4px solid #14b8a6; padding-left: 12px;' },
    { label: '青绿背景块', css: 'background-color: #f0fdfa; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #14b8a6;' },
    { label: '青绿渐变色', css: 'background: linear-gradient(135deg, #14b8a6 0%, #e8a838 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部朱红边框', css: 'border-bottom: 3px solid #f43f5e; padding-bottom: 8px;' },
    { label: '左侧朱红竖线', css: 'border-left: 4px solid #f43f5e; padding-left: 12px;' },
    { label: '朱红背景块', css: 'background-color: #fff1f2; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #f43f5e;' },
    { label: '朱红渐变色', css: 'background: linear-gradient(135deg, #f43f5e 0%, #4a90d9 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '底部靛蓝边框', css: 'border-bottom: 3px solid #6366f1; padding-bottom: 8px;' },
    { label: '左侧靛蓝竖线', css: 'border-left: 4px solid #6366f1; padding-left: 12px;' },
    { label: '靛蓝背景块', css: 'background-color: #eef2ff; padding: 10px 16px; border-radius: 6px; border-left: 3px solid #6366f1;' },
    { label: '靛蓝渐变色', css: 'background: linear-gradient(135deg, #6366f1 0%, #5cb85c 100%); color: #fff; padding: 14px 20px; border-radius: 8px;' },
    { label: '上下1px双线', css: 'border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 8px 0; text-align: center;' },
  ],

  h2: [
    { label: '无额外样式', css: '' },
    { label: '底部琥珀边框', css: 'border-bottom: 2px solid #e8a838; padding-bottom: 6px;' },
    { label: '左侧琥珀竖线', css: 'border-left: 3px solid #e8a838; padding-left: 10px;' },
    { label: '琥珀背景标签', css: 'background-color: #fefaf0; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #e8a838;' },
    { label: '底部天蓝边框', css: 'border-bottom: 2px solid #4a90d9; padding-bottom: 6px;' },
    { label: '左侧天蓝竖线', css: 'border-left: 3px solid #4a90d9; padding-left: 10px;' },
    { label: '天蓝背景标签', css: 'background-color: #f0f6ff; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #4a90d9;' },
    { label: '底部翠绿边框', css: 'border-bottom: 2px solid #5cb85c; padding-bottom: 6px;' },
    { label: '左侧翠绿竖线', css: 'border-left: 3px solid #5cb85c; padding-left: 10px;' },
    { label: '翠绿背景标签', css: 'background-color: #f0fff0; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #5cb85c;' },
    { label: '底部粉红边框', css: 'border-bottom: 2px solid #d4687a; padding-bottom: 6px;' },
    { label: '左侧粉红竖线', css: 'border-left: 3px solid #d4687a; padding-left: 10px;' },
    { label: '粉红背景标签', css: 'background-color: #fef0f0; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #d4687a;' },
    { label: '底部紫色边框', css: 'border-bottom: 2px solid #8b5cf6; padding-bottom: 6px;' },
    { label: '左侧紫色竖线', css: 'border-left: 3px solid #8b5cf6; padding-left: 10px;' },
    { label: '紫色背景标签', css: 'background-color: #f5f0ff; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #8b5cf6;' },
    { label: '底部青色边框', css: 'border-bottom: 2px solid #06b6d4; padding-bottom: 6px;' },
    { label: '左侧青色竖线', css: 'border-left: 3px solid #06b6d4; padding-left: 10px;' },
    { label: '青色背景标签', css: 'background-color: #f0fdfe; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #06b6d4;' },
    { label: '底部橙色边框', css: 'border-bottom: 2px solid #f97316; padding-bottom: 6px;' },
    { label: '左侧橙色竖线', css: 'border-left: 3px solid #f97316; padding-left: 10px;' },
    { label: '橙色背景标签', css: 'background-color: #fff7ed; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #f97316;' },
    { label: '底部草绿边框', css: 'border-bottom: 2px solid #84cc16; padding-bottom: 6px;' },
    { label: '左侧草绿竖线', css: 'border-left: 3px solid #84cc16; padding-left: 10px;' },
    { label: '草绿背景标签', css: 'background-color: #f7fee7; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #84cc16;' },
    { label: '底部玫红边框', css: 'border-bottom: 2px solid #ec4899; padding-bottom: 6px;' },
    { label: '左侧玫红竖线', css: 'border-left: 3px solid #ec4899; padding-left: 10px;' },
    { label: '玫红背景标签', css: 'background-color: #fdf2f8; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #ec4899;' },
    { label: '底部青绿边框', css: 'border-bottom: 2px solid #14b8a6; padding-bottom: 6px;' },
    { label: '左侧青绿竖线', css: 'border-left: 3px solid #14b8a6; padding-left: 10px;' },
    { label: '青绿背景标签', css: 'background-color: #f0fdfa; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #14b8a6;' },
    { label: '底部朱红边框', css: 'border-bottom: 2px solid #f43f5e; padding-bottom: 6px;' },
    { label: '左侧朱红竖线', css: 'border-left: 3px solid #f43f5e; padding-left: 10px;' },
    { label: '朱红背景标签', css: 'background-color: #fff1f2; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #f43f5e;' },
    { label: '底部靛蓝边框', css: 'border-bottom: 2px solid #6366f1; padding-bottom: 6px;' },
    { label: '左侧靛蓝竖线', css: 'border-left: 3px solid #6366f1; padding-left: 10px;' },
    { label: '靛蓝背景标签', css: 'background-color: #eef2ff; padding: 6px 14px; border-radius: 4px; display: inline-block; border-left: 3px solid #6366f1;' },
    { label: '底部虚线', css: 'border-bottom: 2px dashed #ccc; padding-bottom: 6px;' },
    { label: '底部点线', css: 'border-bottom: 2px dotted #ccc; padding-bottom: 6px;' },
    { label: '上下装饰线', css: 'border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 8px 0; text-align: center;' },
    { label: '4px圆角标签', css: 'display: inline-block; background: #e8a838; color: #fff; padding: 4px 16px; border-radius: 4px; font-size: 0.9em;' },
    { label: '8px圆角标签', css: 'display: inline-block; background: #e8a838; color: #fff; padding: 4px 16px; border-radius: 8px; font-size: 0.9em;' },
    { label: '12px圆角标签', css: 'display: inline-block; background: #e8a838; color: #fff; padding: 4px 16px; border-radius: 12px; font-size: 0.9em;' },
    { label: '左侧2px色块', css: 'border-left: 2px solid #e8a838; background: #fefaf0; padding: 6px 12px; border-radius: 0 4px 4px 0;' },
    { label: '左侧4px色块', css: 'border-left: 4px solid #e8a838; background: #fefaf0; padding: 6px 12px; border-radius: 0 4px 4px 0;' },
    { label: '左侧6px色块', css: 'border-left: 6px solid #e8a838; background: #fefaf0; padding: 6px 12px; border-radius: 0 4px 4px 0;' },
    { label: '阴影标签', css: 'display: inline-block; padding: 6px 16px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);' },
    { label: '双下划线', css: 'border-bottom: 3px double #ccc; padding-bottom: 4px;' },
    { label: '左侧双线', css: 'border-left: 6px double #e8a838; padding: 4px 0 4px 12px;' },
    { label: '大写间距', css: 'text-transform: uppercase; letter-spacing: 2px;' },
  ],

  paragraph: [
    { label: '无额外样式', css: '' },
    { label: '琥珀卡片边框', css: 'border: 1px solid #e8a838; padding: 12px; border-radius: 8px;' },
    { label: '琥珀背景', css: 'background-color: #fefaf0; padding: 12px; border-radius: 6px;' },
    { label: '琥珀引用线', css: 'border-left: 3px solid #e8a838; padding-left: 12px; background: #fefaf0; border-radius: 0 4px 4px 0;' },
    { label: '天蓝卡片边框', css: 'border: 1px solid #4a90d9; padding: 12px; border-radius: 8px;' },
    { label: '天蓝背景', css: 'background-color: #f0f6ff; padding: 12px; border-radius: 6px;' },
    { label: '天蓝引用线', css: 'border-left: 3px solid #4a90d9; padding-left: 12px; background: #f0f6ff; border-radius: 0 4px 4px 0;' },
    { label: '翠绿卡片边框', css: 'border: 1px solid #5cb85c; padding: 12px; border-radius: 8px;' },
    { label: '翠绿背景', css: 'background-color: #f0fff0; padding: 12px; border-radius: 6px;' },
    { label: '翠绿引用线', css: 'border-left: 3px solid #5cb85c; padding-left: 12px; background: #f0fff0; border-radius: 0 4px 4px 0;' },
    { label: '粉红卡片边框', css: 'border: 1px solid #d4687a; padding: 12px; border-radius: 8px;' },
    { label: '粉红背景', css: 'background-color: #fef0f0; padding: 12px; border-radius: 6px;' },
    { label: '粉红引用线', css: 'border-left: 3px solid #d4687a; padding-left: 12px; background: #fef0f0; border-radius: 0 4px 4px 0;' },
    { label: '紫色卡片边框', css: 'border: 1px solid #8b5cf6; padding: 12px; border-radius: 8px;' },
    { label: '紫色背景', css: 'background-color: #f5f0ff; padding: 12px; border-radius: 6px;' },
    { label: '紫色引用线', css: 'border-left: 3px solid #8b5cf6; padding-left: 12px; background: #f5f0ff; border-radius: 0 4px 4px 0;' },
    { label: '青色卡片边框', css: 'border: 1px solid #06b6d4; padding: 12px; border-radius: 8px;' },
    { label: '青色背景', css: 'background-color: #f0fdfe; padding: 12px; border-radius: 6px;' },
    { label: '青色引用线', css: 'border-left: 3px solid #06b6d4; padding-left: 12px; background: #f0fdfe; border-radius: 0 4px 4px 0;' },
    { label: '橙色卡片边框', css: 'border: 1px solid #f97316; padding: 12px; border-radius: 8px;' },
    { label: '橙色背景', css: 'background-color: #fff7ed; padding: 12px; border-radius: 6px;' },
    { label: '橙色引用线', css: 'border-left: 3px solid #f97316; padding-left: 12px; background: #fff7ed; border-radius: 0 4px 4px 0;' },
    { label: '草绿卡片边框', css: 'border: 1px solid #84cc16; padding: 12px; border-radius: 8px;' },
    { label: '草绿背景', css: 'background-color: #f7fee7; padding: 12px; border-radius: 6px;' },
    { label: '草绿引用线', css: 'border-left: 3px solid #84cc16; padding-left: 12px; background: #f7fee7; border-radius: 0 4px 4px 0;' },
    { label: '玫红卡片边框', css: 'border: 1px solid #ec4899; padding: 12px; border-radius: 8px;' },
    { label: '玫红背景', css: 'background-color: #fdf2f8; padding: 12px; border-radius: 6px;' },
    { label: '玫红引用线', css: 'border-left: 3px solid #ec4899; padding-left: 12px; background: #fdf2f8; border-radius: 0 4px 4px 0;' },
    { label: '青绿卡片边框', css: 'border: 1px solid #14b8a6; padding: 12px; border-radius: 8px;' },
    { label: '青绿背景', css: 'background-color: #f0fdfa; padding: 12px; border-radius: 6px;' },
    { label: '青绿引用线', css: 'border-left: 3px solid #14b8a6; padding-left: 12px; background: #f0fdfa; border-radius: 0 4px 4px 0;' },
    { label: '朱红卡片边框', css: 'border: 1px solid #f43f5e; padding: 12px; border-radius: 8px;' },
    { label: '朱红背景', css: 'background-color: #fff1f2; padding: 12px; border-radius: 6px;' },
    { label: '朱红引用线', css: 'border-left: 3px solid #f43f5e; padding-left: 12px; background: #fff1f2; border-radius: 0 4px 4px 0;' },
    { label: '靛蓝卡片边框', css: 'border: 1px solid #6366f1; padding: 12px; border-radius: 8px;' },
    { label: '靛蓝背景', css: 'background-color: #eef2ff; padding: 12px; border-radius: 6px;' },
    { label: '靛蓝引用线', css: 'border-left: 3px solid #6366f1; padding-left: 12px; background: #eef2ff; border-radius: 0 4px 4px 0;' },
    { label: '4px圆角卡片', css: 'border: 1px solid #e0e0e0; padding: 12px; border-radius: 4px;' },
    { label: '8px圆角卡片', css: 'border: 1px solid #e0e0e0; padding: 12px; border-radius: 8px;' },
    { label: '12px圆角卡片', css: 'border: 1px solid #e0e0e0; padding: 12px; border-radius: 12px;' },
    { label: '16px圆角卡片', css: 'border: 1px solid #e0e0e0; padding: 12px; border-radius: 16px;' },
    { label: '阴影卡片', css: 'border: 1px solid #eee; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);' },
    { label: '大阴影卡片', css: 'border: 1px solid #e0e0e0; padding: 14px; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.08);' },
    { label: '双边框', css: 'border: 2px solid #e0e0e0; padding: 10px; border-radius: 4px; outline: 1px solid #f0f0f0; outline-offset: 2px;' },
    { label: '底部虚线分隔', css: 'border-bottom: 1px dashed #ddd; padding-bottom: 12px; margin-bottom: 12px;' },
    { label: '代码风格', css: 'background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px;' },
    { label: '打字机风格', css: 'font-family: monospace; background: #f8f8f8; padding: 10px; border: 1px solid #ddd; border-radius: 4px;' },
    { label: '缩进风格', css: 'text-indent: 2em; margin-left: 1em; margin-right: 1em;' },
    { label: "左右边框", css: "border-left: 1px solid #ddd; border-right: 1px solid #ddd; padding: 8px 12px;" },
    { label: "顶部标记线", css: "border-top: 3px solid #e8a838; padding-top: 10px; background: #fefaf0; border-radius: 4px;" },
  ],

  blockquote: [
    { label: '无额外样式', css: '' },
    { label: '左侧琥珀粗线', css: 'border-left: 4px solid #e8a838; padding: 12px 16px; background: #fefaf0; border-radius: 0 6px 6px 0;' },
    { label: '琥珀背景卡', css: 'background: #fefaf0; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #e8a838;' },
    { label: '顶部琥珀色条', css: 'border-top: 4px solid #e8a838; padding: 12px 16px; background: #fefaf0; border-radius: 4px;' },
    { label: '左侧天蓝粗线', css: 'border-left: 4px solid #4a90d9; padding: 12px 16px; background: #f0f6ff; border-radius: 0 6px 6px 0;' },
    { label: '天蓝背景卡', css: 'background: #f0f6ff; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #4a90d9;' },
    { label: '顶部天蓝色条', css: 'border-top: 4px solid #4a90d9; padding: 12px 16px; background: #f0f6ff; border-radius: 4px;' },
    { label: '左侧翠绿粗线', css: 'border-left: 4px solid #5cb85c; padding: 12px 16px; background: #f0fff0; border-radius: 0 6px 6px 0;' },
    { label: '翠绿背景卡', css: 'background: #f0fff0; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #5cb85c;' },
    { label: '顶部翠绿色条', css: 'border-top: 4px solid #5cb85c; padding: 12px 16px; background: #f0fff0; border-radius: 4px;' },
    { label: '左侧粉红粗线', css: 'border-left: 4px solid #d4687a; padding: 12px 16px; background: #fef0f0; border-radius: 0 6px 6px 0;' },
    { label: '粉红背景卡', css: 'background: #fef0f0; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #d4687a;' },
    { label: '顶部粉红色条', css: 'border-top: 4px solid #d4687a; padding: 12px 16px; background: #fef0f0; border-radius: 4px;' },
    { label: '左侧紫色粗线', css: 'border-left: 4px solid #8b5cf6; padding: 12px 16px; background: #f5f0ff; border-radius: 0 6px 6px 0;' },
    { label: '紫色背景卡', css: 'background: #f5f0ff; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #8b5cf6;' },
    { label: '顶部紫色色条', css: 'border-top: 4px solid #8b5cf6; padding: 12px 16px; background: #f5f0ff; border-radius: 4px;' },
    { label: '左侧青色粗线', css: 'border-left: 4px solid #06b6d4; padding: 12px 16px; background: #f0fdfe; border-radius: 0 6px 6px 0;' },
    { label: '青色背景卡', css: 'background: #f0fdfe; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #06b6d4;' },
    { label: '顶部青色色条', css: 'border-top: 4px solid #06b6d4; padding: 12px 16px; background: #f0fdfe; border-radius: 4px;' },
    { label: '左侧橙色粗线', css: 'border-left: 4px solid #f97316; padding: 12px 16px; background: #fff7ed; border-radius: 0 6px 6px 0;' },
    { label: '橙色背景卡', css: 'background: #fff7ed; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #f97316;' },
    { label: '顶部橙色色条', css: 'border-top: 4px solid #f97316; padding: 12px 16px; background: #fff7ed; border-radius: 4px;' },
    { label: '左侧草绿粗线', css: 'border-left: 4px solid #84cc16; padding: 12px 16px; background: #f7fee7; border-radius: 0 6px 6px 0;' },
    { label: '草绿背景卡', css: 'background: #f7fee7; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #84cc16;' },
    { label: '顶部草绿色条', css: 'border-top: 4px solid #84cc16; padding: 12px 16px; background: #f7fee7; border-radius: 4px;' },
    { label: '左侧玫红粗线', css: 'border-left: 4px solid #ec4899; padding: 12px 16px; background: #fdf2f8; border-radius: 0 6px 6px 0;' },
    { label: '玫红背景卡', css: 'background: #fdf2f8; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #ec4899;' },
    { label: '顶部玫红色条', css: 'border-top: 4px solid #ec4899; padding: 12px 16px; background: #fdf2f8; border-radius: 4px;' },
    { label: '左侧青绿粗线', css: 'border-left: 4px solid #14b8a6; padding: 12px 16px; background: #f0fdfa; border-radius: 0 6px 6px 0;' },
    { label: '青绿背景卡', css: 'background: #f0fdfa; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #14b8a6;' },
    { label: '顶部青绿色条', css: 'border-top: 4px solid #14b8a6; padding: 12px 16px; background: #f0fdfa; border-radius: 4px;' },
    { label: '左侧朱红粗线', css: 'border-left: 4px solid #f43f5e; padding: 12px 16px; background: #fff1f2; border-radius: 0 6px 6px 0;' },
    { label: '朱红背景卡', css: 'background: #fff1f2; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #f43f5e;' },
    { label: '顶部朱红色条', css: 'border-top: 4px solid #f43f5e; padding: 12px 16px; background: #fff1f2; border-radius: 4px;' },
    { label: '左侧靛蓝粗线', css: 'border-left: 4px solid #6366f1; padding: 12px 16px; background: #eef2ff; border-radius: 0 6px 6px 0;' },
    { label: '靛蓝背景卡', css: 'background: #eef2ff; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #6366f1;' },
    { label: '顶部靛蓝色条', css: 'border-top: 4px solid #6366f1; padding: 12px 16px; background: #eef2ff; border-radius: 4px;' },
    { label: '左侧4px双线', css: 'border-left: 4px double #e8a838; padding: 10px 16px; background: #fefaf0;' },
    { label: '左侧6px双线', css: 'border-left: 6px double #e8a838; padding: 10px 16px; background: #fefaf0;' },
    { label: '左侧8px双线', css: 'border-left: 8px double #e8a838; padding: 10px 16px; background: #fefaf0;' },
    { label: '右侧装饰线', css: 'border-right: 3px solid #e8a838; padding: 10px 16px; text-align: right; background: #fefaf0;' },
    { label: '圆角引用', css: 'border: 1px solid #e0e0e0; padding: 14px 18px; border-radius: 10px; background: #fafafa;' },
    { label: '毛玻璃效果', css: 'background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3);' },
    { label: '上下引号居中', css: 'font-style: italic; color: #888; padding: 16px 20px; text-align: center; font-size: 1.1em;' },
    { label: "底部双线", css: "border-bottom: 3px double #e8a838; padding-bottom: 8px;" },
    { label: "左侧红条警告", css: "border-left: 4px solid #f43f5e; background: #fff1f2; padding: 12px 16px; border-radius: 4px;" },
    { label: "左侧绿条提示", css: "border-left: 4px solid #5cb85c; background: #f0fff0; padding: 12px 16px; border-radius: 4px;" },
    { label: "左侧蓝条信息", css: "border-left: 4px solid #4a90d9; background: #f0f6ff; padding: 12px 16px; border-radius: 4px;" },
    { label: "圆角浅灰卡", css: "background: #f5f5f5; padding: 14px 18px; border-radius: 12px;" },
    { label: "无背景左侧线", css: "border-left: 4px solid #e8a838; padding: 8px 16px;" },
  ],
};

const PRESET_STORAGE_KEY = "wechat-formatter-css-presets";

function loadUserPresets(): Record<string, { label: string; css: string }[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserPresets(presets: Record<string, { label: string; css: string }[]>) {
  try {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  } catch { /* Silently fail */ }
}

/** 自定义 CSS 输入框（带预设选择） */
function CustomCssBlock({
  label,
  value,
  onChange,
  presetKey,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  presetKey: "h1" | "h2" | "paragraph" | "blockquote";
}) {
  const [showPresets, setShowPresets] = useState(false);
  const [userPresets, setUserPresets] = useState<Record<string, { label: string; css: string }[]>>(loadUserPresets);
  const [editingPreset, setEditingPreset] = useState<{ index: number; label: string; css: string } | null>(null);

  const allPresets = useMemo(() => {
    const builtin = BUILTIN_CSS_PRESETS[presetKey] || [];
    const user = userPresets[presetKey] || [];
    return [...builtin, ...user.map((p, i) => ({ ...p, _userIndex: i }))];
  }, [presetKey, userPresets]);

  const applyPreset = useCallback((css: string) => {
    onChange(css || undefined);
    setShowPresets(false);
  }, [onChange]);

  const saveAsPreset = useCallback((label: string, css: string) => {
    if (!label.trim() || !css.trim()) return;
    const updated = { ...userPresets };
    if (!updated[presetKey]) updated[presetKey] = [];
    updated[presetKey] = [...updated[presetKey], { label: label.trim(), css: css.trim() }];
    setUserPresets(updated);
    saveUserPresets(updated);
    setEditingPreset(null);
  }, [userPresets, presetKey]);

  const deleteUserPreset = useCallback((index: number) => {
    const updated = { ...userPresets };
    if (updated[presetKey]) {
      updated[presetKey] = updated[presetKey].filter((_, i) => i !== index);
      if (updated[presetKey].length === 0) delete updated[presetKey];
    }
    setUserPresets(updated);
    saveUserPresets(updated);
  }, [userPresets, presetKey]);

  return (
    <div className="border border-(--neo-line) bg-(--neo-surface)">
      <div className="flex items-center justify-between px-2.5 pt-2">
        <span className="text-[10px] font-bold text-(--neo-muted)">{label}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="text-[9px] font-semibold underline text-(--neo-muted) hover:text-(--neo-ink)"
          >
            {showPresets ? "收起预设" : "预设样式"}
          </button>
          {value && (
            <button
              onClick={() => onChange(undefined)}
              className="text-[9px] font-semibold underline text-(--neo-muted) hover:text-(--neo-ink)"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 预设列表 */}
      {showPresets && (
        <div className="px-2 pt-1.5 space-y-1">
          <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-0.5 border border-(--neo-line) p-1">
            {allPresets.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-1 group">
                <button
                  onClick={() => applyPreset(p.css)}
                  className={`flex-1 text-left px-2 py-1 text-[10px] font-medium truncate hover:bg-(--neo-yellow) ${
                    value === p.css ? "bg-(--neo-yellow)/50" : ""
                  }`}
                  title={p.css}
                >
                  {p.label}
                </button>
                {p._userIndex !== undefined && (
                  <button
                    onClick={() => deleteUserPreset(p._userIndex)}
                    className="text-[9px] text-(--neo-pink) opacity-0 group-hover:opacity-100 hover:underline shrink-0 px-1"
                    title="删除预设"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 添加新预设 */}
          {editingPreset ? (
            <div className="flex items-center gap-1 p-1 border border-(--neo-line)">
              <input
                type="text"
                value={editingPreset.label}
                onChange={(e) => setEditingPreset({ ...editingPreset, label: e.target.value })}
                className="flex-1 px-1.5 py-0.5 text-[9px] border border-(--neo-line) bg-(--neo-surface) focus:outline-none"
                placeholder="预设名称"
                autoComplete="off"
              />
              <button
                onClick={() => saveAsPreset(editingPreset.label, editingPreset.css)}
                className="text-[9px] font-bold px-1.5 py-0.5 bg-(--neo-green) text-[#111]"
                disabled={!editingPreset.label.trim() || !editingPreset.css.trim()}
              >
                保存
              </button>
              <button
                onClick={() => setEditingPreset(null)}
                className="text-[9px] text-(--neo-muted) px-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingPreset({ index: -1, label: "", css: value || "" })}
              className="w-full text-left px-2 py-1 text-[9px] font-semibold text-(--neo-muted) hover:text-(--neo-ink) hover:bg-(--neo-surface)"
            >
              + 将当前 CSS 保存为预设
            </button>
          )}
        </div>
      )}

      <div className="p-2">
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full h-12 px-2 py-1.5 border border-(--neo-line) bg-(--neo-surface) text-[10px] font-mono text-(--neo-ink) resize-none focus:outline-none focus:border-(--neo-yellow)"
          placeholder="输入任意 CSS，如：&#10;box-shadow: 0 4px 12px rgba(0,0,0,0.1);&#10;opacity: 0.9;"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  tone,
  onChange,
  formatValue,
}: RangeControlProps) {
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-(--neo-ink)">
        <span>{label}</span>
        <span
          className={`${badgeClassNames[tone]} border border-(--neo-line) px-1.5 text-[#151515]`}
        >
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer neo-range"
      />
    </div>
  );
}

type SettingsPaneProps = {
  activeTab: ActiveTab;
  allTemplatesCount: number;
  groupedTemplates: TemplateGroup[];
  currentCategory: string;
  setCurrentCategory: React.Dispatch<React.SetStateAction<string>>;
  currentTemplateId: string;
  setCurrentTemplateId: React.Dispatch<React.SetStateAction<string>>;
  formatTweaks: FormatTweaks;
  setFormatTweaks: React.Dispatch<React.SetStateAction<FormatTweaks>>;
  onResetFormatTweaks: () => void;
  syncScroll: boolean;
  setSyncScroll: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenTemplateImporter?: () => void;
  userTemplates?: TemplateConfig[];
  onEditTemplate?: (template: TemplateConfig) => void;
  onDeleteTemplate?: (template: TemplateConfig) => void;
};

export function SettingsPane({
  activeTab,
  allTemplatesCount,
  groupedTemplates,
  currentCategory,
  setCurrentCategory,
  currentTemplateId,
  setCurrentTemplateId,
  formatTweaks,
  setFormatTweaks,
  onResetFormatTweaks,
  syncScroll,
  setSyncScroll,
  onOpenTemplateImporter,
  userTemplates,
  onEditTemplate,
  onDeleteTemplate,
}: SettingsPaneProps) {
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);
  const [isTweaksOpen, setIsTweaksOpen] = useState(false);

  const updateFormatTweaks = <K extends keyof FormatTweaks>(key: K, value: FormatTweaks[K]) => {
    setFormatTweaks((current) => ({ ...current, [key]: value }));
  };

  const currentTemplate = groupedTemplates
    .flatMap((group) => group.templates)
    .find((t) => t.id === currentTemplateId);

  return (
    <div
      className={`w-full md:w-64 lg:w-[320px] flex-col gap-4 shrink-0 h-full overflow-hidden pb-24 md:pb-0 ${activeTab === "settings" ? "flex" : "hidden md:flex"}`}
    >
      <div
        className={`neo-panel overflow-hidden flex flex-col shrink-0 ${isTemplatesOpen ? "flex-1 min-h-0" : ""}`}
      >
        <button
          type="button"
          onClick={() => setIsTemplatesOpen((current) => !current)}
          className="p-4 bg-(--neo-template-header) border-b border-(--neo-line) shrink-0 flex items-center justify-between text-left"
        >
          <h2 className="text-[15px] font-semibold text-(--neo-on-header) flex items-center gap-2 uppercase">
            <Sparkles className="w-4 h-4" />
            主题模板 ({allTemplatesCount}款)
          </h2>
          <div className="flex items-center gap-2">
            {onOpenTemplateImporter && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTemplateImporter();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onOpenTemplateImporter();
                  }
                }}
                className="neo-button neo-button-ghost px-2 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer select-none"
                title="从公众号文章导入样式"
              >
                <Download className="w-3.5 h-3.5" />
                导入
              </span>
            )}
            <ChevronDown
            className={`w-4 h-4 text-(--neo-on-header) transition-transform ${
              isTemplatesOpen ? "rotate-180" : ""
            }`}
            strokeWidth={3}
          />
          </div>
        </button>

        {isTemplatesOpen && (
          <>
            {/* 分类下拉 */}
            <div className="px-3 pt-3 pb-1 bg-(--neo-surface)">
              <select
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
                className="neo-input w-full px-3 py-2 text-xs font-semibold appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  backgroundSize: "14px 14px",
                  paddingRight: "32px",
                }}
              >
                {groupedTemplates.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}（{cat.templates.length}款）
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 overflow-y-auto flex-1 content-start bg-(--neo-surface) custom-scrollbar space-y-3">
              <div className="grid grid-cols-3 2xl:grid-cols-4 gap-3">
                {groupedTemplates
                  .find((group) => group.id === currentCategory)
                  ?.templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={currentTemplateId === template.id}
                      onSelect={() => {
                        setCurrentTemplateId(template.id);
                        updateFormatTweaks("themeColor", template.themeColor);
                      }}
                      onEdit={onEditTemplate}
                      onDelete={onDeleteTemplate}
                    />
                  ))}
              </div>

              {/* 调色板工具 */}
              <div className="border border-(--neo-line) bg-(--neo-surface) p-2.5 ">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-(--neo-ink)">
                    <Palette className="w-3.5 h-3.5" />
                    自定义主题色
                  </div>
                  {formatTweaks.themeColor !== currentTemplate?.themeColor && (
                    <button
                      onClick={() => updateFormatTweaks("themeColor", currentTemplate?.themeColor)}
                      className="text-[10px] font-semibold underline hover:text-(--neo-cyan)"
                    >
                      重置默认
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative w-10 h-10 shrink-0 border border-(--neo-line)  overflow-hidden cursor-pointer ">
                    <input
                      type="color"
                      id="theme-color-input"
                      value={formatTweaks.themeColor || currentTemplate?.themeColor || "#ff6f9f"}
                      onChange={(e) => updateFormatTweaks("themeColor", e.target.value)}
                      className="absolute -inset-1 w-[150%] h-[150%] cursor-pointer border-none p-0 m-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={formatTweaks.themeColor || ""}
                    placeholder={currentTemplate?.themeColor || "输入 Hex 颜色值"}
                    onChange={(e) => updateFormatTweaks("themeColor", e.target.value)}
                    className="flex-1 h-10 px-3 py-2 border border-(--neo-line) bg-(--neo-surface) text-xs font-bold text-(--neo-ink) focus:outline-none focus:bg-(--neo-yellow) placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* 自定义背景色 */}
              <div className="border border-(--neo-line) bg-(--neo-surface) p-2.5 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-(--neo-ink)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    自定义背景色
                  </div>
                  {formatTweaks.backgroundColor && (
                    <button
                      onClick={() => updateFormatTweaks("backgroundColor", undefined)}
                      className="text-[10px] font-semibold underline hover:text-(--neo-cyan)"
                    >
                      重置默认
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative w-10 h-10 shrink-0 border border-(--neo-line) overflow-hidden cursor-pointer">
                    <input
                      type="color"
                      id="bg-color-input"
                      value={formatTweaks.backgroundColor || currentTemplate?.backgroundColor || "#ffffff"}
                      onChange={(e) => updateFormatTweaks("backgroundColor", e.target.value)}
                      className="absolute -inset-1 w-[150%] h-[150%] cursor-pointer border-none p-0 m-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={formatTweaks.backgroundColor || ""}
                    placeholder={currentTemplate?.backgroundColor || "输入 Hex 颜色值"}
                    onChange={(e) => updateFormatTweaks("backgroundColor", e.target.value)}
                    className="flex-1 h-10 px-3 py-2 border border-(--neo-line) bg-(--neo-surface) text-xs font-bold text-(--neo-ink) focus:outline-none focus:bg-(--neo-yellow) placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div
        className={`neo-panel overflow-hidden flex flex-col shrink-0 ${isTweaksOpen ? "flex-1 min-h-0" : ""}`}
      >
        <button
          type="button"
          onClick={() => setIsTweaksOpen((current) => !current)}
          className="p-4 bg-(--neo-template-header) border-b border-(--neo-line) shrink-0 flex items-center justify-between text-left w-full"
        >
          <h2 className="text-[15px] font-semibold text-(--neo-on-header) flex items-center gap-2 uppercase">
            <SlidersHorizontal className="w-4 h-4" />
            细节微调
          </h2>
          <div className="flex items-center gap-2">
            {isTweaksOpen && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onResetFormatTweaks();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onResetFormatTweaks();
                  }
                }}
                className="neo-button neo-button-ghost px-2 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer select-none"
                title="重置微调"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-(--neo-on-header) transition-transform ${
                isTweaksOpen ? "rotate-180" : ""
              }`}
              strokeWidth={3}
            />
          </div>
        </button>

        {isTweaksOpen && (
          <div className="p-3 overflow-y-auto flex-1 custom-scrollbar bg-(--neo-surface)">
            <div className="space-y-3">
              {/* ── 文字排版 ── */}
              <div className="border border-(--neo-line) bg-(--neo-surface)">
                <div className="flex items-center gap-2 px-2.5 pt-2.5 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--neo-muted)">
                    文字排版
                  </span>
                  <div className="flex-1 h-px bg-(--neo-line)" />
                </div>
                <div className="px-2.5 pb-2.5 space-y-2.5">
                  <RangeControl
                    label="正文字号"
                    value={formatTweaks.fontSize}
                    min={14}
                    max={20}
                    step={1}
                    unit="px"
                    tone="yellow"
                    onChange={(value) => updateFormatTweaks("fontSize", value)}
                  />
                  <RangeControl
                    label="行高间距"
                    value={formatTweaks.lineHeight}
                    min={1.5}
                    max={2.2}
                    step={0.1}
                    tone="cyan"
                    onChange={(value) => updateFormatTweaks("lineHeight", value)}
                  />
                  <RangeControl
                    label="段落间距"
                    value={formatTweaks.paragraphSpacing}
                    min={8}
                    max={28}
                    step={1}
                    unit="px"
                    tone="yellow"
                    onChange={(value) => updateFormatTweaks("paragraphSpacing", value)}
                  />
                  <RangeControl
                    label="字间距"
                    value={formatTweaks.letterSpacing}
                    min={0}
                    max={2}
                    step={0.1}
                    unit="px"
                    tone="yellow"
                    onChange={(value) => updateFormatTweaks("letterSpacing", value)}
                    formatValue={(value) => `${value.toFixed(1)}px`}
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-(--neo-line)">
                    <div>
                      <div className="text-xs font-semibold text-(--neo-ink)">首行缩进</div>
                      <p className="text-[10px] neo-text-muted font-bold">正文段落缩进 2em</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold ${formatTweaks.firstLineIndent ? "text-(--neo-green)" : "text-(--neo-muted)"}`}>
                        {formatTweaks.firstLineIndent ? "已开启" : "已关闭"}
                      </span>
                      <button
                        onClick={() =>
                          updateFormatTweaks("firstLineIndent", !formatTweaks.firstLineIndent)
                        }
                        className={`relative inline-flex h-6 w-10 items-center border border-(--neo-line) transition-colors duration-200 focus:outline-none ${
                          formatTweaks.firstLineIndent
                            ? "bg-(--neo-green)"
                            : "bg-(--neo-surface)"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform bg-(--neo-ink) transition-transform duration-200 ${
                            formatTweaks.firstLineIndent ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 页面布局 ── */}
              <div className="border border-(--neo-line) bg-(--neo-surface)">
                <div className="flex items-center gap-2 px-2.5 pt-2.5 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--neo-muted)">
                    页面布局
                  </span>
                  <div className="flex-1 h-px bg-(--neo-line)" />
                </div>
                <div className="px-2.5 pb-2.5 space-y-2.5">
                  <RangeControl
                    label="上留白"
                    value={formatTweaks.pagePaddingTop}
                    min={0}
                    max={48}
                    step={1}
                    unit="px"
                    tone="cyan"
                    onChange={(value) => updateFormatTweaks("pagePaddingTop", value)}
                  />
                  <RangeControl
                    label="下留白"
                    value={formatTweaks.pagePaddingBottom}
                    min={0}
                    max={48}
                    step={1}
                    unit="px"
                    tone="cyan"
                    onChange={(value) => updateFormatTweaks("pagePaddingBottom", value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <RangeControl
                      label="左留白"
                      value={formatTweaks.pagePaddingLeft}
                      min={0}
                      max={48}
                      step={1}
                      unit="px"
                      tone="yellow"
                      onChange={(value) => updateFormatTweaks("pagePaddingLeft", value)}
                    />
                    <RangeControl
                      label="右留白"
                      value={formatTweaks.pagePaddingRight}
                      min={0}
                      max={48}
                      step={1}
                      unit="px"
                      tone="yellow"
                      onChange={(value) => updateFormatTweaks("pagePaddingRight", value)}
                    />
                  </div>
                </div>
              </div>

              {/* ── 元素级样式 ── */}
              <div className="border border-(--neo-line) bg-(--neo-surface)">
                <div className="flex items-center gap-2 px-2.5 pt-2.5 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--neo-muted)">
                    元素样式
                  </span>
                  <div className="flex-1 h-px bg-(--neo-line)" />
                </div>
                <div className="px-2.5 pb-2.5 space-y-2">
                  <ElementStyleSection
                    label="H1 样式"
                    bgColor={formatTweaks.h1BackgroundColor}
                    onBgColor={(v) => updateFormatTweaks("h1BackgroundColor", v)}
                    borderColor={formatTweaks.h1BorderColor}
                    onBorderColor={(v) => updateFormatTweaks("h1BorderColor", v)}
                    borderStyle={formatTweaks.h1BorderStyle}
                    onBorderStyle={(v) => updateFormatTweaks("h1BorderStyle", v)}
                    borderWidth={formatTweaks.h1BorderWidth}
                    onBorderWidth={(v) => updateFormatTweaks("h1BorderWidth", v)}
                    borderRadius={formatTweaks.h1BorderRadius}
                    onBorderRadius={(v) => updateFormatTweaks("h1BorderRadius", v)}
                    padding={formatTweaks.h1Padding}
                    onPadding={(v) => updateFormatTweaks("h1Padding", v)}
                    margin={formatTweaks.h1Margin}
                    onMargin={(v) => updateFormatTweaks("h1Margin", v)}
                    textShadow={formatTweaks.h1TextShadow}
                    onTextShadow={(v) => updateFormatTweaks("h1TextShadow", v)}
                    boxShadow={formatTweaks.h1BoxShadow}
                    onBoxShadow={(v) => updateFormatTweaks("h1BoxShadow", v)}
                    opacity={formatTweaks.h1Opacity}
                    onOpacity={(v) => updateFormatTweaks("h1Opacity", v)}
                    transform={formatTweaks.h1Transform}
                    onTransform={(v) => updateFormatTweaks("h1Transform", v)}
                    transition={formatTweaks.h1Transition}
                    onTransition={(v) => updateFormatTweaks("h1Transition", v)}
                    animation={formatTweaks.h1Animation}
                    onAnimation={(v) => updateFormatTweaks("h1Animation", v)}
                    filter={formatTweaks.h1Filter}
                    onFilter={(v) => updateFormatTweaks("h1Filter", v)}
                    mixBlendMode={formatTweaks.h1MixBlendMode}
                    onMixBlendMode={(v) => updateFormatTweaks("h1MixBlendMode", v)}
                  />
                  <AdvancedElementControls
                    borderWidth={formatTweaks.h1BorderWidth}
                    onBorderWidth={(v) => updateFormatTweaks("h1BorderWidth", v)}
                    padding={formatTweaks.h1Padding}
                    onPadding={(v) => updateFormatTweaks("h1Padding", v)}
                    margin={formatTweaks.h1Margin}
                    onMargin={(v) => updateFormatTweaks("h1Margin", v)}
                    textShadow={formatTweaks.h1TextShadow}
                    onTextShadow={(v) => updateFormatTweaks("h1TextShadow", v)}
                    boxShadow={formatTweaks.h1BoxShadow}
                    onBoxShadow={(v) => updateFormatTweaks("h1BoxShadow", v)}
                    opacity={formatTweaks.h1Opacity}
                    onOpacity={(v) => updateFormatTweaks("h1Opacity", v)}
                    transform={formatTweaks.h1Transform}
                    onTransform={(v) => updateFormatTweaks("h1Transform", v)}
                    transition={formatTweaks.h1Transition}
                    onTransition={(v) => updateFormatTweaks("h1Transition", v)}
                    animation={formatTweaks.h1Animation}
                    onAnimation={(v) => updateFormatTweaks("h1Animation", v)}
                    filter={formatTweaks.h1Filter}
                    onFilter={(v) => updateFormatTweaks("h1Filter", v)}
                    mixBlendMode={formatTweaks.h1MixBlendMode}
                    onMixBlendMode={(v) => updateFormatTweaks("h1MixBlendMode", v)}
                  />
                  <ElementStyleSection
                    label="H2 样式"
                    bgColor={formatTweaks.h2BackgroundColor}
                    onBgColor={(v) => updateFormatTweaks("h2BackgroundColor", v)}
                    borderColor={formatTweaks.h2BorderColor}
                    onBorderColor={(v) => updateFormatTweaks("h2BorderColor", v)}
                    borderStyle={formatTweaks.h2BorderStyle}
                    onBorderStyle={(v) => updateFormatTweaks("h2BorderStyle", v)}
                    borderWidth={formatTweaks.h2BorderWidth}
                    onBorderWidth={(v) => updateFormatTweaks("h2BorderWidth", v)}
                    borderRadius={formatTweaks.h2BorderRadius}
                    onBorderRadius={(v) => updateFormatTweaks("h2BorderRadius", v)}
                    padding={formatTweaks.h2Padding}
                    onPadding={(v) => updateFormatTweaks("h2Padding", v)}
                    margin={formatTweaks.h2Margin}
                    onMargin={(v) => updateFormatTweaks("h2Margin", v)}
                    textShadow={formatTweaks.h2TextShadow}
                    onTextShadow={(v) => updateFormatTweaks("h2TextShadow", v)}
                    boxShadow={formatTweaks.h2BoxShadow}
                    onBoxShadow={(v) => updateFormatTweaks("h2BoxShadow", v)}
                    opacity={formatTweaks.h2Opacity}
                    onOpacity={(v) => updateFormatTweaks("h2Opacity", v)}
                    transform={formatTweaks.h2Transform}
                    onTransform={(v) => updateFormatTweaks("h2Transform", v)}
                    transition={formatTweaks.h2Transition}
                    onTransition={(v) => updateFormatTweaks("h2Transition", v)}
                    animation={formatTweaks.h2Animation}
                    onAnimation={(v) => updateFormatTweaks("h2Animation", v)}
                    filter={formatTweaks.h2Filter}
                    onFilter={(v) => updateFormatTweaks("h2Filter", v)}
                    mixBlendMode={formatTweaks.h2MixBlendMode}
                    onMixBlendMode={(v) => updateFormatTweaks("h2MixBlendMode", v)}
                  />
                  <AdvancedElementControls
                    borderWidth={formatTweaks.h2BorderWidth}
                    onBorderWidth={(v) => updateFormatTweaks("h2BorderWidth", v)}
                    padding={formatTweaks.h2Padding}
                    onPadding={(v) => updateFormatTweaks("h2Padding", v)}
                    margin={formatTweaks.h2Margin}
                    onMargin={(v) => updateFormatTweaks("h2Margin", v)}
                    textShadow={formatTweaks.h2TextShadow}
                    onTextShadow={(v) => updateFormatTweaks("h2TextShadow", v)}
                    boxShadow={formatTweaks.h2BoxShadow}
                    onBoxShadow={(v) => updateFormatTweaks("h2BoxShadow", v)}
                    opacity={formatTweaks.h2Opacity}
                    onOpacity={(v) => updateFormatTweaks("h2Opacity", v)}
                    transform={formatTweaks.h2Transform}
                    onTransform={(v) => updateFormatTweaks("h2Transform", v)}
                    transition={formatTweaks.h2Transition}
                    onTransition={(v) => updateFormatTweaks("h2Transition", v)}
                    animation={formatTweaks.h2Animation}
                    onAnimation={(v) => updateFormatTweaks("h2Animation", v)}
                    filter={formatTweaks.h2Filter}
                    onFilter={(v) => updateFormatTweaks("h2Filter", v)}
                    mixBlendMode={formatTweaks.h2MixBlendMode}
                    onMixBlendMode={(v) => updateFormatTweaks("h2MixBlendMode", v)}
                  />
                  <ElementStyleSection
                    label="正文样式"
                    bgColor={formatTweaks.paragraphBackgroundColor}
                    onBgColor={(v) => updateFormatTweaks("paragraphBackgroundColor", v)}
                    borderColor={formatTweaks.paragraphBorderColor}
                    onBorderColor={(v) => updateFormatTweaks("paragraphBorderColor", v)}
                    borderStyle={formatTweaks.paragraphBorderStyle}
                    onBorderStyle={(v) => updateFormatTweaks("paragraphBorderStyle", v)}
                    borderWidth={formatTweaks.paragraphBorderWidth}
                    onBorderWidth={(v) => updateFormatTweaks("paragraphBorderWidth", v)}
                    borderRadius={formatTweaks.paragraphBorderRadius}
                    onBorderRadius={(v) => updateFormatTweaks("paragraphBorderRadius", v)}
                    padding={formatTweaks.paragraphPadding}
                    onPadding={(v) => updateFormatTweaks("paragraphPadding", v)}
                    margin={formatTweaks.paragraphMargin}
                    onMargin={(v) => updateFormatTweaks("paragraphMargin", v)}
                    textShadow={formatTweaks.paragraphTextShadow}
                    onTextShadow={(v) => updateFormatTweaks("paragraphTextShadow", v)}
                    boxShadow={formatTweaks.paragraphBoxShadow}
                    onBoxShadow={(v) => updateFormatTweaks("paragraphBoxShadow", v)}
                    opacity={formatTweaks.paragraphOpacity}
                    onOpacity={(v) => updateFormatTweaks("paragraphOpacity", v)}
                    transform={formatTweaks.paragraphTransform}
                    onTransform={(v) => updateFormatTweaks("paragraphTransform", v)}
                    transition={formatTweaks.paragraphTransition}
                    onTransition={(v) => updateFormatTweaks("paragraphTransition", v)}
                    animation={formatTweaks.paragraphAnimation}
                    onAnimation={(v) => updateFormatTweaks("paragraphAnimation", v)}
                    filter={formatTweaks.paragraphFilter}
                    onFilter={(v) => updateFormatTweaks("paragraphFilter", v)}
                    mixBlendMode={formatTweaks.paragraphMixBlendMode}
                    onMixBlendMode={(v) => updateFormatTweaks("paragraphMixBlendMode", v)}
                  />
                  <ElementStyleSection
                    label="引用样式"
                    bgColor={formatTweaks.blockquoteBackgroundColor}
                    onBgColor={(v) => updateFormatTweaks("blockquoteBackgroundColor", v)}
                    borderColor={formatTweaks.blockquoteBorderColor}
                    onBorderColor={(v) => updateFormatTweaks("blockquoteBorderColor", v)}
                    borderStyle={formatTweaks.blockquoteBorderStyle}
                    onBorderStyle={(v) => updateFormatTweaks("blockquoteBorderStyle", v)}
                    borderWidth={formatTweaks.blockquoteBorderWidth}
                    onBorderWidth={(v) => updateFormatTweaks("blockquoteBorderWidth", v)}
                    borderRadius={formatTweaks.blockquoteBorderRadius}
                    onBorderRadius={(v) => updateFormatTweaks("blockquoteBorderRadius", v)}
                    padding={formatTweaks.blockquotePadding}
                    onPadding={(v) => updateFormatTweaks("blockquotePadding", v)}
                    margin={formatTweaks.blockquoteMargin}
                    onMargin={(v) => updateFormatTweaks("blockquoteMargin", v)}
                    textShadow={formatTweaks.blockquoteTextShadow}
                    onTextShadow={(v) => updateFormatTweaks("blockquoteTextShadow", v)}
                    boxShadow={formatTweaks.blockquoteBoxShadow}
                    onBoxShadow={(v) => updateFormatTweaks("blockquoteBoxShadow", v)}
                    opacity={formatTweaks.blockquoteOpacity}
                    onOpacity={(v) => updateFormatTweaks("blockquoteOpacity", v)}
                    transform={formatTweaks.blockquoteTransform}
                    onTransform={(v) => updateFormatTweaks("blockquoteTransform", v)}
                    transition={formatTweaks.blockquoteTransition}
                    onTransition={(v) => updateFormatTweaks("blockquoteTransition", v)}
                    animation={formatTweaks.blockquoteAnimation}
                    onAnimation={(v) => updateFormatTweaks("blockquoteAnimation", v)}
                    filter={formatTweaks.blockquoteFilter}
                    onFilter={(v) => updateFormatTweaks("blockquoteFilter", v)}
                    mixBlendMode={formatTweaks.blockquoteMixBlendMode}
                    onMixBlendMode={(v) => updateFormatTweaks("blockquoteMixBlendMode", v)}
                  />
                </div>
              </div>

              {/* ── 自定义 CSS ── */}
              <div className="border border-(--neo-line) bg-(--neo-surface)">
                <div className="flex items-center gap-2 px-2.5 pt-2.5 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--neo-muted)">
                    自定义 CSS
                  </span>
                  <div className="flex-1 h-px bg-(--neo-line)" />
                </div>
                <div className="px-2.5 pb-2.5 space-y-2">
                  <CustomCssBlock
                    label="H1"
                    presetKey="h1"
                    value={formatTweaks.h1CustomCss}
                    onChange={(v) => updateFormatTweaks("h1CustomCss", v)}
                  />
                  <CustomCssBlock
                    label="H2"
                    presetKey="h2"
                    value={formatTweaks.h2CustomCss}
                    onChange={(v) => updateFormatTweaks("h2CustomCss", v)}
                  />
                  <CustomCssBlock
                    label="正文"
                    presetKey="paragraph"
                    value={formatTweaks.paragraphCustomCss}
                    onChange={(v) => updateFormatTweaks("paragraphCustomCss", v)}
                  />
                  <CustomCssBlock
                    label="引用"
                    presetKey="blockquote"
                    value={formatTweaks.blockquoteCustomCss}
                    onChange={(v) => updateFormatTweaks("blockquoteCustomCss", v)}
                  />
                </div>
              </div>

              {/* ── 图片 ── */}
              <div className="border border-(--neo-line) bg-(--neo-surface)">
                <div className="flex items-center gap-2 px-2.5 pt-2.5 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--neo-muted)">
                    图片
                  </span>
                  <div className="flex-1 h-px bg-(--neo-line)" />
                </div>
                <div className="px-2.5 pb-2.5">
                  <RangeControl
                    label="图片圆角"
                    value={formatTweaks.imageRadius}
                    min={0}
                    max={20}
                    step={1}
                    unit="px"
                    tone="cyan"
                    onChange={(value) => updateFormatTweaks("imageRadius", value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block neo-panel overflow-hidden shrink-0">
        <div className="px-4 py-3 bg-(--neo-template-header) border-b border-(--neo-line)">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-(--neo-on-header)" />
              <span className="text-[14px] font-semibold text-(--neo-on-header)">滚动同步</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold ${syncScroll ? "text-(--neo-green)" : "text-(--neo-muted)"}`}>
                {syncScroll ? "已开启" : "已关闭"}
              </span>
              <button
                onClick={() => setSyncScroll(!syncScroll)}
                className={`relative inline-flex h-6 w-10 items-center border border-(--neo-line) transition-all duration-200 focus:outline-none ${
                  syncScroll ? "bg-(--neo-green)" : "bg-(--neo-surface)"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform bg-(--neo-ink) transition-all duration-200 ${
                    syncScroll ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        <div className="px-4 py-2.5 bg-(--neo-surface)">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${syncScroll ? "bg-(--neo-green)" : "bg-(--neo-muted)"}`} />
            <p className="text-xs neo-text-muted font-bold">
              开启后，编辑区与预览区将同步滚动
              {syncScroll && (
                <span className="text-(--neo-green) ml-1">✓ 已同步</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
