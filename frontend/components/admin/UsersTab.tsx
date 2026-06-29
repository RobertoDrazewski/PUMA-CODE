"use client";

import { useEffect, useState, useCallback } from 'react';
import { api, formatDate } from '../../lib/adminApi';
import { Card, Button, Input, Select, Modal } from './ui';

interface User {
  id: number; name: string; email: string; role: string; active: number; created_at: string;
}

export default function UsersTab({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'worker' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await api<{ users: User[] }>('/api/users');
    setUsers(res.users);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function create() {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Completá nombre, email y contraseña.'); return; }
    try {
      await api('/api/users', { method: 'POST', body: form });
      setOpen(false); setForm({ name: '', email: '', password: '', role: 'worker' }); load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al crear el usuario.'); }
  }

  async function toggleActive(u: User) {
    await api(`/api/users/${u.id}`, { method: 'PUT', body: { active: u.active ? 0 : 1 } });
    load();
  }

  async function changeRole(u: User, role: string) {
    await api(`/api/users/${u.id}`, { method: 'PUT', body: { role } });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Equipo</h2>
          <p className="text-sm text-slate-500 mt-1">Agregá trabajadores y definí quién es administrador.</p>
        </div>
        <Button onClick={() => { setForm({ name: '', email: '', password: '', role: 'worker' }); setError(''); setOpen(true); }}>+ Agregar usuario</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/10 bg-white/[0.02]">
                <th className="p-3 font-medium">Nombre</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Rol</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium">Alta</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3 text-slate-100 font-medium">
                    {u.name}{u.id === currentUserId && <span className="text-xs text-blue-400 ml-2">(vos)</span>}
                  </td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      disabled={u.id === currentUserId}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className="rounded-md bg-black/40 border border-white/10 px-2 py-1 text-xs text-slate-200 focus:outline-none disabled:opacity-50"
                    >
                      <option value="worker" className="bg-slate-900">Trabajador</option>
                      <option value="admin" className="bg-slate-900">Administrador</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs ${u.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{formatDate(u.created_at)}</td>
                  <td className="p-3 text-right">
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => toggleActive(u)}
                        className={`text-xs ${u.active ? 'text-red-400/80 hover:text-red-300' : 'text-emerald-400/80 hover:text-emerald-300'}`}
                      >
                        {u.active ? 'Desactivar' : 'Reactivar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar usuario">
        <div className="space-y-4">
          <Input label="Nombre completo *" value={form.name} onChange={(v) => set('name', v)} required />
          <Input label="Email *" type="email" value={form.email} onChange={(v) => set('email', v)} required />
          <Input label="Contraseña *" type="password" value={form.password} onChange={(v) => set('password', v)} required />
          <Select label="Rol" value={form.role} onChange={(v) => set('role', v)} options={[{ value: 'worker', label: 'Trabajador' }, { value: 'admin', label: 'Administrador' }]} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create}>Crear usuario</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
