"use client";
import { useRef, useState } from 'react';

interface AuthorizationFormProps {
  lang: string;
  t: any;
  userData: { name: string; email: string };
  onDone: () => void;
  onClose: () => void;
}

export default function AuthorizationForm({ lang, t, userData, onDone, onClose }: AuthorizationFormProps) {
  const [fields, setFields] = useState({
    razonSocial: userData.name || '',
    cuitDni: '',
    domicilio: '',
    sistemas: '',
    ventana: '',
    firmante: userData.name || '',
  });
  const [acepta, setAcepta] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasSignature = useRef(false);

  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));

  const ctx = () => canvasRef.current?.getContext('2d') || null;

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const g = ctx(); if (!g) return;
    drawing.current = true;
    const { x, y } = pos(e);
    g.beginPath();
    g.moveTo(x, y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const g = ctx(); if (!g) return;
    const { x, y } = pos(e);
    g.lineWidth = 2.5;
    g.lineCap = 'round';
    g.strokeStyle = '#0f172a';
    g.lineTo(x, y);
    g.stroke();
    hasSignature.current = true;
  };
  const end = () => { drawing.current = false; };

  const clearSig = () => {
    const c = canvasRef.current; const g = ctx();
    if (c && g) g.clearRect(0, 0, c.width, c.height);
    hasSignature.current = false;
  };

  const submit = async () => {
    setError('');
    if (!acepta || !hasSignature.current || !fields.sistemas.trim()) {
      setError(t.auth_err || 'Completá los sistemas, firmá y aceptá el consentimiento.');
      return;
    }
    setSending(true);
    try {
      const signature = canvasRef.current?.toDataURL('image/png') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/authorization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData,
          language: lang,
          signature,
          authorization: { ...fields, acepta: true },
        }),
      });
      if (res.ok) {
        onDone();
      } else {
        setError(t.auth_err_send || 'No se pudo enviar. Probá de nuevo.');
      }
    } catch (e) {
      console.error(e);
      setError(t.auth_err_send || 'No se pudo enviar. Probá de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-red-500 focus:bg-red-500/5 transition-all text-sm";

  return (
    <div className="relative z-[10000] w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
      <div className="h-[85vh] md:h-[700px] flex flex-col glass-effect rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500 neon-border">

        {/* Header */}
        <div className="flex justify-between items-center bg-white/5 px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></div>
            <div className="flex flex-col">
              <span className="text-white font-black text-xs uppercase tracking-widest italic">🛡️ {t.auth_title}</span>
              <span className="text-[9px] text-red-400 font-bold tracking-widest uppercase opacity-80">Pentest Authorization</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <p className="text-gray-400 text-[13px] leading-relaxed">{t.auth_intro}</p>

          <input className={inputCls} placeholder={t.auth_f_company} value={fields.razonSocial} onChange={(e) => set('razonSocial', e.target.value)} />
          <input className={inputCls} placeholder={t.auth_f_id} value={fields.cuitDni} onChange={(e) => set('cuitDni', e.target.value)} />
          <input className={inputCls} placeholder={t.auth_f_address} value={fields.domicilio} onChange={(e) => set('domicilio', e.target.value)} />
          <textarea className={inputCls + " min-h-[80px] resize-none"} placeholder={t.auth_f_systems} value={fields.sistemas} onChange={(e) => set('sistemas', e.target.value)} />
          <input className={inputCls} placeholder={t.auth_f_window} value={fields.ventana} onChange={(e) => set('ventana', e.target.value)} />
          <input className={inputCls} placeholder={t.auth_f_signer} value={fields.firmante} onChange={(e) => set('firmante', e.target.value)} />

          {/* Firma */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">{t.auth_sign_label}</span>
              <button onClick={clearSig} className="text-[11px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider">{t.auth_clear}</button>
            </div>
            <canvas
              ref={canvasRef}
              width={320}
              height={140}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              className="w-full h-[140px] bg-white rounded-2xl border border-white/10 touch-none cursor-crosshair"
            />
          </div>

          {/* Consentimiento */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-1 w-4 h-4 accent-red-600 flex-shrink-0" />
            <span className="text-[12px] text-gray-400 leading-relaxed">{t.auth_consent}</span>
          </label>

          {error && <p className="text-red-400 text-[12px] font-bold">{error}</p>}
        </div>

        {/* Footer / acciones */}
        <div className="p-5 bg-white/5 border-t border-white/5 pb-safe-offset-4 space-y-3">
          <button
            onClick={submit}
            disabled={sending}
            className="btn-futuristic w-full py-4 bg-red-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          >
            {sending ? (t.auth_sending || '...') : t.auth_submit}
          </button>
          <button onClick={onDone} className="w-full py-2 text-gray-500 hover:text-gray-300 transition-colors text-[10px] uppercase tracking-widest font-bold">
            {t.auth_skip}
          </button>
        </div>
      </div>
    </div>
  );
}
