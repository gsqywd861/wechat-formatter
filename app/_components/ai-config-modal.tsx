import { Anthropic, OpenAI, OpenRouter } from "@lobehub/icons";
import { Check, ExternalLink, Loader2, Search, Wifi, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { openRouterConfig } from "../_lib/formatter-constants";
import type { AiProviderType, OpenRouterModel } from "../_types/formatter";

let cachedModels: OpenRouterModel[] | null = null;
let pendingModelsRequest: Promise<OpenRouterModel[]> | null = null;

const loadOpenRouterModels = async () => {
  if (cachedModels) return cachedModels;

  pendingModelsRequest ??= fetch("/api/openrouter-models").then(async (res) => {
    const data = (await res.json().catch(() => null)) as {
      models?: OpenRouterModel[];
      error?: string;
    } | null;

    if (!res.ok) {
      throw new Error(data?.error || "模型列表加载失败");
    }

    cachedModels = data?.models || [];
    return cachedModels;
  });

  try {
    return await pendingModelsRequest;
  } finally {
    pendingModelsRequest = null;
  }
};

const formatContextLength = (contextLength: number) => {
  if (!contextLength) return "未知";
  if (contextLength >= 1000000) return `${(contextLength / 1000000).toFixed(1)}M`;
  if (contextLength >= 1000) return `${Math.round(contextLength / 1000)}K`;

  return `${contextLength}`;
};

const formatModelPrice = (model: OpenRouterModel) => {
  if (model.isFree) return "免费";

  const promptPrice = Number(model.promptPrice) * 1000000;
  const completionPrice = Number(model.completionPrice) * 1000000;
  if (
    !Number.isFinite(promptPrice) ||
    !Number.isFinite(completionPrice) ||
    promptPrice <= 0 ||
    completionPrice <= 0
  ) {
    return "价格见 OpenRouter";
  }

  return `$${promptPrice.toFixed(3)} / $${completionPrice.toFixed(3)} 每 1M tokens`;
};

type ProviderDraft = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const emptyDraft: ProviderDraft = {
  baseUrl: "",
  apiKey: "",
  model: "",
};

const providerBaseUrlPlaceholders: Record<AiProviderType, string> = {
  openrouter: openRouterConfig.baseUrl,
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
};

const createEmptyProviderDrafts = (): Record<AiProviderType, ProviderDraft> => ({
  openrouter: {
    ...emptyDraft,
    baseUrl: openRouterConfig.baseUrl,
  },
  openai: { ...emptyDraft },
  anthropic: { ...emptyDraft },
});

type AiConfigModalProps = {
  open: boolean;
  aiProviderType: AiProviderType;
  setAiProviderType: React.Dispatch<React.SetStateAction<AiProviderType>>;
  aiBaseUrl: string;
  setAiBaseUrl: React.Dispatch<React.SetStateAction<string>>;
  aiApiKey: string;
  setAiApiKey: React.Dispatch<React.SetStateAction<string>>;
  aiModel: string;
  setAiModel: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSave: () => void;
  onClear: () => void;
};

export function AiConfigModal({
  open,
  aiProviderType,
  setAiProviderType,
  aiBaseUrl,
  setAiBaseUrl,
  aiApiKey,
  setAiApiKey,
  aiModel,
  setAiModel,
  onClose,
  onSave,
  onClear,
}: AiConfigModalProps) {
  const [models, setModels] = useState<OpenRouterModel[]>(cachedModels || []);
  const [modelQuery, setModelQuery] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "fail">("idle");
  const [testMessage, setTestMessage] = useState("");
  const isOpenRouter = aiProviderType === "openrouter";
  const [providerDrafts, setProviderDrafts] = useState<Record<AiProviderType, ProviderDraft>>(
    () => createEmptyProviderDrafts(),
  );

  useEffect(() => {
    if (!open) return;

    setTestStatus("idle");
    setTestMessage("");

    setProviderDrafts((prev) => ({
      ...prev,
      [aiProviderType]: {
        baseUrl: aiBaseUrl,
        apiKey: aiApiKey,
        model: aiModel,
      },
    }));
  }, [open, aiProviderType, aiBaseUrl, aiApiKey, aiModel]);

  useEffect(() => {
    if (!open || !isOpenRouter || cachedModels) return;

    let cancelled = false;
    setIsLoadingModels(true);
    setModelsError("");

    loadOpenRouterModels()
      .then((loadedModels) => {
        if (!cancelled) setModels(loadedModels);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setModelsError(err instanceof Error ? err.message : "模型列表加载失败");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isOpenRouter]);

  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase();
    if (!query) return models.slice(0, 80);

    return models
      .filter((model) => {
        return (
          model.name.toLowerCase().includes(query) ||
          model.id.toLowerCase().includes(query)
        );
      })
      .slice(0, 80);
  }, [models, modelQuery]);

  const handleClear = () => {
    setModelQuery("");
    setProviderDrafts(createEmptyProviderDrafts());
    onClear();
  };

  const syncCurrentDraft = (patch: Partial<ProviderDraft>) => {
    setProviderDrafts((prev) => ({
      ...prev,
      [aiProviderType]: {
        ...prev[aiProviderType],
        ...patch,
      },
    }));
  };

  const handleBaseUrlChange = (value: string) => {
    setAiBaseUrl(value);
    syncCurrentDraft({ baseUrl: value });
  };

  const handleApiKeyChange = (value: string) => {
    setAiApiKey(value);
    syncCurrentDraft({ apiKey: value });
  };

  const handleModelChange = (value: string) => {
    setAiModel(value);
    syncCurrentDraft({ model: value });
  };

  const handleTestConnection = async () => {
    const trimmedBaseUrl = aiBaseUrl.trim();
    const trimmedApiKey = aiApiKey.trim();
    const trimmedModel = aiModel.trim();

    if (!trimmedBaseUrl || !trimmedApiKey || !trimmedModel) {
      setTestStatus("fail");
      setTestMessage("请先填写 API 地址、API Key 和模型名称");
      return;
    }

    setTestStatus("testing");
    setTestMessage("");

    try {
      const normalizedBaseUrl = trimmedBaseUrl.replace(/\/+$/, "");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      let endpoint: string;
      let body: object;

      if (aiProviderType === "anthropic") {
        endpoint = `${normalizedBaseUrl}/messages`;
        headers["x-api-key"] = trimmedApiKey;
        headers["anthropic-version"] = "2023-06-01";
        body = {
          model: trimmedModel,
          max_tokens: 1,
          messages: [{ role: "user", content: "test" }],
        };
      } else {
        endpoint = `${normalizedBaseUrl}/chat/completions`;
        headers["Authorization"] = `Bearer ${trimmedApiKey}`;
        body = {
          model: trimmedModel,
          max_tokens: 1,
          messages: [{ role: "user", content: "test" }],
        };
      }

      const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });

      if (res.ok) {
        setTestStatus("success");
        setTestMessage("连接成功！");
      } else {
        const errorData = await res.json().catch(() => null) as { error?: { message?: string } | string } | null;
        const errorMsg =
          (errorData?.error && typeof errorData.error === "object" ? errorData.error.message : undefined) ||
          (errorData?.error && typeof errorData.error === "string" ? errorData.error : undefined) ||
          `HTTP ${res.status}：${res.statusText}`;
        setTestStatus("fail");
        setTestMessage(`连接失败：${errorMsg}`);
      }
    } catch (err) {
      setTestStatus("fail");
      setTestMessage(`连接失败：${err instanceof Error ? err.message : "未知错误"}`);
    }
  };

  const handleProviderChange = (provider: AiProviderType) => {
    if (provider === aiProviderType) return;

    const nextDrafts = {
      ...providerDrafts,
      [aiProviderType]: {
        baseUrl: aiBaseUrl,
        apiKey: aiApiKey,
        model: aiModel,
      },
    };
    const targetDraft = nextDrafts[provider];
    const targetBaseUrl =
      provider === "openrouter"
        ? targetDraft.baseUrl || openRouterConfig.baseUrl
        : targetDraft.baseUrl;

    setProviderDrafts(nextDrafts);
    setAiProviderType(provider);
    setAiBaseUrl(targetBaseUrl);
    setAiApiKey(targetDraft.apiKey);
    setAiModel(targetDraft.model);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center neo-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="neo-panel flex flex-col max-w-2xl w-full mx-4 shadow-(--neo-shadow-lg) transform transition-all max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="neo-strip px-5 py-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-(--neo-yellow)/15 border border-(--neo-line) flex items-center justify-center">
              <Wifi className="w-4 h-4 text-(--neo-yellow)" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-(--neo-ink) leading-tight">
                AI 服务配置
              </h3>
              <p className="text-[11px] neo-text-muted font-medium">
                支持 OpenRouter 模型库，以及 OpenAI / Anthropic 兼容 API
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto neo-scrollbar p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-(--neo-ink) mb-2">
              API 类型
            </label>
            <div className="grid grid-cols-3 gap-2 bg-(--neo-section-header) border border-(--neo-line) rounded-lg p-2">
              <button
                type="button"
                onClick={() => handleProviderChange("openrouter")}
                className={`py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 rounded-lg transition-all ${
                  isOpenRouter ? "neo-tab neo-tab-active" : "neo-tab"
                }`}
              >
                <OpenRouter size={16} />
                OpenRouter
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("openai")}
                className={`py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 rounded-lg transition-all ${
                  aiProviderType === "openai" ? "neo-tab neo-tab-active" : "neo-tab"
                }`}
              >
                <OpenAI size={16} />
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("anthropic")}
                className={`py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 rounded-lg transition-all ${
                  aiProviderType === "anthropic" ? "neo-tab neo-tab-active" : "neo-tab"
                }`}
              >
                <Anthropic size={16} />
                Anthropic
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="block text-xs font-semibold text-(--neo-ink)">
                  API 地址
                </label>
                {isOpenRouter && (
                  <button
                    type="button"
                    onClick={() => handleBaseUrlChange(openRouterConfig.baseUrl)}
                    className="text-[10px] font-semibold underline text-(--neo-muted) hover:text-(--neo-ink) transition-colors"
                  >
                    恢复默认
                  </button>
                )}
              </div>
              <input
                type="text"
                value={aiBaseUrl}
                readOnly={isOpenRouter}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                className={`neo-input w-full px-3 py-2.5 text-sm ${isOpenRouter ? "bg-(--neo-section-header) opacity-80" : ""}`}
                placeholder={
                  providerBaseUrlPlaceholders[aiProviderType]
                }
                autoComplete="off"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="block text-xs font-semibold text-(--neo-ink)">
                  API Key
                </label>
                {isOpenRouter && (
                  <a
                    href={openRouterConfig.apiKeyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-semibold underline text-(--neo-muted) hover:text-(--neo-ink) inline-flex items-center gap-1 transition-colors"
                  >
                    获取 OpenRouter API Key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="neo-input w-full px-3 py-2.5 text-sm"
                placeholder="粘贴你的 API Key"
                autoComplete="off"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="block text-xs font-semibold text-(--neo-ink)">
                  {isOpenRouter ? "已选模型" : "模型名称"}
                </label>
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === "testing"}
                  className="neo-button neo-button-ghost px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 shrink-0"
                >
                  {testStatus === "testing" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : testStatus === "success" ? (
                    <Check className="w-3.5 h-3.5 text-(--neo-green)" />
                  ) : testStatus === "fail" ? (
                    <X className="w-3.5 h-3.5 text-(--neo-pink)" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5" />
                  )}
                  {testStatus === "testing"
                    ? "测试中..."
                    : testStatus === "success"
                      ? "连接成功"
                      : testStatus === "fail"
                        ? "连接失败"
                        : "测试连接"}
                </button>
              </div>

              {testMessage && testStatus !== "testing" && testStatus !== "idle" && (
                <div className={`text-xs font-medium mb-1.5 px-2.5 py-1.5 rounded border ${
                  testStatus === "success"
                    ? "text-(--neo-green) bg-(--neo-green)/8 border-(--neo-green)/30"
                    : "text-(--neo-pink) bg-(--neo-pink)/8 border-(--neo-pink)/30"
                }`}>
                  {testMessage}
                </div>
              )}

              <input
                type="text"
                value={aiModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="neo-input w-full px-3 py-2.5 text-sm"
                placeholder={
                  isOpenRouter
                    ? "选择下方模型，或手动输入 OpenRouter 模型 ID"
                    : aiProviderType === "anthropic"
                      ? "claude-sonnet-4-5"
                      : "gpt-4o 或自定义模型名称"
                }
                autoComplete="off"
              />
            </div>
          </div>

          {isOpenRouter && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-xs font-semibold text-(--neo-ink)">
                  搜索模型
                </label>
                <a
                  href={openRouterConfig.modelsPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-semibold underline text-(--neo-muted) hover:text-(--neo-ink) inline-flex items-center gap-1 transition-colors"
                >
                  浏览模型库
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--neo-muted)" />
                <input
                  type="text"
                  value={modelQuery}
                  onChange={(e) => setModelQuery(e.target.value)}
                  className="neo-input w-full pl-9 pr-3 py-2.5 text-sm"
                  placeholder="输入模型名称或 ID，例如 qwen、gemini、:free"
                  autoComplete="off"
                />
              </div>

              <div className="border border-(--neo-line) rounded-lg bg-(--neo-surface) max-h-64 overflow-y-auto custom-scrollbar divide-y divide-(--neo-line)">
                {isLoadingModels && (
                  <div className="p-5 text-sm font-semibold text-(--neo-ink) flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full border-2 border-(--neo-yellow) border-t-transparent animate-spin" />
                    正在加载 OpenRouter 模型列表...
                  </div>
                )}

                {!isLoadingModels && modelsError && (
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-semibold text-(--neo-pink)">{modelsError}</p>
                    <p className="text-xs neo-text-muted font-medium">
                      你仍然可以在"已选模型"里手动输入模型 ID。
                    </p>
                  </div>
                )}

                {!isLoadingModels && !modelsError && filteredModels.length === 0 && (
                  <div className="p-5 text-sm font-medium text-(--neo-muted) text-center">
                    没有匹配的模型，可以手动输入模型 ID。
                  </div>
                )}

                {!isLoadingModels &&
                  !modelsError &&
                  filteredModels.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleModelChange(model.id)}
                      className={`w-full text-left p-3 hover:bg-(--neo-section-header) transition-colors ${
                        aiModel === model.id ? "bg-(--neo-yellow)/15" : ""
                      }`}
                      title={model.description}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-(--neo-ink) truncate">
                              {model.name}
                            </span>
                            {aiModel === model.id && (
                              <span className="shrink-0 w-4 h-4 rounded-full bg-(--neo-green) flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <p className="text-xs neo-text-muted font-mono break-all mt-0.5">
                            {model.id}
                          </p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <span
                            className={`inline-block border border-(--neo-line) px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                              model.isFree
                                ? "bg-(--neo-green) text-[#111111]"
                                : "bg-(--neo-surface) text-(--neo-ink)"
                            }`}
                          >
                            {model.isFree ? "免费" : "付费"}
                          </span>
                          <p className="text-[10px] neo-text-muted font-medium">
                            {formatContextLength(model.contextLength)}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] neo-text-muted mt-1.5 font-medium">
                        {formatModelPrice(model)}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <p className="text-[10px] leading-relaxed neo-text-muted font-medium bg-(--neo-section-header) rounded-lg px-3 py-2">
            配置只保存在当前浏览器本地，排版时会临时发送到服务端调用你选择的模型服务。
            {isOpenRouter && " 模型列表来自 OpenRouter，免费模型会优先展示。"}
          </p>
        </div>

        <div className="flex gap-3 p-5 pt-4 shrink-0 border-t border-(--neo-line)">
          <button
            onClick={onSave}
            className="neo-button neo-button-primary flex-1 py-2.5 text-sm font-semibold"
          >
            保存配置
          </button>
          <button
            onClick={handleClear}
            className="neo-button neo-button-secondary px-5 py-2.5 text-sm font-semibold"
          >
            清空
          </button>
          <button
            onClick={onClose}
            className="neo-button neo-button-ghost px-5 py-2.5 text-sm font-semibold"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
