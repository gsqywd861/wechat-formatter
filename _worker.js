// Custom _worker.js for Cloudflare Pages with static asset serving
// This file should be placed in the project root and will be copied to .open-next/ after build

//@ts-expect-error: Will be resolved by wrangler build
import { handleCdnCgiImageRequest, handleImageRequest } from "./cloudflare/images.js";
//@ts-expect-error: Will be resolved by wrangler build
import { runWithCloudflareRequestContext } from "./cloudflare/init.js";
//@ts-expect-error: Will be resolved by wrangler build
import { maybeGetSkewProtectionResponse } from "./cloudflare/skew-protection.js";
// @ts-expect-error: Will be resolved by wrangler build
import { handler as middlewareHandler } from "./middleware/handler.mjs";
//@ts-expect-error: Will be resolved by wrangler build
export { DOQueueHandler } from "./.build/durable-objects/queue.js";
//@ts-expect-error: Will be resolved by wrangler build
export { DOShardedTagCache } from "./.build/durable-objects/sharded-tag-cache.js";
//@ts-expect-error: Will be resolved by wrangler build
export { BucketCachePurge } from "./.build/durable-objects/bucket-cache-purge.js";
//@ts-expect-error: Will be resolved by wrangler build
import { handler as serverHandler } from "./server-functions/default/handler.mjs";
export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            const skewResponse = maybeGetSkewProtectionResponse(request);
            if (skewResponse) {
                return skewResponse;
            }
            const url = new URL(request.url);

            // Serve images in development.
            if (url.pathname.startsWith("/cdn-cgi/image/")) {
                return handleCdnCgiImageRequest(url, env);
            }
            // Fallback for the Next default image loader.
            if (url.pathname ===
                `${globalThis.__NEXT_BASE_PATH__}/_next/image${globalThis.__TRAILING_SLASH__ ? "/" : ""}`) {
                return await handleImageRequest(url, request.headers, env);
            }
            // Serve static assets from ASSETS binding (Cloudflare Pages built-in)
            // 直接 return，不允许 fallthrough 到 Next server handler，防止 404/竞态
            // 注意：env.ASSETS.fetch() 必须传 URL string 而非 Request 对象
            if (url.pathname.startsWith("/_next/") || url.pathname === "/logo.png" || url.pathname === "/og-image.png") {
                const assetUrl = new URL(url.pathname, "https://assets.local");
                const assetResponse = await env.ASSETS.fetch(assetUrl.toString());
                return assetResponse;
            }
            // - `Request`s are handled by the Next server
            const reqOrResp = await middlewareHandler(request, env, ctx);
            if (reqOrResp instanceof Response) {
                return reqOrResp;
            }
            return serverHandler(reqOrResp, env, ctx, request.signal);
        });
    },
};
