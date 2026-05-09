/**
 * 设备 ID 工具
 * 在浏览器首次访问时生成一个 UUID，存入 localStorage，
 * 用于后续区分用户身份、持久化保存用户设置。
 */

const DEVICE_ID_KEY = "wechat-formatter-device-id";

function generateUuid(): string {
  // 浏览器的 crypto.randomUUID() 方案
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback：手动生成 UUID v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUuid();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
