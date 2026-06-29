"use client";

import { useEffect, useState, useCallback } from 'react';
import { api, money, formatDate } from '../../lib/adminApi';
import { Card, Badge, Button, Input, Select, Modal } from './ui';

interface Client {
  id: number; name: string; company: string | null; email: string | null;
  phone: string | null; service: string | null; amount: string; currency: string;
  status: string; sale_date: string; notes: string | null;
  projects_count: number; open_projects: number;
}

const EMPTY = {
  name: '', company: '', email: '', phone: '', service: '',
  amount: '', currency: 'USD', status: 'active',
  sale_date: new Date().toISOString().slice(0, 10), notes: '',
};

export default function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (q) params.set('q', q);
    const res = await api<{ clients: Client[] }>(`/api/clients?${params}`);
    setClients(res.clients);
  }, [filter, q]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm({ ...EMPTY });
    setEditing(null);
    setError('');
    setOpen(true);
  }
  function openEdit(c: Client) {
    setForm({
      name: c.name, company: c.company || '', email: c.email || '', phone: c.phone || '',
      service: c.service || '', amount: c.amount, currency: c.currency, status: c.status,
      sale_date: c.sale_date.slice(0, 10), notes: c.notes || '',
    });
    setEditing(c.id);
    setError('');
    setOpen(true);
  }

  async function save() {
    setError('');
    try {
      if (editing) {
        await api(`/api/clients/${editing}`, { method: 'PUT', body: form });
      } else {
        await api('/api/clients', { method: 'POST', body: form });
      }
      setOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.');
    }
  }

  async function remove(id: number) {
    if (!confirm('¿Eliminar este cliente y todos sus tickets? Esta acción no se puede deshacer.')) return;
    await api(`/api/clients/${id}`, { method: 'DELETE' });
    load();
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, empresa o email…"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
        >
          <option value="" className="bg-slate-900">Todos los estados</option>
          <option value="lead" className="bg-slate-900">Prospecto</option>
          <option value="active" className="bg-slate-900">Activo</option>
          <option value="finished" className="bg-slate-900">Finalizado</option>
          <option value="cancelled" className="bg-slate-900">Cancelado</option>
        </select>
        <Button onClick={openNew}>+ Nueva venta</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/10 bg-white/[0.02]">
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Servicio</th>
                <th className="p-3 font-medium">Monto</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium">Trabajo</th>
                <th className="p-3 font-medium">Fecha</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div className="text-slate-100 font-medium">{c.name}</div>
                    {c.company && <div className="text-xs text-slate-500">{c.company}</div>}
                  </td>
                  <td className="p-3 text-slate-400">{c.service || '—'}</td>
                  <td className="p-3 text-slate-100 font-medium">{money(c.amount, c.currency)}</td>
                  <td className="p-3"><Badge status={c.status} /></td>
                  <td className="p-3">
                    {c.open_projects > 0
                      ? <span className="text-amber-300 text-xs">{c.open_projects} abierto{c.open_projects > 1 ? 's' : ''}</span>
                      : c.projects_count > 0
                        ? <span className="text-emerald-300 text-xs">Completo</span>
                        : <span className="text-slate-600 text-xs">Sin tickets</span>}
                  </td>
                  <td className="p-3 text-slate-500">{formatDate(c.sale_date)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(c)} className="text-blue-400 hover:text-blue-300 text-xs mr-3">Editar</button>
                    <button onClick={() => remove(c.id)} className="text-red-400/80 hover:text-red-300 text-xs">Eliminar</button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-600">No hay clientes que coincidan. Agregá tu primera venta.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar venta' : 'Nueva venta'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre del contacto *" value={form.name} onChange={(v) => set('name', v)} required />
            <Input label="Empresa" value={form.company} onChange={(v) => set('company', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} />
            <Input label="Teléfono" value={form.phone} onChange={(v) => set('phone', v)} />
          </div>
          <Input label="Servicio / trabajo vendido" value={form.service} onChange={(v) => set('service', v)} placeholder="Ej: App móvil, web, chatbot…" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Precio pagado" type="number" value={form.amount} onChange={(v) => set('amount', v)} placeholder="0" />
            <Select label="Moneda" value={form.currency} onChange={(v) => set('currency', v)} options={[{ value: 'USD', label: 'USD' }, { value: 'ARS', label: 'ARS' }]} />
            <Input label="Fecha de venta" type="date" value={form.sale_date} onChange={(v) => set('sale_date', v)} />
          </div>
          <Select
            label="Estado"
            value={form.status}
            onChange={(v) => set('status', v)}
            options={[
              { value: 'lead', label: 'Prospecto' },
              { value: 'active', label: 'Activo' },
              { value: 'finished', label: 'Finalizado' },
              { value: 'cancelled', label: 'Cancelado' },
            ]}
          />
          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1.5">Notas</span>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none resize-none"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? 'Guardar cambios' : 'Crear venta'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
