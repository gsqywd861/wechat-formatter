/** 站点与品牌常量（metadata、Json-Ld、robots、sitemap 共用） */

export const SITE_HOST = "wechat-formatter-d4c.pages.dev" as const;

export const SITE_URL = `https://${SITE_HOST}` as const;

export const SITE_BRAND = "公众号AI排版助手";

export const SITE_PRODUCT_NAME = "AI一键排版·自动转公众号·超多模板";

/** 默认 <title>：品牌前置，兼顾检索词 */
export const SITE_TITLE_DEFAULT = "公众号AI排版助手-AI一键排版-自动转公众号+超多模板";

/**
 * <meta name="description">
 */
export const SITE_DESCRIPTION = `${SITE_BRAND}是免费在线 Markdown 转微信公众号排版工具，支持 AI 一键优化排版结构，提供极简、商务、文艺、科技、节庆、旅游、政务 8 大类共 80+ 套精美模板，并支持实时预览、样式微调与一键复制发布。`;

/** Open Graph site_name */
export const SITE_OG_SITE_NAME = `${SITE_BRAND}`;
