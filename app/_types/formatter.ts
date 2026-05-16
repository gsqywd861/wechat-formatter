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

  // ── 元素级边框宽度 ──
  h1BorderWidth?: number;
  h2BorderWidth?: number;
  paragraphBorderWidth?: number;
  blockquoteBorderWidth?: number;

  // ── 元素级边框圆角 ──
  h1BorderRadius?: number;
  h2BorderRadius?: number;
  paragraphBorderRadius?: number;
  blockquoteBorderRadius?: number;

  // ── 元素级内边距 ──
  h1Padding?: number;
  h2Padding?: number;
  paragraphPadding?: number;
  blockquotePadding?: number;

  // ── 元素级外边距 ──
  h1Margin?: number;
  h2Margin?: number;
  paragraphMargin?: number;
  blockquoteMargin?: number;

  // ── 元素级文字阴影 ──
  h1TextShadow?: string;
  h2TextShadow?: string;
  paragraphTextShadow?: string;
  blockquoteTextShadow?: string;

  // ── 元素级盒子阴影 ──
  h1BoxShadow?: string;
  h2BoxShadow?: string;
  paragraphBoxShadow?: string;
  blockquoteBoxShadow?: string;

  // ── 元素级透明度 ──
  h1Opacity?: number;
  h2Opacity?: number;
  paragraphOpacity?: number;
  blockquoteOpacity?: number;

  // ── 元素级变换 ──
  h1Transform?: string;
  h2Transform?: string;
  paragraphTransform?: string;
  blockquoteTransform?: string;

  // ── 元素级过渡 ──
  h1Transition?: string;
  h2Transition?: string;
  paragraphTransition?: string;
  blockquoteTransition?: string;

  // ── 元素级动画 ──
  h1Animation?: string;
  h2Animation?: string;
  paragraphAnimation?: string;
  blockquoteAnimation?: string;

  // ── 元素级滤镜 ──
  h1Filter?: string;
  h2Filter?: string;
  paragraphFilter?: string;
  blockquoteFilter?: string;

  // ── 元素级混合模式 ──
  h1MixBlendMode?: string;
  h2MixBlendMode?: string;
  paragraphMixBlendMode?: string;
  blockquoteMixBlendMode?: string;

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
