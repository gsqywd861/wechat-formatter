import { NextResponse } from "next/server";
import { deflateSync } from "zlib";

export const runtime = "nodejs";

/**
 * POST /api/wechat/draft
 *
 * 将文章发布到微信公众号草稿箱。
 * 如果未提供封面 media_id，自动生成默认封面并上传。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appId, appSecret, title, author, digest, content, thumbMediaId } = body;

    if (!appId || !appSecret) {
      return NextResponse.json({ error: "请先配置 AppID 和 AppSecret" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "文章标题不能为空" }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "文章内容不能为空" }, { status: 400 });
    }

    // Step 1: 获取 access_token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}`;

    const tokenRes = await fetch(tokenUrl, { method: "GET" });
    const tokenData = await tokenRes.json() as {
      access_token?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          error: `获取 access_token 失败: ${tokenData.errmsg || `错误码 ${tokenData.errcode}`}`,
        },
        { status: 400 },
      );
    }

    const accessToken = tokenData.access_token;

    // Step 2: 确定封面 media_id（未提供则自动生成）
    let finalThumbMediaId = thumbMediaId;
    if (!finalThumbMediaId) {
      const uploadResult = await uploadDefaultCover(accessToken);
      if (!uploadResult.success) {
        return NextResponse.json({
          error: `自动生成默认封面失败，请在弹窗中手动填写封面 media_id。${uploadResult.error}`,
        }, { status: 400 });
      }
      finalThumbMediaId = uploadResult.mediaId;
    }

    // Step 3: 创建草稿
    const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;

    const draftBody = {
      articles: [
        {
          title: title.slice(0, 64),
          author: (author || "").slice(0, 16),
          digest: (digest || "").slice(0, 128),
          content,
          content_source_url: "",
          thumb_media_id: finalThumbMediaId,
          need_open_comment: 0,
          only_fans_can_comment: 0,
        },
      ],
    };

    const draftRes = await fetch(draftUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftBody),
    });
    const draftData = await draftRes.json() as {
      media_id?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (draftData.media_id) {
      const autoCoverNote = !thumbMediaId ? "（已自动生成默认封面）" : "";
      return NextResponse.json({
        success: true,
        mediaId: draftData.media_id,
        message: `草稿已成功发布到微信公众号草稿箱${autoCoverNote}！`,
      });
    }

    // 美化常见错误
    const errMsg = draftData.errmsg || "";
    let userFriendlyError = `发布草稿失败: ${errMsg}`;

    if (errMsg.includes("media_id") || errMsg.includes("thumb_media_id")) {
      userFriendlyError =
        "封面素材 media_id 无效。请检查：\n" +
        "1. 确认在微信公众号后台「素材管理」已上传封面图片\n" +
        "2. 确保填入的是「永久素材」的 media_id（临时素材不可用）\n" +
        "3. 封面图片格式须为 JPG/PNG/GIF/BMP";
    } else if (errMsg.includes("content")) {
      userFriendlyError =
        "文章内容不符合要求。请检查：\n" +
        "1. 内容不超过 2 万字符\n" +
        "2. 图片链接需来自微信域（外部图片会被过滤）";
    }

    return NextResponse.json({ error: userFriendlyError }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: `请求失败: ${message}` }, { status: 500 });
  }
}

// ─── 默认封面自动生成 ─────────────────────────────

const COVER_WIDTH = 400;
const COVER_HEIGHT = 200;

type UploadResult = { success: true; mediaId: string } | { success: false; error: string };

/**
 * 生成默认封面 PNG 并上传到微信永久素材，返回 media_id
 */
async function uploadDefaultCover(accessToken: string): Promise<UploadResult> {
  try {
    const pngBuffer = generateSolidPng(COVER_WIDTH, COVER_HEIGHT, 0xe8, 0xa8, 0x38);

    // 上传为微信永久素材（草稿箱仅接受永久素材 media_id）
    const uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`;

    // 使用 Node.js 18+ 原生 FormData + File
    const uint8 = new Uint8Array(pngBuffer);
    const file = new File([uint8], "cover.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("media", file);

    const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
    const uploadData = await uploadRes.json() as {
      media_id?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (uploadData.media_id) {
      return { success: true, mediaId: uploadData.media_id };
    }

    return {
      success: false,
      error: uploadData.errmsg || `错误码 ${uploadData.errcode || "未知"}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "未知错误",
    };
  }
}

/**
 * 纯 Node.js 生成 PNG 图片（无外部依赖）
 * 生成一张指定尺寸的单色 PNG
 */
function generateSolidPng(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
): Buffer {
  // ----- 原始像素数据 -----
  // 每行: 1 字节 filter (0=None) + width*3 bytes RGB
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize, 0);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  // ----- 用 zlib 压缩 -----
  const compressed = deflateSync(rawData);

  // ----- 组装 PNG 文件 -----
  const chunks: Buffer[] = [];

  // PNG signature
  chunks.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  // IHDR chunk (13 bytes)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk("IHDR", ihdr));

  // IDAT chunk
  chunks.push(makeChunk("IDAT", compressed));

  // IEND chunk
  chunks.push(makeChunk("IEND", Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

/** 创建 PNG chunk: length(4) + type(4) + data + crc(4) */
function makeChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const length = data.length;
  const crcBuf = Buffer.alloc(4);
  // CRC32 计算：type + data
  const crcInput = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);

  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(length, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/** CRC32 查表法（PNG 规范使用） */
function crc32(data: Buffer): number {
  // 建立查找表
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
