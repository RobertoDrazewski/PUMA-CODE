"use client";

import { useEffect, useState, useCallback } from 'react';
import { api, formatDate } from '../../lib/adminApi';
import { Button, Input, Select, Modal } from './ui';

interface Ticket {
  id: number; client_id: number; title: string; description: string | null;
  status: string; priority: string; assignee_id: number | null;
  due_date: string | null; client_name: string; client_company: string | null;
  assignee_name: string | null;
}
interface ClientLite { id: number; name: string; company: string | null; }
interface WorkerLite { id: number; name: string; }

const COLUMNS = [
  { key: 'todo', label: 'Por hacer', accent: 'border-slate-500/40' },
  { key: 'in_progress', label: 'En progreso', accent: 'border-blue-500/40' },
  { key: 'review', label: 'En revisión', accent: 'border-amber-500/40' },
  { key: 'done', label: 'Finalizado', accent: 'border-emerald-500/40' },
];

const PRIORITY: Record<string, string> = {
  low: 'bg-slate-500/15 text-slate-400',
  medium: 'bg-blue-500/15 text-blue-300',
  high: 'bg-red-500/15 text-red-300',
};
const PRIORITY_LABEL: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta' };

const EMPTY = { client_id: '', title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', due_date: '' };

export default function KanbanTab({ canManageUsers }: { canManageUsers: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [workers, setWorkers] = useState<WorkerLite[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([
      api<{ projects: Ticket[] }>('/api/projects'),
      api<{ clients: ClientLite[] }>('/api/clients'),
    ]);
    setTickets(t.projects);
    setClients(c.clients);
    if (canManageUsers) {
      try {
        const u = await api<{ users: { id: number; name: string; active: number }[] }>('/api/users');
        setWorkers(u.users.filter((x) => x.active).map((x) => ({ id: x.id, name: x.name })));
      } catch { /* worker sin permiso */ }
    }
  }, [canManageUsers]);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm({ ...EMPTY }); setEditing(null); setError(''); setOpen(true); }
  function openEdit(t: Ticket) {
    setForm({
      client_id: String(t.client_id), title: t.title, description: t.description || '',
      status: t.status, priority: t.priority,
      assignee_id: t.assignee_id ? String(t.assignee_id) : '',
      due_date: t.due_date ? t.due_date.slice(0, 10) : '',
    });
    setEditing(t.id); setError(''); setOpen(true);
  }

  async function save() {
    setError('');
    if (!form.client_id || !form.title) { setError('Cliente y título son obligatorios.'); return; }
    const body = {
      ...form,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date || null,
    };
    try {
      if (editing) await api(`/api/projects/${editing}`, { method: 'PUT', body });
      else await api('/api/projects', { method: 'POST', body });
      setOpen(false); load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar.'); }
  }

  async function remove(id: number) {
    if (!confirm('¿Eliminar este ticket?')) return;
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    load();
  }

  async function moveTo(id: number, status: string) {
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    await api(`/api/projects/${id}`, { method: 'PUT', body: { status } });
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">Arrastrá las tarjetas entre columnas para cambiar su estado.</p>
        <Button onClick={openNew}>+ Nuevo ticket</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = tickets.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId !== null) { moveTo(dragId, col.key); setDragId(null); } }}
              className={`glass-effect rounded-2xl border-t-2 ${col.accent} border-x border-b border-white/10 p-3 min-h-[200px]`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                <span className="text-xs text-slate-500 bg-white/5 rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onClick={() => openEdit(t)}
                    className="rounded-xl bg-black/40 border border-white/10 p-3 cursor-grab active:cursor-grabbing hover:border-blue-500/40 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-100 font-medium leading-snug">{t.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${PRIORITY[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">{t.client_name}{t.client_company ? ` · ${t.client_company}` : ''}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[11px] text-slate-400">{t.assignee_name || 'Sin asignar'}</span>
                      {t.due_date && <span className="text-[11px] text-slate-500">{formatDate(t.due_date)}</span>}
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Vacío</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar ticket' : 'Nuevo ticket'}>
        <div className="space-y-4">
          <Input label="Título *" value={form.title} onChange={(v) => set('title', v)} required />
          <Select
            label="Cliente *"
            value={form.client_id}
            onChange={(v) => set('client_id', v)}
            options={[{ value: '', label: 'Elegí un cliente…' }, ...clients.map((c) => ({ value: String(c.id), label: c.company ? `${c.name} · ${c.company}` : c.name }))]}
          />
          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1.5">Descripción</span>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none resize-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Estado" value={form.status} onChange={(v) => set('status', v)} options={COLUMNS.map((c) => ({ value: c.key, label: c.label }))} />
            <Select label="Prioridad" value={form.priority} onChange={(v) => set('priority', v)} options={[{ value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Asignado a"
              value={form.assignee_id}
              onChange={(v) => set('assignee_id', v)}
              options={[{ value: '', label: 'Sin asignar' }, ...workers.map((w) => ({ value: String(w.id), label: w.name }))]}
            />
            <Input label="Fecha límite" type="date" value={form.due_date} onChange={(v) => set('due_date', v)} />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-between items-center pt-2">
            {editing ? <button onClick={() => { remove(editing); setOpen(false); }} className="text-red-400/80 hover:text-red-300 text-sm">Eliminar</button> : <span />}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>{editing ? 'Guardar' : 'Crear'}</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
