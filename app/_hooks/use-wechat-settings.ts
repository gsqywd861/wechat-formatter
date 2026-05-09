import { useCallback, useEffect, useState } from "react";

const STORAGE_KEYS = {
  appId: "wechat-app-id",
  appSecret: "wechat-app-secret",
  thumbMediaId: "wechat-thumb-media-id",
  author: "wechat-author",
} as const;

export type WeChatCredentials = {
  appId: string;
  appSecret: string;
  thumbMediaId: string;
  author: string;
};

export function useWeChatSettings() {
  const [credentials, setCredentials] = useState<WeChatCredentials>({
    appId: "",
    appSecret: "",
    thumbMediaId: "",
    author: "",
  });

  useEffect(() => {
    setCredentials({
      appId: localStorage.getItem(STORAGE_KEYS.appId) || "",
      appSecret: localStorage.getItem(STORAGE_KEYS.appSecret) || "",
      thumbMediaId: localStorage.getItem(STORAGE_KEYS.thumbMediaId) || "",
      author: localStorage.getItem(STORAGE_KEYS.author) || "",
    });
  }, []);

  const saveCredentials = useCallback((creds: WeChatCredentials) => {
    localStorage.setItem(STORAGE_KEYS.appId, creds.appId);
    localStorage.setItem(STORAGE_KEYS.appSecret, creds.appSecret);
    localStorage.setItem(STORAGE_KEYS.thumbMediaId, creds.thumbMediaId);
    localStorage.setItem(STORAGE_KEYS.author, creds.author);
    setCredentials(creds);
  }, []);

  const clearCredentials = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.appId);
    localStorage.removeItem(STORAGE_KEYS.appSecret);
    localStorage.removeItem(STORAGE_KEYS.thumbMediaId);
    localStorage.removeItem(STORAGE_KEYS.author);
    setCredentials({ appId: "", appSecret: "", thumbMediaId: "", author: "" });
  }, []);

  const isConfigured = credentials.appId !== "" && credentials.appSecret !== "";

  return { credentials, saveCredentials, clearCredentials, isConfigured };
}
