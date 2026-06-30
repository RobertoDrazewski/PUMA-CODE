// ============================================================
//  Sentinel · Comandos guiados de pentesting (por plan)
//  Portado del commands_router de Mauro.
// ============================================================

const CMDS = {
  whois:     { fase: 'Reconocimiento pasivo', orden: 1, plan: 'basico', desc: 'Datos de registro del dominio', cmd: 'whois {d}' },
  dig:       { fase: 'Reconocimiento pasivo', orden: 2, plan: 'basico', desc: 'Registros DNS: A, MX, NS, TXT', cmd: 'dig {d} ANY +noall +answer && dig {d} MX +short && dig {d} TXT +short' },
  subfinder: { fase: 'Reconocimiento pasivo', orden: 3, plan: 'basico', desc: 'Enumeración de subdominios', cmd: 'subfinder -d {d} -silent' },
  whatweb:   { fase: 'Reconocimiento pasivo', orden: 4, plan: 'basico', desc: 'Tecnologías, frameworks, CMS', cmd: 'whatweb https://{d} -v' },
  curl:      { fase: 'Reconocimiento pasivo', orden: 5, plan: 'basico', desc: 'Cabeceras HTTP de seguridad', cmd: 'curl -s -I https://{d}' },
  nmap:      { fase: 'Escaneo activo', orden: 6, plan: 'profesional', desc: 'Puertos, servicios y versiones', cmd: 'nmap -sV -sC -T4 --top-ports 1000 {d}' },
  sslscan:   { fase: 'Escaneo activo', orden: 7, plan: 'profesional', desc: 'Certificado SSL/TLS y cifrados', cmd: 'sslscan --no-colour {d}' },
  nikto:     { fase: 'Escaneo activo', orden: 8, plan: 'profesional', desc: 'Vulnerabilidades web conocidas', cmd: 'nikto -h https://{d}' },
  gobuster:  { fase: 'Escaneo activo', orden: 9, plan: 'profesional', desc: 'Directorios y archivos ocultos', cmd: 'gobuster dir -u https://{d} -w /usr/share/wordlists/dirb/common.txt -t 30 -q' },
  wpscan:    { fase: 'Escaneo activo', orden: 10, plan: 'profesional', desc: 'WordPress: plugins, temas, usuarios', cmd: 'wpscan --url https://{d} --enumerate vp,vt,u --no-banner' },
  chatbot:   { fase: 'Análisis de IA', orden: 11, plan: 'enterprise', desc: 'Test OWASP LLM Top 10 contra chatbots', cmd: '# Usá el módulo "Test de chatbots" de Sentinel' },
  auth_test: { fase: 'Lógica de negocio', orden: 12, plan: 'enterprise', desc: 'Autenticación, sesiones, control de acceso', cmd: '# Pruebas manuales de flujos de login' },
  business_logic: { fase: 'Lógica de negocio', orden: 13, plan: 'enterprise', desc: 'Lógica de negocio, flujos de pago', cmd: '# Pruebas manuales de flujos críticos' },
};

const PLANES = {
  basico: { nombre: 'Básico', herramientas: ['whois', 'dig', 'curl', 'whatweb', 'subfinder'] },
  profesional: { nombre: 'Profesional', herramientas: ['whois', 'dig', 'curl', 'whatweb', 'subfinder', 'nmap', 'nikto', 'wpscan', 'gobuster', 'sslscan'] },
  enterprise: { nombre: 'Enterprise', herramientas: ['whois', 'dig', 'curl', 'whatweb', 'subfinder', 'nmap', 'nikto', 'wpscan', 'gobuster', 'sslscan', 'chatbot', 'auth_test', 'business_logic'] },
};

const FILTRO = {
  basico: ['basico'],
  profesional: ['basico', 'profesional'],
  enterprise: ['basico', 'profesional', 'enterprise'],
};

function normalizarPlan(plan) {
  return String(plan || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function comandosPara(plan, dominio) {
  const pk = normalizarPlan(plan);
  const permitidos = FILTRO[pk] || FILTRO.profesional;
  const resultado = [];
  for (const [nombre, cfg] of Object.entries(CMDS)) {
    if (permitidos.includes(cfg.plan)) {
      resultado.push({
        herramienta: nombre,
        fase: cfg.fase,
        orden: cfg.orden,
        descripcion: cfg.desc,
        comando: cfg.cmd.replace('{d}', dominio || 'dominio.com'),
      });
    }
  }
  resultado.sort((a, b) => a.orden - b.orden);
  return resultado;
}

module.exports = { PLANES, FILTRO, normalizarPlan, comandosPara };
