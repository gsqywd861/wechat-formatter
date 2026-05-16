import { marked, type Tokens } from "marked";
import type { FormatTweaks } from "./_types/formatter";

export interface TemplateConfig {
  id: string;
  name: string;
  desc: string;
  category: string;
  themeColor: string;
  backgroundColor: string;
  baseStyle: {
    color: string;
    fontFamily: string;
  };
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

const colorPalettes = {
  neoBrutalism: [
    "#c53d43", // 朱红 (Vermilion)
    "#1a5276", // 靛蓝 (Indigo)
    "#2d6a4f", // 翠绿 (Jade green)
    "#b8860b", // 鎏金 (Gold)
    "#7d3c98", // 紫檀 (Rosewood)
    "#d35400", // 赭橙 (Ochre)
    "#1abc9c", // 碧色 (Jade cyan)
    "#c0392b", // 胭脂 (Rouge)
    "#5d6d7e", // 烟灰 (Smoke gray)
    "#e67e22", // 琥珀 (Amber)
    "#2980b9", // 霁蓝 (Sky blue)
    "#8e44ad", // 绛紫 (Deep purple)
  ],
  minimalist: [
    "#3b82f6",
    "#10b981",
    "#6366f1",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
    "#f43f5e",
    "#64748b",
    "#000000",
    "#2dd4bf",
    "#fb923c",
  ],
  business: [
    "#1e40af",
    "#0f766e",
    "#4338ca",
    "#b45309",
    "#be123c",
    "#6d28d9",
    "#0e7490",
    "#9f1239",
    "#334155",
    "#111827",
    "#1d4ed8",
    "#047857",
  ],
  literary: [
    "#059669",
    "#d97706",
    "#be185d",
    "#7c3aed",
    "#0284c7",
    "#ea580c",
    "#4d7c0f",
    "#c026d3",
    "#0891b2",
    "#86198f",
    "#db2777",
    "#7c2d12",
  ],
  tech: [
    "#2563eb",
    "#0ea5e9",
    "#06b6d4",
    "#10b981",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#f43f5e",
    "#6366f1",
    "#14b8a6",
    "#f97316",
    "#84cc16",
  ],
  festive: [
    "#ef4444",
    "#dc2626",
    "#b91c1c",
    "#f59e0b",
    "#d97706",
    "#ea580c",
    "#c2410c",
    "#be123c",
    "#9f1239",
    "#fbbf24",
    "#e11d48",
    "#ca8a04",
    "#db2777",
    "#e91e63",
    "#c2185b",
    "#ad1457",
    "#ff6f00",
    "#ff8f00",
    "#ffa000",
    "#ffb300",
  ],
  travel: [
    "#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#2dd4bf",
    "#67e8f9", "#7dd3fc", "#38bdf8", "#22d3ee", "#0891b2",
    "#5eead4", "#a7f3d0", "#6ee7b7", "#34d399", "#fde68a",
    "#fdba74", "#fb923c", "#f97316", "#ea580c", "#fcd34d",
    "#0284c7", "#0d9488", "#059669", "#1d4ed8", "#7c3aed",
    "#c026d3", "#e11d48", "#d97706", "#84cc16", "#0e7490",
    "#3b82f6", "#8b5cf6", "#ec4899", "#047857", "#c2410c",
    "#115e59", "#15803d", "#1e40af", "#6366f1", "#9333ea",
    // 旅游风1 (8色) — 阳光度假风
    "#f97316", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa",
    "#f472b6", "#fb923c", "#2dd4bf",
    // 旅游风2 (8色) — 极简文艺风  
    "#1e293b", "#475569", "#0f172a", "#334155", "#64748b",
    "#dc2626", "#b91c1c", "#991b1b",
    // 旅游风3 (8色) — 复古探险风
    "#92400e", "#78350f", "#451a03", "#713f12", "#b45309",
    "#d97706", "#a16207", "#854d0e",
  ],
  industry: [
    "#1e40af", "#1e3a5f", "#334155", "#475569", "#1e293b",
    "#0f172a", "#020617", "#3b5998", "#264653", "#2a9d8f",
    "#1b4332", "#0d9488", "#115e59", "#134e4a", "#0f766e",
    "#374151", "#4f46e5", "#4338ca", "#3730a3", "#312e81",
  ],
  agriculture: [
    "#16a34a", "#22c55e", "#15803d", "#166534", "#4ade80",
    "#86efac", "#22d3ee", "#65a30d", "#4d7c0f", "#3f6212",
    "#a3e635", "#84cc16", "#4d7c0f", "#d9f99d", "#fbbf24",
    "#fde68a", "#92400e", "#78350f", "#451a03", "#713f12",
  ],
  government: [
    "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa",
    "#93c5fd", "#0f172a", "#1e293b", "#334155", "#475569",
    "#64748b", "#94a3b8", "#0c4a6e", "#075985", "#0369a1",
    "#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd",
  ],
};

const names: string[] = [
  "经典",
  "雅致",
  "先锋",
  "深邃",
  "晨光",
  "星穹",
  "暖阳",
  "暮色",
  "清泉",
  "破晓",
  "璀璨",
  "幽蓝",
  "晴空",
  "碧波",
  "晨曦",
  "微风",
  "皓月",
  "流云",
  "翠影",
  "丹霞",
];

const travelNames = [
  "晴空", "碧波", "晨曦", "暖阳", "微风",
  "星辰", "皓月", "流云", "翠影", "丹霞",
  "霜叶", "初雪", "远山", "幽谷", "碧潭",
  "朝露", "晚晴", "松涛", "竹韵", "梅香",
  // 新增20款旅游模板名称
  "云海", "日出", "晚霞", "星空", "彩虹",
  "瀑布", "峡谷", "草原", "沙漠", "海岛",
  "古镇", "梯田", "雪山", "湖泊", "森林",
  "海岸", "温泉", "峡谷", "溶洞", "冰川",
];

const travel2Names = [
  "旅游风1-阳光", "旅游风1-海浪", "旅游风1-椰风", "旅游风1-海韵", "旅游风1-蓝梦",
  "旅游风1-粉霞", "旅游风1-橙光", "旅游风1-碧波",
];

const travel3Names = [
  "旅游风2-雪境", "旅游风2-岩灰", "旅游风2-夜航", "旅游风2-山岚", "旅游风2-雾霭",
  "旅游风2-朱砂", "旅游风2-赤焰", "旅游风2-丹霞",
];

const travel4Names = [
  "旅游风3-古道", "旅游风3-驼铃", "旅游风3-沙洲", "旅游风3-碉楼", "旅游风3-琥珀",
  "旅游风3-秋染", "旅游风3-金辉", "旅游风3-褐石",
];

const festivalNames = [
  "春节", "元宵", "端午", "中秋", "重阳",
  "七夕", "腊八", "除夕", "清明", "中元",
  "上巳", "花朝", "寒食", "下元", "冬至",
  "立春", "夏至", "秋分", "元旦", "国庆",
];

const industryNames = [
  "工造", "重器", "智造", "精工", "铸魂",
  "匠心", "钢骨", "蓝图", "引擎", "灯塔",
  "基石", "驱动", "脉动", "枢纽", "脊梁",
  "锻造", "领航", "启航", "飞跃", "征程",
];

const agricultureNames = [
  "春耕", "夏耘", "秋收", "冬藏", "沃土",
  "稻香", "麦浪", "果园", "菜畦", "花田",
  "茶园", "林海", "牧歌", "渔舟", "丝路",
  "良种", "丰年", "绿野", "青山", "碧水",
];

const governmentNames = [
  "政务", "公仆", "廉政", "效能", "阳光",
  "便民", "法治", "智慧", "数字", "服务",
  "改革", "创新", "担当", "务实", "清廉",
  "为民", "透明", "高效", "规范", "诚信",
];

const chineseNames = [
  "红妆", "墨韵", "青花", "金缕", "丹青",
  "水墨", "烟雨", "锦绣", "檀香", "瑞鹤",
  "松风", "竹影",
];

const categoriesList = [
  { id: "neo-brutalism", name: "中国风" },
  { id: "minimalist", name: "极简风" },
  { id: "business", name: "商务风" },
  { id: "literary", name: "文艺风" },
  { id: "tech", name: "科技风" },
  { id: "festive", name: "节庆风" },
  { id: "travel", name: "旅游风" },
  { id: "industry", name: "产业风" },
  { id: "agriculture", name: "农业风" },
  { id: "government", name: "政务风" },
];

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const value = Number.parseInt(fullHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  const safeAlpha = Math.max(0, Math.min(1, Number(alpha.toFixed(3))));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

function getStyleValue(style: string, property: string) {
  const escapedProperty = property.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const match = style.match(new RegExp(`${escapedProperty}\\s*:\\s*([^;]+)`, "i"));
  return match?.[1]?.trim() ?? "";
}

/** 检查 style 字符串中是否存在 background（含 background-color 和 background 简写） */
function hasBackground(style: string): boolean {
  return /background-color\s*:/i.test(style) || /(?<!\w)background\s*:/i.test(style);
}

/**
 * 确保样式属性存在，若不存在则追加。
 * 对 background-color 做了特殊处理：当 style 中有 background 简写（如渐变）
 * 时，先移除 background 简写再设置 background-color，防止简写覆盖单独属性。
 */
function ensureStyleValue(style: string, property: string, value: string) {
  const escapedProperty = property.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`${escapedProperty}\\s*:\\s*[^;]+;?`, "i");

  // 1) 准确匹配到独立属性 → 直接替换
  if (regex.test(style)) {
    return style.replace(regex, `${property}: ${value};`);
  }

  // 2) 设置 background-color 但存在 background: 简写 → 先移除简写再设置
  if (property === "background-color" && /(?<!\w)background\s*:/i.test(style)) {
    const cleaned = style.replace(/(?<!\w)background\s*:\s*[^;]+;?\s*/gi, "").trim();
    const normalized = cleaned.endsWith(";") ? cleaned : `${cleaned}; `;
    return `${normalized} background-color: ${value};`;
  }

  // 3) 没有找到该属性 → 追加
  const normalizedStyle = style.trim();
  if (!normalizedStyle) {
    return `${property}: ${value};`;
  }

  return normalizedStyle.endsWith(";")
    ? `${normalizedStyle} ${property}: ${value};`
    : `${normalizedStyle}; ${property}: ${value};`;
}

function getStylesByCategory(category: string, color: string): Omit<TemplateConfig, "id" | "name" | "desc" | "category"> {
  switch (category) {
    case "neo-brutalism":
      return {
        themeColor: color,
        backgroundColor: "#faf6f0",
        baseStyle: {
          color: "#3c2415",
          fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'STSong', SimSun, serif",
        },
        containerStyle: "padding: 24px; background-color: #faf6f0;",
        h1Style: `font-size: 1.5em; font-weight: 700; text-align: center; margin: 28px 0; color: #faf6f0; background-color: ${color}; padding: 14px 16px; line-height: 1.4; letter-spacing: 3px; border-radius: 2px;`,
        h2Style: `font-size: 1.3em; font-weight: 700; margin: 24px 0 16px; color: #3c2415; padding: 8px 0 8px 14px; border-left: 4px solid ${color}; background-color: ${hexToRgba(color, 0.06)}; line-height: 1.4;`,
        h3Style: `font-size: 1.1em; font-weight: 600; margin: 18px 0 12px; color: ${color}; padding: 0 0 8px 0; border-bottom: 2px solid ${hexToRgba(color, 0.25)}; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.9; text-indent: 2em; color: #3c2415;",
        blockquoteStyle: `margin: 24px 0; padding: 16px 20px; color: #5c4033; background-color: #f0e8dc; border-left: 3px solid ${color}; border-radius: 0 4px 4px 0;`,
        blockquoteInnerBefore: `<span style="display: block; font-size: 2em; line-height: 1; margin-bottom: 8px; color: ${color}; font-family: 'STKaiti', 'KaiTi', serif; opacity: 0.6;">「</span>`,
        blockquoteInnerAfter: `<span style="display: block; font-size: 2em; line-height: 1; text-align: right; margin-top: 8px; color: ${color}; font-family: 'STKaiti', 'KaiTi', serif; opacity: 0.6;">」</span>`,
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: "margin: 0 0 10px 0; line-height: 1.8; color: #3c2415;",
        listIcon: `<section style="display: inline-block; width: 8px; height: 8px; background-color: ${color}; border-radius: 50%; vertical-align: middle; box-sizing: border-box; overflow: hidden;"><br/></section>`,
        strongStyle: `font-weight: 600; color: ${color};`,
        emStyle: `font-style: italic; color: #5c4033;`,
        codeContainerStyle: `margin: 24px 0; border: 1px solid #d4c5a9; border-radius: 4px; background-color: #f5efe6; overflow: hidden;`,
        codeHeaderStyle: `background-color: ${color}; color: #faf6f0; padding: 8px 12px; font-size: 13px; font-weight: 500;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #3c2415; font-size: 13px; font-family: 'Courier New', monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: "max-width: 100%; border: 1px solid #d4c5a9; border-radius: 4px; display: block; margin: 24px auto;",
        hrStyle: `border: none; border-top: 1px solid ${color}; margin: 32px 0; opacity: 0.5;`,
        linkStyle: `color: ${color}; text-decoration: none; border-bottom: 1px solid ${color};`,
        tableStyle:
          "width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; table-layout: fixed; word-wrap: break-word;",
        thStyle: `border: 1px solid ${color}; padding: 10px 12px; background-color: ${color}; color: #faf6f0; font-weight: 600; text-align: left;`,
        tdStyle: "border: 1px solid #d4c5a9; padding: 10px 12px; color: #3c2415;",
        delStyle: "text-decoration: line-through; opacity: 0.5;",
      };
    case "minimalist":
      return {
        themeColor: color,
        backgroundColor: "#ffffff",
        baseStyle: {
          color: "#374151",
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
        containerStyle: "padding: 16px; background-color: #ffffff;",
        h1Style: `font-size: 1.4em; font-weight: bold; text-align: center; margin: 24px 0 16px; color: ${color}; border-bottom: 1px solid ${color}; padding-bottom: 8px; line-height: 1.4;`,
        h2Style: `font-size: 1.25em; font-weight: bold; margin: 24px 0 16px; color: #111827; padding-left: 12px; border-left: 4px solid ${color}; line-height: 1.4;`,
        h3Style: `font-size: 1.1em; font-weight: bold; margin: 16px 0 12px; color: #374151; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.8; text-indent: 0;",
        blockquoteStyle: `border-left: 3px solid ${color}; margin: 20px 0; padding: 12px 16px; color: #4b5563; background-color: #f3f4f6;`,
        blockquoteInnerBefore: "",
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: "margin: 0 0 8px 0; line-height: 1.6;",
        listIcon: `<section style="display: inline-block; color: ${color}; font-weight: bold;">•</section>`,
        strongStyle: `font-weight: bold; color: ${color};`,
        emStyle: "font-style: italic; color: #4b5563;",
        codeContainerStyle: `margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; overflow: hidden; background-color: #f8fafc;`,
        codeHeaderStyle: `background-color: #e2e8f0; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #334155; font-size: 13px; font-family: monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: "max-width: 100%; border-radius: 8px; display: block; margin: 20px auto;",
        hrStyle: `border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;`,
        linkStyle: `color: ${color}; text-decoration: none; border-bottom: 1px dashed ${color};`,
        tableStyle:
          "width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 0.95em; table-layout: fixed; word-wrap: break-word;",
        thStyle: `border-bottom: 2px solid ${color}; padding: 12px 8px; text-align: left; color: #111827; font-weight: bold; margin: 0;`,
        tdStyle:
          "border-bottom: 1px solid #f3f4f6; padding: 12px 8px; color: #4b5563; margin: 0; word-wrap: break-word; word-break: break-all;",
        delStyle: "text-decoration: line-through; color: #9ca3af;",
      };
    case "business":
      return {
        themeColor: color,
        backgroundColor: "#ffffff",
        baseStyle: {
          color: "#334155",
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
        containerStyle: "padding: 20px; background-color: #ffffff;",
        h1Style: `font-size: 1.5em; font-weight: 800; text-align: left; margin: 24px 0 24px 0; color: ${color}; border-bottom: 3px solid ${color}; line-height: 1.4; padding-bottom: 8px;`,
        h2Style: `font-size: 1.2em; font-weight: 700; background-color: ${color}; color: #ffffff; display: inline-block; padding: 6px 16px; margin: 24px 0 16px 0; border-radius: 2px; line-height: 1.4;`,
        h3Style: `font-size: 1.1em; font-weight: bold; margin: 16px 0 12px 0; color: ${color}; border-bottom: 1px dashed ${hexToRgba(color, 0.502)}; padding-bottom: 4px; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.8; text-indent: 2em;",
        blockquoteStyle: `border-left: 6px solid ${color}; margin: 24px 0; padding: 16px; color: #475569; background-color: #f8fafc; font-weight: 500;`,
        blockquoteInnerBefore: "",
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: "margin: 0 0 10px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; color: ${color}; font-size: 12px;">■</section>`,
        strongStyle: `font-weight: bold; color: ${color}; background-color: ${hexToRgba(color, 0.082)}; padding: 0 2px;`,
        emStyle: "font-style: italic; color: #64748b;",
        codeContainerStyle: `margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #475569; overflow: hidden; background-color: #1e293b;`,
        codeHeaderStyle: `background-color: #334155; padding: 8px 12px; font-size: 0; line-height: 1; border-bottom: 1px solid #0f172a;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #f8fafc; font-size: 13px; font-family: monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle:
          "max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; display: block; margin: 20px auto;",
        hrStyle: `border: none; border-top: 2px dashed ${hexToRgba(color, 0.502)}; margin: 32px 0;`,
        linkStyle: `color: ${color}; font-weight: 500; text-decoration: none; border-bottom: 1px solid ${color};`,
        tableStyle:
          "width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #cbd5e1; font-size: 0.9em; table-layout: fixed; word-wrap: break-word;",
        thStyle: `border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc; color: ${color}; font-weight: bold; margin: 0;`,
        tdStyle: `border: 1px solid #cbd5e1; padding: 10px; color: #334155; margin: 0; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #cbd5e1;",
      };
    case "literary":
      return {
        themeColor: color,
        backgroundColor: "#fdfcfb",
        baseStyle: {
          color: "#4b5563",
          fontFamily: '"Noto Serif SC", serif, system-ui',
        },
        containerStyle: `padding: 24px 16px; background-color: #fdfcfb;`,
        h1Style: `font-size: 1.35em; font-weight: normal; text-align: center; margin: 30px 0; color: ${color}; letter-spacing: 4px; line-height: 1.4;`,
        h2Style: `font-size: 1.15em; font-weight: normal; text-align: center; margin: 30px 0 20px; color: ${color}; padding: 8px 0; line-height: 1.4; border-top: 1px solid ${hexToRgba(color, 0.251)}; border-bottom: 1px solid ${hexToRgba(color, 0.251)}; letter-spacing: 2px; display: block;`,
        h3Style: `font-size: 1.05em; font-weight: bold; text-align: center; margin: 20px 0 16px 0; color: #374151; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 20px 0; line-height: 2.0; letter-spacing: 1px;",
        blockquoteStyle: `margin: 32px 0; padding: 20px; color: ${color}; text-align: center; font-style: italic; font-size: 0.95em; border-radius: 8px; background-color: ${hexToRgba(color, 0.031)};`,
        blockquoteInnerBefore: ``,
        blockquoteInnerAfter: ``,
        listStyle: "margin: 0 0 20px 0; padding: 0; list-style-type: none;",
        listItemStyle: `margin: 0 0 12px 0; line-height: 1.8;`,
        listIcon: `<section style="display: inline-block; width: 8px; height: 8px; border: 1px solid ${color}; border-radius: 50%; vertical-align: middle; box-sizing: border-box; overflow: hidden;"><br/></section>`,
        strongStyle: `font-weight: normal; color: #1f2937; border-bottom: 2px solid ${hexToRgba(color, 0.502)};`,
        emStyle: `font-style: italic; color: ${color};`,
        codeContainerStyle: `margin: 24px 0; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.03); border: 1px solid ${hexToRgba(color, 0.188)}; overflow: hidden; background-color: #fdfaf6;`,
        codeHeaderStyle: `background-color: ${hexToRgba(color, 0.063)}; padding: 8px 12px; font-size: 0; line-height: 1; border-bottom: 1px solid ${hexToRgba(color, 0.125)};`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #374151; font-size: 13px; font-family: monospace; white-space: pre-wrap; word-break: break-all; line-height: 1.6;`,
        imgStyle:
          "max-width: 100%; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.05); display: block; margin: 30px auto;",
        hrStyle: `border: none; border-top: 1px solid ${hexToRgba(color, 0.251)}; margin: 32px auto; width: 60%;`,
        linkStyle: `color: ${color}; text-decoration: none; border-bottom: 1px solid ${color}; padding-bottom: 1px;`,
        tableStyle:
          "width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 0.95em; table-layout: fixed; word-wrap: break-word;",
        thStyle: `border-bottom: 1px solid ${color}; padding: 12px; color: ${color}; font-weight: normal; letter-spacing: 1px; text-align: left; margin: 0;`,
        tdStyle: `border-bottom: 1px dashed ${hexToRgba(color, 0.251)}; padding: 12px; color: #4b5563; margin: 0; word-wrap: break-word; word-break: break-all; background-color: #fdfcfb;`,
        delStyle: "text-decoration: line-through; opacity: 0.5;",
      };
    case "tech":
      return {
        themeColor: color,
        backgroundColor: "#0f172a",
        baseStyle: {
          color: "#e5e7eb",
          fontFamily: '"Space Grotesk", sans-serif',
        },
        containerStyle: `padding: 20px; background-color: #0f172a;`,
        h1Style: `font-size: 1.6em; font-weight: bold; text-align: left; margin: 20px 0 32px 0; color: ${color === "#10b981" ? "#3b82f6" : "#10b981"}; text-transform: uppercase; letter-spacing: 2px; line-height: 1.4; border-bottom: 2px solid ${hexToRgba(color, 0.314)}; padding-bottom: 12px;`,
        h2Style: `font-size: 1.25em; font-weight: bold; margin: 30px 0 20px 0; color: #ffffff; border-left: 6px solid ${color}; padding-left: 14px; background-color: #1e293b; display: block; line-height: 1.4; padding-top: 6px; padding-bottom: 6px;`,
        h3Style: `font-size: 1.1em; font-weight: bold; margin: 20px 0 16px 0; color: ${color}; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.8; color: #cbd5e1;",
        blockquoteStyle: `border: 1px solid ${color}; margin: 24px 0; padding: 16px; color: #94a3b8; background-color: #1e293b; border-radius: 4px;`,
        blockquoteInnerBefore: `<span style="color: ${color === "#10b981" ? "#3b82f6" : "#10b981"}; margin-right: 8px;">></span>`,
        blockquoteInnerAfter: ``,
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: `margin: 0 0 10px 0; line-height: 1.7;`,
        listIcon: `<section style="display: inline-block; color: ${color === "#10b981" ? "#3b82f6" : "#10b981"}; font-weight: bold; font-family: monospace;">/&gt;</section>`,
        strongStyle: `font-weight: bold; color: #ffffff; border-bottom: 1px solid ${color};`,
        emStyle: `color: ${color}; font-style: normal; text-decoration: underline; text-decoration-color: ${color};`,
        codeContainerStyle: `margin: 24px 0; border-radius: 6px; border: 1px solid #334155; overflow: hidden; background-color: #000000;`,
        codeHeaderStyle: `background-color: #1e293b; padding: 8px 12px; font-size: 0; line-height: 1; border-bottom: 1px solid #334155;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: ${color === "#10b981" ? "#3b82f6" : "#10b981"}; font-size: 13px; font-family: monospace; white-space: pre-wrap; word-break: break-all; line-height: 1.5;`,
        imgStyle: `max-width: 100%; border: 2px solid #334155; border-radius: 8px; display: block; margin: 24px auto;`,
        hrStyle: `border: none; border-top: 1px solid #334155; margin: 32px 0;`,
        linkStyle: `color: ${color === "#10b981" ? "#3b82f6" : "#10b981"}; text-decoration: underline; text-decoration-style: dashed;`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #334155; font-size: 0.9em; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid #334155; padding: 10px; background-color: #1e293b; color: #ffffff; text-align: left; margin: 0;`,
        tdStyle: `border: 1px solid #334155; padding: 10px; color: #cbd5e1; margin: 0; word-wrap: break-word; word-break: break-all;`,
        delStyle: `text-decoration: line-through; color: #475569;`,
      };
    case "festive":
      return {
        themeColor: color,
        backgroundColor: "#fffbeb",
        baseStyle: { color: "#451a03", fontFamily: "system-ui, sans-serif" },
        containerStyle: `padding: 24px; background-color: #fffbeb; border: 4px solid ${color};`,
        h1Style: `font-size: 1.5em; font-weight: bold; text-align: center; margin: 10px 0 30px 0; color: #ffffff; background-color: ${color}; padding: 12px; border-radius: 8px; letter-spacing: 2px; line-height: 1.4;`,
        h2Style: `font-size: 1.2em; font-weight: bold; text-align: center; background-color: #fef3c7; color: ${color}; border: 2px solid ${color}; margin: 24px auto 20px auto; padding: 8px 24px; border-radius: 20px; display: inline-block; line-height: 1.4;`,
        h3Style: `font-size: 1.1em; font-weight: bold; margin: 16px 0 16px 0; color: ${color}; text-align: center; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.8; text-indent: 2em; color: #78350f;",
        blockquoteStyle: `border: 2px dashed ${color}; border-radius: 8px; margin: 24px 0; padding: 16px; color: #92400e; background-color: #fef3c7; text-align: center; font-weight: 500;`,
        blockquoteInnerBefore: ``,
        blockquoteInnerAfter: ``,
        listStyle: "margin: 0 0 16px 0; padding: 0; color: #78350f; list-style-type: none;",
        listItemStyle: "margin: 0 0 10px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; width: 8px; height: 8px; background-color: #ea580c; transform: rotate(45deg); vertical-align: middle; box-sizing: border-box; overflow: hidden;"><br/></section>`,
        strongStyle: `font-weight: bold; color: ${color};`,
        emStyle: `font-style: italic; color: #b45309;`,
        codeContainerStyle: `margin: 24px 0; border-radius: 8px; border: 2px dashed ${color}; overflow: hidden; background-color: #fef3c7;`,
        codeHeaderStyle: `background-color: #fcd34d; padding: 8px 12px; font-size: 0; line-height: 1; border-bottom: 2px solid ${hexToRgba(color, 0.125)};`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #9f1239; font-size: 13px; font-family: monospace; white-space: pre-wrap; word-break: break-all; line-height: 1.5;`,
        imgStyle: `max-width: 100%; border: 4px solid #fef3c7; border-radius: 12px; display: block; margin: 20px auto;`,
        hrStyle: `border: none; border-top: 2px dashed ${color}; margin: 32px 0;`,
        linkStyle: `color: #9f1239; font-weight: bold; text-decoration: none; border-bottom: 2px solid #fcd34d;`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 2px solid ${color}; font-size: 0.9em; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid ${color}; padding: 10px; background-color: #fef3c7; color: ${color}; font-weight: bold; text-align: center; margin: 0;`,
        tdStyle: `border: 1px solid ${color}; padding: 10px; color: #92400e; margin: 0; word-wrap: break-word; word-break: break-all;`,
        delStyle: `text-decoration: line-through; color: #b45309;`,
      };
    case "travel":
      return {
        themeColor: color,
        backgroundColor: "#f0f9ff",
        baseStyle: { color: "#0c4a6e", fontFamily: "system-ui, sans-serif" },
        containerStyle: `padding: 24px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px;`,
        h1Style: `font-size: 1.5em; font-weight: bold; text-align: center; margin: 10px 0 24px 0; color: #ffffff; background: linear-gradient(135deg, ${color} 0%, ${hexToRgba(color, 0.5)} 100%); padding: 16px; border-radius: 12px; letter-spacing: 1px; line-height: 1.4; box-shadow: 0 4px 12px ${hexToRgba(color, 0.251)};`,
        h2Style: `font-size: 1.2em; font-weight: bold; margin: 24px 0 16px 0; color: ${color}; padding-left: 14px; border-left: 4px solid ${color}; line-height: 1.4;`,
        h3Style: `font-size: 1.05em; font-weight: 600; margin: 16px 0 12px 0; color: #0c4a6e; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 14px 0; line-height: 1.8; color: #1e293b;",
        blockquoteStyle: `border-left: 4px solid ${color}; margin: 20px 0; padding: 14px 18px; color: #475569; background-color: #ffffff; border-radius: 0 8px 8px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.04); font-style: italic;`,
        blockquoteInnerBefore: ``,
        blockquoteInnerAfter: ``,
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: "margin: 0 0 8px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; font-size: 12px; color: ${color};">✦</section>`,
        strongStyle: `font-weight: bold; color: ${color};`,
        emStyle: "font-style: italic; color: #64748b;",
        codeContainerStyle: `margin: 20px 0; border-radius: 10px; border: 1px solid ${hexToRgba(color, 0.314)}; overflow: hidden; background-color: #ffffff;`,
        codeHeaderStyle: `background-color: ${hexToRgba(color, 0.125)}; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #1e293b; font-size: 13px; font-family: monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: `max-width: 100%; border-radius: 12px; display: block; margin: 20px auto; box-shadow: 0 4px 12px ${hexToRgba(color, 0.188)};`,
        hrStyle: `border: none; height: 2px; background: linear-gradient(90deg, transparent, ${color}, transparent); margin: 32px 0;`,
        linkStyle: `color: ${color}; text-decoration: none; border-bottom: 1px dashed ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); table-layout: fixed; word-wrap: break-word;`,
        thStyle: `padding: 12px; background-color: ${color}; color: #ffffff; font-weight: bold; text-align: left;`,
        tdStyle: `border-bottom: 1px solid #e2e8f0; padding: 12px; color: #475569; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #94a3b8;",
      };
    case "industry":
      return {
        themeColor: color,
        backgroundColor: "#f8fafc",
        baseStyle: { color: "#1e293b", fontFamily: "system-ui, sans-serif" },
        containerStyle: `padding: 20px; background-color: #f8fafc;`,
        h1Style: `font-size: 1.4em; font-weight: 800; margin: 20px 0 20px 0; color: #ffffff; background-color: ${color}; padding: 12px 20px; border-radius: 4px; line-height: 1.4; letter-spacing: 1px; text-transform: uppercase;`,
        h2Style: `font-size: 1.15em; font-weight: 700; margin: 24px 0 16px 0; color: #f8fafc; background-color: ${color}; padding: 8px 16px; border-radius: 2px; display: inline-block; line-height: 1.4; letter-spacing: 0.5px;`,
        h3Style: `font-size: 1.05em; font-weight: 700; margin: 16px 0 12px 0; color: ${color}; border-bottom: 2px solid ${hexToRgba(color, 0.314)}; padding-bottom: 4px; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 14px 0; line-height: 1.7; color: #334155; font-size: 0.95em;",
        blockquoteStyle: `border-left: 4px solid ${color}; margin: 24px 0; padding: 14px 18px; color: #475569; background-color: #f1f5f9; font-weight: 500;`,
        blockquoteInnerBefore: "",
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: "margin: 0 0 8px 0; line-height: 1.6;",
        listIcon: `<section style="display: inline-block; width: 8px; height: 8px; background-color: ${color}; border-radius: 50%; vertical-align: middle; box-sizing: border-box; overflow: hidden;"><br/></section>`,
        strongStyle: `font-weight: 700; color: ${color};`,
        emStyle: "font-style: italic; color: #64748b;",
        codeContainerStyle: `margin: 24px 0; border: 1px solid #475569; border-radius: 4px; overflow: hidden; background-color: #1e293b;`,
        codeHeaderStyle: `background-color: #334155; padding: 8px 12px; font-size: 0; line-height: 1; border-bottom: 1px solid #0f172a;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #e2e8f0; font-size: 13px; font-family: monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: `max-width: 100%; border: 1px solid #cbd5e1; display: block; margin: 20px auto;`,
        hrStyle: `border: none; border-top: 1px solid #cbd5e1; margin: 32px 0;`,
        linkStyle: `color: ${color}; font-weight: 600; text-decoration: none; border-bottom: 2px solid ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #cbd5e1; font-size: 0.9em; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid #94a3b8; padding: 10px; background-color: ${color}; color: #ffffff; font-weight: 700; text-align: left;`,
        tdStyle: `border: 1px solid #cbd5e1; padding: 10px; color: #475569; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #94a3b8;",
      };
    case "agriculture":
      return {
        themeColor: color,
        backgroundColor: "#f0fdf4",
        baseStyle: { color: "#14532d", fontFamily: "system-ui, sans-serif" },
        containerStyle: `padding: 20px; background-color: #f0fdf4;`,
        h1Style: `font-size: 1.5em; font-weight: bold; text-align: center; margin: 10px 0 24px 0; color: #ffffff; background: linear-gradient(135deg, ${color} 0%, #15803d 100%); padding: 14px 20px; border-radius: 10px; line-height: 1.4; box-shadow: 0 3px 8px ${hexToRgba(color, 0.251)};`,
        h2Style: `font-size: 1.2em; font-weight: bold; margin: 24px 0 16px 0; color: #166534; background-color: ${hexToRgba(color, 0.125)}; padding: 6px 14px; border-radius: 6px; line-height: 1.4;`,
        h3Style: `font-size: 1.05em; font-weight: 600; margin: 16px 0 12px 0; color: #15803d; border-bottom: 2px solid ${hexToRgba(color, 0.314)}; padding-bottom: 4px; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 14px 0; line-height: 1.8; color: #166534;",
        blockquoteStyle: `border-left: 4px solid ${color}; margin: 24px 0; padding: 14px 18px; color: #14532d; background-color: #dcfce7; border-radius: 0 8px 8px 0;`,
        blockquoteInnerBefore: "",
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: "margin: 0 0 8px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; font-size: 12px; color: ${color};">🌿</section>`,
        strongStyle: `font-weight: bold; color: #15803d;`,
        emStyle: "font-style: italic; color: #166534;",
        codeContainerStyle: `margin: 24px 0; border: 1px solid #86efac; border-radius: 8px; overflow: hidden; background-color: #f0fdf4;`,
        codeHeaderStyle: `background-color: #bbf7d0; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #14532d; font-size: 13px; font-family: monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: `max-width: 100%; border: 2px solid #bbf7d0; border-radius: 10px; display: block; margin: 20px auto;`,
        hrStyle: `border: none; border-top: 2px solid #bbf7d0; margin: 32px 0;`,
        linkStyle: `color: #15803d; text-decoration: none; border-bottom: 1px dashed #86efac;`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #86efac; border-radius: 6px; overflow: hidden; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `padding: 10px; background-color: ${color}; color: #ffffff; font-weight: bold; text-align: left;`,
        tdStyle: `border-bottom: 1px solid #bbf7d0; padding: 10px; color: #14532d; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #86efac;",
      };
    case "government":
      return {
        themeColor: color,
        backgroundColor: "#f8fafc",
        baseStyle: { color: "#1e293b", fontFamily: "system-ui, sans-serif" },
        containerStyle: "padding: 20px; background-color: #f8fafc;",
        h1Style: `font-size: 1.4em; font-weight: 800; text-align: center; margin: 10px 0 24px 0; color: #ffffff; background-color: ${color}; padding: 12px 20px; letter-spacing: 2px; line-height: 1.4; box-shadow: 0 2px 8px rgba(0,0,0,0.1);`,
        h2Style: `font-size: 1.15em; font-weight: 700; margin: 24px 0 16px 0; color: ${color}; border-left: 4px solid ${color}; padding-left: 12px; line-height: 1.4;`,
        h3Style: `font-size: 1.05em; font-weight: 600; margin: 16px 0 12px 0; color: #334155; border-bottom: 1px solid ${hexToRgba(color, 0.3)}; padding-bottom: 4px; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.8; color: #334155; text-indent: 2em;",
        blockquoteStyle: `border-left: 4px solid ${color}; margin: 20px 0; padding: 12px 16px; color: #475569; background-color: #f1f5f9; font-weight: 500;`,
        blockquoteInnerBefore: "",
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: "margin: 0 0 8px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; width: 6px; height: 6px; background-color: ${color}; border-radius: 50%; vertical-align: middle; box-sizing: border-box; overflow: hidden;"><br/></section>`,
        strongStyle: `font-weight: 700; color: ${color};`,
        emStyle: "font-style: italic; color: #64748b;",
        codeContainerStyle: `margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background-color: #f8fafc;`,
        codeHeaderStyle: `background-color: #e2e8f0; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #334155; font-size: 13px; font-family: monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: "max-width: 100%; border: 1px solid #e2e8f0; display: block; margin: 20px auto;",
        hrStyle: `border: none; border-top: 2px solid ${hexToRgba(color, 0.3)}; margin: 32px 0;`,
        linkStyle: `color: ${color}; text-decoration: none; border-bottom: 2px solid ${hexToRgba(color, 0.5)};`,
        tableStyle: "width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 0.95em; table-layout: fixed; word-wrap: break-word;",
        thStyle: `padding: 10px; background-color: ${color}; color: #ffffff; font-weight: 700; text-align: left; border: 1px solid ${hexToRgba(color, 0.8)};`,
        tdStyle: "padding: 10px; border: 1px solid #e2e8f0; color: #334155; word-wrap: break-word; word-break: break-all;",
        delStyle: "text-decoration: line-through; color: #94a3b8;",
      };
    default:
      // 默认返回极简风格
      return getStylesByCategory("minimalist", "#3b82f6");
  }
}

// ── 旅游风 5 套完全差异化样式变体 ──
const TRAVEL_VARIANT_DESCS = [
  "海风——蓝调渐变圆角，清新通透的旅行驾驶感",
  "山行——大地色尖角边框，硬朗户外探险风格",
  "暮光——暖橙色块分割，落日余晖般温暖",
  "星夜——深色背景白字，极简干净星空氛围",
  "绿洲——沙色底调+彩标高亮，轻松假日心情",
];

function getTravelVariant(color: string, base: Omit<TemplateConfig, "id" | "name" | "desc" | "category">, variantIdx: number): Omit<TemplateConfig, "id" | "name" | "desc" | "category"> {
  switch (variantIdx) {
    case 0: return base; // 原始蓝调渐变
    case 1:
      return {
        ...base,
        backgroundColor: "#fafaf9",
        containerStyle: `padding: 24px; background-color: #fafaf9; border: 4px solid ${color};`,
        baseStyle: { color: "#1c1917", fontFamily: '"Helvetica Neue", Arial, sans-serif' },
        h1Style: `font-size: 1.5em; font-weight: 900; text-align: left; margin: 10px 0 24px 0; color: #f8fafc; background-color: ${color}; padding: 16px 20px; border-left: 6px solid ${color}; line-height: 1.3; letter-spacing: 0.5px; text-transform: uppercase;`,
        h2Style: `font-size: 1.2em; font-weight: 800; margin: 24px 0 16px 0; color: ${color}; padding: 8px 0 8px 14px; border-left: 6px solid ${color}; line-height: 1.3; text-transform: uppercase; background-color: transparent;`,
        h3Style: `font-size: 1.05em; font-weight: 700; margin: 16px 0 12px 0; color: ${color}; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 14px 0; line-height: 1.8; color: #292524; font-weight: 500;",
        blockquoteStyle: `border: 3px solid ${color}; margin: 24px 0; padding: 18px; color: #1c1917; background-color: #ffffff; font-weight: 600; font-style: italic;`,
        blockquoteInnerBefore: `<span style="display: block; font-size: 2.5em; line-height: 0.8; color: ${color}; font-family: Georgia, serif;">“</span>`,
        blockquoteInnerAfter: `<span style="display: block; font-size: 2.5em; line-height: 0.8; text-align: right; color: ${color}; font-family: Georgia, serif;">”</span>`,
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: "margin: 0 0 8px 0; line-height: 1.7; font-weight: 500;",
        listIcon: `<section style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border: 2px solid #292524; transform: rotate(45deg); vertical-align: middle; box-sizing: border-box; overflow: hidden;"><br/></section>`,
        strongStyle: `font-weight: 800; color: #1c1917; background-color: ${color}; padding: 0 4px;`,
        emStyle: "font-style: italic; color: #57534e; text-decoration: underline; text-decoration-style: wavy;",
        codeContainerStyle: `margin: 24px 0; border: 3px solid ${color}; background-color: #1c1917; overflow: hidden;`,
        codeHeaderStyle: `background-color: ${color}; padding: 8px 12px; font-size: 0; line-height: 1; border-bottom: 1px solid #44403c;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #e7e5e4; font-size: 13px; font-family: 'Courier New', monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: `max-width: 100%; border: 4px solid ${color}; display: block; margin: 24px auto;`,
        hrStyle: `border: none; border-top: 4px solid ${color}; margin: 36px 0;`,
        linkStyle: `color: ${color}; font-weight: 700; text-decoration: none; border-bottom: 3px solid ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 3px solid ${color}; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 2px solid ${color}; padding: 12px; background-color: ${color}; color: #ffffff; font-weight: 800; text-align: left;`,
        tdStyle: `border: 2px solid ${color}; padding: 12px; color: #1c1917; font-weight: 500;`,
        delStyle: "text-decoration: line-through; opacity: 0.5;",
      };
    case 2:
      return {
        ...base,
        backgroundColor: "#fff7ed",
        containerStyle: `padding: 20px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);`,
        baseStyle: { color: "#7c2d12", fontFamily: 'Georgia, "Times New Roman", serif' },
        h1Style: `font-size: 1.6em; font-weight: 400; text-align: center; margin: 10px 0 28px 0; color: ${color}; border: none; background: linear-gradient(90deg, transparent 5%, ${hexToRgba(color, 0.15)} 5%, ${hexToRgba(color, 0.15)} 95%, transparent 95%); padding: 18px 20px; line-height: 1.4; font-style: italic; letter-spacing: 2px;`,
        h2Style: `font-size: 1.3em; font-weight: 600; margin: 24px 0 16px 0; color: ${color}; text-align: center; padding: 8px 0; border-top: 2px solid ${hexToRgba(color, 0.4)}; border-bottom: 2px solid ${hexToRgba(color, 0.4)}; line-height: 1.4; background: transparent;`,
        h3Style: `font-size: 1.1em; font-weight: 600; margin: 16px 0 12px 0; color: #9a3412; line-height: 1.4; text-align: center;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.9; color: #431407; text-indent: 2em;",
        blockquoteStyle: `border: none; border-left: 4px solid ${color}; margin: 24px 0; padding: 16px 20px; color: ${color}; background-color: #ffedd5; font-style: italic; border-radius: 0 12px 12px 0;`,
        blockquoteInnerBefore: "",
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; color: #431407; list-style-type: none;",
        listItemStyle: "margin: 0 0 10px 0; line-height: 1.8;",
        listIcon: `<section style="display: inline-block; font-size: 14px; color: ${color}; font-style: normal;">✻</section>`,
        strongStyle: `font-weight: 700; color: ${color}; border-bottom: 1px solid ${color};`,
        emStyle: `font-style: italic; color: #9a3412;`,
        codeContainerStyle: `margin: 24px 0; border: 1px solid ${hexToRgba(color, 0.4)}; border-radius: 4px; background-color: #ffedd5; overflow: hidden;`,
        codeHeaderStyle: `background-color: ${hexToRgba(color, 0.2)}; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #431407; font-size: 13px; font-family: 'Courier New', monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: `max-width: 100%; border: 3px solid ${hexToRgba(color, 0.4)}; border-radius: 16px; display: block; margin: 24px auto;`,
        hrStyle: `border: none; height: 2px; background: linear-gradient(90deg, transparent, ${color}, transparent); margin: 36px 0;`,
        linkStyle: `color: ${color}; font-weight: 600; text-decoration: none; border-bottom: 1px solid ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 0.9em; border: 1px solid ${hexToRgba(color, 0.3)}; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid ${color}; padding: 10px; background-color: ${hexToRgba(color, 0.2)}; color: ${color}; font-weight: 600; text-align: center;`,
        tdStyle: `border: 1px solid ${hexToRgba(color, 0.3)}; padding: 10px; color: #431407; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #9a3412;",
      };
    case 3:
      return {
        ...base,
        backgroundColor: "#0f172a",
        baseStyle: { color: "#e2e8f0", fontFamily: '"Helvetica Neue", Arial, sans-serif' },
        containerStyle: `padding: 24px; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); border-radius: 0;`,
        h1Style: `font-size: 1.4em; font-weight: 300; text-align: center; margin: 10px 0 24px 0; color: #ffffff; border-bottom: 1px solid ${hexToRgba(color, 0.5)}; padding: 16px 0; line-height: 1.4; letter-spacing: 3px; text-transform: uppercase; background: transparent;`,
        h2Style: `font-size: 1.15em; font-weight: 400; margin: 24px 0 16px 0; color: #ffffff; padding-left: 12px; border-left: 3px solid ${color}; line-height: 1.4; letter-spacing: 1px; background: transparent;`,
        h3Style: `font-size: 1em; font-weight: 500; margin: 16px 0 12px 0; color: ${color}; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 14px 0; line-height: 1.9; color: #cbd5e1; font-weight: 300;",
        blockquoteStyle: `border: 1px solid ${hexToRgba(color, 0.3)}; margin: 24px 0; padding: 16px 20px; color: #e2e8f0; background-color: ${hexToRgba(color, 0.06)}; font-weight: 300; font-style: italic;`,
        blockquoteInnerBefore: `<span style="display: block; font-size: 2em; line-height: 0.6; color: ${color}; opacity: 0.5; font-family: Georgia, serif;">✦</span>`,
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; color: #cbd5e1; list-style-type: none;",
        listItemStyle: "margin: 0 0 8px 0; line-height: 1.6; font-weight: 300;",
        listIcon: `<section style="display: inline-block; font-size: 10px; color: ${color};">✦</section>`,
        strongStyle: `font-weight: 600; color: #ffffff; border-bottom: 1px solid ${color};`,
        emStyle: "font-style: italic; color: #94a3b8;",
        codeContainerStyle: `margin: 24px 0; border: 1px solid #475569; background-color: #0f172a; overflow: hidden;`,
        codeHeaderStyle: `background-color: #1e293b; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #cbd5e1; font-size: 13px; font-family: 'SF Mono', monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: `max-width: 100%; border: 1px solid ${hexToRgba(color, 0.3)}; border-radius: 4px; display: block; margin: 20px auto;`,
        hrStyle: `border: none; border-top: 1px solid ${hexToRgba(color, 0.3)}; margin: 32px 0;`,
        linkStyle: `color: ${color}; font-weight: 400; text-decoration: none; border-bottom: 1px dashed ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #475569; font-size: 0.9em; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid #475569; padding: 10px; background-color: ${hexToRgba(color, 0.2)}; color: #ffffff; font-weight: 500; text-align: left;`,
        tdStyle: `border: 1px solid #475569; padding: 10px; color: #cbd5e1; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #64748b;",
      };
    case 4:
      return {
        ...base,
        backgroundColor: "#fefce8",
        containerStyle: `padding: 20px; background: linear-gradient(180deg, #fefce8 0%, #fef9c3 30%, #fefce8 100%);`,
        baseStyle: { color: "#292524", fontFamily: '"Helvetica Neue", Arial, sans-serif' },
        h1Style: `font-size: 1.5em; font-weight: 700; text-align: center; margin: 10px 0 24px 0; color: #1c1917; background-color: #ffffff; border: none; border-bottom: 4px solid ${color}; padding: 12px 20px; line-height: 1.4; box-shadow: 0 4px 12px ${hexToRgba(color, 0.12)};`,
        h2Style: `font-size: 1.2em; font-weight: 700; margin: 24px 0 16px 0; color: #1c1917; display: inline-block; padding: 4px 20px 4px 0; border-bottom: 3px solid ${color}; line-height: 1.4; background: transparent;`,
        h3Style: `font-size: 1.05em; font-weight: 600; margin: 16px 0 12px 0; color: ${color}; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 14px 0; line-height: 1.8; color: #44403c;",
        blockquoteStyle: `border: none; border-left: 4px solid ${color}; margin: 20px 0; padding: 14px 18px; color: #57534e; background-color: #fefce8; border-radius: 0 12px 12px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);`,
        blockquoteInnerBefore: "",
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
        listItemStyle: "margin: 0 0 8px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; width: 8px; height: 8px; background-color: ${color}; border-radius: 50%; vertical-align: middle; box-sizing: border-box; overflow: hidden;"><br/></section>`,
        strongStyle: `font-weight: 700; color: #ffffff; background-color: ${color}; padding: 1px 8px; border-radius: 4px;`,
        emStyle: "font-style: italic; color: #78716c;",
        codeContainerStyle: `margin: 20px 0; border: 1px solid #d6d3d1; border-radius: 8px; background-color: #ffffff; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);`,
        codeHeaderStyle: `background-color: #f5f5f4; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #292524; font-size: 13px; font-family: 'SF Mono', monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
        imgStyle: `max-width: 100%; border-radius: 16px; display: block; margin: 20px auto; box-shadow: 0 8px 24px ${hexToRgba(color, 0.15)};`,
        hrStyle: `border: none; border-top: 2px dotted ${hexToRgba(color, 0.4)}; margin: 32px 0;`,
        linkStyle: `color: ${color}; text-decoration: none; border-bottom: 2px dashed ${hexToRgba(color, 0.4)};`,
        tableStyle: "width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); table-layout: fixed; word-wrap: break-word;",
        thStyle: `padding: 12px; background-color: ${color}; color: #ffffff; font-weight: 600; text-align: left;`,
        tdStyle: `border-bottom: 1px solid #e7e5e4; padding: 12px; color: #44403c; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #a8a29e;",
      };
  }
  return base;
}

// ── 旅游风2：阳光度假风格变体 (1种样式 × 8色) ──
const TRAVEL2_DESCS = [
  "阳光度假——暖橙色基调+圆角卡片，热情活力",
];
function getTravel2Variant(color: string, base: Omit<TemplateConfig, "id" | "name" | "desc" | "category">, _idx: number): Omit<TemplateConfig, "id" | "name" | "desc" | "category"> {
  return {
    ...base,
    backgroundColor: "#fff7ed",
    containerStyle: `padding: 24px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);`,
    baseStyle: { color: "#7c2d12", fontFamily: '"Helvetica Neue", Arial, sans-serif' },
    h1Style: `font-size: 1.5em; font-weight: 800; text-align: center; margin: 10px 0 24px 0; color: #ffffff; background: linear-gradient(135deg, ${color} 0%, ${hexToRgba(color, 0.7)} 100%); padding: 16px 20px; border-radius: 12px; line-height: 1.4; letter-spacing: 1px; box-shadow: 0 4px 12px ${hexToRgba(color, 0.3)};`,
    h2Style: `font-size: 1.2em; font-weight: 700; margin: 24px 0 16px 0; color: ${color}; border-left: 4px solid ${color}; padding-left: 12px; line-height: 1.4; background: transparent;`,
    h3Style: `font-size: 1.05em; font-weight: 600; margin: 16px 0 12px 0; color: #9a3412; line-height: 1.4;`,
    h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
    h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
    h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
    pStyle: "margin: 0 0 14px 0; line-height: 1.8; color: #431407;",
    blockquoteStyle: `border-radius: 12px; border: 2px solid ${color}; margin: 20px 0; padding: 16px; color: #7c2d12; background-color: #ffffff;`,
    blockquoteInnerBefore: "",
    blockquoteInnerAfter: "",
    listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
    listItemStyle: "margin: 0 0 8px 0; line-height: 1.7;",
    listIcon: `<section style="display: inline-block; font-size: 12px; color: ${color};">☀</section>`,
    strongStyle: `font-weight: 700; color: #ffffff; background-color: ${color}; padding: 1px 6px; border-radius: 4px;`,
    emStyle: "font-style: italic; color: #9a3412;",
    codeContainerStyle: `margin: 20px 0; border-radius: 12px; border: 1px solid ${hexToRgba(color, 0.3)}; background-color: #ffffff; overflow: hidden;`,
    codeHeaderStyle: `background-color: ${hexToRgba(color, 0.1)}; padding: 8px 12px; font-size: 0; line-height: 1;`,
    codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #431407; font-size: 13px; font-family: 'SF Mono', monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
    imgStyle: `max-width: 100%; border-radius: 12px; display: block; margin: 20px auto; box-shadow: 0 4px 12px ${hexToRgba(color, 0.2)};`,
    hrStyle: `border: none; height: 2px; background: linear-gradient(90deg, transparent, ${color}, transparent); margin: 32px 0;`,
    linkStyle: `color: ${color}; font-weight: 600; text-decoration: none; border-bottom: 2px solid ${color};`,
    tableStyle: "width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); table-layout: fixed; word-wrap: break-word;",
    thStyle: `padding: 12px; background-color: ${color}; color: #ffffff; font-weight: 600; text-align: left;`,
    tdStyle: `border-bottom: 1px solid #fed7aa; padding: 12px; color: #431407;`,
    delStyle: "text-decoration: line-through; color: #c2410c;",
  };
}

// ── 旅游风3：极简文艺风格变体 (1种样式 × 8色) ──
const TRAVEL3_DESCS = [
  "极简文艺——深色底+留白，专注阅读氛围",
];
function getTravel3Variant(color: string, base: Omit<TemplateConfig, "id" | "name" | "desc" | "category">, _idx: number): Omit<TemplateConfig, "id" | "name" | "desc" | "category"> {
  return {
    ...base,
    backgroundColor: "#fafafa",
    containerStyle: `padding: 24px; background-color: #fafafa;`,
    baseStyle: { color: "#1a1a1a", fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif' },
    h1Style: `font-size: 1.4em; font-weight: 700; text-align: center; margin: 10px 0 24px 0; color: ${color}; border: none; padding: 12px 20px; line-height: 1.4; letter-spacing: 2px; border-bottom: 2px solid ${hexToRgba(color, 0.3)}; background: transparent;`,
    h2Style: `font-size: 1.15em; font-weight: 600; margin: 24px 0 16px 0; color: ${color}; border-left: 3px solid ${color}; padding-left: 12px; line-height: 1.4; background: transparent;`,
    h3Style: `font-size: 1em; font-weight: 600; margin: 16px 0 12px 0; color: #1a1a1a; line-height: 1.4;`,
    h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
    h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
    h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
    pStyle: "margin: 0 0 14px 0; line-height: 2; color: #374151;",
    blockquoteStyle: `border: none; border-left: 3px solid ${color}; margin: 20px 0; padding: 12px 18px; color: #6b7280; background-color: #f3f4f6; font-style: italic;`,
    blockquoteInnerBefore: "",
    blockquoteInnerAfter: "",
    listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
    listItemStyle: "margin: 0 0 8px 0; line-height: 1.8;",
    listIcon: `<section style="display: inline-block; width: 4px; height: 4px; background-color: ${color}; border-radius: 50%; vertical-align: middle; box-sizing: border-box; overflow: hidden;"><br/></section>`,
    strongStyle: `font-weight: 700; color: ${color};`,
    emStyle: "font-style: italic; color: #9ca3af;",
    codeContainerStyle: `margin: 20px 0; border: 1px solid #e5e7eb; background-color: #ffffff; overflow: hidden;`,
    codeHeaderStyle: `background-color: #f3f4f6; padding: 8px 12px; font-size: 0; line-height: 1;`,
    codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #1a1a1a; font-size: 13px; font-family: 'SF Mono', monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
    imgStyle: `max-width: 100%; border: 1px solid #e5e7eb; display: block; margin: 20px auto;`,
    hrStyle: `border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;`,
    linkStyle: `color: ${color}; text-decoration: none; border-bottom: 1px solid ${color};`,
    tableStyle: "width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e5e7eb; table-layout: fixed; word-wrap: break-word;",
    thStyle: `border: 1px solid #e5e7eb; padding: 10px; background-color: ${hexToRgba(color, 0.1)}; color: ${color}; font-weight: 600; text-align: left;`,
    tdStyle: `border: 1px solid #e5e7eb; padding: 10px; color: #374151;`,
    delStyle: "text-decoration: line-through; color: #d1d5db;",
  };
}

// ── 旅游风4：复古探险风格变体 (1种样式 × 8色) ──
const TRAVEL4_DESCS = [
  "复古探险——大地色系+粗犷边框，硬朗探险风",
];
function getTravel4Variant(color: string, base: Omit<TemplateConfig, "id" | "name" | "desc" | "category">, _idx: number): Omit<TemplateConfig, "id" | "name" | "desc" | "category"> {
  return {
    ...base,
    backgroundColor: "#faf5eb",
    containerStyle: `padding: 24px; background: linear-gradient(180deg, #faf5eb 0%, #f5e6cc 100%);`,
    baseStyle: { color: "#292524", fontFamily: '"Georgia", "Times New Roman", serif' },
    h1Style: `font-size: 1.5em; font-weight: 700; text-align: center; margin: 10px 0 24px 0; color: #ffffff; background-color: ${color}; padding: 16px 20px; line-height: 1.4; letter-spacing: 1px; border: 3px solid #292524; box-shadow: 4px 4px 0 #292524;`,
    h2Style: `font-size: 1.2em; font-weight: 700; margin: 24px 0 16px 0; color: ${color}; border-bottom: 2px solid ${hexToRgba(color, 0.4)}; padding-bottom: 6px; line-height: 1.4; background: transparent;`,
    h3Style: `font-size: 1.05em; font-weight: 600; margin: 16px 0 12px 0; color: #44403c; line-height: 1.4;`,
    h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
    h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
    h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
    pStyle: "margin: 0 0 14px 0; line-height: 1.9; color: #44403c;",
    blockquoteStyle: `border: 2px solid ${color}; margin: 20px 0; padding: 16px; color: #57534e; background-color: #fffcf5; font-style: italic;`,
    blockquoteInnerBefore: "",
    blockquoteInnerAfter: "",
    listStyle: "margin: 0 0 16px 0; padding: 0; list-style-type: none;",
    listItemStyle: "margin: 0 0 8px 0; line-height: 1.7;",
    listIcon: `<section style="display: inline-block; font-size: 10px; color: ${color};">✦</section>`,
    strongStyle: `font-weight: 700; color: ${color};`,
    emStyle: "font-style: italic; color: #78716c;",
    codeContainerStyle: `margin: 20px 0; border: 2px solid ${color}; background-color: #faf5eb; overflow: hidden;`,
    codeHeaderStyle: `background-color: ${hexToRgba(color, 0.15)}; padding: 8px 12px; font-size: 0; line-height: 1;`,
    codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #292524; font-size: 13px; font-family: 'Courier New', monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-all;`,
    imgStyle: `max-width: 100%; border: 3px solid ${color}; display: block; margin: 20px auto;`,
    hrStyle: `border: none; border-top: 3px double ${hexToRgba(color, 0.4)}; margin: 32px 0;`,
    linkStyle: `color: ${color}; font-weight: 600; text-decoration: none; border-bottom: 2px solid ${color};`,
    tableStyle: "width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 2px solid ${color}; table-layout: fixed; word-wrap: break-word;",
    thStyle: `border: 1px solid ${color}; padding: 10px; background-color: ${color}; color: #ffffff; font-weight: 700; text-align: left;`,
    tdStyle: `border: 1px solid ${hexToRgba(color, 0.3)}; padding: 10px; color: #44403c;`,
    delStyle: "text-decoration: line-through; color: #a8a29e;",
  };
}

// ── 节庆风 5 套完全差异化样式变体 ──
const FESTIVE_VARIANT_DESCS = [
  "红火——深红底色烫金字，经典浓郁节日氛围",
  "金典——黑金撞色横条纹装饰，沉稳大气庆典",
  "夜焰——藏蓝深色底+炫彩点缀，绚烂烟花视觉",
  "春花——淡粉底+花簇装饰，温馨浪漫节庆",
  "古卷——仿羊皮纸底+毛笔字，传统书卷文化味",
];

function getFestiveVariant(color: string, base: Omit<TemplateConfig, "id" | "name" | "desc" | "category">, variantIdx: number): Omit<TemplateConfig, "id" | "name" | "desc" | "category"> {
  switch (variantIdx) {
    case 0:
      return {
        ...base,
        backgroundColor: "#7f1d1d",
        baseStyle: { color: "#fef2f2", fontFamily: '"Helvetica Neue", Arial, sans-serif' },
        containerStyle: `padding: 28px; background: linear-gradient(180deg, #7f1d1d 0%, #991b1b 100%); border: 3px solid ${color};`,
        h1Style: `font-size: 1.6em; font-weight: bold; text-align: center; margin: 10px 0 28px 0; color: #fbbf24; text-shadow: 0 2px 4px rgba(0,0,0,0.3); padding: 14px 20px; border: 2px solid ${color}; line-height: 1.4; letter-spacing: 4px; background: transparent;`,
        h2Style: `font-size: 1.2em; font-weight: bold; text-align: center; margin: 24px auto 20px auto; color: #fbbf24; padding: 6px 20px; display: inline-block; line-height: 1.4; border-bottom: 2px solid ${color}; background: transparent;`,
        h3Style: `font-size: 1.1em; font-weight: bold; margin: 16px 0 12px 0; color: #fbbf24; text-align: center; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.8; color: #fef2f2;",
        blockquoteStyle: `border: 2px solid ${color}; border-radius: 8px; margin: 24px 0; padding: 18px; color: #fef3c7; background-color: rgba(0,0,0,0.2); text-align: center; font-weight: 500;`,
        blockquoteInnerBefore: `<span style="display: block; font-size: 2em; line-height: 0.4; color: ${color};">❝</span>`,
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; color: #fef2f2; list-style-type: none;",
        listItemStyle: "margin: 0 0 10px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; font-size: 12px; color: ${color};">★</section>`,
        strongStyle: `font-weight: bold; color: #fbbf24; text-shadow: 0 1px 2px rgba(0,0,0,0.3); border-bottom: 2px solid ${color};`,
        emStyle: `font-style: italic; color: #fecaca;`,
        codeContainerStyle: `margin: 24px 0; border-radius: 8px; border: 1px solid #fbbf24; overflow: hidden; background-color: rgba(0,0,0,0.3);`,
        codeHeaderStyle: `background-color: rgba(0,0,0,0.3); padding: 8px 12px; font-size: 0; line-height: 1; border-bottom: 1px solid #fbbf24;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #fef3c7; font-size: 13px; font-family: monospace; white-space: pre-wrap; word-break: break-all; line-height: 1.5;`,
        imgStyle: `max-width: 100%; border: 4px solid ${color}; border-radius: 8px; display: block; margin: 24px auto;`,
        hrStyle: `border: none; border-top: 2px dashed ${color}; margin: 36px 0;`,
        linkStyle: `color: #fbbf24; font-weight: bold; text-decoration: none; border-bottom: 2px solid ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 2px solid ${color}; font-size: 0.9em; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid ${color}; padding: 10px; background-color: rgba(0,0,0,0.3); color: ${color}; font-weight: bold; text-align: center;`,
        tdStyle: `border: 1px solid ${color}; padding: 10px; color: #fef2f2; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; opacity: 0.6;",
      };
    case 1:
      return {
        ...base,
        backgroundColor: "#0a0a0a",
        baseStyle: { color: "#f5f5f5", fontFamily: "Georgia, serif" },
        containerStyle: `padding: 24px; background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%); border: 1px solid ${color};`,
        h1Style: `font-size: 1.5em; font-weight: bold; text-align: center; margin: 10px 0 30px 0; color: #ffffff; background: linear-gradient(90deg, transparent 8%, ${color} 8%, ${color} 92%, transparent 92%); padding: 14px 20px; line-height: 1.4; letter-spacing: 3px;`,
        h2Style: `font-size: 1.2em; font-weight: bold; text-align: center; margin: 24px auto 20px auto; color: ${color}; padding: 8px 0; display: inline-block; line-height: 1.4; border-top: 2px solid ${color}; border-bottom: 2px solid ${color}; background: transparent;`,
        h3Style: `font-size: 1.1em; font-weight: bold; margin: 16px 0 12px 0; color: ${color}; text-align: left; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 14px 0; line-height: 1.8; color: #d4d4d4;",
        blockquoteStyle: `border: none; border-left: 6px solid ${color}; margin: 24px 0; padding: 14px 20px; color: #a3a3a3; background-color: rgba(251,191,36,0.05); font-style: italic;`,
        listStyle: "margin: 0 0 16px 0; padding: 0; color: #d4d4d4; list-style-type: none;",
        listItemStyle: "margin: 0 0 8px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; font-size: 10px; color: ${color};">▣</section>`,
        strongStyle: `font-weight: bold; color: ${color};`,
        emStyle: "font-style: italic; color: #a3a3a3;",
        codeContainerStyle: `margin: 24px 0; border: 1px solid #404040; background-color: #171717; overflow: hidden;`,
        codeHeaderStyle: `background-color: #262626; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #a3a3a3; font-size: 13px; font-family: monospace; white-space: pre-wrap; word-break: break-all; line-height: 1.5;`,
        imgStyle: `max-width: 100%; border: 2px solid ${color}; display: block; margin: 24px auto;`,
        hrStyle: `border: none; border-top: 1px solid #404040; margin: 32px 0; position: relative;`,
        linkStyle: `color: ${color}; text-decoration: none; border-bottom: 1px dashed ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #404040; font-size: 0.9em; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid #404040; padding: 10px; background-color: ${color}; color: #0a0a0a; font-weight: bold; text-align: center;`,
        tdStyle: `border: 1px solid #404040; padding: 10px; color: #d4d4d4; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #525252;",
      };
    case 2:
      return {
        ...base,
        backgroundColor: "#0c1929",
        baseStyle: { color: "#cbd5e1", fontFamily: '"Helvetica Neue", Arial, sans-serif' },
        containerStyle: `padding: 24px; background: linear-gradient(180deg, #0c1929 0%, #172033 100%); border: 2px solid ${color}; border-radius: 4px;`,
        h1Style: `font-size: 1.5em; font-weight: bold; text-align: center; margin: 10px 0 24px 0; color: #ffffff; background: linear-gradient(135deg, ${color} 0%, #818cf8 100%); padding: 14px 20px; border-radius: 4px; line-height: 1.4; letter-spacing: 2px; box-shadow: 0 0 20px ${hexToRgba(color, 0.3)};`,
        h2Style: `font-size: 1.2em; font-weight: bold; text-align: center; margin: 24px auto 20px auto; color: #ffffff; padding: 8px 24px; display: inline-block; line-height: 1.4; border: 1px solid ${hexToRgba(color, 0.5)}; border-radius: 4px; background-color: ${hexToRgba(color, 0.1)};`,
        h3Style: `font-size: 1.1em; font-weight: bold; margin: 16px 0 12px 0; color: ${color}; text-align: center; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.8; color: #cbd5e1;",
        blockquoteStyle: `border: 1px solid ${hexToRgba(color, 0.4)}; border-radius: 4px; margin: 24px 0; padding: 16px 20px; color: #e2e8f0; background-color: ${hexToRgba(color, 0.06)}; font-weight: 400;`,
        blockquoteInnerBefore: `<span style="display: block; font-size: 1.5em; line-height: 0.4; color: ${color}; opacity: 0.6;">✦</span>`,
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; color: #cbd5e1; list-style-type: none;",
        listItemStyle: "margin: 0 0 10px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; width: 8px; height: 8px; background-color: ${color}; border-radius: 50%; vertical-align: middle; box-shadow: 0 0 6px ${color}; box-sizing: border-box; overflow: hidden;"><br/></section>`,
        strongStyle: `font-weight: bold; color: #ffffff; background-color: ${hexToRgba(color, 0.2)}; padding: 0 4px; border-radius: 2px;`,
        emStyle: "font-style: italic; color: #94a3b8;",
        codeContainerStyle: `margin: 24px 0; border: 1px solid #475569; background-color: #0f172a; overflow: hidden; border-radius: 4px;`,
        codeHeaderStyle: `background-color: #1e293b; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #cbd5e1; font-size: 13px; font-family: monospace; white-space: pre-wrap; word-break: break-all; line-height: 1.5;`,
        imgStyle: `max-width: 100%; border: 2px solid ${color}; border-radius: 4px; display: block; margin: 24px auto; box-shadow: 0 0 16px ${hexToRgba(color, 0.2)};`,
        hrStyle: `border: none; height: 2px; background: linear-gradient(90deg, transparent, ${color}, transparent); margin: 36px 0;`,
        linkStyle: `color: ${color}; font-weight: bold; text-decoration: none; border-bottom: 1px dashed ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #475569; font-size: 0.9em; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid #475569; padding: 10px; background-color: ${hexToRgba(color, 0.3)}; color: #ffffff; font-weight: bold; text-align: center;`,
        tdStyle: `border: 1px solid #475569; padding: 10px; color: #cbd5e1; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #64748b;",
      };
    case 3:
      return {
        ...base,
        backgroundColor: "#fdf2f8",
        baseStyle: { color: "#831843", fontFamily: '"Helvetica Neue", Arial, sans-serif' },
        containerStyle: `padding: 24px; background: linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%); border: 2px solid ${color}; border-radius: 20px;`,
        h1Style: `font-size: 1.4em; font-weight: 600; text-align: center; margin: 10px 0 24px 0; color: #ffffff; background: linear-gradient(135deg, #ec4899 0%, ${color} 100%); padding: 14px 20px; border-radius: 30px; line-height: 1.4; letter-spacing: 1px;`,
        h2Style: `font-size: 1.15em; font-weight: 600; text-align: center; margin: 24px auto 20px auto; color: ${color}; padding: 6px 20px; display: inline-block; line-height: 1.4; background-color: #ffffff; border: 2px solid ${color}; border-radius: 20px;`,
        h3Style: `font-size: 1.05em; font-weight: 600; margin: 16px 0 12px 0; color: ${color}; text-align: center; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 14px 0; line-height: 1.8; color: #831843;",
        blockquoteStyle: `border: 2px solid ${color}; border-radius: 16px; margin: 24px 0; padding: 16px; color: #9d174d; background-color: #ffffff; text-align: center; font-weight: 400;`,
        listStyle: "margin: 0 0 16px 0; padding: 0; color: #831843; list-style-type: none;",
        listItemStyle: "margin: 0 0 10px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; font-size: 14px; color: ${color};">🌸</section>`,
        strongStyle: `font-weight: bold; color: ${color}; border-bottom: 2px solid ${color};`,
        emStyle: `font-style: italic; color: #db2777;`,
        codeContainerStyle: `margin: 24px 0; border-radius: 12px; border: 1px solid #f9a8d4; background-color: #ffffff; overflow: hidden;`,
        codeHeaderStyle: `background-color: #fce7f3; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #831843; font-size: 13px; font-family: monospace; white-space: pre-wrap; word-break: break-all; line-height: 1.5;`,
        imgStyle: `max-width: 100%; border: 3px solid ${color}; border-radius: 16px; display: block; margin: 24px auto;`,
        hrStyle: `border: none; border-top: 2px dotted ${color}; margin: 32px 0;`,
        linkStyle: `color: ${color}; font-weight: bold; text-decoration: none; border-bottom: 2px solid ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid ${color}; font-size: 0.9em; border-radius: 12px; overflow: hidden; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid ${color}; padding: 10px; background-color: #fce7f3; color: ${color}; font-weight: bold; text-align: center;`,
        tdStyle: `border: 1px solid #fce7f3; padding: 10px; color: #831843; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #db2777;",
      };
    case 4:
      return {
        ...base,
        backgroundColor: "#faf5e7",
        baseStyle: { color: "#292524", fontFamily: '"STKaiti", "KaiTi", "楷体", "Noto Serif SC", serif' },
        containerStyle: `padding: 28px 24px; background: linear-gradient(135deg, #faf5e7 0%, #f5f0e0 100%); border: 3px solid ${color};`,
        h1Style: `font-size: 1.6em; font-weight: 900; text-align: center; margin: 10px 0 28px 0; color: #292524; font-family: "STKaiti", "KaiTi", "楷体", "Noto Serif SC", serif; padding: 16px 20px; line-height: 1.4; letter-spacing: 6px; border: 2px solid ${color}; background: transparent; writing-mode: horizontal-tb;`,
        h2Style: `font-size: 1.3em; font-weight: bold; text-align: center; margin: 24px auto 20px auto; color: ${color}; font-family: "STKaiti", "KaiTi", "楷体", serif; padding: 6px 20px; display: inline-block; line-height: 1.4; border-bottom: 2px solid ${color}; background: transparent;`,
        h3Style: `font-size: 1.1em; font-weight: bold; margin: 16px 0 12px 0; color: #78716c; font-family: "STKaiti", "KaiTi", "楷体", serif; line-height: 1.4;`,
        h4Style: "font-size: 1em; font-weight: bold; margin: 14px 0 10px;",
        h5Style: "font-size: 0.95em; font-weight: bold; margin: 12px 0 8px;",
        h6Style: "font-size: 0.9em; font-weight: bold; margin: 10px 0 6px;",
        pStyle: "margin: 0 0 16px 0; line-height: 1.9; color: #57534e; text-indent: 2em; font-family: system-ui, sans-serif;",
        blockquoteStyle: `border-left: 4px solid ${color}; margin: 24px 0; padding: 14px 18px; color: #57534e; background-color: #f5f0e0; font-style: italic; font-family: "STKaiti", "KaiTi", "楷体", serif;`,
        blockquoteInnerBefore: `<span style="display: block; font-size: 2em; line-height: 0.6; color: ${color}; font-family: Georgia, serif;">“</span>`,
        blockquoteInnerAfter: "",
        listStyle: "margin: 0 0 16px 0; padding: 0; color: #57534e; list-style-type: none;",
        listItemStyle: "margin: 0 0 10px 0; line-height: 1.7;",
        listIcon: `<section style="display: inline-block; width: 8px; height: 8px; background-color: ${color}; transform: rotate(45deg); vertical-align: middle; box-sizing: border-box; overflow: hidden;"><br/></section>`,
        strongStyle: `font-weight: bold; color: ${color}; font-family: "STKaiti", "KaiTi", "楷体", serif;`,
        emStyle: `font-style: italic; color: #78716c;`,
        codeContainerStyle: `margin: 24px 0; border: 1px solid #d4c5a9; background-color: #f5f0e0; overflow: hidden;`,
        codeHeaderStyle: `background-color: #e8dfcc; padding: 8px 12px; font-size: 0; line-height: 1;`,
        codeBlockStyle: `margin: 0; padding: 16px; overflow-x: auto; color: #57534e; font-size: 13px; font-family: "KaiTi", monospace; white-space: pre-wrap; word-break: break-all; line-height: 1.5;`,
        imgStyle: `max-width: 100%; border: 4px solid #e8dfcc; display: block; margin: 24px auto;`,
        hrStyle: `border: none; border-top: 2px dashed #d4c5a9; margin: 36px 0;`,
        linkStyle: `color: ${color}; font-weight: bold; text-decoration: none; border-bottom: 1px solid ${color};`,
        tableStyle: `width: 100%; max-width: 100%; border-collapse: collapse; margin: 24px 0; border: 2px solid #d4c5a9; font-size: 0.9em; table-layout: fixed; word-wrap: break-word;`,
        thStyle: `border: 1px solid #d4c5a9; padding: 10px; background-color: #e8dfcc; color: ${color}; font-weight: bold; text-align: center;`,
        tdStyle: `border: 1px solid #d4c5a9; padding: 10px; color: #57534e; word-wrap: break-word; word-break: break-all;`,
        delStyle: "text-decoration: line-through; color: #a8a29e;",
      };
  }
  return base;
}

function generateTemplates(): TemplateConfig[] {
  const result: TemplateConfig[] = [];

  // 1. 极简风 (Minimalist) - 圆点、清爽边框
  colorPalettes.minimalist.forEach((color, i) => {
    result.push({
      id: `minimalist-${i}`,
      name: names[i]!,
      desc: "标准的点与线排版，适合日常阅读",
      category: "minimalist",
      ...getStylesByCategory("minimalist", color),
    });
  });

  // 2. 商务风 (Business) - 方块、实底、专业
  colorPalettes.business.forEach((color, i) => {
    result.push({
      id: `business-${i}`,
      name: names[i]!,
      desc: "方块标识符，适合严谨的行业报告",
      category: "business",
      ...getStylesByCategory("business", color),
    });
  });

  // 3. 文艺风 (Literary) - 花朵、括号、留白
  colorPalettes.literary.forEach((color, i) => {
    result.push({
      id: `literary-${i}`,
      name: names[i]!,
      desc: "配有小花图标，给文字呼吸喘息的空间",
      category: "literary",
      ...getStylesByCategory("literary", color),
    });
  });

  // 4. 科技风 (Tech) - 尖角、极客终端
  colorPalettes.tech.forEach((color, i) => {
    result.push({
      id: `tech-${i}`,
      name: names[i]!,
      desc: "打破常规的终端 /> 标识设计",
      category: "tech",
      ...getStylesByCategory("tech", color),
    });
  });

  // 5. 节庆风 (Festive) - 5套样式变体
  colorPalettes.festive.forEach((color, i) => {
    const base = getStylesByCategory("festive", color);
    result.push({
      id: `festive-${i}`,
      name: names[i]!,
      desc: FESTIVE_VARIANT_DESCS[i % 5],
      category: "festive",
      ...getFestiveVariant(color, base, i % 5),
    });
  });

  // 6. 中国风 (Chinese Style) - 宣纸底色、宋体排印、典雅装饰
  colorPalettes.neoBrutalism.forEach((color, i) => {
    result.push({
      id: `neo-brutalism-${i}`,
      name: chineseNames[i]!,
      desc: "中国风配色、宣纸底色与典雅宋体，尽显东方韵味",
      category: "neo-brutalism",
      ...getStylesByCategory("neo-brutalism", color),
    });
  });

  // 7. 旅游风 (Travel) - 5套样式变体 (40色)
  colorPalettes.travel.forEach((color, i) => {
    if (i >= 40) return; // 前40个走已有变体
    const base = getStylesByCategory("travel", color);
    result.push({
      id: `travel-${i}`,
      name: travelNames[i]!,
      desc: TRAVEL_VARIANT_DESCS[i % 5],
      category: "travel",
      ...getTravelVariant(color, base, i % 5),
    });
  });

  // 7a. 旅游风1：阳光度假 (8色)
  const travel2Offset = 40;
  for (let i = 0; i < 8; i++) {
    const color = colorPalettes.travel[travel2Offset + i]!;
    const base = getStylesByCategory("travel", color);
    result.push({
      id: `travel2-${i}`,
      name: travel2Names[i]!,
      desc: TRAVEL2_DESCS[0],
      category: "travel",
      ...getTravel2Variant(color, base, i),
    });
  }

  // 7b. 旅游风2：极简文艺 (8色)
  const travel3Offset = 48;
  for (let i = 0; i < 8; i++) {
    const color = colorPalettes.travel[travel3Offset + i]!;
    const base = getStylesByCategory("travel", color);
    result.push({
      id: `travel3-${i}`,
      name: travel3Names[i]!,
      desc: TRAVEL3_DESCS[0],
      category: "travel",
      ...getTravel3Variant(color, base, i),
    });
  }

  // 7c. 旅游风3：复古探险 (8色)
  const travel4Offset = 56;
  for (let i = 0; i < 8; i++) {
    const color = colorPalettes.travel[travel4Offset + i]!;
    const base = getStylesByCategory("travel", color);
    result.push({
      id: `travel4-${i}`,
      name: travel4Names[i]!,
      desc: TRAVEL4_DESCS[0],
      category: "travel",
      ...getTravel4Variant(color, base, i),
    });
  }

  // 8. 产业风 (Industry) - 稳重专业
  colorPalettes.industry.forEach((color, i) => {
    result.push({
      id: `industry-${i}`,
      name: industryNames[i]!,
      desc: "稳重专业的工业色调，适合产业报告",
      category: "industry",
      ...getStylesByCategory("industry", color),
    });
  });

  // 9. 农业风 (Agriculture) - 朴实田园
  colorPalettes.agriculture.forEach((color, i) => {
    result.push({
      id: `agriculture-${i}`,
      name: agricultureNames[i]!,
      desc: "朴实自然的田园色调，适合农业资讯",
      category: "agriculture",
      ...getStylesByCategory("agriculture", color),
    });
  });

  // 10. 政务风 (Government) - 严谨规范
  colorPalettes.government.forEach((color, i) => {
    result.push({
      id: `government-${i}`,
      name: governmentNames[i]!,
      desc: "严谨规范的政务风格，适合政务公开",
      category: "government",
      ...getStylesByCategory("government", color),
    });
  });

  return result;
}

export const allTemplates = generateTemplates();
export const groupedTemplates = categoriesList.map((cat) => ({
  ...cat,
  templates: allTemplates.filter((t) => t.category === cat.id),
}));

// 用户自定义模板分类
export const USER_CATEGORY_ID = "user";
export const USER_CATEGORY_NAME = "我的模板";

/**
 * 合并用户模板到分类列表
 * 用户模板始终在分类列表最后显示
 */
export function mergeUserTemplates(
  baseGrouped: typeof groupedTemplates,
  userTemplates: TemplateConfig[],
) {
  if (!userTemplates || userTemplates.length === 0) return baseGrouped;

  const userGroup = {
    id: USER_CATEGORY_ID,
    name: USER_CATEGORY_NAME,
    templates: userTemplates,
  };

  // 替换已有的 user 分组或追加
  const withoutUser = baseGrouped.filter((g) => g.id !== USER_CATEGORY_ID);
  return [...withoutUser, userGroup];
}

export function renderArticle(
  markdownText: string,
  baseTemplate: TemplateConfig,
  formatTweaks: FormatTweaks,
): string {
  // 用户自定义模板不使用 getStylesByCategory 覆盖样式
  const isUserTemplate = baseTemplate.category === USER_CATEGORY_ID;

  // Use custom theme color if provided (only for built-in templates)
  const template =
    !isUserTemplate && formatTweaks.themeColor
      ? (() => {
          const color = formatTweaks.themeColor;
          const base = getStylesByCategory(baseTemplate.category, color);
          // 提取模板索引以保留样式变体
          const idxMatch = baseTemplate.id.match(/-(\d+)$/);
          const idx = idxMatch ? parseInt(idxMatch[1]) : 0;
          if (baseTemplate.category === "travel") {
            return { ...baseTemplate, ...getTravelVariant(color, base, idx % 5) };
          }
          if (baseTemplate.category === "festive") {
            return { ...baseTemplate, ...getFestiveVariant(color, base, idx % 5) };
          }
          return { ...baseTemplate, ...base };
        })()
      : baseTemplate;

  // 应用快速调色覆盖（直接修改 template 对象，后续渲染自动生效）
  if (formatTweaks.h1TextColor) {
    template.h1Style = ensureStyleValue(
      template.h1Style,
      "color",
      formatTweaks.h1TextColor,
    );
  }
  if (formatTweaks.h2TextColor) {
    template.h2Style = ensureStyleValue(
      template.h2Style,
      "color",
      formatTweaks.h2TextColor,
    );
  }
  if (formatTweaks.paragraphTextColor) {
    template.pStyle = ensureStyleValue(
      template.pStyle,
      "color",
      formatTweaks.paragraphTextColor,
    );
  }

  // 自定义整体背景色
  if (formatTweaks.backgroundColor) {
    template.backgroundColor = formatTweaks.backgroundColor;
    // 更新 containerStyle 中的 background-color（可能有 inline 值或渐变）
    if (template.containerStyle) {
      template.containerStyle = template.containerStyle
        .replace(/background(?:-color)?\s*:\s*[^;]+;?/gi, "")
        .replace(/background:\s*[^;]+;?/gi, "");
      // 追加新的背景色
      template.containerStyle = `${template.containerStyle.trim()} background-color: ${formatTweaks.backgroundColor};`;
    }
  }

  // ── 元素级样式覆盖：背景色 ──
  if (formatTweaks.h1BackgroundColor) {
    template.h1Style = ensureStyleValue(template.h1Style, "background-color", formatTweaks.h1BackgroundColor);
  }
  if (formatTweaks.h2BackgroundColor) {
    template.h2Style = ensureStyleValue(template.h2Style, "background-color", formatTweaks.h2BackgroundColor);
  }
  if (formatTweaks.paragraphBackgroundColor) {
    template.pStyle = ensureStyleValue(template.pStyle, "background-color", formatTweaks.paragraphBackgroundColor);
  }
  if (formatTweaks.blockquoteBackgroundColor) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "background-color", formatTweaks.blockquoteBackgroundColor);
  }

  // ── 元素级样式覆盖：边框色 + 边框样式 ──
  function applyBorderOverride(
    targetStyle: string,
    colorVal: string | undefined,
    styleVal: string | undefined,
  ): string {
    let s = targetStyle;
    if (colorVal) {
      s = ensureStyleValue(s, "border-color", colorVal);
      // 尝试替换 border 简写中的颜色
      s = s.replace(
        /(border\s*:\s*[^;]+?)(\s+#[0-9a-fA-F]{3,8}|\s+rgb[^)]+\))(\s*;)/gi,
        `$1 ${colorVal}$3`,
      );
    }
    if (styleVal) {
      s = ensureStyleValue(s, "border-style", styleVal);
    }
    return s;
  }

  if (formatTweaks.h1BorderColor || formatTweaks.h1BorderStyle) {
    template.h1Style = applyBorderOverride(template.h1Style, formatTweaks.h1BorderColor, formatTweaks.h1BorderStyle);
  }
  if (formatTweaks.h2BorderColor || formatTweaks.h2BorderStyle) {
    template.h2Style = applyBorderOverride(template.h2Style, formatTweaks.h2BorderColor, formatTweaks.h2BorderStyle);
  }
  if (formatTweaks.paragraphBorderColor || formatTweaks.paragraphBorderStyle) {
    template.pStyle = applyBorderOverride(template.pStyle, formatTweaks.paragraphBorderColor, formatTweaks.paragraphBorderStyle);
  }
  if (formatTweaks.blockquoteBorderColor || formatTweaks.blockquoteBorderStyle) {
    template.blockquoteStyle = applyBorderOverride(template.blockquoteStyle, formatTweaks.blockquoteBorderColor, formatTweaks.blockquoteBorderStyle);
  }

  // ── 元素级样式覆盖：圆角 ──
  if (formatTweaks.h1BorderRadius !== undefined) {
    template.h1Style = ensureStyleValue(template.h1Style, "border-radius", `${formatTweaks.h1BorderRadius}px`);
  }
  if (formatTweaks.h2BorderRadius !== undefined) {
    template.h2Style = ensureStyleValue(template.h2Style, "border-radius", `${formatTweaks.h2BorderRadius}px`);
  }
  if (formatTweaks.paragraphBorderRadius !== undefined) {
    template.pStyle = ensureStyleValue(template.pStyle, "border-radius", `${formatTweaks.paragraphBorderRadius}px`);
  }
  if (formatTweaks.blockquoteBorderRadius !== undefined) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "border-radius", `${formatTweaks.blockquoteBorderRadius}px`);
  }

  // ── 元素级样式覆盖：边框宽度 ──
  if (formatTweaks.h1BorderWidth !== undefined) {
    template.h1Style = ensureStyleValue(template.h1Style, "border-width", `${formatTweaks.h1BorderWidth}px`);
  }
  if (formatTweaks.h2BorderWidth !== undefined) {
    template.h2Style = ensureStyleValue(template.h2Style, "border-width", `${formatTweaks.h2BorderWidth}px`);
  }
  if (formatTweaks.paragraphBorderWidth !== undefined) {
    template.pStyle = ensureStyleValue(template.pStyle, "border-width", `${formatTweaks.paragraphBorderWidth}px`);
  }
  if (formatTweaks.blockquoteBorderWidth !== undefined) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "border-width", `${formatTweaks.blockquoteBorderWidth}px`);
  }

  // ── 元素级样式覆盖：内边距 ──
  if (formatTweaks.h1Padding !== undefined) {
    template.h1Style = ensureStyleValue(template.h1Style, "padding", `${formatTweaks.h1Padding}px`);
  }
  if (formatTweaks.h2Padding !== undefined) {
    template.h2Style = ensureStyleValue(template.h2Style, "padding", `${formatTweaks.h2Padding}px`);
  }
  if (formatTweaks.paragraphPadding !== undefined) {
    template.pStyle = ensureStyleValue(template.pStyle, "padding", `${formatTweaks.paragraphPadding}px`);
  }
  if (formatTweaks.blockquotePadding !== undefined) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "padding", `${formatTweaks.blockquotePadding}px`);
  }

  // ── 元素级样式覆盖：外边距 ──
  if (formatTweaks.h1Margin !== undefined) {
    template.h1Style = ensureStyleValue(template.h1Style, "margin", `${formatTweaks.h1Margin}px 0`);
  }
  if (formatTweaks.h2Margin !== undefined) {
    template.h2Style = ensureStyleValue(template.h2Style, "margin", `${formatTweaks.h2Margin}px 0`);
  }
  if (formatTweaks.paragraphMargin !== undefined) {
    template.pStyle = ensureStyleValue(template.pStyle, "margin", `${formatTweaks.paragraphMargin}px 0`);
  }
  if (formatTweaks.blockquoteMargin !== undefined) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "margin", `${formatTweaks.blockquoteMargin}px 0`);
  }

  // ── 元素级样式覆盖：文字阴影 ──
  if (formatTweaks.h1TextShadow) {
    template.h1Style = ensureStyleValue(template.h1Style, "text-shadow", formatTweaks.h1TextShadow);
  }
  if (formatTweaks.h2TextShadow) {
    template.h2Style = ensureStyleValue(template.h2Style, "text-shadow", formatTweaks.h2TextShadow);
  }
  if (formatTweaks.paragraphTextShadow) {
    template.pStyle = ensureStyleValue(template.pStyle, "text-shadow", formatTweaks.paragraphTextShadow);
  }
  if (formatTweaks.blockquoteTextShadow) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "text-shadow", formatTweaks.blockquoteTextShadow);
  }

  // ── 元素级样式覆盖：盒子阴影 ──
  if (formatTweaks.h1BoxShadow) {
    template.h1Style = ensureStyleValue(template.h1Style, "box-shadow", formatTweaks.h1BoxShadow);
  }
  if (formatTweaks.h2BoxShadow) {
    template.h2Style = ensureStyleValue(template.h2Style, "box-shadow", formatTweaks.h2BoxShadow);
  }
  if (formatTweaks.paragraphBoxShadow) {
    template.pStyle = ensureStyleValue(template.pStyle, "box-shadow", formatTweaks.paragraphBoxShadow);
  }
  if (formatTweaks.blockquoteBoxShadow) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "box-shadow", formatTweaks.blockquoteBoxShadow);
  }

  // ── 元素级样式覆盖：透明度 ──
  if (formatTweaks.h1Opacity !== undefined) {
    template.h1Style = ensureStyleValue(template.h1Style, "opacity", String(formatTweaks.h1Opacity));
  }
  if (formatTweaks.h2Opacity !== undefined) {
    template.h2Style = ensureStyleValue(template.h2Style, "opacity", String(formatTweaks.h2Opacity));
  }
  if (formatTweaks.paragraphOpacity !== undefined) {
    template.pStyle = ensureStyleValue(template.pStyle, "opacity", String(formatTweaks.paragraphOpacity));
  }
  if (formatTweaks.blockquoteOpacity !== undefined) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "opacity", String(formatTweaks.blockquoteOpacity));
  }

  // ── 元素级样式覆盖：变换 ──
  if (formatTweaks.h1Transform) {
    template.h1Style = ensureStyleValue(template.h1Style, "transform", formatTweaks.h1Transform);
  }
  if (formatTweaks.h2Transform) {
    template.h2Style = ensureStyleValue(template.h2Style, "transform", formatTweaks.h2Transform);
  }
  if (formatTweaks.paragraphTransform) {
    template.pStyle = ensureStyleValue(template.pStyle, "transform", formatTweaks.paragraphTransform);
  }
  if (formatTweaks.blockquoteTransform) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "transform", formatTweaks.blockquoteTransform);
  }

  // ── 元素级样式覆盖：过渡 ──
  if (formatTweaks.h1Transition) {
    template.h1Style = ensureStyleValue(template.h1Style, "transition", formatTweaks.h1Transition);
  }
  if (formatTweaks.h2Transition) {
    template.h2Style = ensureStyleValue(template.h2Style, "transition", formatTweaks.h2Transition);
  }
  if (formatTweaks.paragraphTransition) {
    template.pStyle = ensureStyleValue(template.pStyle, "transition", formatTweaks.paragraphTransition);
  }
  if (formatTweaks.blockquoteTransition) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "transition", formatTweaks.blockquoteTransition);
  }

  // ── 元素级样式覆盖：动画 ──
  if (formatTweaks.h1Animation) {
    template.h1Style = ensureStyleValue(template.h1Style, "animation", formatTweaks.h1Animation);
  }
  if (formatTweaks.h2Animation) {
    template.h2Style = ensureStyleValue(template.h2Style, "animation", formatTweaks.h2Animation);
  }
  if (formatTweaks.paragraphAnimation) {
    template.pStyle = ensureStyleValue(template.pStyle, "animation", formatTweaks.paragraphAnimation);
  }
  if (formatTweaks.blockquoteAnimation) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "animation", formatTweaks.blockquoteAnimation);
  }

  // ── 元素级样式覆盖：滤镜 ──
  if (formatTweaks.h1Filter) {
    template.h1Style = ensureStyleValue(template.h1Style, "filter", formatTweaks.h1Filter);
  }
  if (formatTweaks.h2Filter) {
    template.h2Style = ensureStyleValue(template.h2Style, "filter", formatTweaks.h2Filter);
  }
  if (formatTweaks.paragraphFilter) {
    template.pStyle = ensureStyleValue(template.pStyle, "filter", formatTweaks.paragraphFilter);
  }
  if (formatTweaks.blockquoteFilter) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "filter", formatTweaks.blockquoteFilter);
  }

  // ── 元素级样式覆盖：混合模式 ──
  if (formatTweaks.h1MixBlendMode) {
    template.h1Style = ensureStyleValue(template.h1Style, "mix-blend-mode", formatTweaks.h1MixBlendMode);
  }
  if (formatTweaks.h2MixBlendMode) {
    template.h2Style = ensureStyleValue(template.h2Style, "mix-blend-mode", formatTweaks.h2MixBlendMode);
  }
  if (formatTweaks.paragraphMixBlendMode) {
    template.pStyle = ensureStyleValue(template.pStyle, "mix-blend-mode", formatTweaks.paragraphMixBlendMode);
  }
  if (formatTweaks.blockquoteMixBlendMode) {
    template.blockquoteStyle = ensureStyleValue(template.blockquoteStyle, "mix-blend-mode", formatTweaks.blockquoteMixBlendMode);
  }

  // ── 自定义 CSS：追加到模板样式尾部（用于用户手动微调）──
  if (formatTweaks.h1CustomCss) {
    template.h1Style += ` ${formatTweaks.h1CustomCss}`;
  }
  if (formatTweaks.h2CustomCss) {
    template.h2Style += ` ${formatTweaks.h2CustomCss}`;
  }
  if (formatTweaks.paragraphCustomCss) {
    template.pStyle += ` ${formatTweaks.paragraphCustomCss}`;
  }
  if (formatTweaks.blockquoteCustomCss) {
    template.blockquoteStyle += ` ${formatTweaks.blockquoteCustomCss}`;
  }

  const customRenderer = new marked.Renderer();
  const defaultRenderer = new marked.Renderer();

  const tuneBlockStyle = (
    style: string,
    options: {
      lineHeight?: boolean;
      paragraphSpacing?: boolean;
      firstLineIndent?: boolean;
      letterSpacing?: boolean;
    } = {},
  ) => {
    let nextStyle = style;

    if (options.lineHeight) {
      nextStyle = ensureStyleValue(nextStyle, "line-height", String(formatTweaks.lineHeight));
    }

    if (options.paragraphSpacing) {
      nextStyle = ensureStyleValue(nextStyle, "margin", `0 0 ${formatTweaks.paragraphSpacing}px 0`);
    }

    if (options.firstLineIndent) {
      nextStyle = ensureStyleValue(
        nextStyle,
        "text-indent",
        formatTweaks.firstLineIndent ? "2em" : "0",
      );
    }

    if (options.letterSpacing) {
      nextStyle = ensureStyleValue(nextStyle, "letter-spacing", `${formatTweaks.letterSpacing}px`);
    }

    return nextStyle;
  };

  const paragraphStyle = tuneBlockStyle(template.pStyle, {
    lineHeight: true,
    paragraphSpacing: true,
    firstLineIndent: true,
    letterSpacing: true,
  });

  const listItemStyle = tuneBlockStyle(template.listItemStyle, {
    lineHeight: true,
    letterSpacing: true,
  });

  const blockquoteStyle = tuneBlockStyle(template.blockquoteStyle, {
    lineHeight: true,
    letterSpacing: true,
  });

  const imageStyle = ensureStyleValue(
    template.imgStyle,
    "border-radius",
    `${formatTweaks.imageRadius}px`,
  );
  // 统一图片样式：删除固定 width，确保 max-width:100% + height:auto
  // 防止微信编辑器对小于200px的图片错误缩放（缩小一半+靠右）
  let safeImageStyle = imageStyle;
  // 删除固定 width，让 max-width:100% 控制宽度
  safeImageStyle = safeImageStyle.replace(/width\s*:\s*\d+px\s*;?\s*/gi, "");
  // 确保 max-width:100% 和 height:auto
  if (!/max-width\s*:/i.test(safeImageStyle)) {
    safeImageStyle = `max-width: 100%; ${safeImageStyle}`;
  }
  if (!/height\s*:/i.test(safeImageStyle)) {
    safeImageStyle = `${safeImageStyle} height: auto;`;
  } else {
    // 有 height 但不是 auto 的，统一改为 auto
    safeImageStyle = safeImageStyle.replace(/height\s*:\s*\d+px\s*;?\s*/gi, "");
    safeImageStyle = `${safeImageStyle} height: auto;`;
  }

  // Adds background-color to a style string only when it doesn't already have one.
  // This distributes the article background across individual block elements so that
  // even if WeChat's paste handler strips the outer section background, each content
  // block still shows the correct color. Crucially, it also removes the need for a
  // monolithic <table> wrapper, which was blocking WeChat's smart-ad system from
  // finding paragraph break points inside the article.
  const bgFallback = (style: string): string => {
    if (hasBackground(style)) return style;
    const trimmed = style.trimEnd();
    return `${trimmed}${trimmed.endsWith(";") ? " " : "; "}background-color: ${template.backgroundColor};`;
  };

  customRenderer.heading = function (token: Tokens.Heading) {
    const depth = token.depth;
    const textHtml = this.parser.parseInline(token.tokens);

    let baseStyle = "";
    if (depth === 1) baseStyle = template.h1Style;
    else if (depth === 2) baseStyle = template.h2Style;
    else if (depth === 3) baseStyle = template.h3Style;
    else if (depth === 4) baseStyle = template.h4Style || template.h3Style;
    else if (depth === 5) baseStyle = template.h5Style || template.h3Style;
    else baseStyle = template.h6Style || template.h3Style;

    const s = bgFallback(baseStyle);

    // Extract margin and align
    const marginMatch = s.match(/margin\s*:\s*([^;]+)/i);
    const margin = marginMatch ? marginMatch[1] : (depth === 1 ? "32px 0" : "24px 0");
    const cleanStyle = s.replace(/margin\s*:\s*[^;]+;?/gi, "margin: 0;");
    
    const textAlignMatch = cleanStyle.match(/text-align\s*:\s*([^;]+)/i);
    const textAlign = textAlignMatch ? textAlignMatch[1] : (depth === 1 ? "center" : "left");

    const isInline = cleanStyle.includes("display: inline-block");

    // Use robust nested section structure for WeChat to avoid text displacement
    if (isInline) {
      return `<section style="margin: ${margin}; text-align: ${textAlign};">
        <section style="${cleanStyle} display: inline-block; text-align: left;">
          <section style="margin: 0; padding: 0; font-size: 1em; font-weight: inherit; line-height: 1.4; background: none; border: none; color: inherit;">
            ${textHtml}
          </section>
        </section>
      </section>`;
    }

    return `<section style="margin: ${margin}; text-align: ${textAlign};">
      <section style="${cleanStyle}">
        <section style="margin: 0; padding: 0; font-size: 1em; font-weight: inherit; line-height: 1.4; background: none; border: none; color: inherit;">
          ${textHtml}
        </section>
      </section>
    </section>`;
  };

  customRenderer.paragraph = function (token: Tokens.Paragraph) {
    const html = defaultRenderer.paragraph.call(this, token);

    // Check for multi-image row (only contains images and optional whitespaces/breaks)
    const pContent = html
      .trim()
      .replace(/^<p[^>]*>/i, "")
      .replace(/<\/p>$/i, "");
    const textWithoutImg = pContent
      .replace(/<img[^>]*>/gi, "")
      .replace(/<br\s*\/?>/gi, "")
      .trim();

    if (textWithoutImg === "") {
      const imagesMatch = pContent.match(/<img[^>]*>/gi);
      if (imagesMatch && imagesMatch.length > 1) {
        // Multi-image layout using inline-block (Highly compatible, avoids table and flex)
        const gapWidth = 4;
        const imgCount = imagesMatch.length;
        const widthPercent = (100 / imgCount) - 1.5;

        const flexItems = imagesMatch
          .map((imgHtml: string) => {
            // 统一移除固定 width/height，确保 max-width:100% + height:auto
            const styledImg = imgHtml.replace(
              /style="([^"]*)"/i,
              (m, existingStyle) => {
                let s = existingStyle
                  .replace(/width\s*:\s*\d+px\s*;?\s*/gi, "")
                  .replace(/height\s*:\s*\d+px\s*;?\s*/gi, "");
                if (!/max-width\s*:/.test(s)) s += "; max-width: 100%";
                if (!/height\s*:/.test(s)) s += "; height: auto";
                return `style="width: 100%; height: auto; object-fit: cover; border-radius: ${formatTweaks.imageRadius}px; display: block; vertical-align: middle; max-width: 100%;"`;
              },
            );
            return `<section style="display: inline-block; width: ${widthPercent}%; padding: 0 ${gapWidth}px; box-sizing: border-box; vertical-align: top;">${styledImg}</section>`;
          })
          .join("");

        return `<section style="text-align: center; margin: 0 0 16px 0; line-height: 0;">${flexItems}</section>`;
      }

      // 单张图片段落：去掉所有多余 margin，不留空行
      if (imagesMatch && imagesMatch.length === 1) {
        const imgHtml = imagesMatch[0].replace(
          /style="([^"]*)"/i,
          (m, existingStyle) => {
            let s = existingStyle
              .replace(/width\s*:\s*\d+px\s*;?\s*/gi, "")
              .replace(/margin[^;]*;?\s*/gi, "")
              .replace(/display\s*:\s*[^;]+;?\s*/gi, "")
              .replace(/vertical-align\s*:\s*[^;]+;?\s*/gi, "");
            if (!/max-width\s*:/.test(s)) s += "; max-width: 100%";
            if (!/height\s*:/.test(s)) s += "; height: auto";
            return `style="width: 100%; height: auto; object-fit: cover; border-radius: ${formatTweaks.imageRadius}px; display: block; max-width: 100%;"`;
          },
        );
        return `<section style="text-align: center; line-height: 0;">${imgHtml}</section>`;
      }
    }

    return html.replace(/^<p[^>]*>/i, `<p style="${bgFallback(paragraphStyle)}">`);
  };

  customRenderer.blockquote = function (token: Tokens.Blockquote) {
    let html = defaultRenderer.blockquote.call(this, token);
    html = html.replace(
      /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i,
      (m: string, inner: string) => {
        inner = inner.replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, "<br>");
        inner = inner.replace(/(<br>)+$/i, "");
        return (
          `<blockquote style="${blockquoteStyle}">` +
          template.blockquoteInnerBefore +
          inner +
          template.blockquoteInnerAfter +
          `</blockquote>`
        );
      },
    );
    return html;
  };

  // 列表最外层
  customRenderer.list = function (token: Tokens.List) {
    const ordered = token.ordered;
    const start = token.start || 1;
    
    const itemsHtml = token.items.map((item, index) => {
      // Use block parser for list item content
      let inner = this.parser.parse(item.tokens);
      // Clean up paragraph margins for the first element
      inner = inner.replace(/^<p style="([^"]*)"/i, (m: string, s: string) => {
        const cleanS = s.replace(/margin\s*:\s*[^;]+;?/gi, "margin: 0;");
        return `<p style="${cleanS}"`;
      });
      inner = inner.replace(/<input disabled="" type="checkbox">/gi, "");

      let icon = "";
      if (item.task) {
        icon = item.checked
          ? `<section style="display: inline-block; width: 14px; height: 14px; line-height: 14px; text-align: center; border: 2px solid #000000; background-color: #10b981; color: #000000; font-size: 10px; font-weight: bold; margin-top: 4px; box-sizing: border-box;">√</section>`
          : `<section style="display: inline-block; width: 14px; height: 14px; border: 2px solid #000000; background-color: #ffffff; margin-top: 4px; box-sizing: border-box; overflow: hidden;"><br/></section>`;
      } else if (ordered) {
        const num = start + index;
        if (template.category === "neo-brutalism") {
          icon = `<section style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; background-color: ${template.themeColor}; color: #faf6f0; font-size: 12px; font-weight: 600; border-radius: 3px; font-family: 'STKaiti', 'KaiTi', serif; box-sizing: border-box; overflow: hidden;">${num}</section>`;
        } else {
          icon = `<section style="display: inline-block; color: ${template.themeColor}; font-weight: bold; font-family: sans-serif;">${num}.</section>`;
        }
      } else {
        icon = template.listIcon;
      }

      const iconWidth = template.category === "neo-brutalism" ? 28 : 24;

      // Extremely robust float layout for WeChat Official Accounts
      return `<section style="display: block; clear: both; margin-bottom: 12px;">
        <section style="float: left; width: ${iconWidth}px; box-sizing: border-box;">
          <section style="text-align: left;">${icon}</section>
        </section>
        <section style="margin-left: ${iconWidth}px; box-sizing: border-box; overflow: hidden;">
          <section style="display: block; overflow: hidden;">
            ${inner}
          </section>
        </section>
        <section style="display: block; clear: both; height: 0; line-height: 0; font-size: 0; overflow: hidden;"></section>
      </section>`;
    }).join("");

    return `<section style="${bgFallback(template.listStyle)} padding: 0; margin: 20px 0 16px 0;">${itemsHtml}</section>`;
  };

  customRenderer.strong = function (token: Tokens.Strong) {
    const html = defaultRenderer.strong.call(this, token);
    return html.replace(/^<strong[^>]*>/i, `<strong style="${template.strongStyle}">`);
  };

  customRenderer.em = function (token: Tokens.Em) {
    const html = defaultRenderer.em.call(this, token);
    return html.replace(/^<em[^>]*>/i, `<em style="${template.emStyle}">`);
  };

  customRenderer.codespan = function (token: Tokens.Codespan) {
    const html = defaultRenderer.codespan.call(this, token);
    const inlineCodeStyle = `background-color: #f1f5f9; color: ${template.themeColor}; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; margin: 0 2px;`;
    return html.replace(/^<code[^>]*>/i, `<code style="${inlineCodeStyle}">`);
  };

  customRenderer.code = function (token: Tokens.Code) {
    const rawCode = token.text;
    const escapedCode = rawCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const macHeader = `<svg width="42" height="12" viewBox="0 0 42 12" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="6" fill="#ff5f56"/><circle cx="21" cy="6" r="6" fill="#ffbd2e"/><circle cx="36" cy="6" r="6" fill="#27c93f"/></svg>`;
    const headerBg =
      template.codeHeaderStyle.match(/background-color:\s*([^;]+)/i)?.[1] || "#e2e8f0";
    const headerPadding = template.codeHeaderStyle.match(/padding:\s*([^;]+)/i)?.[1] || "8px 12px";
    const headerBorder = template.codeHeaderStyle.match(/border-bottom:\s*([^;]+)/i)?.[1] || "";
    const headerBorderStyle = headerBorder ? `border-bottom: ${headerBorder};` : "";
    return `<section style="${template.codeContainerStyle}"><section style="background-color: ${headerBg}; padding: ${headerPadding}; ${headerBorderStyle}">${macHeader}</section><section style="padding: 0; margin: 0;"><pre style="${template.codeBlockStyle}"><code>${escapedCode}</code></pre></section></section>`;
  };

  // 微信图片域名列表
  const WECHAT_IMAGE_DOMAINS = [
    "mmbiz.qpic.cn",
    "wx.qlogo.cn",
    "qpic.cn",
    "m.qpic.cn",
    "res.wx.qq.com",
    "mmbiz.us",
    "mmsns.qpic.cn",
    "snp.qq.com",
    "pub.qq.com",
    "shp.qpic.cn",
    "mp.weixin.qq.com",
  ];

  function isWechatImageUrl(url: string): boolean {
    return WECHAT_IMAGE_DOMAINS.some(domain => url.includes(domain));
  }

  customRenderer.image = function (token: Tokens.Image) {
    const html = defaultRenderer.image.call(this, token);
    const href = token.href || "";

    // 微信图片：不发送 Referer 头以规避防盗链，直接加载原始 URL
    if (isWechatImageUrl(href)) {
      return html.replace(
        /^<img([^>]*)>/i,
        `<img$1 data-src="${href}" src="${href}" referrerpolicy="no-referrer" style="${safeImageStyle}" class="wechat-proxy-image" />`,
      );
    }

    return html.replace(/^<img([^>]*)>/i, `<img$1 referrerpolicy="no-referrer" style="${safeImageStyle}" />`);
  };

  customRenderer.hr = function () {
    return `<hr style="${template.hrStyle}" />`;
  };

  customRenderer.link = function (token: Tokens.Link) {
    const html = defaultRenderer.link.call(this, token);
    return html.replace(/^<a([^>]*)>/i, `<a$1 style="${template.linkStyle}">`);
  };

  customRenderer.table = function (token: Tokens.Table) {
    const html = defaultRenderer.table.call(this, token);
    const tableStyle = ensureStyleValue(
      template.tableStyle,
      "background-color",
      template.backgroundColor,
    );
    return html.replace(
      /^<table[^>]*>/i,
      `<table cellpadding="0" cellspacing="0" border="0" style="${tableStyle}">`,
    );
  };

  customRenderer.tablerow = function (token: Tokens.TableRow) {
    return defaultRenderer.tablerow.call(this, token);
  };

  customRenderer.tablecell = function (token: Tokens.TableCell) {
    const html = defaultRenderer.tablecell.call(this, token);
    const isHeader = token.header;
    let style = isHeader ? template.thStyle : template.tdStyle;
    const fallbackCellBackground = isHeader
      ? getStyleValue(template.thStyle, "background-color") || template.backgroundColor
      : getStyleValue(template.tdStyle, "background-color") || template.backgroundColor;

    style = ensureStyleValue(style, "background-color", fallbackCellBackground);

    if (token.align) {
      style = style.trim().endsWith(";")
        ? `${style} text-align: ${token.align};`
        : `${style}; text-align: ${token.align};`;
    }

    const tag = isHeader ? "th" : "td";
    const bgColor = getStyleValue(style, "background-color") || template.backgroundColor;

    return html.replace(
      new RegExp(`^<${tag}[^>]*>`, "i"),
      `<${tag} bgcolor="${bgColor}" style="${style}">`,
    );
  };

  customRenderer.del = function (token: Tokens.Del) {
    const html = defaultRenderer.del.call(this, token);
    return html.replace(/^<del[^>]*>/i, `<del style="${template.delStyle}">`);
  };

  customRenderer.checkbox = function (token: Tokens.Checkbox) {
    return token.checked
      ? '<span style="display: inline-block; width: 12px; height: 12px; line-height: 12px; text-align: center; border: 1px solid #10b981; color: #10b981; font-size: 10px; font-weight: bold; margin-right: 4px;">x</span>'
      : '<span style="display: inline-block; width: 12px; height: 12px; border: 1px solid #9ca3af; margin-right: 4px;"></span>';
  };

  marked.setOptions({
    renderer: customRenderer,
    breaks: true,
    gfm: true,
  });

  const innerHtml = marked.parse(markdownText) as string;
  const articleContainerStyle = ensureStyleValue(
    ensureStyleValue(
      `${template.containerStyle} font-size: ${formatTweaks.fontSize}px; line-height: ${formatTweaks.lineHeight}; letter-spacing: ${formatTweaks.letterSpacing}px; color: ${template.baseStyle.color}; font-family: ${template.baseStyle.fontFamily}; word-wrap: break-word; word-break: break-all; box-sizing: border-box;`,
      "padding",
      `${formatTweaks.pagePaddingTop}px ${formatTweaks.pagePaddingRight}px ${formatTweaks.pagePaddingBottom}px ${formatTweaks.pagePaddingLeft}px`,
    ),
    "background-color",
    template.backgroundColor,
  );

  const rawHtml = `<section style="width: 100%; max-width: 100%; box-sizing: border-box; background-color: ${template.backgroundColor};"><section style="${articleContainerStyle}">${innerHtml}</section></section>`;

  // 微信公众号兼容性后处理
  return wechatCompatPostProcess(rawHtml, formatTweaks);
}

/**
 * 微信公众号粘贴兼容性后处理
 *
 * 微信编辑器在粘贴 HTML 时会进行的操作：
 * - 移除 <style>/<link>/<script> 标签
 * - 移除 class/id/data-* 属性（保留部分 style）
 * - 覆盖 font-size、line-height、color、background-color
 * - 可能移除 rgba() 颜色值
 * - 修改 img 的 width/height
 * - 对 inline-block 元素添加额外间隙
 * - 忽略 position: absolute/fixed
 *
 * 本函数增强关键样式的稳定性，确保粘贴后视觉效果与预览一致。
 */
function wechatCompatPostProcess(html: string, tweaks: FormatTweaks): string {
  let result = html;

  // 0. 移除所有 <script> 标签（防止 React dangerouslySetInnerHTML 报错）
  result = result.replace(/<script[\s\S]*?<\/script>/gi, "");
  result = result.replace(/<script[^>]*\/>/gi, "");

  // 1. 为所有带 style 的 <section> 添加 !important 保护关键属性
  result = result.replace(
    /(<section[^>]*style=")([^"]*)("[^>]*>)/gi,
    (_match, prefix: string, styleBody: string, suffix: string) => {
      const protectedStyle = protectImportantProps(styleBody);
      return `${prefix}${protectedStyle}${suffix}`;
    },
  );

  // 2. 为所有 <img> 确保 max-width: 100% 和 height: auto，删除固定 width/height
  result = result.replace(
    /(<img[^>]*)(style=")([^"]*)("[^>]*\/?>)/gi,
    (_match, before, _stylePrefix, styleBody, suffix) => {
      let s = styleBody;
      // 删除所有固定 width 和 height，让图片自适应
      s = s.replace(/width\s*:\s*\d+px\s*;?\s*/gi, "");
      s = s.replace(/height\s*:\s*\d+px\s*;?\s*/gi, "");
      if (!/max-width\s*:/.test(s)) s += "; max-width: 100%";
      if (!/height\s*:/.test(s)) s += "; height: auto";
      return `${before}style="${s}"${suffix}`;
    },
  );

  // 3. 为 <p> 标签增强字体/行高稳定性
  result = result.replace(
    /(<p[^>]*style=")([^"]*)("[^>]*>)/gi,
    (_match, prefix: string, styleBody: string, suffix: string) => {
      const protectedStyle = protectImportantProps(styleBody);
      return `${prefix}${protectedStyle}${suffix}`;
    },
  );

  // 4. 为 <blockquote> 增强稳定性
  result = result.replace(
    /(<blockquote[^>]*style=")([^"]*)("[^>]*>)/gi,
    (_match, prefix: string, styleBody: string, suffix: string) => {
      const protectedStyle = protectImportantProps(styleBody);
      return `${prefix}${protectedStyle}${suffix}`;
    },
  );

  return result;
}

/**
 * 对关键 CSS 属性添加 !important 保护，
 * 防止微信编辑器覆盖字体大小、行高、颜色、背景色
 */
function protectImportantProps(style: string): string {
  const importantProps = ["font-size", "line-height", "color", "background", "background-color"];

  // 跳过已标记 !important 的属性
  for (const prop of importantProps) {
    // 匹配 "prop: value;" 但跳过 "prop: value !important;"
    const regex = new RegExp(
      `(${prop}\\s*:\\s*[^;]+?)(?:\\s*!important)?\\s*;`,
      "gi",
    );
    style = style.replace(regex, (match) => {
      if (match.includes("!important")) return match;
      return match.replace(";", " !important;");
    });
  }

  return style;
}
