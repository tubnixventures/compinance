import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  BookOpen,
  Terminal,
  Play,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Layers,
  Database,
  Smartphone,
  Globe,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ENDPOINTS_CATALOG, ApiDocEndpoint } from './endpoints/docs/endpoints-list';

export default function App() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiDocEndpoint>(ENDPOINTS_CATALOG[0]);
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(ENDPOINTS_CATALOG[0].bodySample || {}, null, 2)
  );
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeRoleSession, setActiveRoleSession] = useState<string>('None (Public)');

  const tags = ['All', 'Auth', 'Users & KYC', 'Staff & RBAC', 'Loans & PawaPay'];

  const filteredEndpoints = selectedTag === 'All'
    ? ENDPOINTS_CATALOG
    : ENDPOINTS_CATALOG.filter((e) => e.tag === selectedTag);

  useEffect(() => {
    setRequestBody(
      selectedEndpoint.bodySample ? JSON.stringify(selectedEndpoint.bodySample, null, 2) : ''
    );
    setResponseOutput(null);
    setResponseStatus(null);
    setResponseHeaders({});
  }, [selectedEndpoint]);

  const handleSelectEndpoint = (ep: ApiDocEndpoint) => {
    setSelectedEndpoint(ep);
  };

  const handleExecuteRequest = async () => {
    setLoading(true);
    setResponseOutput(null);
    setResponseStatus(null);
    setResponseHeaders({});

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(selectedEndpoint.method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      setResponseStatus(res.status);

      const headersMap: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersMap[key] = val;
      });
      setResponseHeaders(headersMap);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponseOutput(json);
      } else {
        const text = await res.text();
        setResponseOutput(text);
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseOutput({ error: err.message, note: 'Network or client error during request' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleName: string, email: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: email, password: 'Compinance2026!' }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveRoleSession(`${roleName} (${email})`);
        setResponseStatus(res.status);
        setResponseOutput(json);
      } else {
        alert(`Login failed: ${json.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const curlCommand = `curl -X ${selectedEndpoint.method} "http://localhost:3000${selectedEndpoint.path}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" ${
    selectedEndpoint.bodySample
      ? `\\\n  -d '${requestBody.replace(/\n/g, '').replace(/\s+/g, ' ')}'`
      : ''
  }`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Banner Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">Compinance</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Core Backend API
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  /doc
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Open Developer Documentation & Interactive API Console for Frontend Engineers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500">Active Session:</span>
              <span className="font-mono font-semibold text-emerald-400">{activeRoleSession}</span>
            </div>
            <a
              href="/doc/spec"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition"
            >
              <span>OpenAPI Spec</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Architecture Highlights Bar */}
      <section className="border-b border-slate-800/80 bg-slate-900/40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <strong>PawaPay M-Pesa:</strong> Float-checked automated disbursement & reconciliation
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <strong>Gemini AI KYC:</strong> Automated document consistency & fraud analysis
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <strong>Storage:</strong> Firestore (Google Native) & Cloudflare R2
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <strong>Hyper Security:</strong> Kenya Geo-fence & VPN blocking
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <strong>Antifraud & Governance:</strong> 1 Account per ID/Phone • Peer-Parent & Self-Parenting Blocking • Deep Gemini Forensic KYC
            </span>
          </div>

          {/* Quick Role Impersonator */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-500 font-semibold mr-1">Auth Quick-Switch:</span>
            {[
              { label: 'Student', email: 'student@uonbi.ac.ke' },
              { label: 'Care (L1)', email: 'care@compinance.co.ke' },
              { label: 'Manager (L2)', email: 'manager@compinance.co.ke' },
              { label: 'Admin (L3)', email: 'admin@compinance.co.ke' },
              { label: 'CEO (L4)', email: 'ceo@compinance.co.ke' },
              { label: 'Root (L5)', email: 'root@compinance.co.ke' },
            ].map((r) => (
              <button
                key={r.label}
                onClick={() => handleQuickLogin(r.label, r.email)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
                title={`Login as ${r.email}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Documentation & Interactive Console Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoint Navigation */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="flex flex-wrap gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  selectedTag === t
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 max-h-[calc(100vh-220px)] overflow-y-auto space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1 tracking-wider">
              Available Endpoints ({filteredEndpoints.length})
            </div>
            {filteredEndpoints.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              const methodColor =
                ep.method === 'POST'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : ep.method === 'DELETE'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : 'text-blue-400 bg-blue-500/10 border-blue-500/20';

              return (
                <button
                  key={`${ep.method}-${ep.path}`}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-2.5 rounded-xl transition flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/40 shadow-sm'
                      : 'border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${methodColor}`}>
                      {ep.method}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{ep.auth}</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{ep.summary}</div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">{ep.path}</div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Endpoint Specification & Live Request Runner */}
        <section className="lg:col-span-8 space-y-6">
          {/* Selected Endpoint Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border ${
                    selectedEndpoint.method === 'POST'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : selectedEndpoint.method === 'DELETE'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      : 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <code className="text-base sm:text-lg font-mono font-bold text-white">
                  {selectedEndpoint.path}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  {selectedEndpoint.auth}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {selectedEndpoint.tag}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">{selectedEndpoint.summary}</h2>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">{selectedEndpoint.description}</p>
            </div>

            {/* Request Body & Parameters */}
            {['POST', 'PUT', 'PATCH', 'DELETE'].includes(selectedEndpoint.method) && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Request JSON Body
                  </span>
                  <span className="text-slate-500">Edit payload before executing</span>
                </div>
                <textarea
                  rows={selectedEndpoint.bodySample ? 6 : 3}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 shadow-inner"
                  placeholder="{}"
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteRequest}
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{loading ? 'Sending Request...' : 'Execute Live Request'}</span>
                </button>
              </div>

              <button
                onClick={copyCurl}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'cURL Copied!' : 'Copy cURL'}</span>
              </button>
            </div>
          </div>

          {/* Response Console Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Response Console
                </h3>
              </div>
              {responseStatus !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold border ${
                      responseStatus < 300
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : responseStatus === 401 || responseStatus === 403
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {responseStatus}
                  </span>
                </div>
              )}
            </div>

            {responseOutput ? (
              <div className="space-y-3">
                {Object.keys(responseHeaders).length > 0 && (
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-[11px] font-mono text-slate-400 space-y-0.5">
                    <span className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">Response Headers:</span>
                    <div>content-type: <span className="text-slate-200">{responseHeaders['content-type']}</span></div>
                    {responseHeaders['set-cookie'] && (
                      <div>set-cookie: <span className="text-emerald-300">{responseHeaders['set-cookie']}</span></div>
                    )}
                  </div>
                )}
                <pre className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96 shadow-inner">
                  {typeof responseOutput === 'object'
                    ? JSON.stringify(responseOutput, null, 2)
                    : responseOutput}
                </pre>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-8 text-center text-xs text-slate-500">
                Click <strong className="text-slate-300">"Execute Live Request"</strong> above or trigger any endpoint to inspect real JSON outputs, session cookies, and HTTP headers.
              </div>
            )}
          </div>

          {/* Reference Sample Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Contract Response Schema
            </h3>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
              {JSON.stringify(selectedEndpoint.responseSample, null, 2)}
            </pre>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-4 py-4 text-xs text-slate-500 text-center">
        Compinance Backend v1.0.0 • Pure Cloud Run Node.js & Google Native Firestore • PawaPay Kenya M-Pesa Integration • Cloudflare R2 • ZeptoMail • Infobip WhatsApp
      </footer>
    </div>
  );
}
