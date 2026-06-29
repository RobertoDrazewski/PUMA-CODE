"use client";

import { useEffect, useState } from 'react';
import { getUser, clearSession, SessionUser } from '../../lib/adminApi';
import Login from '../../components/admin/Login';
import DashboardTab from '../../components/admin/DashboardTab';
import ClientsTab from '../../components/admin/ClientsTab';
import KanbanTab from '../../components/admin/KanbanTab';
import SentinelTab from '../../components/admin/SentinelTab';
import UsersTab from '../../components/admin/UsersTab';

type TabKey = 'dashboard' | 'clients' | 'kanban' | 'sentinel' | 'admin';

const TABS: { key: TabKey; label: string; icon: string; adminOnly?: boolean }[] = [
  { key: 'dashboard', label: 'Resumen', icon: '📊' },
  { key: 'clients', label: 'Clientes y ventas', icon: '💼' },
  { key: 'kanban', label: 'Proyectos', icon: '🗂️' },
  { key: 'sentinel', label: 'Cybersecurity', icon: '🛡️' },
  { key: 'admin', label: 'Equipo', icon: '👥', adminOnly: true },
];

export default function AdminPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabKey>('dashboard');

  useEffect(() => {
    setUser(getUser());
    setReady(true);
  }, []);

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-slate-600">Cargando…</div>;
  if (!user) return <Login onLogin={setUser} />;

  const isAdmin = user.role === 'admin';
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐆</span>
            <span className="font-bold text-white">Puma Code</span>
            <span className="text-xs text-slate-500 border border-white/10 rounded-full px-2 py-0.5 ml-1">Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-slate-200 leading-tight">{user.name}</p>
              <p className="text-xs text-slate-500 leading-tight">{isAdmin ? 'Administrador' : 'Trabajador'}</p>
            </div>
            <button onClick={logout} className="text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <nav className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main>
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'clients' && <ClientsTab />}
          {tab === 'kanban' && <KanbanTab canManageUsers={isAdmin} />}
          {tab === 'sentinel' && <SentinelTab />}
          {tab === 'admin' && isAdmin && <UsersTab currentUserId={user.id} />}
        </main>
      </div>
    </div>
  );
}
