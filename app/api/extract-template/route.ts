import { extractTemplateFromHtml, adaptiveExtractTemplate, DEFAULT_LEARNED_PARAMS } from "../../_lib/template-extractor";

/**
 * POST /api/extract-template
 *
 * 接收微信公众号文章的 HTML 或 URL，提取样式并生成 TemplateConfig。
 * v8: 支持学习参数自适应调整
 *
 * Body:
 *   { html: string }       — 直接提供文章 HTML
 *   { url: string }        — 提供文章链接（服务端抓取）
 *   { deviceId?: string }  — 设备ID（用于加载学习参数）
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { html: rawHtml, url, deviceId } = body as {
      html?: string;
      url?: string;
      deviceId?: string;
    };

    if (!rawHtml && !url) {
      return Response.json(
        { error: "请提供 HTML 内容或文章 URL" },
        { status: 400 },
      );
    }

    let htmlContent = rawHtml || "";

    // 如果提供了 URL，尝试抓取页面 HTML
    if (url && !htmlContent) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.43",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9",
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          return Response.json(
            {
              error: `无法获取文章内容 (HTTP ${response.status})。部分微信公众号文章需要登录或反爬限制，请尝试直接粘贴 HTML。`,
            },
            { status: 502 },
          );
        }

        htmlContent = await response.text();

        if (!htmlContent || htmlContent.length < 100) {
          return Response.json(
            {
              error: "获取到的文章内容为空。部分微信公众号文章需要登录查看，请尝试直接粘贴 HTML。",
            },
            { status: 422 },
          );
        }

        // 尝试提取文章的主体内容（公众号文章通常包含 <div class="rich_media_content">）
        // 使用更宽松的匹配模式，处理各种 class 格式
        const contentMatch = htmlContent.match(
          /<div[^>]*class="[^"]*rich_media_content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:script|div)/i,
        );
        if (contentMatch && contentMatch[1]) {
          htmlContent = `<section>${contentMatch[1]}</section>`;
        } else {
          // 第二策略：尝试匹配带属性的 rich_media_content（可能 class 在引号外）
          const contentMatch2 = htmlContent.match(
            /<div[^>]*class='[^']*rich_media_content[^']*'[^>]*>([\s\S]*?)<\/div>\s*<(?:script|div)/i,
          );
          if (contentMatch2 && contentMatch2[1]) {
            htmlContent = `<section>${contentMatch2[1]}</section>`;
          } else {
            // 第三策略：尝试匹配任何包含 rich_media_content 的 div
            const contentMatch3 = htmlContent.match(
              /<div[^>]*rich_media_content[^>]*>([\s\S]*?)<\/div>\s*<(?:script|div)/i,
            );
            if (contentMatch3 && contentMatch3[1]) {
              htmlContent = `<section>${contentMatch3[1]}</section>`;
            } else {
              // 备用：提取 body 内容
              const bodyMatch = htmlContent.match(
                /<body[^>]*>([\s\S]*)<\/body>/i,
              );
              if (bodyMatch && bodyMatch[1]) {
                htmlContent = bodyMatch[1];
              }
            }
          }
        }
      } catch (fetchErr) {
        const msg =
          fetchErr instanceof Error ? fetchErr.message : "未知错误";
        return Response.json(
          {
            error: `抓取文章失败: ${msg}。部分微信公众号文章需要登录或反爬限制，请尝试直接粘贴文章 HTML 到输入框。`,
          },
          { status: 502 },
        );
      }
    }

    // 检查 HTML 内容是否太短（可能是无效内容）
    if (!htmlContent || htmlContent.trim().length < 50) {
      return Response.json(
        {
          error: "HTML 内容过短或为空，请检查输入。如果使用的是文章链接，请尝试直接粘贴 HTML。",
        },
        { status: 422 },
      );
    }

    // 加载学习参数（如果有 deviceId）
    let learnedContext = DEFAULT_LEARNED_PARAMS;
    if (deviceId && deviceId.length > 10) {
      try {
        const { getLearnedParams } = await import("../../_lib/template-learning");
        const learnedParams = await getLearnedParams(deviceId, htmlContent);
        if (learnedParams) {
          learnedContext = learnedParams;
        }
      } catch {
        // 学习参数加载失败不影响主流程
      }
    }

    // 执行样式提取（传入学习参数）
    const template = adaptiveExtractTemplate(htmlContent, learnedContext);

    return Response.json({ success: true, template });
  } catch (err: unknown) {
    console.error("Template extraction error:", err);
    const message = err instanceof Error ? err.message : "未知错误";
    return Response.json(
      {
        error: `样式提取失败: ${message}。请检查 HTML 是否包含有效的排版样式。`,
      },
      { status: 500 },
    );
  }
}