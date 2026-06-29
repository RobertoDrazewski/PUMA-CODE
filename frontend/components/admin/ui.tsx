"use client";

import { ReactNode } from 'react';

/* ---------- Card ---------- */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass-effect rounded-2xl border border-white/10 ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Botón ---------- */
export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    ghost: 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10',
    danger: 'bg-red-600/90 hover:bg-red-500 text-white',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------- Input ---------- */
export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
}: {
  label?: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-slate-400 mb-1.5">{label}</span>}
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition"
      />
    </label>
  );
}

/* ---------- Select ---------- */
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-slate-400 mb-1.5">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-900">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="glass-effect w-full max-w-lg rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Badge de estado ---------- */
const STATUS_STYLES: Record<string, string> = {
  lead: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  active: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  finished: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  SEGURO: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  ACEPTABLE: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  MEJORABLE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  CRITICO: 'bg-red-500/15 text-red-300 border-red-500/30',
};
const STATUS_LABELS: Record<string, string> = {
  lead: 'Prospecto',
  active: 'Activo',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};
export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        STATUS_STYLES[status] || 'bg-white/5 text-slate-300 border-white/10'
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
