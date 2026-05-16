/**
 * 模板提取自我迭代学习系统 v1
 *
 * 核心机制：
 * 1. 反馈记录：每次提取后记录原始HTML特征 + 提取结果 + 用户最终保存的模板（修正后）
 * 2. 模式学习：从修正数据中学习 DOM特征→样式映射 的规律
 * 3. 自适应提取：根据学习到的模式动态调整 extractTemplateFromHtml 的参数
 *
 * 存储：使用 Cloudflare KV（key: `learn:${deviceId}`）
 */

import type { ExtractionResult } from "./template-extractor";

// ============== 类型定义 ==============

/** 单次提取的原始记录 */
export interface ExtractionRecord {
  /** 提取时间戳 */
  timestamp: number;
  /** 原始HTML的指纹（用于相似度匹配） */
  htmlFingerprint: HtmlFingerprint;
  /** 引擎提取的原始结果 */
  extracted: ExtractionResult;
  /** 用户最终保存的模板（修正后的） */
  userCorrected?: UserCorrection;
}

/** 用户修正数据 */
export interface UserCorrection {
  /** 用户是否手动编辑过模板 */
  wasEdited: boolean;
  /** 用户修改了哪些字段（key: 字段名, value: [提取值, 修正值]） */
  diff: Record<string, { extracted: string; corrected: string }>;
  /** 用户是否直接使用了提取结果（无修改） */
  usedAsIs: boolean;
}

/** HTML指纹 - 用于相似文章匹配 */
export interface HtmlFingerprint {
  /** 文章结构签名：各级标签的分布模式 */
  structureSig: string;
  /** 颜色调色板（排序后的唯一颜色列表） */
  colorPalette: string[];
  /** 字体大小分布 */
  fontSizeDistribution: Record<string, number>;
  /** 背景色分布 */
  bgColorDistribution: Record<string, number>;
  /** 平均文本长度 */
  avgTextLength: number;
  /** section嵌套深度 */
  maxSectionDepth: number;
  /** 容器数量 */
  containerCount: number;
  /** 文本节点数量 */
  textNodeCount: number;
}

/** 学习到的模式 */
export interface LearnedPattern {
  /** 模式ID */
  id: string;
  /** 匹配的结构签名 */
  structureSig: string;
  /** 匹配的颜色调色板（模糊匹配） */
  colorPalette: string[];
  /** 该模式下的最佳分类阈值调整 */
  thresholdAdjustments: ThresholdAdjustments;
  /** 该模式下的样式属性偏好 */
  stylePreferences: StylePreferences;
  /** 使用次数 */
  usageCount: number;
  /** 成功率（用户未修改的比例） */
  successRate: number;
  /** 最后更新时间 */
  lastUsed: number;
}

/** 分类阈值调整 */
export interface ThresholdAdjustments {
  /** h1 字号阈值偏移 */
  h1FontSizeOffset: number;
  /** h2 字号阈值偏移 */
  h2FontSizeOffset: number;
  /** h3 字号阈值偏移 */
  h3FontSizeOffset: number;
  /** 短文本长度阈值偏移 */
  shortTextLenOffset: number;
  /** 装饰敏感度（越高越容易识别为有装饰） */
  decorationSensitivity: number;
}

/** 样式属性偏好 */
export interface StylePreferences {
  /** 标题样式中必须保留的属性（即使引擎认为不重要） */
  headingKeepProps: string[];
  /** 正文样式中必须保留的属性 */
  paragraphKeepProps: string[];
  /** 背景色提取优先级：container > own > inherited */
  bgColorPriority: "container" | "own" | "inherited";
  /** 是否优先选择有装饰的节点作为代表 */
  preferDecorated: boolean;
  /** 容器属性合并深度 */
  containerMergeDepth: number;
}

/** 学习状态 */
export interface LearningState {
  /** 提取记录（最近50条） */
  records: ExtractionRecord[];
  /** 学习到的模式 */
  patterns: LearnedPattern[];
  /** 全局统计 */
  stats: LearningStats;
}

export interface LearningStats {
  totalExtractions: number;
  totalCorrections: number;
  totalUsedAsIs: number;
  /** 各字段的修正频率 */
  fieldCorrectionFreq: Record<string, number>;
}

// ============== 默认配置 ==============

export const DEFAULT_LEARNED_PARAMS = {
  thresholds: {
    h1FontSizeOffset: 0,
    h2FontSizeOffset: 0,
    h3FontSizeOffset: 0,
    shortTextLenOffset: 0,
    decorationSensitivity: 1.0,
  } as ThresholdAdjustments,
  preferences: {
    headingKeepProps: [
      "background-color", "background", "border", "border-left",
      "border-radius", "padding", "margin", "box-shadow", "text-shadow",
    ],
    paragraphKeepProps: [
      "text-indent", "line-height", "letter-spacing", "text-align",
    ],
    bgColorPriority: "container" as const,
    preferDecorated: true,
    containerMergeDepth: 3,
  } as StylePreferences,
};

// ============== HTML指纹生成 ==============

/**
 * 从HTML内容生成指纹，用于相似文章匹配
 */
export function generateHtmlFingerprint(html: string): HtmlFingerprint {
  // 提取所有颜色
  const colorSet = new Set<string>();
  const colorRegex = /#[0-9a-fA-F]{3,8}\b|rgba?\s*\([^)]+\)/gi;
  const colors = html.match(colorRegex) || [];
  colors.forEach((c) => colorSet.add(normalizeColorSimple(c)));

  // 提取所有字体大小
  const fontSizeDist: Record<string, number> = {};
  const fontSizeRegex = /font-size\s*:\s*([^;]+)/gi;
  let fsMatch;
  while ((fsMatch = fontSizeRegex.exec(html)) !== null) {
    const fs = fsMatch[1].trim();
    fontSizeDist[fs] = (fontSizeDist[fs] || 0) + 1;
  }

  // 提取背景色分布
  const bgDist: Record<string, number> = {};
  const bgRegex = /background(?:-color)?\s*:\s*([^;]+)/gi;
  let bgMatch;
  while ((bgMatch = bgRegex.exec(html)) !== null) {
    const bg = bgMatch[1].trim();
    if (!bg.includes("none") && !bg.includes("transparent")) {
      bgDist[bg] = (bgDist[bg] || 0) + 1;
    }
  }

  // 计算section嵌套深度
  let maxDepth = 0;
  let currentDepth = 0;
  const sectionOpen = /<section\b/gi;
  const sectionClose = /<\/section>/gi;
  const allTags = html.match(/<\/?section\b[^>]*>/gi) || [];
  for (const tag of allTags) {
    if (tag.startsWith("</")) {
      currentDepth = Math.max(0, currentDepth - 1);
    } else {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
  }

  // 结构签名：基于标签层次模式
  const structureSig = generateStructureSignature(html);

  // 文本节点统计
  const textNodes = html.match(/>([^<]{3,})</g) || [];
  const avgTextLen = textNodes.length > 0
    ? textNodes.reduce((sum, t) => sum + t.length - 2, 0) / textNodes.length
    : 0;

  // 容器数量估算
  const containerCount = (html.match(/<(?:section|div)[^>]*style=/gi) || []).length;

  return {
    structureSig,
    colorPalette: Array.from(colorSet).sort(),
    fontSizeDistribution: fontSizeDist,
    bgColorDistribution: bgDist,
    avgTextLength: Math.round(avgTextLen),
    maxSectionDepth: maxDepth,
    containerCount,
    textNodeCount: textNodes.length,
  };
}

function normalizeColorSimple(c: string): string {
  return c.toLowerCase().replace(/\s+/g, "");
}

/**
 * 生成结构签名：基于标签序列的哈希
 */
function generateStructureSignature(html: string): string {
  // 提取前100个标签的序列
  const tags = html.match(/<(\w+)[\s>]/gi) || [];
  const tagNames = tags.slice(0, 100).map((t) => t.slice(1).trim());

  // 按层次分组统计
  const tagCounts: Record<string, number> = {};
  tagNames.forEach((t) => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  });

  // 生成签名：按数量排序的标签列表
  const sorted = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => `${tag}:${count}`)
    .join("|");

  return sorted;
}

// ============== 指纹相似度计算 ==============

/**
 * 计算两个HTML指纹的相似度 (0-1)
 */
export function calculateFingerprintSimilarity(
  a: HtmlFingerprint,
  b: HtmlFingerprint,
): number {
  let score = 0;
  let weights = 0;

  // 结构签名相似度（Jaccard）
  const sigA = new Set(a.structureSig.split("|"));
  const sigB = new Set(b.structureSig.split("|"));
  const intersection = new Set([...sigA].filter((x) => sigB.has(x)));
  const union = new Set([...sigA, ...sigB]);
  const sigSim = union.size > 0 ? intersection.size / union.size : 0;
  score += sigSim * 0.3;
  weights += 0.3;

  // 颜色调色板相似度
  const colorSim = calculateSetSimilarity(
    new Set(a.colorPalette),
    new Set(b.colorPalette),
  );
  score += colorSim * 0.25;
  weights += 0.25;

  // 字体大小分布相似度
  const fsSim = calculateDistributionSimilarity(
    a.fontSizeDistribution,
    b.fontSizeDistribution,
  );
  score += fsSim * 0.2;
  weights += 0.2;

  // 背景色分布相似度
  const bgSim = calculateDistributionSimilarity(
    a.bgColorDistribution,
    b.bgColorDistribution,
  );
  score += bgSim * 0.15;
  weights += 0.15;

  // 容器数量相似度
  const containerSim = calculateNumericSimilarity(
    a.containerCount,
    b.containerCount,
  );
  score += containerSim * 0.1;
  weights += 0.1;

  return weights > 0 ? score / weights : 0;
}

function calculateSetSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateDistributionSimilarity(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  if (keys.size === 0) return 1;

  let totalA = 0, totalB = 0;
  for (const v of Object.values(a)) totalA += v;
  for (const v of Object.values(b)) totalB += v;

  if (totalA === 0 && totalB === 0) return 1;
  if (totalA === 0 || totalB === 0) return 0;

  let diff = 0;
  for (const k of keys) {
    const pa = (a[k] || 0) / totalA;
    const pb = (b[k] || 0) / totalB;
    diff += Math.abs(pa - pb);
  }

  return Math.max(0, 1 - diff / 2);
}

function calculateNumericSimilarity(a: number, b: number): number {
  if (a === 0 && b === 0) return 1;
  const max = Math.max(a, b);
  return max > 0 ? 1 - Math.abs(a - b) / max : 0;
}

// ============== 模式学习 ==============

/**
 * 从提取记录中学习模式
 */
export function learnFromRecords(records: ExtractionRecord[]): LearnedPattern[] {
  const patterns: Map<string, LearnedPattern> = new Map();

  for (const record of records) {
    if (!record.userCorrected || record.userCorrected.usedAsIs) continue;

    const sig = record.htmlFingerprint.structureSig;
    const existing = patterns.get(sig);

    if (existing) {
      // 更新现有模式
      updatePattern(existing, record);
    } else {
      // 创建新模式
      patterns.set(sig, createPatternFromRecord(record));
    }
  }

  return Array.from(patterns.values());
}

function createPatternFromRecord(record: ExtractionRecord): LearnedPattern {
  const diff = record.userCorrected!.diff;

  // 分析修正内容，推断阈值调整方向
  const adjustments = analyzeDiffForThresholds(diff);
  const preferences = analyzeDiffForPreferences(diff);

  return {
    id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    structureSig: record.htmlFingerprint.structureSig,
    colorPalette: record.htmlFingerprint.colorPalette,
    thresholdAdjustments: adjustments,
    stylePreferences: preferences,
    usageCount: 1,
    successRate: record.userCorrected!.usedAsIs ? 1 : 0,
    lastUsed: record.timestamp,
  };
}

function updatePattern(pattern: LearnedPattern, record: ExtractionRecord): void {
  const diff = record.userCorrected!.diff;
  const newAdjustments = analyzeDiffForThresholds(diff);
  const newPreferences = analyzeDiffForPreferences(diff);

  // 合并阈值调整（加权平均）
  pattern.thresholdAdjustments = mergeThresholds(
    pattern.thresholdAdjustments,
    newAdjustments,
    pattern.usageCount,
  );

  // 合并样式偏好
  pattern.stylePreferences = mergePreferences(
    pattern.stylePreferences,
    newPreferences,
  );

  pattern.usageCount++;
  pattern.lastUsed = record.timestamp;

  // 更新成功率
  const wasSuccess = record.userCorrected!.usedAsIs;
  pattern.successRate =
    (pattern.successRate * (pattern.usageCount - 1) + (wasSuccess ? 1 : 0)) /
    pattern.usageCount;
}

/**
 * 从修正差异中分析阈值调整方向
 */
function analyzeDiffForThresholds(
  diff: Record<string, { extracted: string; corrected: string }>,
): ThresholdAdjustments {
  const adj: ThresholdAdjustments = {
    h1FontSizeOffset: 0,
    h2FontSizeOffset: 0,
    h3FontSizeOffset: 0,
    shortTextLenOffset: 0,
    decorationSensitivity: 1.0,
  };

  // 分析标题样式修正
  for (const [key, val] of Object.entries(diff)) {
    if (key.includes("Style") && (key.includes("h1") || key.includes("h2") || key.includes("h3"))) {
      // 如果修正中添加了背景色/边框，说明引擎漏掉了装饰 → 提高装饰敏感度
      if (val.corrected.includes("background") && !val.extracted.includes("background")) {
        adj.decorationSensitivity += 0.3;
      }
      if (val.corrected.includes("border") && !val.extracted.includes("border")) {
        adj.decorationSensitivity += 0.3;
      }
    }
  }

  adj.decorationSensitivity = Math.min(2.0, adj.decorationSensitivity);

  return adj;
}

/**
 * 从修正差异中分析样式偏好
 */
function analyzeDiffForPreferences(
  diff: Record<string, { extracted: string; corrected: string }>,
): StylePreferences {
  const keepProps = new Set<string>();

  for (const [key, val] of Object.entries(diff)) {
    if (!val.extracted && val.corrected) {
      // 引擎完全没提取到的属性
      const props = extractProperties(val.corrected);
      props.forEach((p) => keepProps.add(p));
    }
  }

  return {
    headingKeepProps: Array.from(keepProps),
    paragraphKeepProps: Array.from(keepProps),
    bgColorPriority: "container",
    preferDecorated: true,
    containerMergeDepth: 3,
  };
}

function extractProperties(styleStr: string): string[] {
  const props: string[] = [];
  const decls = styleStr.split(";");
  for (const decl of decls) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx > 0) {
      props.push(decl.slice(0, colonIdx).trim());
    }
  }
  return props;
}

function mergeThresholds(
  existing: ThresholdAdjustments,
  incoming: ThresholdAdjustments,
  weight: number,
): ThresholdAdjustments {
  const w1 = weight;
  const w2 = 1;
  const total = w1 + w2;

  return {
    h1FontSizeOffset: (existing.h1FontSizeOffset * w1 + incoming.h1FontSizeOffset * w2) / total,
    h2FontSizeOffset: (existing.h2FontSizeOffset * w1 + incoming.h2FontSizeOffset * w2) / total,
    h3FontSizeOffset: (existing.h3FontSizeOffset * w1 + incoming.h3FontSizeOffset * w2) / total,
    shortTextLenOffset: (existing.shortTextLenOffset * w1 + incoming.shortTextLenOffset * w2) / total,
    decorationSensitivity: (existing.decorationSensitivity * w1 + incoming.decorationSensitivity * w2) / total,
  };
}

function mergePreferences(
  existing: StylePreferences,
  incoming: StylePreferences,
): StylePreferences {
  return {
    headingKeepProps: Array.from(
      new Set([...existing.headingKeepProps, ...incoming.headingKeepProps]),
    ),
    paragraphKeepProps: Array.from(
      new Set([...existing.paragraphKeepProps, ...incoming.paragraphKeepProps]),
    ),
    bgColorPriority: existing.bgColorPriority,
    preferDecorated: existing.preferDecorated || incoming.preferDecorated,
    containerMergeDepth: Math.max(existing.containerMergeDepth, incoming.containerMergeDepth),
  };
}

// ============== 查找最佳匹配模式 ==============

/**
 * 根据HTML指纹查找最匹配的学习模式
 */
export function findBestMatchingPattern(
  fingerprint: HtmlFingerprint,
  patterns: LearnedPattern[],
  minSimilarity = 0.6,
): LearnedPattern | null {
  let best: LearnedPattern | null = null;
  let bestScore = 0;

  for (const pattern of patterns) {
    const sim = calculateFingerprintSimilarity(fingerprint, {
      structureSig: pattern.structureSig,
      colorPalette: pattern.colorPalette,
      fontSizeDistribution: {},
      bgColorDistribution: {},
      avgTextLength: 0,
      maxSectionDepth: 0,
      containerCount: 0,
      textNodeCount: 0,
    });

    // 加权：考虑成功率
    const weightedScore = sim * (0.5 + 0.5 * pattern.successRate);

    if (weightedScore > bestScore && sim >= minSimilarity) {
      bestScore = weightedScore;
      best = pattern;
    }
  }

  return best;
}

// ============== 云端存储接口 ==============

const LEARNING_KEY_PREFIX = "learn:";
const MAX_RECORDS = 50;

/** 加载学习状态 */
export async function loadLearningState(deviceId: string): Promise<LearningState | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (ctx.env as any).config_store as {
      get: (key: string) => Promise<string | null>;
      put: (key: string, value: string) => Promise<void>;
    };

    const data = await kv.get(`${LEARNING_KEY_PREFIX}${deviceId}`);
    if (!data) return null;

    const state = JSON.parse(data) as LearningState;
    return state;
  } catch {
    return null;
  }
}

/** 保存学习状态 */
export async function saveLearningState(
  deviceId: string,
  state: LearningState,
): Promise<boolean> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (ctx.env as any).config_store as {
      put: (key: string, value: string) => Promise<void>;
    };

    // 限制记录数量
    if (state.records.length > MAX_RECORDS) {
      state.records = state.records.slice(-MAX_RECORDS);
    }

    await kv.put(`${LEARNING_KEY_PREFIX}${deviceId}`, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// ============== 记录提取结果 ==============

/**
 * 记录一次提取结果（在服务端调用）
 */
export async function recordExtraction(
  deviceId: string,
  html: string,
  extracted: ExtractionResult,
): Promise<void> {
  const state = (await loadLearningState(deviceId)) || {
    records: [],
    patterns: [],
    stats: {
      totalExtractions: 0,
      totalCorrections: 0,
      totalUsedAsIs: 0,
      fieldCorrectionFreq: {},
    },
  };

  const fingerprint = generateHtmlFingerprint(html);

  const record: ExtractionRecord = {
    timestamp: Date.now(),
    htmlFingerprint: fingerprint,
    extracted,
  };

  state.records.push(record);
  state.stats.totalExtractions++;

  // 重新学习模式
  state.patterns = learnFromRecords(state.records);

  await saveLearningState(deviceId, state);
}

/**
 * 记录用户修正（在保存模板时调用）
 */
export async function recordCorrection(
  deviceId: string,
  html: string,
  extracted: ExtractionResult,
  userTemplate: Record<string, string>,
): Promise<void> {
  const state = (await loadLearningState(deviceId)) || {
    records: [],
    patterns: [],
    stats: {
      totalExtractions: 0,
      totalCorrections: 0,
      totalUsedAsIs: 0,
      fieldCorrectionFreq: {},
    },
  };

  // 计算差异
  const diff: UserCorrection["diff"] = {};
  let wasEdited = false;

  const fieldsToCompare = [
    "h1Style", "h2Style", "h3Style", "pStyle",
    "blockquoteStyle", "containerStyle", "strongStyle", "emStyle",
  ];

  for (const field of fieldsToCompare) {
    const extractedVal = (extracted as unknown as Record<string, string>)[field] || "";
    const correctedVal = userTemplate[field] || "";

    if (extractedVal !== correctedVal) {
      diff[field] = { extracted: extractedVal, corrected: correctedVal };
      wasEdited = true;
      state.stats.fieldCorrectionFreq[field] = (state.stats.fieldCorrectionFreq[field] || 0) + 1;
    }
  }

  const correction: UserCorrection = {
    wasEdited,
    diff,
    usedAsIs: !wasEdited,
  };

  if (wasEdited) {
    state.stats.totalCorrections++;
  } else {
    state.stats.totalUsedAsIs++;
  }

  // 找到对应的记录并更新
  const fingerprint = generateHtmlFingerprint(html);
  const existingRecord = state.records.find((r) =>
    calculateFingerprintSimilarity(r.htmlFingerprint, fingerprint) > 0.85,
  );

  if (existingRecord) {
    existingRecord.userCorrected = correction;
  } else {
    state.records.push({
      timestamp: Date.now(),
      htmlFingerprint: fingerprint,
      extracted,
      userCorrected: correction,
    });
  }

  // 重新学习模式
  state.patterns = learnFromRecords(state.records);

  await saveLearningState(deviceId, state);
}

// ============== 获取学习参数 ==============

/**
 * 根据HTML内容获取学习后的提取参数
 */
export async function getLearnedParams(
  deviceId: string,
  html: string,
): Promise<{ thresholds: ThresholdAdjustments; preferences: StylePreferences }> {
  const state = await loadLearningState(deviceId);
  if (!state || state.patterns.length === 0) {
    return DEFAULT_LEARNED_PARAMS;
  }

  const fingerprint = generateHtmlFingerprint(html);
  const pattern = findBestMatchingPattern(fingerprint, state.patterns);

  if (!pattern) {
    return DEFAULT_LEARNED_PARAMS;
  }

  return {
    thresholds: pattern.thresholdAdjustments,
    preferences: pattern.stylePreferences,
  };
}

// ============== 客户端API封装 ==============

/** 客户端：记录提取结果 */
export async function reportExtractionToCloud(
  deviceId: string,
  html: string,
  extracted: ExtractionResult,
): Promise<void> {
  try {
    await fetch("/api/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record_extraction",
        deviceId,
        html: html.slice(0, 50000), // 限制大小
        extracted,
      }),
    });
  } catch {
    // 静默失败，不影响主流程
  }
}

/** 客户端：报告用户修正 */
export async function reportCorrectionToCloud(
  deviceId: string,
  html: string,
  extracted: ExtractionResult,
  userTemplate: Record<string, string>,
): Promise<void> {
  try {
    await fetch("/api/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record_correction",
        deviceId,
        html: html.slice(0, 50000),
        extracted,
        userTemplate,
      }),
    });
  } catch {
    // 静默失败
  }
}
