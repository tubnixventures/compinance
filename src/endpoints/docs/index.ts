import { Context } from 'hono';
import { OPENAPI_SPEC } from './spec';
import { ENDPOINTS_CATALOG } from './endpoints-list';

export function handleGetDocsSpec(c: Context) {
  return c.json({
    ...OPENAPI_SPEC,
    endpoints: ENDPOINTS_CATALOG,
  });
}

export function handleGetDocsHtml(c: Context) {
  const wantsJson = c.req.header('accept')?.includes('application/json') || c.req.query('format') === 'json';
  if (wantsJson) {
    return handleGetDocsSpec(c);
  }

  const catalogJson = JSON.stringify(ENDPOINTS_CATALOG).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compinance Backend API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tailwindcss/ui@latest/dist/tailwind-ui.min.css">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans p-6 md:p-12 min-h-screen">
  <div class="max-w-6xl mx-auto space-y-8">
    <header class="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">v1.0.0 OPEN</span>
          <span class="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Kenya M-Pesa Only</span>
        </div>
        <h1 class="text-3xl font-extrabold text-white mt-2">Compinance Developer API Documentation</h1>
        <p class="text-slate-400 mt-1">Open public reference for frontend engineers and coding agents. Base: <code class="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">/api</code></p>
      </div>
      <div class="flex gap-2">
        <a href="/docs/spec" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg text-slate-200 border border-slate-700">OpenAPI JSON</a>
        <a href="/" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-sm font-medium rounded-lg text-white">Interactive Playground</a>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Authentication</div>
        <div class="text-sm text-slate-300 mt-1">1hr Access Token | 60-day Refresh Token | Cookie Sessions</div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Disbursements & Float</div>
        <div class="text-sm text-slate-300 mt-1">PawaPay M-Pesa integration with automated balance float reserve check</div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold">KYC Verification</div>
        <div class="text-sm text-slate-300 mt-1">Cloudflare R2 + Gemini AI automated forgery & consistency check</div>
      </div>
      <div class="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Hierarchy RBAC</div>
        <div class="text-sm text-slate-300 mt-1">Customer Care &lt; Manager &lt; Admin &lt; CEO &lt; Root (no peer visibility)</div>
      </div>
    </div>

    <div id="endpoints-container" class="space-y-4"></div>
  </div>

  <script>
    const endpoints = ${catalogJson};
    const container = document.getElementById('endpoints-container');
    
    endpoints.forEach(ep => {
      const card = document.createElement('div');
      card.className = "bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition";
      const badgeColor = ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ep.method === 'DELETE' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      
      card.innerHTML = \`
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 text-xs font-mono font-bold rounded border \${badgeColor}">\${ep.method}</span>
            <code class="text-base font-mono text-white font-semibold">\${ep.path}</code>
            <span class="text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-800">\${ep.tag}</span>
          </div>
          <span class="text-xs px-2.5 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700">Auth: \${ep.auth}</span>
        </div>
        <p class="text-slate-300 text-sm mt-3">\${ep.description}</p>
        <div class="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          \${ep.bodySample ? \`<div><span class="text-slate-500 block mb-1">Request Payload:</span><pre class="bg-slate-950 p-3 rounded-lg overflow-x-auto text-emerald-300">\${JSON.stringify(ep.bodySample, null, 2)}</pre></div>\` : ''}
          <div><span class="text-slate-500 block mb-1">Response Sample:</span><pre class="bg-slate-950 p-3 rounded-lg overflow-x-auto text-slate-300">\${JSON.stringify(ep.responseSample, null, 2)}</pre></div>
        </div>
      \`;
      container.appendChild(card);
    });
  </script>
</body>
</html>`;

  return c.html(html);
}
