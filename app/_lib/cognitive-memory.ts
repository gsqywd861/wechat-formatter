/**
 * 认知记忆系统 - 新一代自我学习能力
 * 
 * 核心思想：建立样式认知图，而非简单统计
 * 采用主动探索、概念抽象、意图推理的设计
 */

import type { ExtractionResult } from "./template-extractor";

// ============== 核心认知模型 ==============

/** 样式认知节点 - 理解样式的语义 */
export interface StyleCognitiveNode {
  /** 节点ID */
  id: string;
  /** 样式特征 */
  features: {
    /** 样式类型：标题/正文/容器等 */
    type: string;
    /** 视觉复杂度 */
    complexity: number; // 0-100
    /** 装饰程度 */
    decoration: number; // 0-100
    /** 布局依赖性 */
    layoutDependency: number; // 0-100
    /** 颜色特征 */
    colorSignature: string[];
    /** 字体特征 */
    fontSignature: string[];
  };
  /** 用户偏好 */
  preferences: {
    /** 用户通常保留的属性 */
    usuallyKept: string[];
    /** 用户通常去除的属性 */
    usuallyRemoved: string[];
    /** 用户通常添加的属性 */
    usuallyAdded: string[];
    /** 修正频率 */
    correctionFrequency: number;
  };
  /** 关联策略 */
  strategies: StyleStrategy[];
  /** 成功案例 */
  successExamples: StyleExample[];
  /** 失败案例 */
  failureExamples: StyleExample[];
  /** 置信度 */
  confidence: number;
}

/** 样式策略 - 如何处理某种样式 */
export interface StyleStrategy {
  /** 策略ID */
  id: string;
  /** 策略描述 */
  description: string;
  /** 适用条件 */
  conditions: {
    complexityRange: [number, number];
    decorationRange: [number, number];
    layoutDependencyRange: [number, number];
  };
  /** 执行动作 */
  actions: {
    /** 要保留的属性 */
    keepProperties: string[];
    /** 要过滤的属性 */
    filterProperties: string[];
    /** 要智能添加的属性 */
    smartAddProperties: string[];
    /** 阈值调整 */
    thresholdAdjustments: {
      importance: number;
      uniqueness: number;
      relevance: number;
    };
  };
  /** 策略评分 */
  score: number;
  /** 使用次数 */
  usageCount: number;
  /** 成功率 */
  successRate: number;
}

/** 样式示例 - 成功/失败的案例 */
export interface StyleExample {
  /** 原始样式 */
  original: string;
  /** 提取结果 */
  extracted: string;
  /** 用户修正 */
  corrected: string;
  /** 用户满意度 */
  satisfaction: number; // 1-5
  /** 标签 */
  tags: string[];
}

/** 用户意图模型 - 理解用户想要什么 */
export interface UserIntentModel {
  /** 意图类型 */
  intent: "precision" | "simplicity" | "visuality" | "readability" | "decorative";
  /** 意图特征 */
  characteristics: {
    /** 对精确度的重视程度 */
    precisionWeight: number;
    /** 对简洁度的重视程度 */
    simplicityWeight: number;
    /** 对视觉效果的重视程度 */
    visualityWeight: number;
    /** 对可读性的重视程度 */
    readabilityWeight: number;
    /** 对装饰性的重视程度 */
    decorativeWeight: number;
  };
  /** 意图行为模式 */
  behaviorPatterns: {
    /** 常见修正类型 */
    commonCorrectionTypes: string[];
    /** 添加属性的频率 */
    addFrequency: number;
    /** 删除属性的频率 */
    deleteFrequency: number;
    /** 编辑花费的时间 */
    editingTime: number;
  };
  /** 意图标签 */
  tags: string[];
}

/** 认知记忆状态 */
export interface CognitiveMemoryState {
  /** 样式认知图 */
  styleCognitiveMap: Map<string, StyleCognitiveNode>;
  /** 用户意图模型 */
  userIntentModels: UserIntentModel[];
  /** 当前活跃的策略 */
  activeStrategies: StyleStrategy[];
  /** 学习历史 */
  learningHistory: LearningEvent[];
  /** 探索状态 */
  explorationState: ExplorationState;
}

/** 学习事件 */
export interface LearningEvent {
  /** 事件ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 事件类型 */
  type: "extraction" | "correction" | "strategy_selection" | "exploration";
  /** 事件数据 */
  data: any;
  /** 学习产出 */
  learnings: string[];
}

/** 探索状态 - 主动探索最优参数 */
export interface ExplorationState {
  /** 探索维度 */
  dimensions: {
    /** 维度名称 */
    name: string;
    /** 当前值 */
    current: number;
    /** 探索范围 */
    range: [number, number];
    /** 探索步长 */
    step: number;
  }[];
  /** 探索目标 */
  targets: {
    /** 目标名称 */
    name: string;
    /** 目标值 */
    value: number;
    /** 权重 */
    weight: number;
  }[];
  /** 探索结果 */
  results: ExplorationResult[];
  /** 当前探索方向 */
  currentDirection: ExplorationDirection;
}

/** 探索结果 */
export interface ExplorationResult {
  /** 参数组合 */
  parameters: Record<string, number>;
  /** 评估得分 */
  score: number;
  /** 用户满意度 */
  userSatisfaction?: number;
  /** 标签 */
  tags: string[];
}

/** 探索方向 */
export interface ExplorationDirection {
  /** 方向名称 */
  direction: string;
  /** 方向描述 */
  description: string;
  /** 探索优先级 */
  priority: number;
}

// ============== 核心功能 ==============

/** 初始化认知记忆 */
export function initCognitiveMemory(): CognitiveMemoryState {
  return {
    styleCognitiveMap: new Map(),
    userIntentModels: [],
    activeStrategies: [],
    learningHistory: [],
    explorationState: {
      dimensions: [
        { name: "importance_threshold", current: 0.7, range: [0.1, 1.0], step: 0.1 },
        { name: "uniqueness_threshold", current: 0.5, range: [0.1, 1.0], step: 0.1 },
        { name: "relevance_threshold", current: 0.6, range: [0.1, 1.0], step: 0.1 },
      ],
      targets: [
        { name: "precision", value: 1.0, weight: 0.3 },
        { name: "simplicity", value: 1.0, weight: 0.3 },
        { name: "user_satisfaction", value: 5.0, weight: 0.4 },
      ],
      results: [],
      currentDirection: {
        direction: "balance",
        description: "平衡精度与简洁度",
        priority: 1,
      },
    },
  };
}

/** 分析样式特征 */
export function analyzeStyleFeatures(styleString: string): StyleCognitiveNode["features"] {
  const props = parseStyleProperties(styleString);
  
  // 计算复杂度
  const complexity = calculateComplexity(props);
  
  // 计算装饰程度
  const decoration = calculateDecoration(props);
  
  // 计算布局依赖性
  const layoutDependency = calculateLayoutDependency(props);
  
  // 提取颜色特征
  const colorSignature = extractColorSignature(props);
  
  // 提取字体特征
  const fontSignature = extractFontSignature(props);
  
  return {
    type: inferStyleType(props),
    complexity,
    decoration,
    layoutDependency,
    colorSignature,
    fontSignature,
  };
}

/** 计算样式复杂度 */
function calculateComplexity(props: Record<string, string>): number {
  const count = Object.keys(props).length;
  const hasComplexProps = Object.keys(props).filter(p => 
    p.includes("gradient") || p.includes("shadow") || p.includes("animation")
  ).length;
  
  return Math.min(100, count * 5 + hasComplexProps * 20);
}

/** 计算装饰程度 */
function calculateDecoration(props: Record<string, string>): number {
  const decorativeProps = ["box-shadow", "text-shadow", "border-radius", "background-image", "gradient"];
  const score = Object.keys(props).filter(p => 
    decorativeProps.some(dp => p.includes(dp))
  ).length;
  
  return Math.min(100, score * 25);
}

/** 计算布局依赖性 */
function calculateLayoutDependency(props: Record<string, string>): number {
  const layoutProps = ["width", "height", "position", "top", "left", "margin", "padding"];
  const hasLayout = Object.keys(props).filter(p => layoutProps.includes(p)).length;
  
  return Math.min(100, hasLayout * 15);
}

/** 提取颜色特征 */
function extractColorSignature(props: Record<string, string>): string[] {
  const colors: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key.includes("color") || key.includes("background") || key.includes("border")) {
      const colorMatches = value.match(/#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/gi);
      if (colorMatches) {
        colors.push(...colorMatches);
      }
    }
  }
  return colors;
}

/** 提取字体特征 */
function extractFontSignature(props: Record<string, string>): string[] {
  const fonts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key.includes("font")) {
      fonts.push(`${key}:${value}`);
    }
  }
  return fonts;
}

/** 推断样式类型 */
function inferStyleType(props: Record<string, string>): string {
  if (props["font-weight"] === "bold" && props["font-size"] && parseInt(props["font-size"]) > 18) {
    return "heading";
  }
  if (props["background-color"] || props["background-image"]) {
    return "container";
  }
  if (props["text-indent"] || props["text-align"]) {
    return "paragraph";
  }
  if (props["border"] || props["box-shadow"]) {
    return "decorative";
  }
  return "general";
}

/** 解析样式属性 */
function parseStyleProperties(styleString: string): Record<string, string> {
  const props: Record<string, string> = {};
  const parts = styleString.split(";");
  for (const part of parts) {
    const [key, value] = part.split(":");
    if (key && value) {
      props[key.trim()] = value.trim();
    }
  }
  return props;
}

/** 记录学习事件 */
export function recordLearningEvent(
  state: CognitiveMemoryState,
  type: LearningEvent["type"],
  data: any,
  learnings: string[]
): CognitiveMemoryState {
  const event: LearningEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    type,
    data,
    learnings,
  };
  
  state.learningHistory.push(event);
  
  // 保留最近100个事件
  if (state.learningHistory.length > 100) {
    state.learningHistory = state.learningHistory.slice(-100);
  }
  
  return state;
}

/** 从修正中学习策略 */
export function learnFromCorrection(
  state: CognitiveMemoryState,
  originalStyle: string,
  extractedStyle: string,
  correctedStyle: string,
  satisfaction: number
): CognitiveMemoryState {
  // 分析特征
  const originalFeatures = analyzeStyleFeatures(originalStyle);
  const extractedFeatures = analyzeStyleFeatures(extractedStyle);
  const correctedFeatures = analyzeStyleFeatures(correctedStyle);
  
  // 计算差异
  const diff = computeStyleDifference(extractedStyle, correctedStyle);
  
  // 创建样式示例
  const example: StyleExample = {
    original,
    extracted,
    corrected,
    satisfaction,
    tags: inferTagsFromDiff(diff),
  };
  
  // 更新或创建认知节点
  const nodeId = `${originalFeatures.type}-${originalFeatures.complexity}`;
  const existingNode = state.styleCognitiveMap.get(nodeId);
  
  if (existingNode) {
    // 更新现有节点
    if (satisfaction >= 4) {
      existingNode.successExamples.push(example);
    } else {
      existingNode.failureExamples.push(example);
    }
    
    // 更新偏好
    updateNodePreferences(existingNode, diff);
    
    // 更新策略
    updateNodeStrategies(existingNode, diff, satisfaction);
    
    // 更新置信度
    existingNode.confidence = Math.min(1.0, existingNode.confidence + 0.1);
  } else {
    // 创建新节点
    const newNode: StyleCognitiveNode = {
      id: nodeId,
      features: originalFeatures,
      preferences: {
        usuallyKept: diff.keptProperties,
        usuallyRemoved: diff.removedProperties,
        usuallyAdded: diff.addedProperties,
        correctionFrequency: 1,
      },
      strategies: [],
      successExamples: satisfaction >= 4 ? [example] : [],
      failureExamples: satisfaction < 4 ? [example] : [],
      confidence: 0.5,
    };
    
    state.styleCognitiveMap.set(nodeId, newNode);
  }
  
  // 记录学习事件
  return recordLearningEvent(state, "correction", {
    originalStyle,
    extractedStyle,
    correctedStyle,
    satisfaction,
  }, [
    `学习了${originalFeatures.type}类型的样式处理`,
    `用户满意度：${satisfaction}`,
    `差异分析：${JSON.stringify(diff)}`,
  ]);
}

/** 计算样式差异 */
function computeStyleDifference(extracted: string, corrected: string): {
  keptProperties: string[];
  removedProperties: string[];
  addedProperties: string[];
  modifiedProperties: string[];
} {
  const extractedProps = parseStyleProperties(extracted);
  const correctedProps = parseStyleProperties(corrected);
  
  const kept = Object.keys(extractedProps).filter(k => correctedProps[k] === extractedProps[k]);
  const removed = Object.keys(extractedProps).filter(k => !correctedProps[k]);
  const added = Object.keys(correctedProps).filter(k => !extractedProps[k]);
  const modified = Object.keys(extractedProps).filter(k => 
    correctedProps[k] && correctedProps[k] !== extractedProps[k]
  );
  
  return {
    keptProperties: kept,
    removedProperties: removed,
    addedProperties: added,
    modifiedProperties: modified,
  };
}

/** 更新节点偏好 */
function updateNodePreferences(node: StyleCognitiveNode, diff: any): void {
  node.preferences.correctionFrequency++;
  
  // 更新通常保留的属性
  for (const prop of diff.keptProperties) {
    if (!node.preferences.usuallyKept.includes(prop)) {
      node.preferences.usuallyKept.push(prop);
    }
  }
  
  // 更新通常去除的属性
  for (const prop of diff.removedProperties) {
    if (!node.preferences.usuallyRemoved.includes(prop)) {
      node.preferences.usuallyRemoved.push(prop);
    }
  }
  
  // 更新通常添加的属性
  for (const prop of diff.addedProperties) {
    if (!node.preferences.usuallyAdded.includes(prop)) {
      node.preferences.usuallyAdded.push(prop);
    }
  }
}

/** 更新节点策略 */
function updateNodeStrategies(node: StyleCognitiveNode, diff: any, satisfaction: number): void {
  // 根据差异创建或更新策略
  const strategyId = `strategy-${node.id}-${Date.now()}`;
  
  const existingStrategy = node.strategies.find(s => {
    // 检查是否已有相似策略
    const match = s.actions.keepProperties.length === diff.keptProperties.length &&
                  s.actions.filterProperties.length === diff.removedProperties.length &&
                  s.actions.smartAddProperties.length === diff.addedProperties.length;
    return match;
  });
  
  if (existingStrategy) {
    // 更新现有策略
    existingStrategy.usageCount++;
    existingStrategy.successRate = (
      existingStrategy.successRate * (existingStrategy.usageCount - 1) + 
      (satisfaction >= 4 ? 1 : 0)
    ) / existingStrategy.usageCount;
  } else {
    // 创建新策略
    const newStrategy: StyleStrategy = {
      id: strategyId,
      description: `处理${node.features.type}样式的策略`,
      conditions: {
        complexityRange: [node.features.complexity - 20, node.features.complexity + 20],
        decorationRange: [node.features.decoration - 20, node.features.decoration + 20],
        layoutDependencyRange: [node.features.layoutDependency - 20, node.features.layoutDependency + 20],
      },
      actions: {
        keepProperties: diff.keptProperties,
        filterProperties: diff.removedProperties,
        smartAddProperties: diff.addedProperties,
        thresholdAdjustments: {
          importance: 0.7,
          uniqueness: 0.5,
          relevance: 0.6,
        },
      },
      score: satisfaction * 20,
      usageCount: 1,
      successRate: satisfaction >= 4 ? 1 : 0,
    };
    
    node.strategies.push(newStrategy);
  }
}

/** 推断标签 */
function inferTagsFromDiff(diff: any): string[] {
  const tags: string[] = [];
  
  if (diff.addedProperties.length > 0) {
    tags.push("adds_properties");
  }
  
  if (diff.removedProperties.length > 0) {
    tags.push("removes_properties");
  }
  
  if (diff.modifiedProperties.length > 0) {
    tags.push("modifies_properties");
  }
  
  if (diff.keptProperties.length === 0 && diff.addedProperties.length > 0) {
    tags.push("completely_reworked");
  }
  
  return tags;
}

/** 主动探索：尝试新的参数组合 */
export function exploreParameters(
  state: CognitiveMemoryState,
  dimensionName: string,
  direction: "increase" | "decrease"
): CognitiveMemoryState {
  const dimension = state.explorationState.dimensions.find(d => d.name === dimensionName);
  if (!dimension) return state;
  
  const newValue = direction === "increase" 
    ? dimension.current + dimension.step
    : dimension.current - dimension.step;
  
  // 确保在范围内
  dimension.current = Math.max(dimension.range[0], Math.min(dimension.range[1], newValue));
  
  // 记录探索结果
  const result: ExplorationResult = {
    parameters: { [dimensionName]: dimension.current },
    score: 0, // 待评估
    tags: [`${dimensionName}_${direction}`],
  };
  
  state.explorationState.results.push(result);
  
  // 更新探索方向
  state.explorationState.currentDirection = {
    direction: `探索${dimensionName}`,
    description: `${direction}方向，当前值${dimension.current}`,
    priority: 2,
  };
  
  return recordLearningEvent(state, "exploration", {
    dimensionName,
    direction,
    newValue: dimension.current,
  }, [
    `主动探索${dimensionName}参数`,
    `方向：${direction}`,
    `新值：${dimension.current}`,
  ]);
}

/** 选择最佳策略 */
export function selectBestStrategy(
  state: CognitiveMemoryState,
  styleFeatures: StyleCognitiveNode["features"]
): StyleStrategy | null {
  // 查找匹配的认知节点
  const matchingNodes = Array.from(state.styleCognitiveMap.values()).filter(node => {
    const match = node.features.type === styleFeatures.type &&
                 Math.abs(node.features.complexity - styleFeatures.complexity) <= 30 &&
                 Math.abs(node.features.decoration - styleFeatures.decoration) <= 30 &&
                 Math.abs(node.features.layoutDependency - styleFeatures.layoutDependency) <= 30;
    return match;
  });
  
  if (matchingNodes.length === 0) return null;
  
  // 选择置信度最高的节点
  const bestNode = matchingNodes.sort((a, b) => b.confidence - a.confidence)[0];
  
  // 选择成功率最高的策略
  const bestStrategy = bestNode.strategies.sort((a, b) => 
    b.score * b.successRate * b.usageCount - a.score * a.successRate * a.usageCount
  )[0];
  
  return bestStrategy;
}

/** 评估参数组合 */
export function evaluateParameters(
  state: CognitiveMemoryState,
  parameters: Record<string, number>,
  userSatisfaction?: number
): number {
  // 基础评分
  let score = 0;
  
  // 与目标值的接近程度
  for (const target of state.explorationState.targets) {
    const paramValue = parameters[target.name] || 0;
    const distance = Math.abs(paramValue - target.value);
    const closeness = 1 - distance / Math.max(1, target.value);
    score += closeness * target.weight;
  }
  
  // 用户满意度权重
  if (userSatisfaction) {
    score += userSatisfaction * 0.2;
  }
  
  return Math.max(0, Math.min(100, score));
}

/** 获取自适应参数 */
export function getAdaptiveParameters(
  state: CognitiveMemoryState,
  styleString: string
): {
  importanceThreshold: number;
  uniquenessThreshold: number;
  relevanceThreshold: number;
  keepProperties: string[];
  filterProperties: string[];
} {
  const features = analyzeStyleFeatures(styleString);
  const strategy = selectBestStrategy(state, features);
  
  if (strategy) {
    return {
      importanceThreshold: strategy.actions.thresholdAdjustments.importance,
      uniquenessThreshold: strategy.actions.thresholdAdjustments.uniqueness,
      relevanceThreshold: strategy.actions.thresholdAdjustments.relevance,
      keepProperties: strategy.actions.keepProperties,
      filterProperties: strategy.actions.filterProperties,
    };
  }
  
  // 默认参数
  return {
    importanceThreshold: 0.7,
    uniquenessThreshold: 0.5,
    relevanceThreshold: 0.6,
    keepProperties: [],
    filterProperties: [],
  };
}