# 新一代认知学习系统 - 设计文档

## 🚀 核心设计理念

### **摆脱传统统计学习模式**
- 不再简单统计修正频率
- 不再简单模式匹配
- 不再延迟反馈循环

### **采用认知记忆和主动探索**
1. **建立样式认知图** - 理解样式语义而非统计次数
2. **主动参数探索** - 主动寻找最优参数组合
3. **意图推理** - 理解用户想要什么
4. **实时自适应** - 单次学习即可调整

## 🧠 核心组件

### 1. 认知记忆系统 (`cognitive-memory.ts`)
```typescript
// 建立样式认知图
interface StyleCognitiveNode {
  features: {
    type: string;           // 样式类型
    complexity: number;     // 视觉复杂度
    decoration: number;     // 装饰程度
    layoutDependency: number; // 布局依赖性
  };
  preferences: {
    usuallyKept: string[];   // 用户通常保留的属性
    usuallyRemoved: string[]; // 用户通常去除的属性
    usuallyAdded: string[];   // 用户通常添加的属性
  };
  strategies: StyleStrategy[]; // 学习到的策略
}
```

### 2. 自适应提取器 (`template-extractor.ts`)
```typescript
// 自适应参数调整
export async function adaptiveExtractTemplate(
  html: string,
  deviceId?: string,
  styleString?: string
): Promise<ExtractionResult>;

// 智能提取
export async function intelligentExtractTemplate(
  html: string,
  deviceId?: string,
  useCognitiveLearning: boolean = true
);
```

### 3. 认知API端点 (`/api/cognitive/route.ts`)
- `analyze_style` - 分析样式特征
- `learn_from_correction` - 从修正中学习
- `explore_parameters` - 主动探索参数
- `get_adaptive_params` - 获取自适应参数
- `cognitive_report` - 获取认知报告

### 4. 新的学习进度组件 (`learning-progress.tsx`)
- 展示认知节点数量
- 展示学习策略
- 实时参数探索界面
- 学习趋势分析

## ⚡ 主要改进点

### ✅ 真正的自我迭代
1. **理解而非统计**：系统理解样式语义，不仅仅是统计修正次数
2. **主动而非被动**：主动探索最优参数，而不是等待用户多次修正
3. **认知而非记忆**：建立样式认知图，而不是简单的记忆列表

### ✅ 实时反馈循环
- **单次学习即可调整**：一次用户修正就能更新提取策略
- **主动参数优化**：系统会主动探索最优参数组合
- **意图推理**：分析用户通常保留/去除的属性，推断用户意图

### ✅ 多维评估体系
- **样式复杂度分析**
- **装饰程度评估**
- **布局依赖性判断**
- **用户满意度跟踪**

## 🛠️ 集成指南

### 1. 替换原有的学习API调用
```typescript
// 旧方式
fetch(`/api/learn?deviceId=${deviceId}&action=stats`);

// 新方式
fetch(`/api/cognitive?deviceId=${deviceId}&action=stats`);
```

### 2. 使用自适应提取
```typescript
// 旧方式
const result = extractTemplateFromHtml(html);

// 新方式
const result = await adaptiveExtractTemplate(html, deviceId, styleString);
```

### 3. 处理用户修正
```typescript
// 旧方式
recordCorrection(deviceId, html, extracted, userTemplate);

// 新方式
await processUserCorrection(
  deviceId,
  html,
  originalStyle,
  extracted,
  userTemplate,
  satisfactionScore
);
```

## 📊 效果评估指标

### 定量指标
1. **学习成功率**：用户满意度≥4的比例
2. **认知节点增长**：建立的样式认知节点数量
3. **策略有效性**：策略的成功率和使用次数
4. **改进趋势**：学习效果的长期变化趋势

### 定性指标
1. **用户意图理解度**：系统对用户排版偏好的理解程度
2. **自适应能力**：对不同类型样式的适应能力
3. **探索主动性**：系统主动优化参数的积极性
4. **学习效率**：单次学习的效果提升程度

## 🎯 未来发展方向

### 1. 深度认知理解
- **样式语义网络**：建立更复杂的样式关系网络
- **意图分层**：理解用户的多层次意图（精确度、简洁度、视觉效果等）
- **跨样式推理**：在不同样式类型之间建立推理关系

### 2. 增强探索能力
- **多目标优化**：同时优化多个目标（精度、速度、简洁度等）
- **探索策略进化**：探索策略本身的自我进化
- **风险评估**：评估参数探索的风险和收益

### 3. 用户参与提升
- **主动询问**：系统可以主动询问用户偏好
- **可解释性**：向用户解释为什么选择某个策略
- **用户反馈引导**：引导用户提供更有价值的反馈

## 📋 迁移计划

### 阶段1：核心功能替换（已完成）
- ✅ 创建认知记忆系统
- ✅ 实现自适应提取
- ✅ 建立新的API端点
- ✅ 更新学习进度组件

### 阶段2：逐步替换原有调用
- 更新模板提取页面使用新API
- 更新模板保存逻辑使用新学习机制
- 逐步淘汰旧的统计学习系统

### 阶段3：功能增强与优化
- 添加更复杂的样式特征分析
- 优化探索算法
- 添加用户意图分类

## 🔧 技术优势

### 与传统系统的对比
| 维度 | 传统统计学习 | 新认知学习 |
|------|-------------|------------|
| 学习机制 | 统计修正频率 | 理解样式语义 |
| 反馈速度 | 需要多次修正 | 单次即可调整 |
| 主动性 | 被动等待用户修正 | 主动探索参数 |
| 理解深度 | 表面统计 | 深层认知 |
| 适应性 | 固定参数组合 | 动态自适应 |

## 💡 设计哲学

**真正的自我迭代不是统计修正次数，而是理解用户意图、建立认知模型、主动优化能力。**

系统现在能够：
1. **理解**：理解样式语义和用户偏好
2. **学习**：从单次修正中建立认知模型
3. **适应**：动态调整参数适应不同样式
4. **进化**：主动探索实现能力进化

这不再是"老一套的方式"，而是真正的**认知驱动的自我迭代系统**。