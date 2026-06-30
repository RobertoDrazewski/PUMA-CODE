"use client";

import { useEffect, useState, useCallback } from 'react';
import { api, API_BASE, formatDate, getToken } from '../../lib/adminApi';
import { Card, Button, Input, Select, Modal } from './ui';

/* Abre un archivo desde un endpoint protegido (manda el token, trae el blob
   y lo abre en una pestaña nueva; si el navegador la bloquea, lo descarga). */
async function descargarArchivoAuth(path: string, fallbackName: string) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) {
    let msg = `No se pudo generar el informe (HTTP ${res.status}).`;
    try { const j = await res.json(); msg = j.error || msg; } catch { /* binario */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // Pestaña bloqueada por el navegador -> caemos a descarga directa.
    const a = document.createElement('a');
    a.href = url; a.download = fallbackName;
    document.body.appendChild(a); a.click(); a.remove();
  }
  // Damos tiempo a que la pestaña/descarga tome el blob antes de liberarlo.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* ===================== Tipos ===================== */
interface SProject {
  id: number; nombre: string; dominio: string | null; plan: string;
  score: number; fecha: string; estado: string; label: string; color: string;
  token: string | null; badge_active: boolean;
}
interface Stats { proyectos: number; score_promedio: number | string; auditorias: number; ultima_auditoria: string; }
interface Hallazgo {
  titulo: string; severidad: string; cvss: string; cvss_vector?: string;
  owasp: string; descripcion: string; evidencia: string; impacto: string; recomendacion: string;
}
interface Comando { herramienta: string; fase: string; orden: number; descripcion: string; comando: string; }
interface ChatTest { id: string; nombre: string; owasp: string; descripcion: string; prompt_ataque: string; }

const SEV_COLOR: Record<string, string> = {
  critico: 'bg-red-500/15 text-red-300 border-red-500/30',
  alto: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medio: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  bajo: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  info: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const SUBTABS = [
  { key: 'panel', label: 'Panel' },
  { key: 'analyzer', label: 'Analizador IA' },
  { key: 'chatbot', label: 'Test de chatbots' },
  { key: 'commands', label: 'Comandos' },
  { key: 'badges', label: 'Sellos' },
] as const;
type SubTab = (typeof SUBTABS)[number]['key'];

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1200); }}
      className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
    >
      {ok ? '✓ copiado' : 'copiar'}
    </button>
  );
}

/* ===================== Componente principal ===================== */
export default function SentinelTab() {
  const [sub, setSub] = useState<SubTab>('panel');
  const [projects, setProjects] = useState<SProject[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    try {
      const res = await api<{ stats: Stats; proyectos: SProject[] }>('/api/sentinel');
      setStats(res.stats); setProjects(res.proyectos);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-red-400">🛡️</span>
        <h2 className="text-lg font-semibold text-white">Sentinel</h2>
        <span className="text-xs text-slate-500 border border-white/10 rounded-full px-2 py-0.5">seguridad ofensiva · interno</span>
      </div>

      {/* Sub-navegación */}
      <nav className="flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
        {SUBTABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition ${
              sub === t.key ? 'text-white border-b-2 border-red-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {sub === 'panel' && <PanelView stats={stats} projects={projects} reload={loadOverview} />}
      {sub === 'analyzer' && <AnalyzerView projects={projects} reload={loadOverview} />}
      {sub === 'chatbot' && <ChatbotView />}
      {sub === 'commands' && <CommandsView projects={projects} />}
      {sub === 'badges' && <BadgesView projects={projects} />}
    </div>
  );
}

/* ===================== Panel ===================== */
function PanelView({ stats, projects, reload }: { stats: Stats | null; projects: SProject[]; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', contact: '', plan: 'profesional' });
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function create() {
    setError('');
    if (!form.name) { setError('El nombre es obligatorio.'); return; }
    try { await api('/api/sentinel/projects', { method: 'POST', body: form }); setOpen(false); setForm({ name: '', domain: '', contact: '', plan: 'profesional' }); reload(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }
  async function remove(id: number) {
    if (!confirm('¿Quitar este proyecto de Sentinel? Se borran sus auditorías.')) return;
    await api(`/api/sentinel/projects/${id}`, { method: 'DELETE' }); reload();
  }
  async function descargarUltimoInforme(p: SProject) {
    setError('');
    try {
      const res = await api<{ audits: { id: number }[] }>(`/api/sentinel/projects/${p.id}/audits`);
      if (!res.audits.length) { setError(`"${p.nombre}" todavía no tiene auditorías para informar.`); return; }
      await descargarArchivoAuth(`/api/sentinel/audits/${res.audits[0].id}/report`, `Informe_Sentinel_${p.nombre}.pdf`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button variant="danger" onClick={() => setOpen(true)}>+ Nuevo proyecto</Button></div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Proyectos</p><p className="text-2xl font-bold text-white mt-2">{stats.proyectos}</p></Card>
          <Card className="p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Score promedio</p><p className="text-2xl font-bold text-white mt-2">{stats.score_promedio}/100</p></Card>
          <Card className="p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Auditorías</p><p className="text-2xl font-bold text-white mt-2">{stats.auditorias}</p></Card>
          <Card className="p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Última auditoría</p><p className="text-2xl font-bold text-white mt-2">{stats.ultima_auditoria}</p></Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-semibold">{p.nombre}</p>
                <p className="text-xs text-slate-500">{p.dominio || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: p.color }}>{p.score}</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ color: p.color, borderColor: `${p.color}55`, background: `${p.color}1a` }}>{p.label}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div><p className="text-slate-600">Plan</p><p className="text-slate-300 capitalize">{p.plan}</p></div>
              <div><p className="text-slate-600">Última auditoría</p><p className="text-slate-300">{p.fecha}</p></div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <button onClick={() => descargarUltimoInforme(p)} className="text-blue-400 hover:text-blue-300 text-xs">📄 Último informe PDF</button>
              <button onClick={() => remove(p.id)} className="text-red-400/70 hover:text-red-300 text-xs">Quitar</button>
            </div>
          </Card>
        ))}
        {projects.length === 0 && <p className="text-slate-600 text-sm">No hay proyectos en Sentinel todavía.</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo proyecto monitoreado">
        <div className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(v) => set('name', v)} required />
          <Input label="Dominio" value={form.domain} onChange={(v) => set('domain', v)} placeholder="ejemplo.com" />
          <Input label="Contacto" value={form.contact} onChange={(v) => set('contact', v)} />
          <Select label="Plan" value={form.plan} onChange={(v) => set('plan', v)} options={[{ value: 'basico', label: 'Básico' }, { value: 'profesional', label: 'Profesional' }, { value: 'enterprise', label: 'Enterprise' }]} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button variant="danger" onClick={create}>Crear</Button></div>
        </div>
      </Modal>
    </div>
  );
}

/* ===================== Analizador IA ===================== */
const TOOLS_BY_PLAN: Record<string, string[]> = {
  basico: ['whois', 'dig', 'curl', 'whatweb', 'subfinder'],
  profesional: ['whois', 'dig', 'curl', 'whatweb', 'subfinder', 'nmap', 'nikto', 'wpscan', 'gobuster', 'sslscan'],
  enterprise: ['whois', 'dig', 'curl', 'whatweb', 'subfinder', 'nmap', 'nikto', 'wpscan', 'gobuster', 'sslscan'],
};

function AnalyzerView({ projects }: { projects: SProject[]; reload: () => void }) {
  const [projectId, setProjectId] = useState('');
  const [tool, setTool] = useState('nmap');
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ audit_id: number; score: { score: number; nivel: string }; detalle: { hallazgos: Hallazgo[]; infraestructura: { parametro: string; valor: string }[]; controles_ok: { control: string; observacion: string }[]; nota?: string; datos_insuficientes?: boolean } } | null>(null);
  const [dlError, setDlError] = useState('');

  const proj = projects.find((p) => String(p.id) === projectId);
  const tools = proj ? TOOLS_BY_PLAN[proj.plan] || TOOLS_BY_PLAN.profesional : TOOLS_BY_PLAN.enterprise;

  async function analizar() {
    setError(''); setResult(null);
    if (!projectId || !raw.trim()) { setError('Elegí un proyecto y pegá la salida de la herramienta.'); return; }
    setLoading(true);
    try {
      const res = await api<typeof result>('/api/sentinel/analyze', {
        method: 'POST', body: { project_id: Number(projectId), tool, raw_output: raw },
      });
      setResult(res);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al analizar.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <p className="text-sm text-slate-400">Pegá la salida cruda de una herramienta (nmap, nikto, wpscan, curl…). La IA genera hallazgos con CVSS y calcula el score. <span className="text-slate-500">Cero alucinaciones: solo reporta lo que está en la salida.</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Proyecto" value={projectId} onChange={setProjectId} options={[{ value: '', label: 'Elegí un proyecto…' }, ...projects.map((p) => ({ value: String(p.id), label: `${p.nombre} (${p.plan})` }))]} />
          <Select label="Herramienta" value={tool} onChange={setTool} options={tools.map((t) => ({ value: t, label: t }))} />
        </div>
        <label className="block">
          <span className="block text-xs font-medium text-slate-400 mb-1.5">Salida cruda</span>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8} placeholder="Pegá acá el output completo de la herramienta…" className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-slate-100 focus:border-blue-500 focus:outline-none resize-y" />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end"><Button variant="danger" onClick={analizar} disabled={loading}>{loading ? 'Analizando con IA…' : 'Analizar'}</Button></div>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div><p className="text-xs uppercase tracking-wide text-slate-500">Score de postura</p><p className="text-3xl font-bold text-white mt-1 capitalize">{result.score.score}<span className="text-base text-slate-500">/100 · {result.score.nivel}</span></p></div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">{result.detalle.hallazgos.length} hallazgo(s)</span>
              <Button onClick={async () => {
                setDlError('');
                try { await descargarArchivoAuth(`/api/sentinel/audits/${result.audit_id}/report`, 'Informe_Sentinel.pdf'); }
                catch (e) { setDlError(e instanceof Error ? e.message : 'Error'); }
              }}>📄 Descargar informe PDF</Button>
            </div>
          </Card>
          {dlError && <p className="text-sm text-red-400">{dlError}</p>}

          {result.detalle.datos_insuficientes && <Card className="p-4 text-amber-300 text-sm">⚠ Datos insuficientes: {result.detalle.nota}</Card>}

          {result.detalle.hallazgos.map((h, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-white font-semibold">{h.titulo}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 capitalize ${SEV_COLOR[h.severidad] || SEV_COLOR.info}`}>{h.severidad} · CVSS {h.cvss}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{h.owasp}</p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-slate-300">{h.descripcion}</p>
                {h.evidencia && <div className="bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-xs text-slate-400">{h.evidencia}</div>}
                <p className="text-slate-400"><span className="text-slate-500">Impacto:</span> {h.impacto}</p>
                <p className="text-emerald-300/90"><span className="text-slate-500">Recomendación:</span> {h.recomendacion}</p>
              </div>
            </Card>
          ))}

          {result.detalle.controles_ok?.length > 0 && (
            <Card className="p-5">
              <h4 className="text-sm font-semibold text-emerald-300 mb-3">Controles correctos</h4>
              <ul className="space-y-1.5 text-sm">{result.detalle.controles_ok.map((c, i) => (<li key={i} className="text-slate-300">✓ {c.control} — <span className="text-slate-500">{c.observacion}</span></li>))}</ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ===================== Test de chatbots ===================== */
function ChatbotView() {
  const [tests, setTests] = useState<ChatTest[]>([]);
  const [sel, setSel] = useState<ChatTest | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [veredicto, setVeredicto] = useState<{ resultado: string; confianza: string; explicacion: string; riesgo: string; recomendacion: string } | null>(null);

  useEffect(() => { api<{ tests: ChatTest[] }>('/api/sentinel/chatbot/tests').then((d) => setTests(d.tests)).catch(() => {}); }, []);

  async function evaluar() {
    if (!sel || !respuesta.trim()) { setError('Elegí un test y pegá la respuesta del chatbot.'); return; }
    setError(''); setVeredicto(null); setLoading(true);
    try {
      const res = await api<{ resultado: typeof veredicto }>('/api/sentinel/chatbot/evaluate', { method: 'POST', body: { test_id: sel.id, chatbot_response: respuesta } });
      setVeredicto(res.resultado as never);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  }

  const vColor = veredicto?.resultado === 'VULNERABLE' ? 'text-red-300' : veredicto?.resultado === 'RESISTIO' ? 'text-emerald-300' : 'text-amber-300';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card className="p-5">
        <h4 className="text-sm font-semibold text-white mb-1">Ataques OWASP LLM Top 10</h4>
        <p className="text-xs text-slate-500 mb-3">Elegí un ataque, copialo y pegáselo al chatbot del cliente. Después pegá su respuesta para que la IA la evalúe.</p>
        <div className="space-y-2">
          {tests.map((t) => (
            <button key={t.id} onClick={() => { setSel(t); setVeredicto(null); setRespuesta(''); }} className={`w-full text-left rounded-lg border p-3 transition ${sel?.id === t.id ? 'border-red-400/50 bg-red-500/5' : 'border-white/10 hover:border-white/20'}`}>
              <p className="text-sm text-slate-100 font-medium">{t.nombre}</p>
              <p className="text-xs text-slate-500">{t.owasp}</p>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {sel ? (
          <>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold text-white">Prompt de ataque</p><CopyBtn text={sel.prompt_ataque} /></div>
              <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-slate-300">{sel.prompt_ataque}</div>
              <label className="block mt-4">
                <span className="block text-xs font-medium text-slate-400 mb-1.5">Respuesta del chatbot</span>
                <textarea value={respuesta} onChange={(e) => setRespuesta(e.target.value)} rows={5} placeholder="Pegá la respuesta que dio el chatbot…" className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none resize-y" />
              </label>
              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
              <div className="flex justify-end mt-3"><Button variant="danger" onClick={evaluar} disabled={loading}>{loading ? 'Evaluando…' : 'Evaluar con IA'}</Button></div>
            </Card>

            {veredicto && (
              <Card className="p-5">
                <p className={`text-lg font-bold ${vColor}`}>{veredicto.resultado} <span className="text-xs text-slate-500 font-normal">· confianza {veredicto.confianza}</span></p>
                <p className="text-sm text-slate-300 mt-2">{veredicto.explicacion}</p>
                {veredicto.riesgo && <p className="text-sm text-slate-400 mt-2"><span className="text-slate-500">Riesgo:</span> {veredicto.riesgo}</p>}
                {veredicto.recomendacion && <p className="text-sm text-emerald-300/90 mt-2"><span className="text-slate-500">Recomendación:</span> {veredicto.recomendacion}</p>}
              </Card>
            )}
          </>
        ) : <Card className="p-8 text-center text-slate-600 text-sm">Elegí un ataque de la izquierda para empezar.</Card>}
      </div>
    </div>
  );
}

/* ===================== Comandos guiados ===================== */
function CommandsView({ projects }: { projects: SProject[] }) {
  const [projectId, setProjectId] = useState('');
  const [data, setData] = useState<{ comandos: Comando[]; dominio: string; plan: string } | null>(null);
  const [error, setError] = useState('');

  async function cargar(id: string) {
    setProjectId(id); setData(null); setError('');
    if (!id) return;
    try { const res = await api<{ comandos: Comando[]; dominio: string; plan: string }>(`/api/sentinel/commands/${id}`); setData(res); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }

  const fases = data ? Array.from(new Set(data.comandos.map((c) => c.fase))) : [];

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <Select label="Proyecto" value={projectId} onChange={cargar} options={[{ value: '', label: 'Elegí un proyecto…' }, ...projects.map((p) => ({ value: String(p.id), label: `${p.nombre} (${p.plan})` }))]} />
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </Card>

      {fases.map((fase) => (
        <div key={fase}>
          <h4 className="text-sm font-semibold text-white mb-2">{fase}</h4>
          <div className="space-y-2">
            {data!.comandos.filter((c) => c.fase === fase).map((c) => (
              <Card key={c.herramienta} className="p-4">
                <div className="flex items-center justify-between"><p className="text-sm text-slate-100 font-medium">{c.herramienta}</p><span className="text-xs text-slate-500">{c.descripcion}</span></div>
                <div className="flex items-center gap-3 mt-2 bg-black/40 border border-white/10 rounded-lg p-2">
                  <code className="text-xs text-emerald-300/90 font-mono flex-1 overflow-x-auto">{c.comando}</code>
                  <CopyBtn text={c.comando} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===================== Sellos ===================== */
function BadgesView({ projects }: { projects: SProject[] }) {
  const conSello = projects.filter((p) => p.token);
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">Cada proyecto tiene un sello dinámico que refleja su score en tiempo real. Embebé el código en el sitio del cliente; el color cambia solo según la postura.</p>
      {conSello.map((p) => {
        const svgUrl = `${API_BASE}/badge/${p.token}.svg`;
        const verifyUrl = `${API_BASE}/v/${p.token}`;
        const embed = `<a href="${verifyUrl}" target="_blank"><img src="${svgUrl}" alt="Sentinel by Puma Code" /></a>`;
        return (
          <Card key={p.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-white font-semibold">{p.nombre}</p>
                <p className="text-xs text-slate-500">{p.dominio}</p>
              </div>
              {/* preview en vivo del SVG */}
              <img src={svgUrl} alt={`Sello ${p.nombre}`} className="h-[60px]" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2"><span className="text-xs text-slate-500 w-16">Embed</span><code className="text-xs text-slate-400 font-mono bg-black/40 border border-white/10 rounded p-2 flex-1 overflow-x-auto">{embed}</code><CopyBtn text={embed} /></div>
              <div className="flex items-center gap-2"><span className="text-xs text-slate-500 w-16">Verificar</span><a href={verifyUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 font-mono overflow-x-auto">{verifyUrl}</a></div>
            </div>
          </Card>
        );
      })}
      {conSello.length === 0 && <p className="text-slate-600 text-sm">No hay sellos generados todavía.</p>}
    </div>
  );
}
