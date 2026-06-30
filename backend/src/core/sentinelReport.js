// ============================================================
//  Sentinel · Generador de informe PDF profesional (Node/pdfkit)
//  Reemplaza el pipeline externo generar.py de Mauro: arma el PDF
//  nativo en el backend, sin Python ni Chromium (corre en Railway).
//  Identidad Puma Code: negro #0d0d0d, amarillo #f5c400.
// ============================================================
const PDFDocument = require('pdfkit');

/* ---------- paleta ---------- */
const NEGRO = '#0d0d0d';
const AMARILLO = '#f5c400';
const GRIS = '#8a8a8a';
const GRIS_CLARO = '#d8d8d8';
const GRIS_LINEA = '#e5e7eb';
const TINTA = '#1f2430';

const SEV = {
  critico: { color: '#c0392b', label: 'Crítico' },
  alto: { color: '#e67e22', label: 'Alto' },
  medio: { color: '#d4a017', label: 'Medio' },
  bajo: { color: '#2980b9', label: 'Bajo' },
  info: { color: '#7f8c8d', label: 'Info' },
};

/* ---------- lógica portada de Mauro (informes_router.py) ---------- */
const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const MODALIDAD = {
  basico: 'Reconocimiento Pasivo',
  profesional: 'Reconocimiento Pasivo + Escaneo Activo',
  enterprise: 'Reconocimiento Pasivo + Escaneo Activo + Análisis de Lógica de Negocio + Test de IA',
};
const HERRAMIENTAS = {
  basico: 'whois, dig, subfinder, curl, whatweb',
  profesional: 'whois, dig, subfinder, curl, whatweb, nmap, nikto, wpscan, gobuster, sslscan',
  enterprise: 'whois, dig, subfinder, curl, whatweb, nmap, nikto, wpscan, gobuster, sslscan, test de chatbots IA',
};
const PLAZOS = { critico: 'Inmediato', alto: 'Esta semana', medio: 'Próximo mes', bajo: 'Próximo trimestre', info: 'Sin plazo' };
const ESFUERZOS = { critico: '2-4 hs', alto: '2-4 hs', medio: '1-2 hs', bajo: '1 h', info: 'N/A' };

const planKey = (p) => String(p || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const sevKey = (s) => {
  const k = String(s || 'info').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return SEV[k] ? k : 'info';
};

function formatearFecha(d) {
  const dt = d ? new Date(d) : new Date();
  return `${dt.getDate()} de ${MESES[dt.getMonth() + 1]} de ${dt.getFullYear()}`;
}

function estadoPorScore(score) {
  if (score >= 85) return { label: 'Seguro', color: '#27ae60' };
  if (score >= 70) return { label: 'Aceptable', color: '#2980b9' };
  if (score >= 50) return { label: 'Mejorable', color: '#e67e22' };
  return { label: 'Crítico', color: '#c0392b' };
}

function generarConclusion(score, nombre) {
  if (score >= 85) return `La auditoría de seguridad realizada sobre la infraestructura de ${nombre} revela una postura de seguridad sólida. Se recomienda mantener las buenas prácticas actuales y realizar auditorías periódicas para asegurar la continuidad de los controles implementados.`;
  if (score >= 70) return `La auditoría de seguridad de ${nombre} muestra una postura aceptable con áreas de mejora identificadas. Se recomienda implementar las acciones del plan de remediación en los plazos indicados y programar un re-pentest para verificar las correcciones.`;
  if (score >= 50) return `La auditoría de seguridad de ${nombre} revela vulnerabilidades que requieren atención prioritaria. Se recomienda implementar las correcciones del plan de remediación comenzando por las de severidad alta, y programar un re-pentest dentro de los próximos 30 días.`;
  return `La auditoría de seguridad de ${nombre} revela vulnerabilidades críticas que ponen en riesgo la operación del negocio. Se recomienda acción inmediata sobre los hallazgos críticos y de severidad alta. Un re-pentest urgente debe programarse una vez implementadas las correcciones prioritarias.`;
}

function resumenEjecutivo(hallazgos, controlesOk, score) {
  let estado;
  if (score >= 85) estado = 'La postura de seguridad del sitio es sólida, con controles bien implementados y sin vulnerabilidades críticas.';
  else if (score >= 70) estado = 'La postura de seguridad es aceptable, con algunos aspectos que requieren atención para alcanzar un nivel óptimo.';
  else if (score >= 50) estado = 'Se detectaron vulnerabilidades que requieren atención. La postura de seguridad necesita mejoras significativas.';
  else estado = 'Se detectaron vulnerabilidades críticas que requieren atención inmediata. La postura de seguridad del sitio es insuficiente.';

  const positivos = (controlesOk && controlesOk.length) ? controlesOk.slice(0, 5).map((c) => c.control || '') : ['No se identificaron controles positivos destacables'];
  const niveles = { critico: 'alta', alto: 'alta', medio: 'media', bajo: 'baja' };
  const prioridades = (hallazgos || []).filter((h) => sevKey(h.severidad) !== 'info').map((h) => ({
    nivel: niveles[sevKey(h.severidad)] || 'baja',
    titulo: h.titulo || '',
    descripcion: (h.descripcion || '').slice(0, 200),
    accion: (h.recomendacion || '').slice(0, 200),
  }));
  return { estado_general: estado, positivos, prioridades };
}

/* ============================================================
   Construcción del PDF
   Devuelve un PDFDocument con el contenido escrito (sin .end()).
   El caller hace: doc.pipe(stream); doc.end();
   ============================================================ */
function crearDocInforme({ project, audit }) {
  const analisis = (() => { try { return JSON.parse(audit.result_json || '{}'); } catch { return {}; } })();
  const hallazgosRaw = analisis.hallazgos || [];
  const controlesOk = analisis.controles_ok || [];
  const infra = analisis.infraestructura || [];
  const score = Number(audit.score || 0);
  const pk = planKey(audit.plan);
  const nombre = project.name;
  const dominio = project.domain || '—';
  const fecha = formatearFecha(audit.created_at);

  const hallazgos = hallazgosRaw.map((h, i) => ({ id: `H${String(i + 1).padStart(2, '0')}`, ...h }));

  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, info: {
    Title: `Informe de Seguridad — ${nombre}`, Author: 'Puma Code · Sentinel', Subject: 'Auditoría de seguridad',
  } });

  const W = doc.page.width;     // 595.28
  const H = doc.page.height;    // 841.89
  const M = 56;                 // margen de contenido
  const CW = W - M * 2;         // ancho de contenido

  /* ---------- helpers de dibujo ---------- */
  const escudo = (x, y, s, fill = AMARILLO, check = NEGRO) => {
    doc.save();
    doc.path(`M ${x + s * 0.5} ${y} L ${x + s} ${y + s * 0.18} L ${x + s} ${y + s * 0.55} C ${x + s} ${y + s * 0.8} ${x + s * 0.5} ${y + s} ${x + s * 0.5} ${y + s} C ${x + s * 0.5} ${y + s} ${x} ${y + s * 0.8} ${x} ${y + s * 0.55} L ${x} ${y + s * 0.18} Z`).fill(fill);
    doc.path(`M ${x + s * 0.3} ${y + s * 0.48} L ${x + s * 0.45} ${y + s * 0.62} L ${x + s * 0.72} ${y + s * 0.32}`).lineWidth(s * 0.07).lineCap('round').lineJoin('round').stroke(check);
    doc.restore();
  };

  const tildeVerde = (x, y, s = 9) => {
    doc.save();
    doc.path(`M ${x} ${y + s * 0.5} L ${x + s * 0.38} ${y + s * 0.85} L ${x + s} ${y}`).lineWidth(1.6).lineCap('round').lineJoin('round').stroke('#27ae60');
    doc.restore();
  };

  const anilloScore = (cx, cy, r, sc, color) => {
    doc.save();
    doc.lineWidth(7).circle(cx, cy, r).stroke('#2a2a2a');
    const frac = Math.max(0, Math.min(100, sc)) / 100;
    if (frac > 0) {
      const a0 = -Math.PI / 2;
      const a1 = a0 + frac * 2 * Math.PI;
      const sx = cx + r * Math.cos(a0), sy = cy + r * Math.sin(a0);
      const ex = cx + r * Math.cos(a1), ey = cy + r * Math.sin(a1);
      const large = frac > 0.5 ? 1 : 0;
      doc.path(`M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`).lineWidth(7).lineCap('round').stroke(color);
    }
    doc.restore();
  };

  let footerSubtitle = `${nombre} · ${dominio}`;

  /* ============ PORTADA ============ */
  doc.rect(0, 0, W, H).fill('#ffffff');
  doc.rect(0, 0, W, 300).fill(NEGRO);
  escudo(M, 54, 46);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text('SENTINEL', M + 60, 60);
  doc.fillColor(GRIS).font('Helvetica').fontSize(9).text('by Puma Code · Seguridad ofensiva continua', M + 60, 80);

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(30).text('Informe de Auditoría', M, 130, { width: CW });
  doc.fillColor(AMARILLO).font('Helvetica-Bold').fontSize(30).text('de Seguridad', M, 165, { width: CW });
  doc.fillColor(GRIS_CLARO).font('Helvetica').fontSize(11).text(`Preparado para ${nombre}`, M, 215);

  // tarjeta de score sobre el borde de la franja negra
  const cardY = 240, cardH = 120;
  doc.roundedRect(M, cardY, CW, cardH, 14).fill('#161616');
  doc.roundedRect(M, cardY, CW, cardH, 14).lineWidth(1).stroke('#2a2a2a');
  const est = estadoPorScore(score);
  anilloScore(M + 70, cardY + cardH / 2, 38, score, est.color);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26).text(String(Math.round(score)), M + 52, cardY + cardH / 2 - 16, { width: 36, align: 'center' });
  doc.fillColor(GRIS).font('Helvetica').fontSize(8).text('/100', M + 52, cardY + cardH / 2 + 10, { width: 36, align: 'center' });
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13).text('Postura de seguridad', M + 135, cardY + 32);
  doc.fillColor(est.color).font('Helvetica-Bold').fontSize(18).text(est.label, M + 135, cardY + 52);
  doc.fillColor(GRIS).font('Helvetica').fontSize(9).text(`Plan ${MODALIDAD[pk] ? pk.charAt(0).toUpperCase() + pk.slice(1) : audit.plan}`, M + 135, cardY + 80);

  // metadatos
  let my = cardY + cardH + 48;
  const metaRow = (k, v) => {
    doc.font('Helvetica-Bold').fontSize(11);
    const vh = doc.heightOfString(v, { width: CW - 150 });
    doc.fillColor(GRIS).font('Helvetica').fontSize(9).text(k.toUpperCase(), M, my, { width: 140 });
    doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(11).text(v, M + 150, my - 1, { width: CW - 150 });
    my += Math.max(26, vh + 14);
    doc.moveTo(M, my - 7).lineTo(W - M, my - 7).lineWidth(0.5).stroke(GRIS_LINEA);
  };
  metaRow('Cliente', nombre);
  metaRow('Dominio', dominio);
  metaRow('Contacto', project.contact || 'Equipo IT');
  metaRow('Fecha de auditoría', fecha);
  metaRow('Modalidad', MODALIDAD[pk] || MODALIDAD.profesional);
  metaRow('Versión del informe', '1.0 — Final');

  // nota de confidencialidad
  doc.roundedRect(M, H - 130, CW, 64, 10).fill('#fbfaf5');
  doc.roundedRect(M, H - 130, CW, 64, 10).lineWidth(1).stroke(AMARILLO);
  doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(9).text('DOCUMENTO CONFIDENCIAL', M + 16, H - 118);
  doc.fillColor('#555').font('Helvetica').fontSize(8.5).text('Este informe contiene información sensible sobre la seguridad de la infraestructura del cliente. Su distribución está restringida al cliente y al equipo de Puma Code.', M + 16, H - 104, { width: CW - 32 });

  /* ---------- helpers de página de contenido ---------- */
  let y = 0;
  const nuevaPagina = () => { doc.addPage(); y = M + 8; };
  const espacio = (h) => { if (y + h > H - 70) nuevaPagina(); };

  const tituloSeccion = (txt) => {
    espacio(48);
    doc.rect(M, y, 4, 18).fill(AMARILLO);
    doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(15).text(txt, M + 14, y);
    y += 30;
  };
  const parrafo = (txt, opts = {}) => {
    const size = opts.size || 10.5; const color = opts.color || '#33384a';
    doc.fillColor(color).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size);
    const h = doc.heightOfString(txt, { width: CW });
    espacio(h + 6);
    doc.fillColor(color).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).text(txt, M, y, { width: CW, align: opts.align || 'left' });
    y += h + (opts.gap != null ? opts.gap : 10);
  };

  /* ============ RESUMEN EJECUTIVO (enterprise) ============ */
  nuevaPagina();
  if (pk === 'enterprise') {
    const re = resumenEjecutivo(hallazgos, controlesOk, score);
    tituloSeccion('Resumen ejecutivo');
    parrafo(re.estado_general);

    parrafo('Aspectos positivos', { bold: true, color: '#27ae60', size: 11, gap: 6 });
    re.positivos.forEach((p) => {
      espacio(16);
      tildeVerde(M + 1, y + 2, 9);
      doc.fillColor('#33384a').font('Helvetica').fontSize(10).text(p, M + 16, y, { width: CW - 16 });
      y += Math.max(16, doc.heightOfString(p, { width: CW - 16 }) + 4);
    });
    y += 8;

    if (re.prioridades.length) {
      parrafo('Prioridades de atención', { bold: true, color: '#c0392b', size: 11, gap: 6 });
      re.prioridades.slice(0, 6).forEach((p) => {
        const blkH = 14 + doc.heightOfString(p.descripcion, { width: CW - 20 }) + 14;
        espacio(blkH + 10);
        const c = p.nivel === 'alta' ? '#c0392b' : p.nivel === 'media' ? '#e67e22' : '#2980b9';
        doc.rect(M, y, 3, blkH).fill(c);
        doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(10.5).text(`[${p.nivel.toUpperCase()}] ${p.titulo}`, M + 12, y, { width: CW - 12 });
        doc.fillColor('#55607a').font('Helvetica').fontSize(9.5).text(p.descripcion, M + 12, y + 14, { width: CW - 20 });
        y += blkH + 10;
      });
    }
  } else {
    tituloSeccion('Resumen');
    parrafo(resumenEjecutivo(hallazgos, controlesOk, score).estado_general);
  }

  /* ============ DATOS DE LA AUDITORÍA ============ */
  tituloSeccion('Datos de la auditoría');
  const ficha = [
    ['Fecha', fecha],
    ['Versión', '1.0 — Final'],
    ['Modalidad', MODALIDAD[pk] || MODALIDAD.profesional],
    ['Herramientas', HERRAMIENTAS[pk] || HERRAMIENTAS.profesional],
  ];
  ficha.forEach(([k, v]) => {
    const vh = doc.heightOfString(v, { width: CW - 130 });
    espacio(vh + 14);
    doc.fillColor('#9aa0ad').font('Helvetica-Bold').fontSize(9).text(k.toUpperCase(), M, y, { width: 120 });
    doc.fillColor('#33384a').font('Helvetica').fontSize(10).text(v, M + 130, y, { width: CW - 130 });
    y += vh + 12;
    doc.moveTo(M, y - 6).lineTo(W - M, y - 6).lineWidth(0.5).stroke(GRIS_LINEA);
  });
  y += 6;

  /* ============ INFRAESTRUCTURA ============ */
  if (infra.length) {
    tituloSeccion('Infraestructura detectada');
    infra.forEach((it) => {
      espacio(18);
      doc.fillColor('#9aa0ad').font('Helvetica-Bold').fontSize(9).text((it.parametro || '').toUpperCase(), M, y, { width: 180 });
      doc.fillColor('#33384a').font('Helvetica').fontSize(10).text(it.valor || '', M + 190, y, { width: CW - 190 });
      y += Math.max(16, doc.heightOfString(it.valor || '', { width: CW - 190 }) + 4);
    });
    y += 8;
  }

  /* ============ HALLAZGOS ============ */
  tituloSeccion(`Hallazgos (${hallazgos.length})`);
  if (!hallazgos.length) {
    parrafo('No se identificaron hallazgos negativos en esta auditoría.', { color: '#27ae60' });
  }
  hallazgos.forEach((h) => {
    const sk = sevKey(h.severidad);
    const sc = SEV[sk];
    const campos = [
      ['Descripción', h.descripcion],
      ['Evidencia', h.evidencia],
      ['Impacto', h.impacto],
      ['Recomendación', h.recomendacion],
    ].filter(([, v]) => v);

    // estimación de alto para no cortar el encabezado del hallazgo
    espacio(70);
    // encabezado
    doc.roundedRect(M, y, CW, 26, 6).fill('#f7f8fa');
    doc.rect(M, y, 4, 26).fill(sc.color);
    doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(11).text(`${h.id} · ${h.titulo || ''}`, M + 14, y + 7, { width: CW - 160 });
    // badge severidad + cvss
    const bw = 120;
    doc.roundedRect(W - M - bw, y + 5, bw, 16, 8).fill(sc.color);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text(`${sc.label.toUpperCase()} · CVSS ${h.cvss || '0.0'}`, W - M - bw, y + 9, { width: bw, align: 'center' });
    y += 32;
    if (h.owasp) { doc.fillColor(GRIS).font('Helvetica-Oblique').fontSize(8.5).text(h.owasp, M + 14, y); y += 14; }
    if (h.cvss_vector) { doc.fillColor('#9aa0ad').font('Helvetica').fontSize(8).text(h.cvss_vector, M + 14, y); y += 12; }
    y += 2;

    campos.forEach(([k, v]) => {
      const esEvidencia = k === 'Evidencia';
      doc.font(esEvidencia ? 'Courier' : 'Helvetica').fontSize(esEvidencia ? 8.5 : 9.5);
      const vh = doc.heightOfString(v, { width: CW - 28 });
      espacio(vh + 22);
      doc.fillColor('#9aa0ad').font('Helvetica-Bold').fontSize(8.5).text(k.toUpperCase(), M + 14, y);
      y += 13;
      if (esEvidencia) {
        doc.roundedRect(M + 14, y - 3, CW - 28, vh + 8, 4).fill('#0d0d0d');
        doc.fillColor('#d8d8d8').font('Courier').fontSize(8.5).text(v, M + 22, y + 1, { width: CW - 44 });
        y += vh + 12;
      } else {
        const col = k === 'Recomendación' ? '#1e7a4d' : '#33384a';
        doc.fillColor(col).font('Helvetica').fontSize(9.5).text(v, M + 14, y, { width: CW - 28 });
        y += vh + 8;
      }
    });
    y += 12;
    doc.moveTo(M, y - 6).lineTo(W - M, y - 6).lineWidth(0.5).stroke(GRIS_LINEA);
    y += 4;
  });

  /* ============ CONTROLES OK ============ */
  if (controlesOk.length) {
    tituloSeccion('Controles correctos');
    controlesOk.forEach((c) => {
      const txt = `${c.control || ''}${c.observacion ? ' — ' + c.observacion : ''}`;
      const vh = doc.heightOfString(txt, { width: CW - 18 });
      espacio(vh + 8);
      tildeVerde(M + 1, y + 3, 9);
      doc.fillColor('#33384a').font('Helvetica').fontSize(9.5).text(txt, M + 16, y + 1, { width: CW - 18 });
      y += Math.max(16, vh + 6);
    });
    y += 8;
  }

  /* ============ PLAN DE REMEDIACIÓN ============ */
  if (hallazgos.length) {
    tituloSeccion('Plan de remediación');
    // cabecera de tabla
    espacio(28);
    const cols = [
      { x: M, w: 38, t: 'ID' },
      { x: M + 38, w: CW - 38 - 110 - 70, t: 'Hallazgo' },
      { x: W - M - 110 - 70, w: 110, t: 'Plazo' },
      { x: W - M - 70, w: 70, t: 'Esfuerzo' },
    ];
    doc.rect(M, y, CW, 22).fill(NEGRO);
    cols.forEach((c) => doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text(c.t.toUpperCase(), c.x + 6, y + 7, { width: c.w - 8 }));
    y += 22;
    hallazgos.forEach((h, i) => {
      const sk = sevKey(h.severidad);
      const titulo = h.titulo || '';
      const th = Math.max(18, doc.heightOfString(titulo, { width: cols[1].w - 8 }) + 8);
      espacio(th + 2);
      if (i % 2 === 0) doc.rect(M, y, CW, th).fill('#f7f8fa');
      doc.rect(M, y, 3, th).fill(SEV[sk].color);
      doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(8.5).text(h.id, cols[0].x + 8, y + 5, { width: cols[0].w - 8 });
      doc.fillColor('#33384a').font('Helvetica').fontSize(8.5).text(titulo, cols[1].x + 6, y + 5, { width: cols[1].w - 8 });
      doc.fillColor('#55607a').font('Helvetica').fontSize(8.5).text(PLAZOS[sk], cols[2].x + 6, y + 5, { width: cols[2].w - 8 });
      doc.fillColor('#55607a').font('Helvetica').fontSize(8.5).text(ESFUERZOS[sk], cols[3].x + 6, y + 5, { width: cols[3].w - 8 });
      y += th;
    });
    y += 16;
  }

  /* ============ CONCLUSIÓN ============ */
  tituloSeccion('Conclusión');
  parrafo(generarConclusion(score, nombre));

  // sello / verificación
  if (project.badge_token) {
    espacio(60);
    doc.roundedRect(M, y, CW, 50, 10).fill('#fbfaf5');
    doc.roundedRect(M, y, CW, 50, 10).lineWidth(1).stroke(AMARILLO);
    escudo(M + 14, y + 11, 28);
    doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(10).text('Sello verificable Sentinel', M + 54, y + 12);
    doc.fillColor('#55607a').font('Helvetica').fontSize(8.5).text(`Verificá el estado en tiempo real: /v/${project.badge_token}`, M + 54, y + 28, { width: CW - 70 });
    y += 60;
  }

  /* ---------- pie de página numerado en todas menos la portada ---------- */
  const range = doc.bufferedPageRange();
  for (let i = 1; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.moveTo(M, H - 50).lineTo(W - M, H - 50).lineWidth(0.5).stroke(GRIS_LINEA);
    doc.fillColor(GRIS).font('Helvetica').fontSize(8).text(`Confidencial · Puma Code · Sentinel`, M, H - 42, { width: CW / 2 });
    doc.fillColor(GRIS).font('Helvetica').fontSize(8).text(`${footerSubtitle}   ·   Pág. ${i + 1} de ${range.count}`, M + CW / 2, H - 42, { width: CW / 2, align: 'right' });
  }

  return doc;
}

module.exports = { crearDocInforme };