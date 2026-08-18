"use client";

import { useCallback, useEffect, useState } from 'react';
import { api, formatDate } from '../../lib/adminApi';
import { Card, Button, Select, Input, Modal } from './ui';

interface Stats {
  total: number;
  ultimos_7d: number;
  ultima_actividad: string | null;
  express: number;
  desarrollo: number;
  pentest: number;
  convertidos: number;
}
type AssistantStatus = 'planificado' | 'desarrollo' | 'activo';
interface FleetStatus {
  devices: { total: number; unpaired: number; online: number; offline: number };
  vehicles: { total: number; active: number; maintenance: number; inactive: number; ultimo_ping: string | null };
  subscriptions: { activas: number; pendientes: number; mrr_ars: number; ultimo_pago: string | null };
  checked_at: string;
}
interface Assistant {
  key: string;
  name: string;
  role: string;
  icon: string;
  status: AssistantStatus;
  github_repo: string | null;
  updated_at: string;
  stats: Stats | null;
  fleet: FleetStatus | null;
}
interface Lead {
  id: number;
  client_name: string;
  client_email: string;
  project_name: string | null;
  service_type: 'express' | 'desarrollo' | 'pentest';
  profile: string | null;
  quoted_usd: number | null;
  language: string | null;
  status: 'cotizado' | 'contactado' | 'convertido' | 'descartado';
  created_at: string;
}

const SERVICE_LABEL: Record<string, string> = {
  express: 'Express', desarrollo: 'Desarrollo', pentest: 'Pentest',
};
const STATUS_LABEL: Record<string, string> = {
  cotizado: 'Cotizado', contactado: 'Contactado', convertido: 'Convertido', descartado: 'Descartado',
};
const STATUS_COLOR: Record<string, string> = {
  cotizado: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  contactado: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  convertido: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  descartado: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const ASSISTANT_STATUS_LABEL: Record<AssistantStatus, string> = {
  planificado: 'Planificado', desarrollo: 'En desarrollo', activo: 'Activo · Producción',
};
const ASSISTANT_STATUS_COLOR: Record<AssistantStatus, string> = {
  planificado: 'text-slate-500 border-white/10',
  desarrollo: 'text-amber-400 border-amber-500/30',
  activo: 'text-emerald-400 border-emerald-500/30',
};

function timeSince(iso: string | null) {
  if (!iso) return 'sin actividad todavía';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'recién';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export default function AssistantsTab() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Assistant | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api<{ assistants: Assistant[] }>('/api/assistants');
      setAssistants(res.assistants);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = assistants.find((a) => a.key === selected);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-blue-400">🤖</span>
        <h2 className="text-lg font-semibold text-white">Asistentes</h2>
        <span className="text-xs text-slate-500 border border-white/10 rounded-full px-2 py-0.5">
          tus puestos de trabajo con IA
        </span>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assistants.map((a) => (
          <Card key={a.key} className="p-5 transition hover:border-blue-500/40">
            <div className="flex items-start justify-between">
              <button
                onClick={() => a.stats && setSelected(a.key)}
                className={`flex items-center gap-3 text-left ${a.stats ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={!a.stats}
              >
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="text-white font-semibold">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.role}</p>
                </div>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold tracking-wide uppercase border rounded-full px-2 py-0.5 ${ASSISTANT_STATUS_COLOR[a.status]}`}>
                  {a.status === 'activo' && (
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 -mt-px" />
                  )}
                  {ASSISTANT_STATUS_LABEL[a.status]}
                </span>
                <button
                  onClick={() => setEditing(a)}
                  title="Editar estado y repo"
                  className="text-slate-500 hover:text-white transition text-sm"
                >
                  ✎
                </button>
              </div>
            </div>

            {a.github_repo && (
              <a
                href={a.github_repo}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg px-2.5 py-1 transition"
              >
                <span>⌥</span> {a.github_repo.replace('https://github.com/', '')}
              </a>
            )}

            {a.stats && (
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                <div>
                  <p className="text-lg font-bold text-white">{a.stats.total}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Leads totales</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{a.stats.ultimos_7d}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Últimos 7 días</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-400">{a.stats.convertidos}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Convertidos</p>
                </div>
              </div>
            )}
            {a.stats && (
              <p className="mt-2 text-xs text-slate-500">Última actividad: {timeSince(a.stats.ultima_actividad)}</p>
            )}

            {a.key === 'kalyber-monitor' && a.fleet && (
              <div className="mt-4 border-t border-white/5 pt-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-lg font-bold text-emerald-400">{a.fleet.devices.online}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Equipos online</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-400">{a.fleet.devices.offline}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Equipos offline</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{a.fleet.vehicles.active}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Vehículos activos</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {a.fleet.subscriptions.activas} suscripción{a.fleet.subscriptions.activas === 1 ? '' : 'es'} activa{a.fleet.subscriptions.activas === 1 ? '' : 's'}
                    {a.fleet.subscriptions.mrr_ars > 0 && ` · $${a.fleet.subscriptions.mrr_ars.toLocaleString('es-AR')} ARS/mes`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600">Chequeado {timeSince(a.fleet.checked_at)} · último ping de flota: {timeSince(a.fleet.vehicles.ultimo_ping)}</p>
              </div>
            )}
            {a.key === 'kalyber-monitor' && !a.fleet && (
              <p className="mt-4 text-xs text-amber-500/80 border-t border-white/5 pt-3">
                ⚠️ Sin conexión con Kalyber ahora mismo (revisá KALYBER_API_URL / KALYBER_INTERNAL_SECRET en Puma Code, y PUMA_INTERNAL_SECRET en Kalyber).
              </p>
            )}

            {!a.stats && a.key !== 'kalyber-monitor' && (
              <p className={`text-xs text-slate-600 pt-3 ${a.github_repo ? '' : 'border-t border-white/5 mt-4'}`}>
                Todavía sin actividad medible — se conecta cuando avancemos con este proyecto.
              </p>
            )}
          </Card>
        ))}
        {assistants.length === 0 && !error && (
          <p className="text-slate-600 text-sm">Cargando…</p>
        )}
      </div>

      {active && <LeadsView assistant={active} onClose={() => setSelected(null)} />}

      {editing && (
        <EditAssistantModal
          assistant={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setAssistants((list) => list.map((a) => (a.key === updated.key ? { ...a, ...updated } : a)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditAssistantModal({
  assistant, onClose, onSaved,
}: { assistant: Assistant; onClose: () => void; onSaved: (a: Assistant) => void }) {
  const [status, setStatus] = useState<AssistantStatus>(assistant.status);
  const [repo, setRepo] = useState(assistant.github_repo || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(''); setSaving(true);
    try {
      const res = await api<{ assistant: Assistant }>(`/api/assistants/${assistant.key}`, {
        method: 'PUT',
        body: { status, github_repo: repo.trim() || null },
      });
      onSaved({ ...assistant, ...res.assistant });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Editar · ${assistant.name}`}>
      <div className="space-y-4">
        <Select
          label="Estado"
          value={status}
          onChange={(v) => setStatus(v as AssistantStatus)}
          options={[
            { value: 'planificado', label: 'Planificado' },
            { value: 'desarrollo', label: 'En desarrollo' },
            { value: 'activo', label: 'Activo · Producción' },
          ]}
        />
        <Input
          label="Repositorio de GitHub"
          value={repo}
          onChange={setRepo}
          placeholder="https://github.com/RobertoDrazewski/kalyber"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function LeadsView({ assistant, onClose }: { assistant: Assistant; onClose: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api<{ leads: Lead[] }>(`/api/assistants/${assistant.key}/activity`);
      setLeads(res.leads);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [assistant.key]);

  useEffect(() => { load(); }, [load]);

  async function setLeadStatus(id: number, status: string) {
    try {
      await api(`/api/assistants/leads/${id}/status`, { method: 'PUT', body: { status } });
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: status as Lead['status'] } : l)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  const filtered = filter ? leads.filter((l) => l.service_type === filter) : leads;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">{assistant.name} · actividad</h3>
          <p className="text-xs text-slate-500">Cada fila es una charla del chat público que terminó en cotización enviada por mail.</p>
        </div>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition">
          Cerrar
        </button>
      </div>

      <div className="mb-3 max-w-[220px]">
        <Select
          label=""
          value={filter}
          onChange={setFilter}
          options={[
            { value: '', label: 'Todos los tipos' },
            { value: 'express', label: 'Express' },
            { value: 'desarrollo', label: 'Desarrollo' },
            { value: 'pentest', label: 'Pentest' },
          ]}
        />
      </div>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-white/10">
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Proyecto</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">Cotizado</th>
              <th className="py-2 pr-3">Cuándo</th>
              <th className="py-2 pr-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-white/5">
                <td className="py-2.5 pr-3">
                  <p className="text-slate-100">{l.client_name}</p>
                  <p className="text-xs text-slate-500">{l.client_email}</p>
                </td>
                <td className="py-2.5 pr-3 text-slate-300">{l.project_name || '—'}</td>
                <td className="py-2.5 pr-3 text-slate-400">{SERVICE_LABEL[l.service_type]}</td>
                <td className="py-2.5 pr-3 text-slate-100 font-medium">{l.quoted_usd ? `US$ ${Number(l.quoted_usd).toLocaleString('es-AR')}` : '—'}</td>
                <td className="py-2.5 pr-3 text-slate-500 text-xs">{formatDate(l.created_at)}</td>
                <td className="py-2.5 pr-3">
                  <select
                    value={l.status}
                    onChange={(e) => setLeadStatus(l.id, e.target.value)}
                    className={`text-xs rounded-full px-2 py-1 border bg-transparent ${STATUS_COLOR[l.status]}`}
                  >
                    {Object.entries(STATUS_LABEL).map(([v, label]) => (
                      <option key={v} value={v} className="bg-[#0b0b0c] text-slate-200">{label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-slate-600 text-sm text-center py-8">
            Todavía no hay leads registrados. Van a aparecer acá apenas alguien complete una cotización en el sitio.
          </p>
        )}
      </div>
    </Card>
  );
}
