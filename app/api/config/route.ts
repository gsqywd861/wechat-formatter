/**
 * 云端配置存储 API
 *
 * 使用 Cloudflare KV 持久化用户配置（公众号凭据和 AI 设置），
 * 以设备 ID 作为唯一标识，跨设备/浏览器互不干扰。
 *
 * POST /api/config  — 保存或更新配置（全量覆盖）
 * GET  /api/config?deviceId=xxx — 读取指定设备的配置
 * DELETE /api/config?deviceId=xxx — 清除指定设备的配置
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type WeChatConfig = {
  appId: string;
  appSecret: string;
  thumbMediaId: string;
  author: string;
};

type AiConfig = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type UserConfig = {
  wechat: WeChatConfig;
  ai: AiConfig;
};

async function getKV() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (ctx.env as any).config_store as {
      get: (key: string) => Promise<string | null>;
      put: (key: string, value: string) => Promise<void>;
      delete: (key: string) => Promise<void>;
    };
  } catch (e) {
    console.error("Failed to get KV binding:", e);
    return null;
  }
}

function validateDeviceId(deviceId: string): boolean {
  return typeof deviceId === "string" && deviceId.length > 10;
}

// POST — 保存配置
export async function POST(request: NextRequest) {
  try {
    const kv = await getKV();
    if (!kv) {
      return NextResponse.json({ error: "云端存储不可用，配置仅保存在本地浏览器" }, { status: 503 });
    }

    const body = (await request.json()) as {
      deviceId: string;
      wechat?: WeChatConfig;
      ai?: AiConfig;
    };

    const { deviceId, wechat, ai } = body;

    if (!deviceId || !validateDeviceId(deviceId)) {
      return NextResponse.json({ error: "无效的设备 ID" }, { status: 400 });
    }

    const key = `config:${deviceId}`;

    // 读取已有配置，合并后写入
    const existing = await kv.get(key);
    const existingConfig: Partial<UserConfig> = existing ? JSON.parse(existing) : {};

    const mergedConfig: UserConfig = {
      wechat: wechat ?? existingConfig.wechat ?? { appId: "", appSecret: "", thumbMediaId: "", author: "" },
      ai: ai ?? existingConfig.ai ?? { provider: "", baseUrl: "", apiKey: "", model: "" },
    };

    await kv.put(key, JSON.stringify(mergedConfig));

    return NextResponse.json({ success: true, message: "配置已保存到云端" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    console.error("[config save error]", message);
    return NextResponse.json({ error: `保存配置失败: ${message}` }, { status: 500 });
  }
}

// GET — 加载配置
export async function GET(request: NextRequest) {
  try {
    const kv = await getKV();
    if (!kv) {
      return NextResponse.json({ error: "云端存储不可用" }, { status: 503 });
    }

    const deviceId = request.nextUrl.searchParams.get("deviceId");

    if (!deviceId || !validateDeviceId(deviceId)) {
      return NextResponse.json({ error: "无效的设备 ID" }, { status: 400 });
    }

    const key = `config:${deviceId}`;
    const data = await kv.get(key);

    if (!data) {
      return NextResponse.json({ config: null, message: "云端暂无配置" });
    }

    const config = JSON.parse(data) as UserConfig;
    return NextResponse.json({ config, message: "配置已从云端加载" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    console.error("[config load error]", message);
    return NextResponse.json({ error: `加载配置失败: ${message}` }, { status: 500 });
  }
}

// DELETE — 清除配置
export async function DELETE(request: NextRequest) {
  try {
    const kv = await getKV();
    if (!kv) {
      return NextResponse.json({ error: "云端存储不可用" }, { status: 503 });
    }

    const deviceId = request.nextUrl.searchParams.get("deviceId");

    if (!deviceId || !validateDeviceId(deviceId)) {
      return NextResponse.json({ error: "无效的设备 ID" }, { status: 400 });
    }

    const key = `config:${deviceId}`;
    await kv.delete(key);

    return NextResponse.json({ success: true, message: "云端配置已清除" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: `清除配置失败: ${message}` }, { status: 500 });
  }
}
