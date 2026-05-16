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
  | "h4"
  | "h5"
  | "h6"
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
    
    // 处理中文冒号（微信编辑器有时会使用）
    let colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) colonIdx = trimmed.indexOf("："); // 中文冒号
    if (colonIdx === -1) return;
    
    const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
    let val = trimmed.slice(colonIdx + 1).trim();
    
    if (!prop || !val) return;
    
    // 尽可能保留所有属性值，不做任何修改
    // 不移除 !important
    // 不处理 var()
    // 不处理 calc()、attr() 等表达式
    // 不标准化颜色值
    
    result[prop] = val;
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
  className?: string,
  dataAttrs?: Record<string, string>,
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

  // 检查 class 名中的线索（微信编辑器常用 class 标识样式类型）
  const classLower = (className || "").toLowerCase();
  const isTitleClass = /title|heading|header/.test(classLower);
  const isQuoteClass = /quote|blockquote/.test(classLower);
  const isListClass = /list|item/.test(classLower);
  const isCodeClass = /code|highlight/.test(classLower);
  const isContainerClass = /container|wrapper|section/.test(classLower);

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
      // 检查 p 标签是否实际上是标题（微信常见：<p><span>标题</span></p>）
      if (isTitleClass) return "h2";
      if (fontSize >= 18 && textContent.length < 50) return "h2";
      if (fontWeight >= 700 && textContent.length < 30) return "h3";
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
      // 检查 data-* 属性中的线索
      if (dataAttrs) {
        const dataStr = JSON.stringify(dataAttrs).toLowerCase();
        if (/title|heading/.test(dataStr)) return "h2";
        if (/quote|blockquote/.test(dataStr)) return "blockquote";
      }

      // 有多个子 section/div 包含文本 → 布局容器
      if ($el) {
        const textChildren = $el.children("section, div").filter((_: number, child: any) => {
          const $child = $el.constructor._ ? $el.constructor._(child) : null;
          if (!$child) return child.children && child.children.length > 0;
          return $child.text().trim().length > 10;
        }).length;
        if (textChildren > 1) return "container";
      }

      // 微信公众号文章使用嵌套 <section>，需要综合多个信号判断
      const hasBgColor = !!style["background-color"] && !isBlackWhiteGray(style["background-color"]);
      const hasBorder = !!style.border || !!style["border-left"] || !!style["border-bottom"];
      const hasPadding = !!style.padding;
      const textLen = textContent.length;

      // 纯容器：无文本或只有空白
      if (!textContent || textContent.trim().length === 0) {
        // 有边框/背景色的容器 → 贡献 container 样式
        if (hasBgColor || hasBorder || hasPadding) return "container";
        return "container";
      }

      // 增强判断：检查子元素结构
      let hasTitleChild = false;
      let hasOnlyInlineChildren = false;
      let hasBlockChildren = false;
      if ($el) {
        const children = $el.children();
        hasTitleChild = children.length > 0 && children.first().get(0)?.tagName?.toLowerCase() === "span";
        hasOnlyInlineChildren = children.length > 0 && children.toArray().every((c: any) => {
          const t = c.tagName?.toLowerCase();
          return t === "span" || t === "strong" || t === "em" || t === "a";
        });
        // 检查是否有块级子元素（p, div, section, blockquote 等）
        hasBlockChildren = children.toArray().some((c: any) => {
          const t = c.tagName?.toLowerCase();
          return t === "p" || t === "div" || t === "section" || t === "blockquote" || t === "ul" || t === "ol";
        });
      }

      // 微信常见结构：<section><span>标题</span></section>
      // 只有当所有子元素都是行内元素且文本短时，才可能是标题
      if (hasOnlyInlineChildren && textLen < 50 && !hasBlockChildren) {
        if (fontSize >= 16 || fontWeight >= 700) return "h2";
        if (hasBgColor || hasBorder) return "h2";
      }

      // 如果元素包含块级子元素，它更像是一个容器，而不是标题
      if (hasBlockChildren) {
        // 有块级子元素 + 背景色/边框 → 可能是引用容器或内容容器
        if (hasBorder && style["border-left"]) return "blockquote";
        return "container";
      }

      // 短文本 + 大字号 = 标题
      if (fontSize >= 20 && textLen < 40) return "h1";
      if (fontSize >= 17 && textLen < 50) return "h2";
      if (fontSize >= 15 && textLen < 60) return "h3";

      // 短文本 + 加粗 = 标题
      if (fontWeight >= 600 && textLen < 30) {
        if (fontSize >= 15) return "h2";
        return "h3";
      }

      // class 名包含标题线索
      if (isTitleClass) {
        if (fontSize >= 16) return "h2";
        return "h3";
      }

      // 短文本 + 有背景色/边框 → 可能是标题
      // 但只有当文本真正短时（< 25 字符），才可能是标题
      if (textLen < 25 && (hasBgColor || hasBorder)) {
        if (fontSize >= 16 || fontWeight >= 600) return "h2";
        if (fontSize >= 14 || fontWeight >= 500) return "h3";
        // 有特殊背景色/边框但字号不大 → 可能是带装饰的正文
        return "paragraph";
      }

      // 长文本 + 有背景色 → 可能是带背景的正文容器，而不是标题
      if (textLen >= 50 && hasBgColor) {
        return "container";
      }

      // 引用样式特征
      if (isQuoteClass || (hasBorder && style["border-left"] && textLen > 20)) {
        return "blockquote";
      }

      // 纯文本块（没有块级子元素，只是带样式的文本）
      return "paragraph";
    case "span":
      // span 的 role 判断需要结合父元素
      if (fontWeight >= 700 || style["font-weight"] === "bold") return "strong";

      // 检查父元素特征
      if (parentTags.some(t => ["h1","h2","h3","h4","h5","h6"].includes(t))) {
        if (parentTags.includes("h1")) return "h1";
        if (parentTags.includes("h2")) return "h2";
        if (parentTags.includes("h3")) return "h3";
      }

      // 微信常见结构：<section><span>标题</span></section>
      // span 直接包含短文本且父级是 section → 可能是标题的一部分
      if (!textContent) return "unknown";
      if (textContent.length < 30 && parentTags.includes("section")) {
        if (fontSize >= 16 || fontWeight >= 600) return "h2";
        if (fontSize >= 14 || fontWeight >= 500) return "h3";
      }

      // 检查是否有标题相关的 class
      if (isTitleClass) return "h3";

      return "paragraph";
    default:
      if (!textContent) return "container";
      if (fontSize >= 18) return "h2";
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

// ============== 颜色聚类（改进版 - 彻底分离标题和页面背景色）==============

// 判断是否为纯容器角色（仅用于提取全局/页面背景色）
function isGlobalContainerRole(role: ElementRole): boolean {
  // 只有 container 和 paragraph 可以作为页面背景色的候选
  // blockquote 有自己的特殊背景色处理
  return role === "container" || role === "paragraph";
}

// 判断是否为标题角色（其背景色绝对不能作为页面背景色）
function isTitleRole(role: ElementRole): boolean {
  return role === "h1" || role === "h2" || role === "h3" || role === "h4" || role === "h5" || role === "h6";
}

function clusterColors(
  snapshots: ElementSnapshot[],
): { themeColor: string; backgroundColor: string; allColors: ColorCluster[] } {
  const colorMap = new Map<string, ColorCluster>();

  // 收集所有颜色及其使用场景
  snapshots.forEach((s) => {
    const style = s.style;

    // color（文字颜色）- 保持不变
    if (style.color) {
      const normalized = normalizeColor(style.color);
      if (isSignificantColor(normalized) && isReadableColor(normalized)) {
        const key = `text:${normalized}`;
        const existing = colorMap.get(key);
        if (existing) {
          existing.count++;
          if (!existing.contexts.includes(s.role)) {
            existing.contexts.push(s.role);
          }
        } else {
          colorMap.set(key, {
            color: normalized,
            type: "text",
            count: getRoleWeight(s.role) * 2,
            contexts: [s.role],
          });
        }
      }
    }

    // background-color - 关键修改：完全排除标题角色的背景色
    if (style["background-color"]) {
      const normalized = normalizeColor(style["background-color"]);
      
      // 标题角色的背景色完全跳过，不参与任何聚类计算
      if (isTitleRole(s.role)) {
        return; // 跳过本次迭代的后续逻辑
      }
      
      if (normalized && normalized !== "#ffffff" && normalized !== "#fff") {
        const key = `bg:${normalized}`;
        const existing = colorMap.get(key);
        
        // 权重：容器角色高，其他中等
        let weight = isGlobalContainerRole(s.role) ? 3 : 1;
        
        if (existing) {
          existing.count += weight;
          if (!existing.contexts.includes(s.role)) {
            existing.contexts.push(s.role);
          }
        } else {
          colorMap.set(key, {
            color: normalized,
            type: "bg",
            count: weight,
            contexts: [`背景(${s.role})`],
          });
        }
      }
    }

    // background 简写 - 同样排除标题角色的背景色
    if (style.background && !style["background-color"]) {
      const isTitle = isTitleRole(s.role);
      
      // 颜色提取 - 标题角色跳过
      if (!isTitle) {
        const bgColorMatch = style.background.match(/#([0-9a-fA-F]{3,8})\b/);
        if (bgColorMatch) {
          const normalized = normalizeColor(bgColorMatch[0]);
          if (normalized && normalized !== "#ffffff" && normalized !== "#fff" && 
              normalized !== "#000000" && normalized !== "#000") {
            const key = `bg:${normalized}`;
            const existing = colorMap.get(key);
            
            let weight = isGlobalContainerRole(s.role) ? 3 : 1;
            
            if (existing) {
              existing.count += weight;
            } else {
              colorMap.set(key, {
                color: normalized,
                type: "bg",
                count: weight,
                contexts: [`背景简写(${s.role})`],
              });
            }
          }
        }
      }
      // 检测渐变（所有角色都检测，包括标题）
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
            type: "bg",
          });
        }
      }
    }

    // border 颜色
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
                count: getRoleWeight(s.role) * 0.5,
                contexts: [`边框(${s.role})`],
              });
            }
          }
        }
      },
    );

    // border 简写
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
              count: 0.5,
              contexts: [`边框简写(${s.role})`],
            });
          }
        }
      }
    }
  });

  // 按加权分数降序排列
  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([, v]) => v);

  // 主题色：取加权分数最高的有彩色 text 类型
  const textColors = sorted.filter(c => c.type === "text");
  const themeColor = textColors.length > 0 ? textColors[0].color : "#3b82f6";

  // 背景色：取分数最高的 bg 类型
  // 注意：标题角色的 background 已经在收集时被完全排除，所以这里直接取最高分即可
  const bgColors = sorted.filter(c => c.type === "bg" && c.color !== "gradient");
  const backgroundColor = bgColors.length > 0 ? bgColors[0].color : "#ffffff";

  return { themeColor, backgroundColor, allColors: sorted };
}

// 检查颜色是否可读（不太亮也不太暗）
function isReadableColor(hex: string): boolean {
  const normalized = normalizeColor(hex);
  const cleanHex = normalized.replace("#", "");
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  // 亮度在 30-220 之间（不太暗也不太亮）
  return luminance >= 30 && luminance <= 220;
}

// 不同角色的颜色权重不同
function getRoleWeight(role: ElementRole): number {
  const weights: Partial<Record<ElementRole, number>> = {
    h1: 3,
    h2: 2.5,
    h3: 2,
    strong: 2,
    "list-item": 1.5,
    paragraph: 1,
    blockquote: 0.8,
    "code-block": 0.5,
  };
  return weights[role] || 1;
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
  const total = snapshots.length || 1;

  // 特征计数
  let hasShadow = 0;
  let hasThickBorder = 0;
  let hasRoundCorner = 0;
  let hasDarkBg = 0;
  let hasLightBg = 0;
  let hasSerifFont = 0;
  let hasSansSerifFont = 0;
  let hasMonospaceFont = 0;
  let hasGradient = 0;
  let hasDashedBorder = 0;
  let hasLetterSpacing = 0;
  let hasTextShadow = 0;
  let hasAnimation = 0;
  let warmColorCount = 0;
  let coolColorCount = 0;
  let highSaturation = 0;
  let hasPadding = 0;
  let hasMargin = 0;
  let hasTextAlignCenter = 0;
  let hasBoldTitle = 0;

  allStyles.forEach((style) => {
    // 阴影
    if (style["box-shadow"] && style["box-shadow"] !== "none") hasShadow++;
    
    // 厚边框
    if (style.border) {
      const borderWidth = style.border.match(/(\d+)px/);
      if (borderWidth && Number(borderWidth[1]) >= 2) hasThickBorder++;
      if (style.border.includes("dashed") || style.border.includes("dotted")) hasDashedBorder++;
    }
    
    // 圆角
    if (style["border-radius"] && getNumericValue(style["border-radius"]) >= 6) {
      hasRoundCorner++;
    }
    
    // 背景色
    if (style["background-color"]) {
      if (isDarkBackground(style["background-color"])) {
        hasDarkBg++;
      } else if (!isBlackWhiteGray(style["background-color"])) {
        hasLightBg++;
      }
    }
    
    // 渐变
    if (style.background && style.background.includes("gradient")) hasGradient++;
    
    // 字体
    if (style["font-family"]) {
      const ff = style["font-family"].toLowerCase();
      if (ff.includes("serif") || ff.includes("宋体") || ff.includes("songti") || ff.includes("kai")) {
        hasSerifFont++;
      }
      if (ff.includes("sans") || ff.includes("微软雅黑") || ff.includes("microsoft yahei")) {
        hasSansSerifFont++;
      }
      if (ff.includes("mono") || ff.includes("consolas") || ff.includes("courier")) {
        hasMonospaceFont++;
      }
    }
    
    // 字间距
    if (style["letter-spacing"] && getNumericValue(style["letter-spacing"]) > 0) hasLetterSpacing++;
    
    // 文字阴影
    if (style["text-shadow"] && style["text-shadow"] !== "none") hasTextShadow++;
    
    // 动画
    if (style.transition || style.animation) hasAnimation++;
    
    // 内边距
    if (style.padding) hasPadding++;
    
    // 外边距
    if (style.margin) hasMargin++;
    
    // 居中对齐
    if (style["text-align"] === "center") hasTextAlignCenter++;
    
    // 粗体标题（通过 fontWeight 判断）
    if (style["font-weight"] && (style["font-weight"] === "bold" || Number(style["font-weight"]) >= 600)) {
      hasBoldTitle++;
    }
  });

  // 分析主题色冷暖和饱和度
  const hex = themeColor.replace("#", "");
  if (hex.length === 6) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    
    if (r > b + 30) warmColorCount++;
    if (b > r + 30) coolColorCount++;
    if (saturation > 0.5) highSaturation++;
  }

  // 加权评分系统
  const scores: Record<string, number> = {
    "neo-brutalism": 0,
    "minimalist": 0,
    "business": 0,
    "literary": 0,
    "tech": 0,
    "festive": 0,
  };

  // Neo-brutalism: 粗边框、阴影、高饱和度暖色
  scores["neo-brutalism"] += hasThickBorder * 3;
  scores["neo-brutalism"] += hasShadow * 2;
  scores["neo-brutalism"] += highSaturation * 2;
  scores["neo-brutalism"] += warmColorCount * 1.5;
  scores["neo-brutalism"] += hasDashedBorder * 1;

  // Minimalist: 无装饰、无阴影、无粗边框
  scores["minimalist"] += (total - hasShadow - hasThickBorder - hasTextShadow) * 0.5;
  scores["minimalist"] += hasSansSerifFont * 1;
  scores["minimalist"] += hasLetterSpacing * 1.5;

  // Business: 圆角、内边距、居中对齐
  scores["business"] += hasRoundCorner * 2;
  scores["business"] += hasPadding * 1.5;
  scores["business"] += hasTextAlignCenter * 1;
  scores["business"] += hasLightBg * 1;

  // Literary: 衬线字体、字间距、内边距
  scores["literary"] += hasSerifFont * 3;
  scores["literary"] += hasLetterSpacing * 2;
  scores["literary"] += hasPadding * 1;
  scores["literary"] += hasBoldTitle * 1;

  // Tech: 暗背景、等宽字体、渐变
  scores["tech"] += hasDarkBg * 3;
  scores["tech"] += hasMonospaceFont * 2;
  scores["tech"] += hasGradient * 1.5;
  scores["tech"] += coolColorCount * 1;

  // Festive: 暖色、高饱和度、动画
  scores["festive"] += warmColorCount * 2;
  scores["festive"] += highSaturation * 2;
  scores["festive"] += hasAnimation * 1;
  scores["festive"] += hasGradient * 1;

  // 归一化分数
  const maxPossibleScore = total * 5;
  Object.keys(scores).forEach(key => {
    scores[key] = scores[key] / maxPossibleScore;
  });

  // 找出最高分
  let bestCategory = "minimalist";
  let bestScore = 0;
  let secondBestScore = 0;
  
  Object.entries(scores).forEach(([category, score]) => {
    if (score > bestScore) {
      secondBestScore = bestScore;
      bestScore = score;
      bestCategory = category;
    } else if (score > secondBestScore) {
      secondBestScore = score;
    }
  });

  // 计算置信度（基于分差）
  const confidence = bestScore > 0 ? Math.min(0.95, bestScore + (bestScore - secondBestScore) * 0.5) : 0.3;

  return { likelyCategory: bestCategory, confidence };
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
  h4Style: string;
  h5Style: string;
  h6Style: string;
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
  // 改进 HTML 清洗逻辑 - 尽可能保留更多内容和属性
  let cleanHtml = html;
  
  // 1. 移除注释（保留注释可能包含有用信息，但注释会影响解析，所以移除）
  cleanHtml = cleanHtml.replace(/<!--[\s\S]*?-->/gi, "");
  
  // 2. 保留 script 标签内容（可能包含有用数据），但移除 script 标签本身
  // 不移除 script 标签，因为可能包含样式信息
  
  // 3. 保留 style 标签（可能包含有用样式信息）
  // 不移除 style 标签，因为可能包含有用样式信息
  
  // 4. 保留 iframe 标签（可能包含有用内容）
  // 不移除 iframe 标签
  
  // 5. 保留 noscript 标签
  // 不移除 noscript 标签
  
  // 6. 保留事件处理程序属性（尽可能保留所有属性）
  // 不移除事件处理程序属性
  
  // 7. 保留 meta、link 标签
  // 不移除 meta、link 标签
  
  // 8. 尝试提取文章主体内容（微信公众号文章通常包含 <div class="rich_media_content">）
  // 如果找不到主体内容，则使用整个 HTML
  const contentMatch = cleanHtml.match(/<div[^>]*class="rich_media_content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:script|div)/i);
  if (contentMatch && contentMatch[1]) {
    cleanHtml = `<div class="rich_media_content">${contentMatch[1]}</div>`;
  } else {
    // 备用：提取 body 内容
    const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      cleanHtml = `<body>${bodyMatch[1]}</body>`;
    } else {
      // 如果都找不到，使用整个 HTML
      cleanHtml = html;
    }
  }
  
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
    const className = $el.attr("class") || "";
    
    // 提取 data-* 属性
    const dataAttrs: Record<string, string> = {};
    const dataAttrsObj = $el.data() || {};
    Object.keys(dataAttrsObj).forEach(key => {
      dataAttrs[`data-${key}`] = String(dataAttrsObj[key]);
    });

    // 收集父标签
    $el.parents().each((_p, parent) => {
      parentTags.push(parent.tagName.toLowerCase());
    });

    const role = determineRole(tag, style, textContent, parentTags, $el, className, dataAttrs);
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
    const textLen = textContent.length;
    
    // 增强的标题检测 - 更严格地识别标题特征
    // 标题通常具有以下特征：
    // 1. 文本较短（< 80 字符）
    // 2. 有背景色或边框
    // 3. 字号较大（>= 14px）或字重较粗（>= 500）
    const fontSizeForTitleCheck = fontSize || getNumericValue(style["font-size"] || "14");
    const fontWeightForTitleCheck = fontWeight || (style["font-weight"] === "bold" ? 700 : Number.parseInt(style["font-weight"]) || 400);
    const looksLikeTitle = (
      textLen < 80 && 
      (hasSignificantBg || hasBorderStyle) && 
      (fontSizeForTitleCheck >= 14 || fontWeightForTitleCheck >= 500)
    );
    
    // 判断是否为全局容器：有多个带文本的子 section → 跳过（避免把页面背景色合并到 pStyle）
    const textSectionChildren = $el.children("section").filter((_: number, child: any) => {
      return $(child).text().trim().length > 5;
    }).length;
    const isGlobalContainer = textSectionChildren > 1;
    
    // 仅当容器直接包裹单个段落且自身有背景/边框时才合并，且不是标题
    if ((hasSignificantBg || hasBorderStyle || hasPaddingStyle) && childHasText && role === "container" && !isGlobalContainer && !looksLikeTitle) {
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

  // ── 取最具代表性的元素，完整保留其所有样式 ──
  // 如果指定了 containerStyles，则合并容器中该元素没有的属性

  // 属性重要性权重（用于计算样式丰富度得分）- 增加更多 CSS 属性
  const PROPERTY_WEIGHTS: Record<string, number> = {
    "color": 10,
    "font-size": 10,
    "font-weight": 8,
    "font-family": 8,
    "background-color": 9,
    "background": 7,
    "background-image": 7,
    "background-size": 6,
    "background-repeat": 5,
    "background-position": 5,
    "background-attachment": 4,
    "background-clip": 4,
    "background-origin": 4,
    "border": 7,
    "border-width": 6,
    "border-style": 6,
    "border-color": 6,
    "border-radius": 6,
    "border-top": 5,
    "border-right": 5,
    "border-bottom": 5,
    "border-left": 5,
    "border-top-width": 4,
    "border-right-width": 4,
    "border-bottom-width": 4,
    "border-left-width": 4,
    "border-top-style": 4,
    "border-right-style": 4,
    "border-bottom-style": 4,
    "border-left-style": 4,
    "border-top-color": 4,
    "border-right-color": 4,
    "border-bottom-color": 4,
    "border-left-color": 4,
    "border-image": 5,
    "border-collapse": 5,
    "border-spacing": 4,
    "padding": 5,
    "padding-top": 4,
    "padding-right": 4,
    "padding-bottom": 4,
    "padding-left": 4,
    "margin": 5,
    "margin-top": 4,
    "margin-right": 4,
    "margin-bottom": 4,
    "margin-left": 4,
    "line-height": 8,
    "text-align": 6,
    "text-decoration": 6,
    "text-transform": 5,
    "text-indent": 4,
    "text-shadow": 5,
    "letter-spacing": 4,
    "word-spacing": 3,
    "white-space": 5,
    "word-break": 5,
    "word-wrap": 5,
    "overflow-wrap": 5,
    "text-overflow": 5,
    "box-shadow": 5,
    "opacity": 3,
    "transition": 3,
    "transition-property": 2,
    "transition-duration": 2,
    "transition-timing-function": 2,
    "transition-delay": 2,
    "transform": 3,
    "transform-origin": 2,
    "animation": 4,
    "animation-name": 3,
    "animation-duration": 3,
    "animation-timing-function": 3,
    "animation-delay": 2,
    "animation-iteration-count": 2,
    "animation-direction": 2,
    "animation-fill-mode": 2,
    "animation-play-state": 2,
    "filter": 4,
    "backdrop-filter": 4,
    "width": 6,
    "min-width": 5,
    "max-width": 5,
    "height": 6,
    "min-height": 5,
    "max-height": 5,
    "box-sizing": 5,
    "display": 5,
    "visibility": 4,
    "overflow": 4,
    "overflow-x": 3,
    "overflow-y": 3,
    "clip": 3,
    "clip-path": 3,
    "mask": 4,
    "mask-image": 4,
    "mask-size": 3,
    "mask-repeat": 3,
    "mask-position": 3,
    "position": 5,
    "top": 4,
    "right": 4,
    "bottom": 4,
    "left": 4,
    "z-index": 4,
    "float": 4,
    "clear": 3,
    "flex": 5,
    "flex-grow": 4,
    "flex-shrink": 4,
    "flex-basis": 4,
    "flex-direction": 4,
    "flex-wrap": 4,
    "justify-content": 4,
    "align-items": 4,
    "align-self": 3,
    "align-content": 3,
    "order": 3,
    "grid": 5,
    "grid-template": 4,
    "grid-template-columns": 4,
    "grid-template-rows": 4,
    "grid-column": 3,
    "grid-row": 3,
    "grid-gap": 3,
    "gap": 3,
    "table-layout": 4,
    "caption-side": 3,
    "empty-cells": 3,
    "list-style": 5,
    "list-style-type": 4,
    "list-style-position": 3,
    "list-style-image": 4,
    "content": 5,
    "quotes": 3,
    "counter-reset": 3,
    "counter-increment": 3,
    "resize": 3,
    "cursor": 4,
    "pointer-events": 3,
    "user-select": 3,
    "direction": 3,
    "unicode-bidi": 3,
    "writing-mode": 3,
    "text-orientation": 3,
    "font-style": 5,
    "font-variant": 4,
    "font-stretch": 4,
    "font-size-adjust": 3,
    "font-kerning": 3,
    "font-feature-settings": 3,
    "vertical-align": 5,
    "horizontal-align": 4,
  };

  function getStyleScore(style: Record<string, string>): number {
    let score = 0;
    Object.keys(style).forEach(prop => {
      // 基础分：属性数量
      score += 1;
      // 加权分：重要属性
      const weight = PROPERTY_WEIGHTS[prop] || 1;
      score += weight;
      // 奖励：有意义的样式值（非空、非初始值）
      const val = style[prop];
      if (val && val !== "initial" && val !== "inherit" && val !== "normal" && val !== "none") {
        score += 2;
      }
    });
    return score;
  }

  // 智能合并容器样式 - 尽可能保留更多属性
  function mergeContainerStyles(
    elementStyle: Record<string, string>,
    containerStyles: Record<string, string>[],
    priorityProps: string[] = [
      // 背景相关
      "background-color", "background", "background-image", "background-size", "background-repeat", 
      "background-position", "background-attachment", "background-clip", "background-origin", "background-blend-mode",
      // 边框相关
      "border", "border-width", "border-style", "border-color", 
      "border-top", "border-right", "border-bottom", "border-left",
      "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
      "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
      "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
      "border-radius", "border-top-left-radius", "border-top-right-radius", 
      "border-bottom-left-radius", "border-bottom-right-radius",
      "border-image", "border-collapse", "border-spacing",
      // 内边距相关
      "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
      // 外边距相关
      "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
      // 盒模型
      "box-sizing", "width", "min-width", "max-width", "height", "min-height", "max-height",
      "overflow", "overflow-x", "overflow-y", "clip", "clip-path",
      // 显示和定位
      "display", "position", "top", "right", "bottom", "left", "z-index", "float", "clear",
      // 文字相关
      "color", "font-size", "font-family", "font-weight", "font-style", "font-variant",
      "line-height", "text-align", "text-decoration", "text-transform", "text-indent",
      "letter-spacing", "word-spacing", "white-space", "word-break", "word-wrap", "overflow-wrap",
      "text-overflow", "text-shadow", "vertical-align",
      // 阴影和滤镜
      "box-shadow", "filter", "backdrop-filter",
      // 过渡和动画
      "transition", "transition-property", "transition-duration", "transition-timing-function", "transition-delay",
      "animation", "animation-name", "animation-duration", "animation-timing-function", 
      "animation-delay", "animation-iteration-count", "animation-direction", "animation-fill-mode", "animation-play-state",
      // 变换
      "transform", "transform-origin", "transform-style", "perspective",
      // 透明度
      "opacity",
      // 表格
      "table-layout", "caption-side", "empty-cells",
      // 列表
      "list-style", "list-style-type", "list-style-position", "list-style-image",
      // 内容
      "content", "quotes", "counter-reset", "counter-increment",
      // 其他
      "cursor", "pointer-events", "user-select", "resize",
      "direction", "unicode-bidi", "writing-mode", "text-orientation",
      "mix-blend-mode", "isolation", "object-fit", "object-position"
    ]
  ): Record<string, string> {
    const result = { ...elementStyle };
    
    priorityProps.forEach((prop) => {
      // 如果元素自身有该属性，不覆盖（内联样式优先级最高）
      if (result[prop] !== undefined && result[prop] !== null) return;
      
      // 从容器样式中收集该属性的值
      const values = containerStyles.map((s) => s[prop]).filter(v => v !== undefined && v !== null);
      if (values.length === 0) return;
      
      // 保留所有值，不做任何过滤
      const validValues = values.filter(v => v !== "");
      if (validValues.length === 0) return;
      
      // 选择出现频率最高的值
      result[prop] = getMostCommonValue(validValues, prop);
    });
    
    return result;
  }

  function extractBestElementStyle(
    role: ElementRole,
    containerStyles?: Record<string, string>[],
  ): Record<string, string> {
    const items = roleGroups.get(role) || [];
    if (items.length === 0) return {};

    // 选择样式丰富度得分最高的元素
    let best = items[0];
    let bestScore = getStyleScore(best.style);
    for (let i = 1; i < items.length; i++) {
      const score = getStyleScore(items[i].style);
      if (score > bestScore) {
        best = items[i];
        bestScore = score;
      }
    }

    // 复制该元素的完整样式（保留所有属性，不做任何修改）
    const result: Record<string, string> = {};
    Object.entries(best.style).forEach(([prop, val]) => {
      // 保留所有属性值，包括 undefined、null、initial、inherit 等
      result[prop] = val;
    });

    // 使用智能合并函数合并容器样式
    if (containerStyles && containerStyles.length > 0) {
      return mergeContainerStyles(result, containerStyles);
    }

    return result;
  }

  // 提取各角色最丰富元素的完整样式
  const h1Style = extractBestElementStyle("h1");
  const h2Style = extractBestElementStyle("h2");
  const h3Style = extractBestElementStyle("h3");
  const h4Style = extractBestElementStyle("h4");
  const h5Style = extractBestElementStyle("h5");
  const h6Style = extractBestElementStyle("h6");
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

  // 从装饰样式集合中提取最常见的装饰属性 - 增加更多装饰属性
  function extractCommonDecorationStyles(styles: Record<string, string>[]): Record<string, string> {
    if (styles.length === 0) return {};
    // 增加更多装饰属性 - 覆盖所有常见的 CSS 装饰属性
    const decoProps = [
      // 背景相关
      "background-image", "background-size", "background-repeat", "background-position", 
      "background", "background-attachment", "background-clip", "background-origin",
      "background-blend-mode", "background-composite",
      // 阴影
      "box-shadow", "text-shadow",
      // 滤镜
      "filter", "backdrop-filter",
      // 边框图像
      "border-image", "border-image-source", "border-image-slice", "border-image-width", 
      "border-image-outset", "border-image-repeat",
      // 圆角
      "border-radius", "border-top-left-radius", 
      "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius",
      // 剪裁和遮罩
      "clip-path", "mask", "mask-image", "mask-size", "mask-repeat", "mask-position",
      "mask-origin", "mask-clip", "mask-composite", "mask-mode",
      // 透明度
      "opacity",
      // 变换
      "transform", "transform-origin", "perspective", "transform-style",
      // 过渡
      "transition", "transition-property", "transition-duration", "transition-timing-function", "transition-delay",
      // 动画
      "animation", "animation-name", "animation-duration", "animation-timing-function", 
      "animation-delay", "animation-iteration-count", "animation-direction", 
      "animation-fill-mode", "animation-play-state",
      // 混合模式
      "mix-blend-mode", "isolation",
      // 对象适配
      "object-fit", "object-position",
      // 颜色调整
      "brightness", "contrast", "grayscale", "hue-rotate", "invert", "saturate", "sepia",
      // 其他装饰属性
      "outline", "outline-width", "outline-style", "outline-color", "outline-offset",
      "box-decoration-break", "text-decoration-color", "text-decoration-style", "text-decoration-line",
      "text-emphasis", "text-emphasis-color", "text-emphasis-style", "text-emphasis-position",
      "text-rendering", "-webkit-font-smoothing", "-moz-osx-font-smoothing",
      "hyphens", "overflow-wrap", "word-break", "word-spacing", "letter-spacing",
      "white-space", "line-break", "text-align-last", "text-justify",
      "tab-size", "text-indent", "text-overflow", "text-shadow",
      "writing-mode", "direction", "unicode-bidi", "text-orientation",
      "list-style-image", "list-style-position", "list-style-type",
      "quotes", "counter-reset", "counter-increment",
      "resize", "cursor", "pointer-events", "user-select",
      "content-visibility", "contain", "contain-intrinsic-size",
      "scroll-behavior", "scroll-snap-align", "scroll-snap-type",
      "touch-action", "-webkit-overflow-scrolling",
      "fill", "stroke", "fill-opacity", "stroke-opacity", 
      "stroke-width", "stroke-dasharray", "stroke-dashoffset",
      "vector-effect"
    ];
    const result: Record<string, string> = {};
    decoProps.forEach((prop) => {
      const values = styles.map((s) => s[prop]).filter(v => v !== undefined && v !== null);
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
    h4Style: mkStyle(h4Style, {
      "font-size": "1em",
      "font-weight": "bold",
      margin: "14px 0 10px",
    }),
    h5Style: mkStyle(h5Style, {
      "font-size": "0.95em",
      "font-weight": "bold",
      margin: "12px 0 8px",
    }),
    h6Style: mkStyle(h6Style, {
      "font-size": "0.9em",
      "font-weight": "bold",
      margin: "10px 0 6px",
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