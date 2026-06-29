"use client";

import { useEffect, useState, useCallback } from 'react';
import { api, formatDate } from '../../lib/adminApi';
import { Card, Badge, Button, Input, Select, Modal } from './ui';

interface SProject {
  id: number; name: string; domain: string | null; plan: string;
  score: number; status: string; monitored: number; last_audit: string | null;
  open_findings: number;
}
interface Metrics {
  monitored: number; avg_score: number; open_findings: number;
  high_findings: number; last_audit: string | null;
}
interface Activity { id: number; message: string; created_at: string; }

function scoreColor(score: number) {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

const EMPTY = { name: '', domain: '', plan: 'Profesional', score: '', status: 'ACEPTABLE', last_audit: new Date().toISOString().slice(0, 10) };

export default function SentinelTab() {
  const [projects, setProjects] = useState<SProject[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await api<{ projects: SProject[]; metrics: Metrics; activity: Activity[] }>('/api/sentinel');
    setProjects(res.projects);
    setMetrics(res.metrics);
    setActivity(res.activity);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setError('');
    if (!form.name) { setError('El nombre es obligatorio.'); return; }
    try {
      await api('/api/sentinel/projects', { method: 'POST', body: { ...form, score: Number(form.score) || 0 } });
      setOpen(false); setForm({ ...EMPTY }); load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar.'); }
  }

  async function remove(id: number) {
    if (!confirm('¿Quitar este proyecto de Sentinel?')) return;
    await api(`/api/sentinel/projects/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">🛡️</span>
            <h2 className="text-lg font-semibold text-white">Sentinel</h2>
            <span className="text-xs text-slate-500 border border-white/10 rounded-full px-2 py-0.5">interno</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Estado de seguridad de todos los proyectos de Puma Code.</p>
        </div>
        <Button variant="danger" onClick={() => { setForm({ ...EMPTY }); setError(''); setOpen(true); }}>+ Nueva auditoría</Button>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Proyectos monitoreados</p>
            <p className="text-2xl font-bold text-white mt-2">{metrics.monitored}</p>
            <p className="text-xs text-slate-400 mt-1">activos</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Score promedio</p>
            <p className={`text-2xl font-bold mt-2 ${scoreColor(metrics.avg_score)}`}>{metrics.avg_score ?? 0}/100</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Hallazgos abiertos</p>
            <p className="text-2xl font-bold text-white mt-2">{metrics.open_findings}</p>
            <p className="text-xs text-red-400 mt-1">{metrics.high_findings} de alta prioridad</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Última auditoría</p>
            <p className="text-2xl font-bold text-white mt-2">{formatDate(metrics.last_audit)}</p>
          </Card>
        </div>
      )}

      {/* Proyectos monitoreados */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Proyectos · {projects.length} monitoreados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.domain || '—'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${scoreColor(p.score)}`}>{p.score}</p>
                  <Badge status={p.status} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                <div>
                  <p className="text-slate-600">Plan</p>
                  <p className="text-slate-300">{p.plan}</p>
                </div>
                <div>
                  <p className="text-slate-600">Última auditoría</p>
                  <p className="text-slate-300">{formatDate(p.last_audit)}</p>
                </div>
                <div>
                  <p className="text-slate-600">Hallazgos</p>
                  <p className={p.open_findings > 0 ? 'text-amber-300' : 'text-emerald-300'}>{p.open_findings} abiertos</p>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={() => remove(p.id)} className="text-red-400/70 hover:text-red-300 text-xs">Quitar</button>
              </div>
            </Card>
          ))}
          {projects.length === 0 && <p className="text-slate-600 text-sm">No hay proyectos en Sentinel todavía.</p>}
        </div>
      </div>

      {/* Actividad reciente */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Actividad reciente</h3>
        <ul className="space-y-3">
          {activity.map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <div>
                <p className="text-slate-300">{a.message}</p>
                <p className="text-xs text-slate-600">{formatDate(a.created_at)}</p>
              </div>
            </li>
          ))}
          {activity.length === 0 && <li className="text-slate-600 text-sm">Sin actividad reciente.</li>}
        </ul>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva auditoría / proyecto">
        <div className="space-y-4">
          <Input label="Nombre del proyecto *" value={form.name} onChange={(v) => set('name', v)} required />
          <Input label="Dominio" value={form.domain} onChange={(v) => set('domain', v)} placeholder="ejemplo.com" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Plan" value={form.plan} onChange={(v) => set('plan', v)} options={[{ value: 'Basico', label: 'Básico' }, { value: 'Profesional', label: 'Profesional' }, { value: 'Enterprise', label: 'Enterprise' }]} />
            <Input label="Score (0-100)" type="number" value={form.score} onChange={(v) => set('score', v)} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Estado" value={form.status} onChange={(v) => set('status', v)} options={[{ value: 'SEGURO', label: 'Seguro' }, { value: 'ACEPTABLE', label: 'Aceptable' }, { value: 'MEJORABLE', label: 'Mejorable' }, { value: 'CRITICO', label: 'Crítico' }]} />
            <Input label="Fecha de auditoría" type="date" value={form.last_audit} onChange={(v) => set('last_audit', v)} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={save}>Agregar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
