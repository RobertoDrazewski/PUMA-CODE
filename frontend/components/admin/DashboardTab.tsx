"use client";

import { useEffect, useState } from 'react';
import { api, money, formatDate } from '../../lib/adminApi';
import { Card, Badge } from './ui';

interface SalesRow { currency: string; ventas: number; total: string; }
interface StatusRow { status: string; n: number; }
interface MonthlyRow { ym: string; currency: string; total: string; ventas: number; }
interface RecentClient {
  id: number; name: string; company: string | null; service: string | null;
  amount: string; currency: string; status: string; sale_date: string;
}
interface Summary {
  salesMonth: SalesRow[];
  salesTotal: SalesRow[];
  byStatus: StatusRow[];
  activeWork: number;
  tickets: { status: string; n: number }[];
  monthly: MonthlyRow[];
  recentClients: RecentClient[];
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </Card>
  );
}

export default function DashboardTab() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ success: boolean } & Summary>('/api/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-slate-500">Cargando métricas…</p>;

  const monthByCurrency = (c: string) =>
    data.salesMonth.find((r) => r.currency === c)?.total || '0';
  const monthCount = data.salesMonth.reduce((a, r) => a + r.ventas, 0);
  const totalClients = data.byStatus.reduce((a, r) => a + r.n, 0);

  // Gráfico simple de barras (últimos meses, USD)
  const months = Array.from(new Set(data.monthly.map((m) => m.ym))).sort();
  const usdByMonth = months.map((m) => ({
    ym: m,
    total: parseFloat(data.monthly.find((x) => x.ym === m && x.currency === 'USD')?.total || '0'),
  }));
  const maxUsd = Math.max(1, ...usdByMonth.map((m) => m.total));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Ventas del mes (USD)" value={money(monthByCurrency('USD'), 'USD')} sub={`${monthCount} ventas este mes`} />
        <Stat label="Ventas del mes (ARS)" value={money(monthByCurrency('ARS'), 'ARS')} />
        <Stat label="Clientes totales" value={String(totalClients)} sub={`${data.byStatus.find((s) => s.status === 'active')?.n || 0} activos`} />
        <Stat label="Con trabajo activo" value={String(data.activeWork)} sub="clientes con tickets abiertos" />
      </div>

      {/* Gráfico de ventas USD por mes */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Ventas por mes (USD)</h3>
        <div className="flex items-end gap-3 h-40">
          {usdByMonth.map((m) => (
            <div key={m.ym} className="flex-1 flex flex-col items-center justify-end gap-2">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 min-h-[4px] transition-all"
                style={{ height: `${(m.total / maxUsd) * 100}%` }}
                title={money(m.total, 'USD')}
              />
              <span className="text-[10px] text-slate-500">{m.ym.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Últimos clientes */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Últimas ventas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-white/10">
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">Servicio</th>
                <th className="pb-2 font-medium">Monto</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.recentClients.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="py-2.5 text-slate-200">
                    {c.name}
                    {c.company && <span className="text-slate-500"> · {c.company}</span>}
                  </td>
                  <td className="py-2.5 text-slate-400">{c.service || '—'}</td>
                  <td className="py-2.5 text-slate-200 font-medium">{money(c.amount, c.currency)}</td>
                  <td className="py-2.5"><Badge status={c.status} /></td>
                  <td className="py-2.5 text-slate-500">{formatDate(c.sale_date)}</td>
                </tr>
              ))}
              {data.recentClients.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-slate-600">Todavía no hay ventas cargadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
