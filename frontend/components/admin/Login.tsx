"use client";

import { useState } from 'react';
import { api, saveSession, SessionUser } from '../../lib/adminApi';
import { Button, Input } from './ui';

export default function Login({ onLogin }: { onLogin: (u: SessionUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api<{ token: string; user: SessionUser }>('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      });
      saveSession(res.token, res.user);
      onLogin(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl">🐆</span>
            <span className="text-xl font-bold tracking-tight text-white">Puma Code</span>
          </div>
          <p className="text-sm text-slate-500">Panel de control interno</p>
        </div>

        <form onSubmit={submit} className="glass-effect rounded-2xl border border-white/10 p-6 space-y-4">
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="vos@puma-code.com" required />
          <Input label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Acceso restringido al equipo de Puma Code.
        </p>
      </div>
    </div>
  );
}
