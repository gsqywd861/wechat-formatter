"use client";

import { Brain, TrendingUp, Zap, Target, Sparkles, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";

type CognitiveStats = {
  cognitiveNodes: number;
  strategies: number;
  learningEvents: number;
  explorationResults: number;
  successRate: number;
  improvementTrend: number;
};

type CognitiveStrategy = {
  id: string;
  description: string;
  score: number;
  usageCount: number;
  successRate: number;
  conditions: {
    complexityRange: [number, number];
    decorationRange: [number, number];
    layoutDependencyRange: [number, number];
  };
};

type ExplorationDimension = {
  name: string;
  current: number;
  range: [number, number];
  step: number;
};

type LearningProgressProps = {
  deviceId?: string;
};

export function LearningProgress({ deviceId }: LearningProgressProps) {
  const [stats, setStats] = useState<CognitiveStats | null>(null);
  const [strategies, setStrategies] = useState<CognitiveStrategy[]>([]);
  const [dimensions, setDimensions] = useState<ExplorationDimension[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCognitiveData = async () => {
    if (!deviceId || deviceId.length < 10) {
      setError("需要设备ID才能加载认知数据");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 加载认知统计
      const statsResponse = await fetch(`/api/cognitive?deviceId=${deviceId}&action=stats`);
      if (!statsResponse.ok) {
        setError("无法加载认知数据");
        return;
      }
      const statsData = await statsResponse.json();

      // 加载策略
      const strategiesResponse = await fetch(`/api/cognitive?deviceId=${deviceId}&action=strategies`);
      const strategiesData = strategiesResponse.ok ? await strategiesResponse.json() : { strategies: [] };

      // 加载探索维度
      const reportResponse = await fetch(`/api/cognitive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cognitive_report",
          deviceId,
        }),
      });
      const reportData = reportResponse.ok ? await reportResponse.json() : { report: null };

      setStats(statsData.success ? statsData.stats : null);
      setStrategies(strategiesData.success ? strategiesData.strategies : []);
      
      if (reportData.success && reportData.report?.exploration?.currentDimensions) {
        setDimensions(reportData.report.exploration.currentDimensions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 首次渲染时加载数据
  useEffect(() => {
    if (deviceId) {
      loadCognitiveData();
    }
  }, [deviceId]);

  const handleExploreParameter = async (dimensionName: string, direction: "increase" | "decrease") => {
    if (!deviceId) return;

    try {
      const response = await fetch(`/api/cognitive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explore_parameters",
          deviceId,
          data: { dimension: dimensionName, direction },
        }),
      });

      if (response.ok) {
        loadCognitiveData(); // 重新加载数据
      }
    } catch (err) {
      console.error("探索参数失败:", err);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.1) return "📈";
    if (trend < -0.1) return "📉";
    return "➡️";
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0.1) return "text-(--neo-green)";
    if (trend < -0.1) return "text-(--neo-red)";
    return "text-(--neo-ink)/60";
  };

  return (
    <div className="neo-panel p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-(--neo-green)" />
        <h3 className="text-sm font-semibold text-(--neo-ink) uppercase tracking-wider">
          认知学习系统
        </h3>
        <button
          onClick={loadCognitiveData}
          className="text-xs text-(--neo-ink)/70 hover:text-(--neo-green) ml-auto"
        >
          刷新
        </button>
      </div>

      {isLoading && (
        <div className="p-3 border border-(--neo-line) bg-(--neo-yellow)/10">
          <p className="text-xs text-(--neo-ink)">正在加载认知数据...</p>
        </div>
      )}

      {error && (
        <div className="border-2 border-(--neo-red) bg-(--neo-red)/10 p-3">
          <p className="text-xs font-bold text-(--neo-red)">{error}</p>
        </div>
      )}

      {stats && (
        <div className="space-y-4">
          {/* 认知统计 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="neo-strip p-3 flex flex-col items-center">
              <Target className="w-4 h-4 mb-1 text-(--neo-blue)" />
              <span className="text-xs font-bold">{stats.cognitiveNodes}</span>
              <span className="text-xs text-(--neo-ink)/60">认知节点</span>
            </div>
            <div className="neo-strip p-3 flex flex-col items-center">
              <Sparkles className="w-4 h-4 mb-1 text-(--neo-purple)" />
              <span className="text-xs font-bold">{stats.strategies}</span>
              <span className="text-xs text-(--neo-ink)/60">学习策略</span>
            </div>
            <div className="neo-strip p-3 flex flex-col items-center">
              <TrendingUp className="w-4 h-4 mb-1 text-(--neo-green)" />
              <span className="text-xs font-bold">{Math.round(stats.successRate * 100)}%</span>
              <span className="text-xs text-(--neo-ink)/60">成功率</span>
            </div>
            <div className="neo-strip p-3 flex flex-col items-center">
              <Zap className="w-4 h-4 mb-1 text-(--neo-orange)" />
              <span className="text-xs font-bold">{stats.learningEvents}</span>
              <span className="text-xs text-(--neo-ink)/60">学习事件</span>
            </div>
          </div>

          {/* 趋势指标 */}
          <div className="border border-(--neo-line) bg-(--neo-surface) p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-(--neo-ink)">学习趋势</span>
              <span className={`text-xs ${getTrendColor(stats.improvementTrend)}`}>
                {getTrendIcon(stats.improvementTrend)} {stats.improvementTrend > 0 ? "+" : ""}
                {(stats.improvementTrend * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-(--neo-ink)/60">
              系统正在主动学习您的样式偏好，优化提取精度
            </div>
          </div>

          {/* 参数探索 */}
          {dimensions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-(--neo-ink) mb-2">
                主动探索参数
              </p>
              <div className="space-y-2">
                {dimensions.map((dim) => (
                  <div key={dim.name} className="border border-(--neo-line) bg-(--neo-surface) p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">
                        {dim.name.replace("_", " ").replace("threshold", "阈值")}
                      </span>
                      <span className="text-xs text-(--neo-green)">{dim.current.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleExploreParameter(dim.name, "decrease")}
                        className="text-xs px-2 py-1 bg-(--neo-line) hover:bg-(--neo-line)/80 rounded"
                      >
                        -
                      </button>
                      <div className="flex-1 h-2 bg-(--neo-line) rounded-full overflow-hidden">
                        <div
                          className="h-full bg-(--neo-green)"
                          style={{
                            width: `${((dim.current - dim.range[0]) / (dim.range[1] - dim.range[0])) * 100}%`,
                          }}
                        />
                      </div>
                      <button
                        onClick={() => handleExploreParameter(dim.name, "increase")}
                        className="text-xs px-2 py-1 bg-(--neo-line) hover:bg-(--neo-line)/80 rounded"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-xs text-(--neo-ink)/60 mt-1">
                      范围: {dim.range[0]} ~ {dim.range[1]} (步长: {dim.step})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 学习策略 */}
          {strategies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-(--neo-ink) mb-2">
                活跃策略 ({strategies.length})
              </p>
              <div className="space-y-2">
                {strategies.slice(0, 3).map((strategy) => (
                  <div
                    key={strategy.id}
                    className="border border-(--neo-line) bg-(--neo-surface) p-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate">{strategy.description}</span>
                      <span className="text-xs text-(--neo-green)">
                        {Math.round(strategy.successRate * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-(--neo-ink)/60 flex items-center justify-between">
                      <span>使用 {strategy.usageCount} 次</span>
                      <span>得分: {strategy.score.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 智能提示 */}
          <div className="border-2 border-(--neo-blue) bg-(--neo-blue)/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-(--neo-blue)" />
              <p className="text-xs font-bold text-(--neo-blue)">智能学习系统</p>
            </div>
            <p className="text-xs text-(--neo-ink)/70">
              系统正在主动探索最佳参数组合，根据您的修正自动调整提取策略。
              每次保存模板都会增强系统的认知能力。
            </p>
          </div>
        </div>
      )}

      {!stats && !isLoading && !error && (
        <div className="border border-(--neo-line) bg-(--neo-yellow)/10 p-3">
          <p className="text-xs text-(--neo-ink)">认知学习系统已就绪</p>
          <p className="text-xs text-(--neo-ink)/60 mt-1">
            开始提取并保存模板，系统将建立样式认知图，实现真正的自我迭代。
          </p>
        </div>
      )}
    </div>
  );
}