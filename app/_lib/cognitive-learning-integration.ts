/**
 * 认知学习集成示例 - 如何在现有系统中使用新的认知学习系统
 */

import { adaptiveExtractTemplate, intelligentExtractTemplate } from "./template-extractor";
import type { ExtractionResult } from "./template-extractor";

/**
 * 示例1：集成到模板提取流程中
 */
export async function extractTemplateWithLearning(
  html: string,
  deviceId?: string,
  originalStyle?: string
): Promise<ExtractionResult> {
  if (!deviceId) {
    // 没有设备ID，使用标准提取
    return adaptiveExtractTemplate(html);
  }
  
  try {
    // 使用智能提取（包含认知学习）
    const { result, cognitiveInfo } = await intelligentExtractTemplate(html, deviceId, true);
    
    console.log("智能提取结果:", {
      result: result.templateName,
      strategyUsed: cognitiveInfo?.usedStrategy?.description,
      confidence: cognitiveInfo?.confidence,
    });
    
    return result;
  } catch (error) {
    console.error("智能提取失败，回退到标准提取:", error);
    return adaptiveExtractTemplate(html);
  }
}

/**
 * 示例2：处理用户修正并学习
 */
export async function processUserCorrection(
  deviceId: string,
  originalHtml: string,
  originalStyle: string,
  extractedResult: ExtractionResult,
  userCorrectedTemplate: Record<string, string>,
  userSatisfaction: number = 4 // 1-5分
): Promise<void> {
  try {
    // 计算样式差异并学习
    await fetch("/api/cognitive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "learn_from_correction",
        deviceId,
        data: {
          originalStyle,
          extractedStyle: Object.values(extractedResult).join("; "),
          correctedStyle: Object.values(userCorrectedTemplate).join("; "),
          satisfaction: userSatisfaction,
        },
      }),
    });
    
    console.log("已记录用户修正并学习");
    
    // 主动探索参数（如果用户满意度低）
    if (userSatisfaction < 3) {
      await exploreParametersForImprovement(deviceId);
    }
  } catch (error) {
    console.error("处理用户修正失败:", error);
  }
}

/**
 * 示例3：主动探索参数以改进提取质量
 */
export async function exploreParametersForImprovement(deviceId: string): Promise<void> {
  const dimensions = ["importance_threshold", "uniqueness_threshold", "relevance_threshold"];
  const directions = ["increase", "decrease"] as const;
  
  try {
    // 随机选择一个维度和方向进行探索
    const randomDimension = dimensions[Math.floor(Math.random() * dimensions.length)];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
    const response = await fetch("/api/cognitive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "explore_parameters",
        deviceId,
        data: {
          dimension: randomDimension,
          direction: randomDirection,
        },
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("主动探索参数完成:", {
        dimension: randomDimension,
        direction: randomDirection,
        newValue: result.newValue,
      });
    }
  } catch (error) {
    console.error("参数探索失败:", error);
  }
}

/**
 * 示例4：获取学习报告和洞察
 */
export async function getLearningInsights(deviceId: string): Promise<{
  successRate: number;
  improvementTrend: number;
  activeStrategies: number;
  recommendations: string[];
}> {
  try {
    const response = await fetch("/api/cognitive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "cognitive_report",
        deviceId,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      const report = data.report;
      const recommendations: string[] = [];
      
      // 基于报告生成建议
      if (report?.learning?.successRate < 0.6) {
        recommendations.push("当前成功率较低，建议多保存几个模板让系统学习");
      }
      
      if (report?.learning?.improvementTrend < 0) {
        recommendations.push("学习趋势在下降，可能需要调整参数探索方向");
      }
      
      if (report?.cognitiveMap?.nodesCount < 3) {
        recommendations.push("认知节点较少，系统对您的排版偏好了解有限");
      }
      
      if (report?.exploration?.bestResults?.length === 0) {
        recommendations.push("还没有探索到最佳参数组合，建议使用更多不同类型的文章");
      }
      
      return {
        successRate: report?.learning?.successRate || 0,
        improvementTrend: report?.learning?.improvementTrend || 0,
        activeStrategies: report?.cognitiveMap?.nodesCount || 0,
        recommendations,
      };
    }
  } catch (error) {
    console.error("获取学习洞察失败:", error);
  }
  
  return {
    successRate: 0,
    improvementTrend: 0,
    activeStrategies: 0,
    recommendations: ["系统学习数据暂时不可用"],
  };
}

/**
 * 示例5：自适应样式分析
 */
export async function analyzeStyleAndSuggest(
  deviceId: string,
  styleString: string
): Promise<{
  styleType: string;
  complexity: number;
  decoration: number;
  layoutDependency: number;
  suggestions: string[];
}> {
  try {
    const response = await fetch("/api/cognitive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "analyze_style",
        deviceId,
        data: { styleString },
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      const features = data.features;
      const suggestions: string[] = [];
      
      // 根据特征生成建议
      if (features.complexity > 70) {
        suggestions.push("样式复杂度较高，建议简化布局属性");
      }
      
      if (features.decoration > 80) {
        suggestions.push("装饰性较强，建议专注于核心视觉属性");
      }
      
      if (features.layoutDependency > 60) {
        suggestions.push("布局依赖性较高，注意保留相关属性");
      }
      
      return {
        styleType: features.type || "unknown",
        complexity: features.complexity || 0,
        decoration: features.decoration || 0,
        layoutDependency: features.layoutDependency || 0,
        suggestions,
      };
    }
  } catch (error) {
    console.error("样式分析失败:", error);
  }
  
  return {
    styleType: "unknown",
    complexity: 0,
    decoration: 0,
    layoutDependency: 0,
    suggestions: ["无法分析样式特征"],
  };
}

/**
 * 示例6：完整的学习集成流程
 */
export async function completeLearningWorkflow(
  deviceId: string,
  html: string,
  originalStyle: string,
  onExtracted: (result: ExtractionResult) => void,
  onCorrected: (template: Record<string, string>) => void
): Promise<void> {
  console.log("开始认知学习工作流...");
  
  // 1. 分析样式特征
  const analysis = await analyzeStyleAndSuggest(deviceId, originalStyle);
  console.log("样式分析结果:", analysis);
  
  // 2. 智能提取模板
  const extractionResult = await extractTemplateWithLearning(html, deviceId, originalStyle);
  onExtracted(extractionResult);
  
  // 3. 等待用户修正（在实际应用中，这里会有UI交互）
  // 模拟用户修正后调用processUserCorrection
  
  // 4. 获取学习洞察
  const insights = await getLearningInsights(deviceId);
  console.log("学习洞察:", insights);
  
  // 5. 如果效果不好，主动探索参数
  if (insights.successRate < 0.7) {
    console.log("学习效果不佳，开始主动探索...");
    await exploreParametersForImprovement(deviceId);
  }
  
  console.log("认知学习工作流完成");
}

// 使用示例
export async function usageExample() {
  const deviceId = "user-device-001";
  const sampleHtml = "<div style='font-size: 24px; color: #333;'>标题</div><p style='font-size: 16px;'>正文</p>";
  const sampleStyle = "font-size: 24px; color: #333;";
  
  // 完整流程示例
  await completeLearningWorkflow(
    deviceId,
    sampleHtml,
    sampleStyle,
    (result) => {
      console.log("提取结果:", result);
    },
    (template) => {
      console.log("用户修正的模板:", template);
      // 在实际应用中，这里会调用processUserCorrection
    }
  );
}