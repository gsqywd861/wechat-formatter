/**
 * 公众号文章样式提取引擎
 *
 * 接收已排版的微信公众号文章 HTML，分析其内联样式，
 * 自动推断出对应的 TemplateConfig 对象。
 *
 * 核心流程：
 * 1. 用 cheerio 解析 HTML
 * 2. 遍历所有元素，按视觉角色分类（标题/正文/引用/代码等）
 * 3. 提取各类型元素的代表性 inline style
 * 4. 颜色聚类 → 主题色
 * 5. 推断模板分类
 * 6. 组装 TemplateConfig
 */

import * as cheerio from "cheerio";
import type { Cheerio } from "cheerio";
import type { TemplateConfig } from "../template-engine";
import crypto from "node:crypto";

// ============== 类型定义 ==============

/** 解析过程中收集的元素样式快照 */
interface ElementSnapshot {
  tag: string;
  role: ElementRole;
  style: Record<string, string>;
  textContent: string;
  fontSize: number;
  fontWeight: number;
  parentTags: string[];
}

type ElementRole =
  | "h1"
  | "h2"
  | "h3"
  | "paragraph"
  | "blockquote"
  | "list"
  | "list-item"
  | "code-block"
  | "code-inline"
  | "image"
  | "link"
  | "hr"
  | "table"
  | "strong"
  | "em"
  | "container"
  | "unknown";

/** 按角色聚合的样式统计 */
interface RoleStyleStats {
  count: number;
  styles: Record<string, string[]>; // property → values[]
}

// ============== CSS 解析工具 ==============

function parseInlineStyle(styleStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!styleStr) return result;

  styleStr.split(";").forEach((decl) => {
    const trimmed = decl.trim();
    if (!trimmed) return;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) return;
    const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim();
    if (prop && val) {
      result[prop] = val;
    }
  });
  return result;
}

function getNumericValue(value: string, unit: "px" | "em" = "px"): number {
  const match = value.match(new RegExp(`^([\\d.]+)${unit}`));
  return match ? Number.parseFloat(match[1]) : 0;
}

function normalizeColor(value: string): string {
  if (!value) return "";

  // 处理 #rrggbbaa（8位 hex，含 alpha）
  const hex8Match = value.match(/#([0-9a-fA-F]{8})\b/);
  if (hex8Match) {
    return `#${hex8Match[1].slice(0, 6).toLowerCase()}`;
  }

  // 处理 #rrggbb 和 #rgb
  const hexMatch = value.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    return `#${hex.toLowerCase()}`;
  }

  // 处理 rgb/rgba（支持各种空格形式）
  const rgbMatch = value.match(/rgba?\s*\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)/);
  if (rgbMatch) {
    const r = Number.parseInt(rgbMatch[1]);
    const g = Number.parseInt(rgbMatch[2]);
    const b = Number.parseInt(rgbMatch[3]);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  return value;
}

function isSignificantColor(color: string): boolean {
  const normalized = normalizeColor(color);
  // 跳过黑色、白色、灰色
  if (
    normalized === "#ffffff" ||
    normalized === "#000000" ||
    normalized === "#fff" ||
    normalized === "#000"
  ) {
    return false;
  }
  // 跳过近似灰色
  const hex = normalized.replace("#", "");
  if (hex.length !== 6) return true;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // 饱和度太低 → 灰色
  if (max - min < 20 && max > 180) return false;
  // 中性深灰色（#333-#777）→ 常见正文颜色，不是主题色
  if (max - min < 25 && max >= 40 && max <= 130) return false;
  return true;
}

function isBlackWhiteGray(value: string): boolean {
  const normalized = normalizeColor(value);
  const hex = normalized.replace("#", "");
  if (hex.length !== 6) return false;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 15;
}

// ============== 元素分类 ==============

function getTextContent(el: Cheerio<any>): string {
  return el.text().trim();
}

function determineRole(
  tag: string,
  style: Record<string, string>,
  textContent: string,
  parentTags: string[],
  $el?: any,
): ElementRole {
  const fontSize = style["font-size"]
    ? getNumericValue(style["font-size"])
    : 16;
  const fontWeight = style["font-weight"]
    ? style["font-weight"] === "bold" || style["font-weight"] === "700" ||
        style["font-weight"] === "800" || style["font-weight"] === "900"
      ? 700
      : Number.parseInt(style["font-weight"]) || 400
    : 400;

  // 按标签名初步分类
  switch (tag) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return tag as ElementRole;
    case "p":
      return "paragraph";
    case "blockquote":
      return "blockquote";
    case "ul":
    case "ol":
      return "list";
    case "li":
      return "list-item";
    case "pre":
      return "code-block";
    case "code":
      return parentTags.includes("pre") ? "code-block" : "code-inline";
    case "img":
      return "image";
    case "a":
      return "link";
    case "hr":
      return "hr";
    case "table":
      return "table";
    case "strong":
    case "b":
      return "strong";
    case "em":
    case "i":
      return "em";
    case "section":
    case "div":
      // 有多个子 section/div 包含文本 → 布局容器
      if ($el) {
        const textChildren = $el.children("section, div").filter((_: number, child: any) => {
          return child.children && child.children.length > 0;
        }).length;
        if (textChildren > 1) return "container";
      }

      // 微信公众号文章使用嵌套 <section>，需要综合多个信号判断
      const hasBgColor = !!style["background-color"] && !isBlackWhiteGray(style["background-color"]);
      const hasBorder = !!style.border || !!style["border-left"] || !!style["border-bottom"];
      const hasPadding = !!style.padding;
      const textLen = textContent.length;

      // 纯容器：无文本或只有空白
      if (!textContent) {
        // 有边框/背景色的容器 → 贡献 container 样式
        if (hasBgColor || hasBorder) return "container";
        return "container";
      }

      // 短文本 + 大字号 = 标题
      if (fontSize >= 21 && textLen < 40) return "h1";
      if (fontSize >= 18 && textLen < 50) return "h2";
      if (fontSize >= 16 && textLen < 60) return "h3";

      // 短文本 + 加粗 + 无边框 → 可能是标题
      if (fontWeight >= 700 && textLen < 30) {
        if (fontSize >= 16) return "h2";
        return "h3";
      }

      // 短文本 + 有背景色/边框 → 可能是标题（需要字号足够大或加粗）
      if (textLen < 20 && (hasBgColor || hasBorder)) {
        if (fontSize >= 18) return "h2";
        if (fontWeight >= 700) return "h2";
        // 有特殊背景色/边框但字号不大 → 可能是带装饰的正文，不是标题
        return "paragraph";
      }

      // 纯文本块
      return "paragraph";
    case "span":
      if (fontWeight >= 700) return "strong";
      // span 在标题父元素内 → 继承标题角色
      if (parentTags.some(t => ["h1","h2","h3","h4","h5","h6"].includes(t))) {
        if (parentTags.includes("h1")) return "h1";
        if (parentTags.includes("h2")) return "h2";
        if (parentTags.includes("h3")) return "h3";
      }
      // 检查父 section 是否有标题特征（大字号/加粗/短文本）
      if (!textContent) return "unknown";
      // span 只有少量文本且父级是带样式 section → 可能是标题文本
      if (textContent.length < 30 && parentTags.includes("section")) {
        if (fontSize >= 18) return "h2";
        if (fontWeight >= 700) return "h2";
      }
      return "paragraph";
    default:
      if (!textContent) return "container";
      if (fontSize >= 20) return "h2";
      return "paragraph";
  }
}

function collectClassName(el: Cheerio<any>): string {
  return el.attr("class") || "";
}

const WECHAT_SELECTOR = "section, p, h1, h2, h3, h4, h5, h6, blockquote, ul, ol, li, pre, code, img, a, hr, table, strong, em, span, div, figure, td, th";

// ============== 颜色聚类 ==============

interface ColorCluster {
  color: string;
  count: number;
  contexts: string[]; // 使用场景描述
  type?: string;
}

function clusterColors(
  snapshots: ElementSnapshot[],
): { themeColor: string; backgroundColor: string; allColors: ColorCluster[] } {
  const colorMap = new Map<string, ColorCluster>();

  snapshots.forEach((s) => {
    const style = s.style;

    // color（文字颜色）
    if (style.color) {
      const normalized = normalizeColor(style.color);
      if (isSignificantColor(normalized)) {
        const existing = colorMap.get(normalized);
        if (existing) {
          existing.count++;
        } else {
          colorMap.set(normalized, {
            color: normalized,
            type: "text",
            count: 1,
            contexts: [s.role],
          });
        }
      }
    }

    // background-color
    if (style["background-color"]) {
      const normalized = normalizeColor(style["background-color"]);
      if (normalized && normalized !== "#ffffff" && normalized !== "#fff") {
        const key = `bg:${normalized}`;
        const existing = colorMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorMap.set(key, {
            color: normalized,
            type: "bg",
            count: 1,
            contexts: [`背景(${s.role})`],
          });
        }
      }
    }

    // background 简写（可能包含 background-color 但无单独 background-color 属性）
    if (style.background && !style["background-color"]) {
      const bgColorMatch = style.background.match(/#([0-9a-fA-F]{3,8})\b/);
      if (bgColorMatch) {
        const normalized = normalizeColor(bgColorMatch[0]);
        if (normalized && normalized !== "#ffffff" && normalized !== "#fff" && normalized !== "#000000" && normalized !== "#000") {
          const key = `bg:${normalized}`;
          const existing = colorMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorMap.set(key, {
            color: normalized,
            type: "bg",
            count: 1,
            contexts: [`背景简写(${s.role})`],
            });
          }
        }
      }
      // 也检测 background 中的 linear-gradient / radial-gradient
      if (style.background.includes("gradient(")) {
        const gradientKey = "gradient-detected";
        const existing = colorMap.get(gradientKey);
        if (existing) {
          existing.count++;
        } else {
          colorMap.set(gradientKey, {
            color: "gradient",
            count: 1,
            contexts: [`渐变背景(${s.role})`],
          });
        }
      }
    }

    // border-*-color
    ["border-color", "border-left-color", "border-bottom-color", "border-top-color", "border-right-color"].forEach(
      (prop) => {
        if (style[prop]) {
          const normalized = normalizeColor(style[prop]);
          if (isSignificantColor(normalized)) {
            const key = `border:${normalized}`;
            const existing = colorMap.get(key);
            if (existing) {
              existing.count++;
            } else {
              colorMap.set(key, {
              color: normalized,
              type: "border",
              count: 1,
              contexts: [`边框(${s.role})`],
              });
            }
          }
        }
      },
    );

    // border 简写中的颜色（如 "2px solid #ff0000"）
    if (style.border) {
      const borderColorMatch = style.border.match(/#([0-9a-fA-F]{3,8})\b/);
      if (borderColorMatch) {
        const normalized = normalizeColor(borderColorMatch[0]);
        if (isSignificantColor(normalized)) {
          const key = `border:${normalized}`;
          const existing = colorMap.get(key);
          if (!existing) {
            colorMap.set(key, {
              color: normalized,
              count: 1,
              contexts: [`边框简写(${s.role})`],
            });
          }
        }
      }
    }
  });

  // 按出现频率降序排列
  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([, v]) => v);

  // 主题色：取出现最频繁的有彩色 text 类型
  const textColors = sorted.filter(
    (c) => c.type === "text",
  );
  const themeColor =
    textColors.length > 0
      ? textColors[0].color
      : "#3b82f6";

  // 背景色：取出现最频繁的 bg 类型
  const bgColors = sorted.filter((c) => c.type === "bg");
  const backgroundColor = bgColors.length > 0
    ? bgColors[0].color
    : "#ffffff";

  return { themeColor, backgroundColor, allColors: sorted };
}

// ============== 分类推断 ==============

interface CategoryHint {
  likelyCategory: string;
  confidence: number;
}

function inferCategory(
  snapshots: ElementSnapshot[],
  themeColor: string,
  backgroundColor: string,
): CategoryHint {
  const allStyles = snapshots.map((s) => s.style);

  // 检测特征
  let hasShadow = 0;
  let hasThickBorder = 0;
  let hasRoundCorner = 0;
  let hasDarkBg = 0;
  let hasSerifFont = 0;
  let warmColorCount = 0;
  let coolColorCount = 0;

  allStyles.forEach((style) => {
    if (style["box-shadow"]) hasShadow++;
    if (
      style.border &&
      (style.border.includes("3px") || style.border.includes("4px") || style.border.includes("solid"))
    ) {
      hasThickBorder++;
    }
    if (
      style["border-radius"] &&
      getNumericValue(style["border-radius"]) >= 6
    ) {
      hasRoundCorner++;
    }
    if (
      style["background-color"] &&
      isDarkBackground(style["background-color"])
    ) {
      hasDarkBg++;
    }
    if (
      style["font-family"] &&
      (style["font-family"].includes("serif") ||
        style["font-family"].includes("宋体") ||
        style["font-family"].includes("Songti"))
    ) {
      hasSerifFont++;
    }
  });

  // 分析主题色冷暖
  const hex = themeColor.replace("#", "");
  if (hex.length === 6) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    if (r > b + 30) warmColorCount++;
    if (b > r + 30) coolColorCount++;
  }

  const total = snapshots.length || 1;

  // 推断
  if (isDarkBackground(backgroundColor) || hasDarkBg > total * 0.2) {
    return { likelyCategory: "tech", confidence: 0.85 };
  }
  if (warmColorCount > coolColorCount && (hasShadow > total * 0.05 || hasThickBorder > total * 0.05)) {
    return { likelyCategory: "neo-brutalism", confidence: 0.7 };
  }
  if (hasSerifFont > total * 0.05) {
    return { likelyCategory: "literary", confidence: 0.7 };
  }
  if (hasRoundCorner > total * 0.1 && !hasThickBorder) {
    return { likelyCategory: "business", confidence: 0.6 };
  }
  if (warmColorCount > coolColorCount) {
    return { likelyCategory: "festive", confidence: 0.55 };
  }
  if (!hasThickBorder && !hasShadow) {
    return { likelyCategory: "minimalist", confidence: 0.5 };
  }

  return { likelyCategory: "minimalist", confidence: 0.3 };
}

function isDarkBackground(colorValue: string): boolean {
  const normalized = normalizeColor(colorValue);
  const hex = normalized.replace("#", "");
  if (hex.length !== 6) return false;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return (r + g + b) / 3 < 128;
}

// ============== 样式聚合 ==============

function getMostCommonValue(
  values: string[],
  property: string,
): string {
  if (values.length === 0) return "";

  // 统计频率
  const freq = new Map<string, number>();
  values.forEach((v) => {
    freq.set(v, (freq.get(v) || 0) + 1);
  });

  // 按频率降序
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

function buildStyleString(props: Record<string, string>): string {
  return Object.entries(props)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");
}

// ============== 主要导出函数 ==============

export interface ExtractionResult {
  name: string;
  description: string;
  category: string;
  themeColor: string;
  backgroundColor: string;
  baseStyle: { color: string; fontFamily: string };
  containerStyle: string;
  h1Style: string;
  h2Style: string;
  h3Style: string;
  pStyle: string;
  blockquoteStyle: string;
  blockquoteInnerBefore: string;
  blockquoteInnerAfter: string;
  listStyle: string;
  listItemStyle: string;
  listIcon: string;
  strongStyle: string;
  emStyle: string;
  codeContainerStyle: string;
  codeHeaderStyle: string;
  codeBlockStyle: string;
  imgStyle: string;
  hrStyle: string;
  linkStyle: string;
  tableStyle: string;
  thStyle: string;
  tdStyle: string;
  delStyle: string;
}

/**
 * 从微信公众号文章 HTML 中提取样式模板
 */
export function extractTemplateFromHtml(html: string): ExtractionResult {
  // 移除 <script> 标签，防止干扰解析
  const cleanHtml = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<script[^>]*\/>/gi, "");
  const $ = cheerio.load(cleanHtml);
  const snapshots: ElementSnapshot[] = [];
  // 收集包裹图片的容器元素（微信文章常把边框/圆角加在图片父容器上）
  const imageContainers: Record<string, string>[] = [];
  // 收集包裹正文的容器，用于合并背景色/边框到 pStyle
  const paragraphContainers: { style: Record<string, string>; role: string }[] = [];
  // 收集装饰性样式（背景图、渐变、装饰性边框等）
  const decorationStyles: Record<string, string>[] = [];
  // 收集动效样式（transition, animation, transform, filter, opacity）
  const animationStyles: Record<string, string>[] = [];

  // 遍历所有相关元素
  $(WECHAT_SELECTOR).each((_i, el) => {
    const $el = $(el);
    const tag = el.tagName.toLowerCase();
    const styleStr = $el.attr("style") || "";
    const style = parseInlineStyle(styleStr);
    const textContent = getTextContent($el);
    const parentTags: string[] = [];

    // 收集父标签
    $el.parents().each((_p, parent) => {
      parentTags.push(parent.tagName.toLowerCase());
    });

    const role = determineRole(tag, style, textContent, parentTags, $el);
    const fontSize = style["font-size"]
      ? getNumericValue(style["font-size"])
      : 16;
    const fontWeight = style["font-weight"]
      ? style["font-weight"] === "bold" ||
        style["font-weight"] === "700" ||
        style["font-weight"] === "800" ||
        style["font-weight"] === "900"
        ? 700
        : Number.parseInt(style["font-weight"]) || 400
      : 400;

    // 检测包裹图片的容器（section/div 内直接包含 img 标签）
    if (tag === "section" || tag === "div" || tag === "p" || tag === "figure") {
      const hasImgChild = $el.find("img").length > 0 || $el.children("img").length > 0;
      if (hasImgChild && !textContent.trim()) {
        imageContainers.push(style);
      }
    }

    // 收集包裹单段正文的容器（微信常把背景色/边框放在父容器,而非 text 元素本身）
    const hasSignificantBg = style["background-color"] && !isBlackWhiteGray(style["background-color"]);
    const hasBorderStyle = !!style.border || !!style["border-left"] || !!style["border-right"] || !!style["border-top"] || !!style["border-bottom"];
    const hasPaddingStyle = !!style.padding;
    const childHasText = textContent.length > 5;
    // 判断是否为全局容器：有多个带文本的子 section → 跳过（避免把页面背景色合并到 pStyle）
    const textSectionChildren = $el.children("section").filter((_: number, child: any) => {
      return $(child).text().trim().length > 5;
    }).length;
    const isGlobalContainer = textSectionChildren > 1;
    // 仅当容器直接包裹单个段落且自身有背景/边框时才合并
    if ((hasSignificantBg || hasBorderStyle || hasPaddingStyle) && childHasText && role === "container" && !isGlobalContainer) {
      paragraphContainers.push({ style, role: "paragraph" });
    }

    // 收集动效属性：transition, animation, transform, filter, opacity
    const hasAnimation = !!style.transition || !!style.animation || !!style.transform;
    const hasFilter = !!style.filter || (style.opacity && style.opacity !== "1");
    if (hasAnimation || hasFilter) {
      animationStyles.push(style);
    }

    // 收集装饰性样式：背景图、渐变、装饰性边框
    const hasBgImage = style["background-image"] || (style.background && style.background.includes("url("));
    const hasGradient = style.background?.includes("gradient(") || style["background-image"]?.includes("gradient(");
    const hasDecorativeBorder =
      (style.border && (style.border.includes("dashed") || style.border.includes("dotted") || style.border.includes("double"))) ||
      (style["border-style"] && (style["border-style"].includes("dashed") || style["border-style"].includes("dotted")));
    if (hasBgImage || hasGradient || hasDecorativeBorder) {
      decorationStyles.push(style);
    }

    // 只收集有文本内容或明确角色的元素
    if (role === "container" || role === "unknown") return;

    snapshots.push({
      tag,
      role,
      style,
      textContent: textContent.slice(0, 50),
      fontSize,
      fontWeight,
      parentTags,
    });
  });

  // 按角色分组
  const roleGroups = new Map<ElementRole, ElementSnapshot[]>();
  snapshots.forEach((s) => {
    const existing = roleGroups.get(s.role) || [];
    existing.push(s);
    roleGroups.set(s.role, existing);
  });

  // 颜色聚类
  const { themeColor, backgroundColor } = clusterColors(snapshots);

  // 推断分类
  const { likelyCategory } = inferCategory(
    snapshots,
    themeColor,
    backgroundColor,
  );

  // ── 取属性最丰富的那个元素，完整保留其所有样式 ──
  // 如果指定了 containerStyles，则合并容器中该元素没有的属性

  function extractBestElementStyle(
    role: ElementRole,
    containerStyles?: Record<string, string>[],
  ): Record<string, string> {
    const items = roleGroups.get(role) || [];
    if (items.length === 0) return {};

    // 取内联属性最多的元素
    let best = items[0];
    let maxProps = Object.keys(best.style).length;
    for (let i = 1; i < items.length; i++) {
      const count = Object.keys(items[i].style).length;
      if (count > maxProps) {
        best = items[i];
        maxProps = count;
      }
    }

    // 复制该元素的完整样式
    const result: Record<string, string> = { ...best.style };

    // 合并容器样式（元素自身没有的属性从容器补）
    if (containerStyles && containerStyles.length > 0) {
      const containerProps = ["background-color", "background", "border", "border-left",
        "border-radius", "padding", "margin", "box-shadow"];
      containerProps.forEach((prop) => {
        if (!result[prop]) {
          const values = containerStyles.map((s) => s[prop]).filter(Boolean);
          if (values.length > 0) {
            result[prop] = getMostCommonValue(values, prop);
          }
        }
      });
    }

    return result;
  }

  // 提取各角色最丰富元素的完整样式
  const h1Style = extractBestElementStyle("h1");
  const h2Style = extractBestElementStyle("h2");
  const h3Style = extractBestElementStyle("h3");
  const pStyle = extractBestElementStyle("paragraph", paragraphContainers.length > 0 ? paragraphContainers.map(c => c.style) : undefined);
  const bqStyle = extractBestElementStyle("blockquote");
  const strongStyle = extractBestElementStyle("strong");
  const emStyle = extractBestElementStyle("em");
  const listStyle = extractBestElementStyle("list");
  const listItemStyle = extractBestElementStyle("list-item");
  const codeStyle = extractBestElementStyle("code-block");
  const hrStyleProps = extractBestElementStyle("hr");
  const tableStyleProps = extractBestElementStyle("table");
  const thStyleProps = extractBestElementStyle("paragraph"); // table cells use paragraph style
  const imgStyle = extractBestElementStyle("image");
  const linkStyle = extractBestElementStyle("link");

  // 合并图片包裹容器的样式到 imgStyle
  if (imageContainers.length > 0) {
    const containerProps = ["border", "border-radius", "padding", "margin", "box-shadow", "background-color"];
    containerProps.forEach((prop) => {
      if (!imgStyle[prop]) {
        const values = imageContainers.map((s) => s[prop]).filter(Boolean);
        if (values.length > 0) {
          imgStyle[prop] = getMostCommonValue(values, prop);
        }
      }
    });
  }

  // ---------- 综合提取正文颜色 ----------

  // 计算颜色亮度（0-255，越小越暗）
  function colorLuminance(hex: string): number {
    const c = hex.replace("#", "");
    if (c.length !== 6) return 128;
    const r = Number.parseInt(c.slice(0, 2), 16);
    const g = Number.parseInt(c.slice(2, 4), 16);
    const b = Number.parseInt(c.slice(4, 6), 16);
    // 感知亮度公式
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  const TEXT_MAX_LUMINANCE = 150; // 正文颜色最大亮度（超过则太淡不可读）

  // 收集所有文本角色的颜色，按角色加权：直接文本标签权重更高
  const textRoleWeights: Partial<Record<ElementRole, number>> = {
    paragraph: 1,
    strong: 1.5,
    em: 1.5,
    "list-item": 1,
    h1: 1.2,
    h2: 1.2,
    h3: 1,
    blockquote: 0.5,
  };

  // 两轮投票：先选可读的颜色（够暗），再回退到任何颜色
  function pickBestTextColor(fallback: string): string {
    const colorScores = new Map<string, { score: number; luminance: number }>();

    snapshots.forEach((s) => {
      const weight = textRoleWeights[s.role] || 1;
      if (s.style.color) {
        const normalized = normalizeColor(s.style.color);
        if (normalized && !isBlackWhiteGray(normalized)) {
          const existing = colorScores.get(normalized) || { score: 0, luminance: colorLuminance(normalized) };
          existing.score += weight;
          colorScores.set(normalized, existing);
        }
      }
    });

    // 按加权分数降序排列
    const sorted = [...colorScores.entries()].sort((a, b) => b[1].score - a[1].score);

    if (sorted.length === 0) return fallback;

    // 第一优先：取分数最高且亮度够低（可读）的颜色
    const readable = sorted.find(([, info]) => info.luminance <= TEXT_MAX_LUMINANCE);
    if (readable) return readable[0];

    // 第二优先：取分数最高但亮度稍高的（高于150但低于200勉强可用）
    const semiReadable = sorted.find(([, info]) => info.luminance <= 200);
    if (semiReadable) return semiReadable[0];

    // 最终回退：取分数最高的颜色
    return sorted[0][0];
  }

  const bestTextColor = pickBestTextColor("");

  // 基础文本颜色：优先 pStyle 明确颜色（需可读）→ 加权投票 → h1 颜色 → 主题色 → 默认
  let baseColor = "#374151";
  if (pStyle.color) {
    const normPColor = normalizeColor(pStyle.color);
    if (normPColor && !isBlackWhiteGray(normPColor) && colorLuminance(normPColor) <= TEXT_MAX_LUMINANCE) {
      baseColor = pStyle.color;
    } else if (bestTextColor) {
      baseColor = bestTextColor;
    }
  } else if (bestTextColor) {
    baseColor = bestTextColor;
  } else if (h1Style.color) {
    baseColor = h1Style.color;
  } else if (themeColor && colorLuminance(themeColor) <= TEXT_MAX_LUMINANCE) {
    baseColor = themeColor;
  }
  const fontFamily =
    roleGroups.get("paragraph")?.[0]?.style["font-family"] ||
    "system-ui, -apple-system, sans-serif";

  // 用提取到的样式构建每项的style字符串
  const mkStyle = (
    base: Record<string, string>,
    defaults: Record<string, string>,
  ): string => {
    const merged = { ...defaults, ...base };
    return buildStyleString(merged);
  };

  // 从装饰样式集合中提取最常见的装饰属性
  function extractCommonDecorationStyles(styles: Record<string, string>[]): Record<string, string> {
    if (styles.length === 0) return {};
    const decoProps = ["background-image", "background-size", "background-repeat", "background-position", "background"];
    const result: Record<string, string> = {};
    decoProps.forEach((prop) => {
      const values = styles.map((s) => s[prop]).filter(Boolean);
      if (values.length > 0) {
        result[prop] = getMostCommonValue(values, prop);
      }
    });
    return result;
  }

  // ---------- 合并段落容器的背景/边框/内边距到 pStyle ----------
  const paragraphContainerProps = ["background-color", "background", "border", "border-left",
    "border-right", "border-top", "border-bottom", "border-radius", "padding", "margin"];
  const mergedPStyle = { ...pStyle };
  if (paragraphContainers.length > 0) {
    paragraphContainerProps.forEach((prop) => {
      if (!mergedPStyle[prop]) {
        const values = paragraphContainers.map((c) => c.style[prop]).filter(Boolean);
        if (values.length > 0) {
          mergedPStyle[prop] = getMostCommonValue(values, prop);
        }
      }
    });
  }

  // ---------- 合并动效样式到 imgStyle ----------
  if (animationStyles.length > 0) {
    const animImgProps = ["transition", "animation", "transform", "opacity", "filter"];
    animImgProps.forEach((prop) => {
      if (!imgStyle[prop]) {
        const values = animationStyles.map((s) => s[prop]).filter(Boolean);
        if (values.length > 0) {
          imgStyle[prop] = getMostCommonValue(values, prop);
        }
      }
    });
  }

  // 生成唯一ID
  const id = `extracted-${crypto.randomUUID().slice(0, 8)}`;
  const name = `导入模板 #${Math.floor(Math.random() * 900) + 100}`;

  return {
    name,
    description: "从微信公众号文章自动提取的模板",
    category: likelyCategory,
    themeColor,
    backgroundColor,
    baseStyle: {
      color: baseColor,
      fontFamily,
    },
    containerStyle: mkStyle(
      {
        "background-color": backgroundColor,
        ...(decorationStyles.length > 0 ? extractCommonDecorationStyles([...decorationStyles, ...imageContainers]) : {}),
      },
      {
        padding: "16px",
        "font-size": pStyle["font-size"] || "16px",
        color: baseColor,
      },
    ),
    h1Style: mkStyle(h1Style, {
      "font-size": "1.5em",
      "font-weight": "bold",
      "text-align": "center",
      margin: "20px 0",
    }),
    h2Style: mkStyle(h2Style, {
      "font-size": "1.25em",
      "font-weight": "bold",
      margin: "24px 0 16px",
    }),
    h3Style: mkStyle(h3Style, {
      "font-size": "1.1em",
      "font-weight": "bold",
      margin: "16px 0 12px",
    }),
    pStyle: mkStyle(mergedPStyle, {
      margin: "0 0 16px 0",
      "line-height": "1.8",
      color: baseColor,
    }),
    blockquoteStyle: mkStyle(bqStyle, {
      "border-left": `3px solid ${themeColor}`,
      margin: "20px 0",
      padding: "12px 16px",
      "background-color": "#f5f5f5",
    }),
    blockquoteInnerBefore: "",
    blockquoteInnerAfter: "",
    listStyle: mkStyle(listStyle, {
      margin: "0 0 16px 0",
      padding: "0",
    }),
    listItemStyle: mkStyle(listItemStyle, {
      margin: "0 0 8px 0",
      "line-height": "1.7",
    }),
    listIcon: `<span style="display: inline-block; width: 6px; height: 6px; background-color: ${themeColor}; border-radius: 50%; vertical-align: middle; margin-right: 6px;"></span>`,
    strongStyle: mkStyle(strongStyle, {
      "font-weight": "bold",
      color: themeColor,
    }),
    emStyle: mkStyle(emStyle, {
      "font-style": "italic",
      color: baseColor,
    }),
    codeContainerStyle: mkStyle(codeStyle, {
      margin: "20px 0",
      "border-radius": "4px",
      overflow: "hidden",
      border: "1px solid #e5e7eb",
    }),
    codeHeaderStyle: "padding: 8px 12px; font-size: 0; line-height: 1;",
    codeBlockStyle: mkStyle(codeStyle, {
      margin: "0",
      padding: "16px",
      "overflow-x": "auto",
      "font-size": "13px",
      "font-family": "monospace",
      "line-height": "1.6",
      "white-space": "pre-wrap",
    }),
    imgStyle: mkStyle(imgStyle, {
      "max-width": "100%",
      "border-radius": "4px",
      display: "block",
      margin: "20px auto",
    }),
    hrStyle: mkStyle(hrStyleProps, {
      border: "none",
      "border-top": "1px solid #e5e7eb",
      margin: "32px 0",
    }),
    linkStyle: mkStyle(linkStyle, {
      color: themeColor,
      "text-decoration": "none",
    }),
    tableStyle: mkStyle(tableStyleProps, {
      width: "100%",
      "border-collapse": "collapse",
      margin: "24px 0",
    }),
    thStyle: mkStyle(thStyleProps, {
      border: "1px solid #ddd",
      padding: "8px",
      "font-weight": "bold",
      "background-color": "#f8f9fa",
    }),
    tdStyle: mkStyle(thStyleProps, {
      border: "1px solid #ddd",
      padding: "8px",
    } as Record<string, string>),
    delStyle: "text-decoration: line-through; opacity: 0.6;",
  };
}