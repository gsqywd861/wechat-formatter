import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDeviceId } from "../_lib/device-id";
import { saveConfigToCloud } from "../_lib/cloud-config";

export type WeChatCredentials = {
  appId: string;
  appSecret: string;
  thumbMediaId: string;
  author: string;
};

/**
 * 使用设备 ID 作为前缀，确保微信发布配置与当前设备绑定。
 * 用户重新打开页面时自动加载其专属配置。
 */
function useDeviceScopedKey(baseKey: string): string {
  const deviceId = useMemo(() => getDeviceId(), []);
  return `${deviceId}:${baseKey}`;
}

const BASE_KEYS = {
  appId: "wechat-publish-app-id",
  appSecret: "wechat-publish-app-secret",
  thumbMediaId: "wechat-publish-thumb-media-id",
  author: "wechat-publish-author",
} as const;

export function useWeChatSettings() {
  const deviceId = useMemo(() => getDeviceId(), []);
  const keyAppId = useDeviceScopedKey(BASE_KEYS.appId);
  const keyAppSecret = useDeviceScopedKey(BASE_KEYS.appSecret);
  const keyThumbMediaId = useDeviceScopedKey(BASE_KEYS.thumbMediaId);
  const keyAuthor = useDeviceScopedKey(BASE_KEYS.author);

  // 标记初始加载，避免首次加载同步到云端（云端已是最新）
  const isInitialMount = useRef(true);

  const [credentials, setCredentials] = useState<WeChatCredentials>({
    appId: "",
    appSecret: "",
    thumbMediaId: "",
    author: "",
  });

  useEffect(() => {
    setCredentials({
      appId: localStorage.getItem(keyAppId) || "",
      appSecret: localStorage.getItem(keyAppSecret) || "",
      thumbMediaId: localStorage.getItem(keyThumbMediaId) || "",
      author: localStorage.getItem(keyAuthor) || "",
    });
  }, [keyAppId, keyAppSecret, keyThumbMediaId, keyAuthor]);

  const saveCredentials = useCallback(
    (creds: WeChatCredentials) => {
      localStorage.setItem(keyAppId, creds.appId);
      localStorage.setItem(keyAppSecret, creds.appSecret);
      localStorage.setItem(keyThumbMediaId, creds.thumbMediaId);
      localStorage.setItem(keyAuthor, creds.author);
      setCredentials(creds);
    },
    [keyAppId, keyAppSecret, keyThumbMediaId, keyAuthor],
  );

  // 响应式同步到云端（不阻塞 UI 渲染）
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // 仅在已有有效数据时才同步
    if (!credentials.appId && !credentials.appSecret) return;
    saveConfigToCloud(deviceId, { wechat: credentials });
  }, [credentials, deviceId]);

  const clearCredentials = useCallback(() => {
    localStorage.removeItem(keyAppId);
    localStorage.removeItem(keyAppSecret);
    localStorage.removeItem(keyThumbMediaId);
    localStorage.removeItem(keyAuthor);
    setCredentials({ appId: "", appSecret: "", thumbMediaId: "", author: "" });
  }, [keyAppId, keyAppSecret, keyThumbMediaId, keyAuthor]);

  /** 从云端配置覆盖本地凭据 */
  const applyCloudConfig = useCallback(
    (cloudWechat: WeChatCredentials) => {
      localStorage.setItem(keyAppId, cloudWechat.appId);
      localStorage.setItem(keyAppSecret, cloudWechat.appSecret);
      localStorage.setItem(keyThumbMediaId, cloudWechat.thumbMediaId);
      localStorage.setItem(keyAuthor, cloudWechat.author);
      setCredentials(cloudWechat);
    },
    [keyAppId, keyAppSecret, keyThumbMediaId, keyAuthor],
  );

  const isConfigured = credentials.appId !== "" && credentials.appSecret !== "";

  return { credentials, saveCredentials, clearCredentials, applyCloudConfig, isConfigured };
}
