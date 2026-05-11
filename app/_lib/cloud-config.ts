/**
 * 云端配置存储工具
 *
 * 通过 /api/config 接口将用户配置持久化到 Cloudflare KV，
 * 以设备 ID 作为唯一标识。
 */
import type { WeChatCredentials } from "../_hooks/use-wechat-settings";

export type CloudAiConfig = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type CloudUserConfig = {
  wechat?: WeChatCredentials;
  ai?: CloudAiConfig;
};

const FETCH_TIMEOUT_MS = 5_000;

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** 保存配置到云端（按需传输 wechat / ai 子集） */
export async function saveConfigToCloud(
  deviceId: string,
  partial: CloudUserConfig,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithTimeout("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, ...partial }),
    });
    const data = await res.json() as { success?: boolean; message?: string; error?: string };
    if (data.success) {
      return { success: true, message: data.message || "已保存" };
    }
    return { success: false, message: data.error || "保存失败" };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "网络错误" };
  }
}

/** 从云端加载配置 */
export async function loadConfigFromCloud(
  deviceId: string,
): Promise<{ config: CloudUserConfig | null; message: string }> {
  try {
    const res = await fetchWithTimeout(`/api/config?deviceId=${encodeURIComponent(deviceId)}`);
    const data = await res.json() as {
      config?: CloudUserConfig | null;
      message?: string;
      error?: string;
    };
    if (data.config) {
      return { config: data.config, message: data.message || "" };
    }
    return { config: null, message: data.message || data.error || "无云端配置" };
  } catch (err) {
    return { config: null, message: err instanceof Error ? err.message : "网络错误" };
  }
}

/** 清除云端配置 */
export async function clearConfigFromCloud(deviceId: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`/api/config?deviceId=${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
    });
    const data = await res.json() as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}
