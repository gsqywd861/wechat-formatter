/**
 * 学习系统 API
 *
 * POST /api/learn
 *   action: "record_extraction"  - 记录一次提取结果
 *   action: "record_correction"  - 记录用户修正
 *   action: "get_params"         - 获取学习后的参数
 *
 * GET /api/learn?deviceId=xxx&action=stats
 *   获取学习统计
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getLearnedParams,
  loadLearningState,
  recordCorrection,
  recordExtraction,
} from "../../_lib/template-learning";

export const runtime = "nodejs";

async function getKV() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (ctx.env as any).config_store as {
      get: (key: string) => Promise<string | null>;
      put: (key: string, value: string) => Promise<void>;
    };
  } catch (e) {
    console.error("Failed to get KV binding:", e);
    return null;
  }
}

function validateDeviceId(deviceId: string): boolean {
  return typeof deviceId === "string" && deviceId.length > 10;
}

// POST
export async function POST(request: NextRequest) {
  try {
    const kv = await getKV();
    if (!kv) {
      return NextResponse.json(
        { error: "云端存储不可用" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { action, deviceId, html, extracted, userTemplate } = body;

    if (!deviceId || !validateDeviceId(deviceId)) {
      return NextResponse.json(
        { error: "无效的设备 ID" },
        { status: 400 },
      );
    }

    switch (action) {
      case "record_extraction": {
        if (!html || !extracted) {
          return NextResponse.json(
            { error: "缺少 html 或 extracted 参数" },
            { status: 400 },
          );
        }
        await recordExtraction(deviceId, html, extracted);
        return NextResponse.json({ success: true, message: "提取结果已记录" });
      }

      case "record_correction": {
        if (!html || !extracted || !userTemplate) {
          return NextResponse.json(
            { error: "缺少必要参数" },
            { status: 400 },
          );
        }
        await recordCorrection(deviceId, html, extracted, userTemplate);
        return NextResponse.json({ success: true, message: "修正已记录" });
      }

      case "get_params": {
        if (!html) {
          return NextResponse.json(
            { error: "缺少 html 参数" },
            { status: 400 },
          );
        }
        const params = await getLearnedParams(deviceId, html);
        return NextResponse.json({ success: true, params });
      }

      default:
        return NextResponse.json(
          { error: `未知 action: ${action}` },
          { status: 400 },
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    console.error("[learn API error]", message);
    return NextResponse.json(
      { error: `处理失败: ${message}` },
      { status: 500 },
    );
  }
}

// GET - 获取学习统计
export async function GET(request: NextRequest) {
  try {
    const deviceId = request.nextUrl.searchParams.get("deviceId");
    const action = request.nextUrl.searchParams.get("action");

    if (!deviceId || !validateDeviceId(deviceId)) {
      return NextResponse.json(
        { error: "无效的设备 ID" },
        { status: 400 },
      );
    }

    const state = await loadLearningState(deviceId);

    if (!state) {
      return NextResponse.json({
        hasData: false,
        stats: null,
      });
    }

    if (action === "stats") {
      return NextResponse.json({
        hasData: true,
        stats: state.stats,
        patternCount: state.patterns.length,
        recordCount: state.records.length,
        patterns: state.patterns.map((p) => ({
          id: p.id,
          usageCount: p.usageCount,
          successRate: p.successRate,
          lastUsed: p.lastUsed,
          thresholdAdjustments: p.thresholdAdjustments,
        })),
      });
    }

    return NextResponse.json({
      hasData: true,
      stats: state.stats,
      patterns: state.patterns.map((p) => ({
        id: p.id,
        usageCount: p.usageCount,
        successRate: p.successRate,
        lastUsed: p.lastUsed,
        thresholdAdjustments: p.thresholdAdjustments,
        stylePreferences: p.stylePreferences,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: `加载失败: ${message}` },
      { status: 500 },
    );
  }
}
