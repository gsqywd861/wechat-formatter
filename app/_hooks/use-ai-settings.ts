import { useCallback, useEffect, useMemo, useState } from "react";
import { aiStorageKeys, openRouterConfig } from "../_lib/formatter-constants";
import { getDeviceId } from "../_lib/device-id";
import type { AiProviderType } from "../_types/formatter";
import type { ShowToast } from "./use-toast";

/**
 * 使用设备 ID 作为前缀，确保 AI 设置与当前设备绑定。
 * 即使浏览器缓存被清除，只要 localStorage 未被完全抹除，仍可恢复。
 */
function useDeviceScopedKey(baseKey: string): string {
  const deviceId = useMemo(() => getDeviceId(), []);
  return `${deviceId}:${baseKey}`;
}

export function useAiSettings(showToast: ShowToast) {
  const [showAiConfigModal, setShowAiConfigModal] = useState(false);
  const [aiProviderType, setAiProviderType] = useState<AiProviderType>("openrouter");
  const [aiBaseUrl, setAiBaseUrl] = useState<string>(openRouterConfig.baseUrl);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");

  // 设备作用域的存储 key（在组件生命周期内稳定）
  const keyProvider = useDeviceScopedKey(aiStorageKeys.provider);
  const keyBaseUrl = useDeviceScopedKey(aiStorageKeys.baseUrl);
  const keyApiKey = useDeviceScopedKey(aiStorageKeys.apiKey);
  const keyModel = useDeviceScopedKey(aiStorageKeys.model);

  useEffect(() => {
    const savedProvider = localStorage.getItem(keyProvider);
    if (
      savedProvider === "openrouter" ||
      savedProvider === "openai" ||
      savedProvider === "anthropic"
    ) {
      setAiProviderType(savedProvider);
    }
    setAiBaseUrl(localStorage.getItem(keyBaseUrl) || openRouterConfig.baseUrl);
    setAiApiKey(localStorage.getItem(keyApiKey) || "");
    setAiModel(localStorage.getItem(keyModel) || "");
  }, [keyProvider, keyBaseUrl, keyApiKey, keyModel]);

  const saveAiSettings = useCallback(() => {
    const trimmedBaseUrl = aiBaseUrl.trim();
    const trimmedApiKey = aiApiKey.trim();
    const trimmedModel = aiModel.trim();

    if (!trimmedBaseUrl || !trimmedApiKey || !trimmedModel) {
      showToast("请填写 API 地址、API Key 和模型名称", "error");
      return;
    }

    localStorage.setItem(keyProvider, aiProviderType);
    localStorage.setItem(keyBaseUrl, trimmedBaseUrl);
    localStorage.setItem(keyApiKey, trimmedApiKey);
    localStorage.setItem(keyModel, trimmedModel);
    setAiBaseUrl(trimmedBaseUrl);
    setAiApiKey(trimmedApiKey);
    setAiModel(trimmedModel);
    setShowAiConfigModal(false);
    showToast("AI 配置已保存");
  }, [aiProviderType, aiBaseUrl, aiApiKey, aiModel, keyProvider, keyBaseUrl, keyApiKey, keyModel, showToast]);

  const clearAiSettings = useCallback(() => {
    localStorage.removeItem(keyProvider);
    localStorage.removeItem(keyBaseUrl);
    localStorage.removeItem(keyApiKey);
    localStorage.removeItem(keyModel);
    setAiProviderType("openrouter");
    setAiBaseUrl(openRouterConfig.baseUrl);
    setAiApiKey("");
    setAiModel("");
    showToast("AI 配置已清空");
  }, [keyProvider, keyBaseUrl, keyApiKey, keyModel, showToast]);

  return {
    showAiConfigModal,
    setShowAiConfigModal,
    aiProviderType,
    setAiProviderType,
    aiBaseUrl,
    setAiBaseUrl,
    aiApiKey,
    setAiApiKey,
    aiModel,
    setAiModel,
    saveAiSettings,
    clearAiSettings,
  };
}
