/**
 * 认知学习API - 新一代自我迭代系统
 */

import { NextRequest, NextResponse } from "next/server";
import {
  initCognitiveMemory,
  analyzeStyleFeatures,
  learnFromCorrection,
  exploreParameters,
  selectBestStrategy,
  evaluateParameters,
  getAdaptiveParameters,
} from "@/app/_lib/cognitive-memory";
import type { ExtractionResult } from "@/app/_lib/template-extractor";

// 全局认知记忆状态（在内存中缓存）
let cognitiveMemoryCache: Map<string, any> = new Map();

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const { action, deviceId, data } = body;
  
  if (!deviceId || !action) {
    return NextResponse.json({ error: "缺少deviceId或action" }, { status: 400 });
  }
  
  // 获取或初始化认知记忆状态
  const state = cognitiveMemoryCache.get(deviceId) || initCognitiveMemory();
  
  switch (action) {
    case "analyze_style": {
      const { styleString } = data;
      const features = analyzeStyleFeatures(styleString);
      
      cognitiveMemoryCache.set(deviceId, state);
      return NextResponse.json({
        success: true,
        features,
        strategy: selectBestStrategy(state, features),
      });
    }
      
    case "learn_from_correction": {
      const { originalStyle, extractedStyle, correctedStyle, satisfaction } = data;
      const updatedState = learnFromCorrection(
        state,
        originalStyle,
        extractedStyle,
        correctedStyle,
        satisfaction
      );
      
      cognitiveMemoryCache.set(deviceId, updatedState);
      return NextResponse.json({
        success: true,
        learned: true,
        updatedStrategies: updatedState.activeStrategies,
      });
    }
      
    case "explore_parameters": {
      const { dimension, direction } = data;
      const exploredState = exploreParameters(state, dimension, direction);
      
      cognitiveMemoryCache.set(deviceId, exploredState);
      return NextResponse.json({
        success: true,
        newValue: exploredState.explorationState.dimensions.find((d: any) => d.name === dimension)?.current,
        currentDirection: exploredState.explorationState.currentDirection,
      });
    }
      
    case "get_adaptive_params": {
      const { styleString: cssStr } = data;
      const params = getAdaptiveParameters(state, cssStr);
      
      return NextResponse.json({
        success: true,
        adaptiveParameters: params,
      });
    }
      
    case "evaluate_result": {
      const { parameters, userSatisfaction, extractedResult } = data;
      const score = evaluateParameters(state, parameters, userSatisfaction);
      
      // 记录评估结果
      const evaluationState = recordLearningEvent(state, "evaluation", {
        parameters,
        userSatisfaction,
        extractedResult,
        score,
      }, [
        "评估提取结果质量",
        `得分：${score}`,
        `用户满意度：${userSatisfaction || "未提供"}`,
      ]);
      
      cognitiveMemoryCache.set(deviceId, evaluationState);
      return NextResponse.json({
        success: true,
        score,
        recommendations: generateRecommendations(score, extractedResult),
      });
    }
      
    case "cognitive_report":
      return NextResponse.json({
        success: true,
        report: generateCognitiveReport(state),
      });
      
    default:
      return NextResponse.json({ error: "未知action" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const deviceId = searchParams.get("deviceId");
  const action = searchParams.get("action");
  
  if (!deviceId) {
    return NextResponse.json({ error: "缺少deviceId" }, { status: 400 });
  }
  
  const state = cognitiveMemoryCache.get(deviceId) || initCognitiveMemory();
  
  switch (action) {
    case "stats":
      return NextResponse.json({
        success: true,
        stats: {
          cognitiveNodes: state.styleCognitiveMap.size,
          strategies: state.activeStrategies.length,
          learningEvents: state.learningHistory.length,
          explorationResults: state.explorationState.results.length,
        },
      });
      
    case "strategies":
      return NextResponse.json({
        success: true,
        strategies: state.activeStrategies,
      });
      
    case "history":
      return NextResponse.json({
        success: true,
        history: state.learningHistory.slice(-10),
      });
      
    default:
      return NextResponse.json({ error: "未知action" }, { status: 400 });
  }
}

// 辅助函数
function generateRecommendations(score: number, extractedResult: ExtractionResult): string[] {
  const recommendations: string[] = [];
  
  if (score < 60) {
    recommendations.push("建议主动探索参数组合以提高提取质量");
    recommendations.push("尝试调整重要性阈值以获得更精确的结果");
  }
  
  if (score >= 80) {
    recommendations.push("当前参数组合效果良好，继续保持");
    recommendations.push("可以考虑探索其他维度以优化性能");
  }
  
  return recommendations;
}

function generateCognitiveReport(state: any): any {
  return {
    cognitiveMap: {
      nodesCount: state.styleCognitiveMap.size,
      nodeTypes: Array.from(state.styleCognitiveMap.values()).map(n => n.features.type),
      confidenceDistribution: Array.from(state.styleCognitiveMap.values()).map(n => n.confidence),
    },
    exploration: {
      currentDimensions: state.explorationState.dimensions,
      bestResults: state.explorationState.results.sort((a, b) => b.score - a.score).slice(0, 3),
      direction: state.explorationState.currentDirection,
    },
    learning: {
      recentEvents: state.learningHistory.slice(-5),
      successRate: calculateOverallSuccessRate(state),
      improvementTrend: calculateImprovementTrend(state),
    },
  };
}

function calculateOverallSuccessRate(state: any): number {
  const successes = state.learningHistory.filter(e => 
    e.type === "correction" && e.data.satisfaction >= 4
  ).length;
  
  const totalCorrections = state.learningHistory.filter(e => e.type === "correction").length;
  
  return totalCorrections > 0 ? successes / totalCorrections : 0;
}

function calculateImprovementTrend(state: any): number {
  const recentEvents = state.learningHistory.slice(-20);
  if (recentEvents.length < 5) return 0;
  
  const recentScore = recentEvents.filter(e => 
    e.type === "correction" && e.data.satisfaction >= 4
  ).length / Math.max(1, recentEvents.filter(e => e.type === "correction").length);
  
  const olderEvents = state.learningHistory.slice(0, Math.max(0, state.learningHistory.length - 20));
  const olderScore = olderEvents.filter(e => 
    e.type === "correction" && e.data.satisfaction >= 4
  ).length / Math.max(1, olderEvents.filter(e => e.type === "correction").length);
  
  return recentScore - olderScore;
}

function recordLearningEvent(state: any, type: string, data: any, learnings: string[]): any {
  const event = {
    id: `event-${Date.now()}`,
    timestamp: Date.now(),
    type,
    data,
    learnings,
  };
  
  state.learningHistory.push(event);
  if (state.learningHistory.length > 100) {
    state.learningHistory = state.learningHistory.slice(-100);
  }
  
  return state;
}