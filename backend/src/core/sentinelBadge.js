// ============================================================
//  Sentinel · Motor de sellos (badges)
//  Portado del badge engine + svg_generator de Mauro a Node.
//  - Token HMAC-SHA256 infalsificable por proyecto.
//  - SVG dinámico (se genera en cada request con el último score).
//  - Página pública de verificación.
//  Identidad visual Puma Code: negro #0d0d0d, amarillo #f5c400.
// ============================================================
const crypto = require('crypto');

const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || 'cambiar-esto';

// Token único e infalsificable: prefijo del dominio + uuid + firma HMAC.
function generarToken(projectId, dominio) {
  const uid = crypto.randomBytes(16).toString('hex');
  const mensaje = `${projectId}:${dominio}:${uid}`;
  const firma = crypto.createHmac('sha256', SECRET_KEY).update(mensaje).digest('hex');
  const prefijo = String(dominio || 'site').split('.')[0].slice(0, 4).toLowerCase();
  return `${prefijo}-${uid.slice(0, 8)}-${firma.slice(0, 8)}`;
}

// Estado visual del sello según score y vigencia.
function calcularEstadoSello(score, activo, diasDesdeAuditoria) {
  if (!activo) return { estado: 'revocado', color: '#888780', label: 'Revocado' };
  if (diasDesdeAuditoria > 365) return { estado: 'expirado', color: '#888780', label: 'Vencido' };
  if (score >= 85) return { estado: 'excelente', color: '#27ae60', label: 'Seguro' };
  if (score >= 70) return { estado: 'bueno', color: '#2980b9', label: 'Aceptable' };
  if (score >= 50) return { estado: 'regular', color: '#e67e22', label: 'Mejorable' };
  return { estado: 'critico', color: '#c0392b', label: 'Crítico' };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// SVG embebible (300x84) con anillo de progreso.
function generarBadgeSVG(score, estado) {
  const color = estado.color || '#888780';
  const label = escapeHtml(estado.label || '').toUpperCase();
  const scoreInt = Math.round(score);
  const circ = 144.51;
  const arco = Math.round((Math.max(0, Math.min(100, scoreInt)) / 100) * circ * 100) / 100;
  const gap = Math.round((circ - arco) * 100) / 100;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="84" viewBox="0 0 300 84" role="img" aria-label="Sentinel: postura ${scoreInt} de 100, estado ${label}">
  <rect x="0.5" y="0.5" width="299" height="83" rx="14" fill="#0d0d0d" stroke="#f5c400" stroke-opacity="0.35"/>
  <path d="M34 28 L45 31 L45 42 Q45 50 34 54 Q23 50 23 42 L23 31 Z" fill="#f5c400"/>
  <path d="M29 40 L33 44 L40 35" fill="none" stroke="#0d0d0d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="62" y="34" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="#ffffff" letter-spacing="0.5">SENTINEL</text>
  <circle cx="67" cy="51" r="3.5" fill="${color}"/>
  <text x="76" y="55" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" fill="${color}" letter-spacing="0.3">${label}</text>
  <text x="62" y="72" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="#8a8a8a">Auditado · puma code</text>
  <circle cx="255" cy="42" r="23" fill="none" stroke="#2a2a2a" stroke-width="5.5"/>
  <circle cx="255" cy="42" r="23" fill="none" stroke="${color}" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="${arco} ${gap}" transform="rotate(-90 255 42)"/>
  <text x="255" y="40" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${scoreInt}</text>
  <text x="255" y="57" font-family="Arial, Helvetica, sans-serif" font-size="8" fill="#8a8a8a" text-anchor="middle">/ 100</text>
</svg>`;
}

// Página pública de verificación (HTML).
function generarPaginaVerificacion({ nombre, dominio, plan, fecha, estado, score }) {
  const color = estado.color;
  const label = estado.label;
  const scoreInt = Math.round(score);
  const dash = Math.round((scoreInt / 100) * 263.9 * 10) / 10;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Verificación Sentinel — ${escapeHtml(nombre)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; background:#0d0d0d; color:#fff; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
  .card { background:#161616; border:1px solid #2a2a2a; border-radius:18px; padding:32px; max-width:440px; width:100%; }
  .head { display:flex; align-items:center; gap:12px; padding-bottom:20px; border-bottom:1px solid #2a2a2a; margin-bottom:20px; }
  .logo { width:44px; height:44px; }
  .brand { font-size:15px; font-weight:700; }
  .brand small { display:block; font-size:11px; color:#888; font-weight:400; margin-top:2px; }
  .score-row { display:flex; align-items:center; gap:20px; margin-bottom:24px; }
  .ring { position:relative; width:96px; height:96px; flex-shrink:0; }
  .ring svg { transform:rotate(-90deg); }
  .ring .num { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:26px; font-weight:700; }
  .info h1 { font-size:20px; margin-bottom:4px; }
  .info .dom { font-size:13px; color:#888; margin-bottom:8px; }
  .pill { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; padding:4px 12px; border-radius:99px; background:${color}1a; color:${color}; }
  .dot { width:7px; height:7px; border-radius:50%; background:${color}; }
  .meta { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
  .cell { background:#0d0d0d; border-radius:10px; padding:12px; }
  .cell .l { font-size:11px; color:#777; margin-bottom:3px; }
  .cell .v { font-size:14px; font-weight:600; }
  .foot { font-size:12px; color:#666; text-align:center; padding-top:16px; border-top:1px solid #2a2a2a; line-height:1.6; }
  .foot b { color:#f5c400; }
</style></head>
<body>
<div class="card">
  <div class="head">
    <svg class="logo" viewBox="0 0 44 44"><path d="M22 5 L36 9 L36 23 Q36 34 22 39 Q8 34 8 23 L8 9 Z" fill="#f5c400"/><path d="M15 22 L20 27 L30 16" fill="none" stroke="#0d0d0d" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="brand">Sentinel by Puma Code<small>Certificado de seguridad verificado</small></div>
  </div>
  <div class="score-row">
    <div class="ring">
      <svg width="96" height="96"><circle cx="48" cy="48" r="42" fill="none" stroke="#2a2a2a" stroke-width="7"/><circle cx="48" cy="48" r="42" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${dash} 263.9"/></svg>
      <div class="num">${scoreInt}</div>
    </div>
    <div class="info">
      <h1>${escapeHtml(nombre)}</h1>
      <div class="dom">${escapeHtml(dominio || '')}</div>
      <span class="pill"><span class="dot"></span>${label}</span>
    </div>
  </div>
  <div class="meta">
    <div class="cell"><div class="l">Última auditoría</div><div class="v">${escapeHtml(fecha || 'N/D')}</div></div>
    <div class="cell"><div class="l">Plan auditado</div><div class="v">${escapeHtml(plan || 'N/D')}</div></div>
    <div class="cell"><div class="l">Puntaje</div><div class="v">${scoreInt} / 100</div></div>
    <div class="cell"><div class="l">Estado</div><div class="v" style="color:${color}">${label}</div></div>
  </div>
  <div class="foot">Verificado por <b>Puma Code</b><br>Este certificado refleja el estado real en tiempo real</div>
</div>
</body></html>`;
}

module.exports = {
  generarToken,
  calcularEstadoSello,
  generarBadgeSVG,
  generarPaginaVerificacion,
};
