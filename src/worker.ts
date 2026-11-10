import { app } from './app';

export interface Env {
  COSMOS_ENDPOINT?: string;
  COSMOS_KEY?: string;
  COSMOS_DATABASE_ID?: string;
  GEMINI_API_KEY?: string;
  PAWAPAY_API_KEY?: string;
  ZEPTOMAIL_API_KEY?: string;
  INFOBIP_API_KEY?: string;
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

/**
 * Cloudflare Workers Entry Point
 * Mounts the high-speed Hono backend API and handles client assets.
 */
export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Delegate API, Docs, and Health routes directly to Hono
    if (
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/doc') ||
      url.pathname.startsWith('/docs') ||
      url.pathname === '/health'
    ) {
      return app.fetch(request, env, ctx);
    }

    // Serve static SPA assets in Cloudflare Pages / Workers Sites if binding present
    if (env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status < 400) {
        return assetRes;
      }
      // SPA Fallback to index.html
      return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }

    // Fallback to Hono router
    return app.fetch(request, env, ctx);
  },
};
