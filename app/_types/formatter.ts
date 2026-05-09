export type ActiveTab = "input" | "preview" | "settings";
export type PreviewMode = "template" | "original";

export type AiProviderType = "openrouter" | "openai" | "anthropic";

export type FormatTweaks = {
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  firstLineIndent: boolean;
  pagePaddingTop: number;
  pagePaddingRight: number;
  pagePaddingBottom: number;
  pagePaddingLeft: number;
  letterSpacing: number;
  imageRadius: number;
  themeColor?: string;
  /** 自定义整体背景色 */
  backgroundColor?: string;
  /** 快速调色：单独覆盖各级文本颜色（渲染时替换模板内对应颜色） */
  h1TextColor?: string;
  h2TextColor?: string;
  paragraphTextColor?: string;

  // ── 元素级背景色 ──
  h1BackgroundColor?: string;
  h2BackgroundColor?: string;
  paragraphBackgroundColor?: string;
  blockquoteBackgroundColor?: string;

  // ── 元素级边框色 ──
  h1BorderColor?: string;
  h2BorderColor?: string;
  paragraphBorderColor?: string;
  blockquoteBorderColor?: string;

  // ── 元素级边框样式 ──
  h1BorderStyle?: string;
  h2BorderStyle?: string;
  paragraphBorderStyle?: string;
  blockquoteBorderStyle?: string;

  // ── 元素级边框圆角 ──
  h1BorderRadius?: number;
  h2BorderRadius?: number;
  paragraphBorderRadius?: number;
  blockquoteBorderRadius?: number;

  // ── 自定义 CSS（自由输入任何 CSS 属性，会追加到元素 style 尾部）──
  h1CustomCss?: string;
  h2CustomCss?: string;
  paragraphCustomCss?: string;
  blockquoteCustomCss?: string;
};

export type OpenRouterModel = {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  promptPrice: string;
  completionPrice: string;
  isFree: boolean;
};

export type ToastType = "success" | "error";

export type ToastState = {
  message: string;
  type: ToastType;
} | null;

export type WordCount = {
  chars: number;
  words: number;
  lines: number;
  readTime: number;
};
