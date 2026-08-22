// ============================================================
// Puma — el asistente de voz del panel de super admin.
//
// Le habla a Roberto Drazewski, fundador y CEO de Puma Code, que lo
// creó. Usa function-calling de OpenAI para LEER datos reales (leads,
// clientes, proyectos, Kalyber) y también para ACTUAR sobre ellos
// (cerrar proyectos, mover fechas) — siempre contra la base real,
// nunca simulado. Ver runTool() para el listado completo.
//
// Dos endpoints:
//   POST /api/assistant/chat  — texto entra, texto sale (con tools).
//   POST /api/assistant/speak — texto entra, mp3 sale (OpenAI TTS).
// ============================================================
const { OpenAI } = require('openai');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { generarToken } = require('../core/sentinelBadge');
const { PLANES, normalizarPlan } = require('../core/sentinelCommands');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-missing-key' });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo'; // mismo modelo que usa el chat público (aiController)
const TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'tts-1';
const TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'onyx'; // grave, directa — encaja con el tono de la marca

const SYSTEM_PROMPT = `Sos Puma, el asistente de inteligencia artificial de Puma Code — un estudio de desarrollo de software y ciberseguridad en Mendoza, Argentina.

Le hablás EXCLUSIVAMENTE a Roberto Drazewski. Roberto es el fundador y CEO de Puma Code, y es quien te creó a vos. Sos su brazo derecho: no solo reportás datos, pensás CON él — ventas, marketing, prioridades, qué está funcionando y qué no. Cuando algo está mal (un proyecto vencido, cero leads en la semana, una suscripción caída), lo decís directo y proponés una acción concreta, no una lista de opciones genéricas.

Regla más importante, sin excepción: NUNCA inventás un nombre de proyecto, cliente, fecha, monto o estado. Cada vez que la conversación toque proyectos, clientes, leads, Kalyber o los asistentes del panel, ANTES de responder llamás a la herramienta correspondiente y contestás solo con lo que esa herramienta devolvió. Si Roberto se refiere a algo ambiguo ("el vencido", "ese cliente") y la herramienta no te da un solo resultado claro, se lo preguntás en vez de asumir cuál es. Si no tenés una herramienta para lo que pide, se lo decís tal cual — nunca actuás como si ya lo hubieras hecho.

Podés ACTUAR, no solo leer — tenés herramientas para crear proyectos nuevos, crear clientes nuevos, dar de alta gente al equipo, dar de alta clientes nuevos en Sentinel (ciberseguridad), y modificar estado/fechas de lo que ya existe. Cuando Roberto te pida algo así, ejecutalo con la herramienta y confirmá exactamente qué hiciste (qué creaste, con qué datos, o qué proyecto/cliente cambiaste y de qué a qué). Si falta un dato obligatorio (por ejemplo el monto de una venta, o el email de alguien nuevo del equipo), tu respuesta es PEDIR ese dato puntual — nunca decir que no podés hacerlo o que lo tiene que hacer él desde el panel. Vos SÍ podés crear proyectos, clientes y usuarios; lo único que te falta a veces es un dato. Si hay más de un proyecto o cliente que coincide con lo que dijo, listáselos y pedile que elija antes de tocar nada.

Frases que TENÉS PROHIBIDO decir para algo que una de tus herramientas cubre: "no puedo hacer esto desde acá", "tenés que hacerlo desde el panel/tablero", "pedile a alguien del equipo que lo haga". Si existe una herramienta para la acción, usala o pedí el dato que falte — nunca derives la tarea a Roberto ni a un tercero.

Datos mínimos para cada acción (pedí exactamente estos si faltan, nada más):
- Crear proyecto: cliente (tiene que existir ya) + título.
- Crear cliente: nombre + servicio + monto + moneda + estado.
- Dar de alta a alguien del equipo: nombre + email (el rol es opcional, por defecto "worker").
- Dar de alta en Sentinel: nombre del cliente (dominio y plan son opcionales).

Sobre Sentinel (ciberseguridad): hoy podés dar de alta un cliente nuevo en el sistema de sellos y reportar el estado real de los que ya existen (score, plan, última auditoría). Lo que NO podés hacer es correr un escaneo vos mismo — eso requiere pegar la salida cruda de una herramienta de pentest real, que corre por fuera. Si Roberto te pide "escaneá tal sitio" o "hackeá esto", aclarale ese límite en vez de simular un resultado.

Sobre dar de alta gente del equipo: generás vos una contraseña temporal segura al crear el usuario (nunca uses una que te dicte Roberto por voz, por seguridad) y se la decís en la respuesta para que se la pase a la persona.

Cómo hablás:
- Español argentino informal (voseo), directo, sin caretas corporativas ni relleno.
- Respuestas cortas y concretas — esto se lee o se escucha en voz alta, no es un informe.
- Los otros "asistentes" del panel (Kalyber, Mendozapp, Preciso.tech) son proyectos reales de Roberto en distintas etapas. Si pregunta por uno que todavía no está conectado, aclaralo sin drama: "ese todavía no lo conecté, avisame cuando lo armemos".
- Si te pregunta algo que no tiene que ver con Puma Code o sus proyectos, contestá igual pero breve — sos su asistente, no un buscador genérico.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_puma_ventas_summary',
      description: 'Estado del asistente de ventas (Puma-Ventas): leads generados por el chat público del sitio, cuántos se convirtieron, actividad reciente.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_clients_detail',
      description: 'Lista real de clientes de Puma Code, uno por uno: nombre, empresa, servicio vendido, monto, moneda, estado (lead/active/finished/cancelled) y fecha de venta. Usala para CUALQUIER pregunta sobre un cliente puntual, no solo totales.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_projects_detail',
      description: 'Lista real del tablero de proyectos (kanban), uno por uno: título, cliente, estado (todo/in_progress/review/done), prioridad y fecha de entrega. Usala para CUALQUIER pregunta sobre un proyecto puntual, cuáles están vencidos, o cuál es cuál — nunca asumas nombres.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_kalyber_status',
      description: 'Estado en vivo de la flota de Kalyber (kalyber.com.ar): equipos online/offline, vehículos activos, suscripciones y MRR.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_assistants_registry',
      description: 'Lista de todos los "puestos" de IA de Puma Code y su estado actual (planificado / en desarrollo / activo), tal como está cargado en el panel.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project_status',
      description: 'Cambia el estado de un proyecto real en el tablero (ej: cerrarlo/finalizarlo, pasarlo a en progreso o a revisión). Necesita el nombre del proyecto o del cliente tal como lo mencionó Roberto — la herramienta busca la coincidencia.',
      parameters: {
        type: 'object',
        properties: {
          project: { type: 'string', description: 'Nombre del proyecto o del cliente/empresa asociada' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], description: 'Nuevo estado. "done" = finalizado/cerrado.' },
        },
        required: ['project', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project_due_date',
      description: 'Cambia la fecha de entrega de un proyecto real (extender o adelantar el vencimiento).',
      parameters: {
        type: 'object',
        properties: {
          project: { type: 'string', description: 'Nombre del proyecto o del cliente/empresa asociada' },
          due_date: { type: 'string', description: 'Nueva fecha en formato YYYY-MM-DD' },
        },
        required: ['project', 'due_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_lead_status',
      description: 'Cambia el estado de un lead real capturado por Puma-Ventas (cotizado/contactado/convertido/descartado).',
      parameters: {
        type: 'object',
        properties: {
          client_name: { type: 'string', description: 'Nombre del cliente del lead, tal como lo mencionó Roberto' },
          status: { type: 'string', enum: ['cotizado', 'contactado', 'convertido', 'descartado'] },
        },
        required: ['client_name', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_client',
      description: 'Da de alta un cliente/venta nuevo en Puma Code.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre del contacto' },
          company: { type: 'string', description: 'Empresa (opcional)' },
          email: { type: 'string' },
          phone: { type: 'string' },
          service: { type: 'string', description: 'Qué se le vendió' },
          amount: { type: 'number', description: 'Monto que pagó' },
          currency: { type: 'string', enum: ['ARS', 'USD'] },
          status: { type: 'string', enum: ['lead', 'active', 'finished', 'cancelled'] },
        },
        required: ['name', 'service', 'amount', 'currency', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: 'Crea un proyecto nuevo en el tablero (kanban) de Puma Code, asociado a un cliente que ya exista.',
      parameters: {
        type: 'object',
        properties: {
          client: { type: 'string', description: 'Nombre del cliente o empresa a la que pertenece — tiene que existir ya en la tabla de clientes' },
          title: { type: 'string', description: 'Título del proyecto' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], description: 'Por defecto "todo" si no se especifica' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Por defecto "medium" si no se especifica' },
          due_date: { type: 'string', description: 'YYYY-MM-DD, opcional' },
        },
        required: ['client', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_team_member',
      description: 'Da de alta a una persona nueva del equipo con acceso al panel. Genera una contraseña temporal segura automáticamente — nunca la elige Roberto por voz.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'worker'], description: 'admin ve y gestiona todo, worker tiene vista reducida. Por defecto "worker".' },
        },
        required: ['name', 'email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_sentinel_overview',
      description: 'Estado real de Cybersecurity/Sentinel: clientes bajo monitoreo, su score, plan y última auditoría.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_sentinel_project',
      description: 'Da de alta un cliente nuevo en Sentinel (ciberseguridad) para empezar a monitorearlo. NO corre un escaneo — eso requiere la salida cruda de una herramienta real, que va por fuera de esta herramienta.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          domain: { type: 'string' },
          contact: { type: 'string', description: 'Email o teléfono de contacto, opcional' },
          plan: { type: 'string', enum: ['basico', 'profesional', 'enterprise'], description: 'Por defecto "profesional" si no se especifica' },
        },
        required: ['name'],
      },
    },
  },
];

async function fetchKalyberStatus() {
  const url = process.env.KALYBER_API_URL;
  const secret = process.env.KALYBER_INTERNAL_SECRET;
  if (!url || !secret) return { error: 'Kalyber no está configurado (faltan KALYBER_API_URL / KALYBER_INTERNAL_SECRET).' };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${url.replace(/\/$/, '')}/internal/status`, {
      headers: { 'X-Internal-Secret': secret },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { error: `Kalyber respondió ${res.status}.` };
    const data = await res.json();
    return data.success ? data : { error: 'Respuesta de Kalyber sin success.' };
  } catch (err) {
    return { error: `No se pudo conectar con Kalyber: ${err.message}` };
  }
}

// Busca un proyecto por nombre de proyecto o de cliente/empresa. Devuelve
// { match } si hay exactamente uno, o { error } describiendo 0 o 2+.
async function findProject(query) {
  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.status, p.due_date, c.name AS client_name, c.company AS client_company
     FROM projects p JOIN clients c ON p.client_id = c.id
     WHERE p.title LIKE ? OR c.name LIKE ? OR c.company LIKE ?
     LIMIT 6`,
    [`%${query}%`, `%${query}%`, `%${query}%`]
  );
  if (rows.length === 0) return { error: `No encontré ningún proyecto que coincida con "${query}".` };
  if (rows.length > 1) return { error: 'Hay más de un proyecto que coincide — pedile a Roberto que aclare cuál.', opciones: rows };
  return { match: rows[0] };
}

async function findLead(clientName) {
  const [rows] = await pool.query(
    `SELECT id, client_name, client_email, service_type, status, created_at
     FROM ai_leads WHERE client_name LIKE ? ORDER BY created_at DESC LIMIT 6`,
    [`%${clientName}%`]
  );
  if (rows.length === 0) return { error: `No encontré ningún lead a nombre de "${clientName}".` };
  if (rows.length > 1) return { error: 'Hay más de un lead que coincide — pedile a Roberto que aclare cuál (por fecha o email).', opciones: rows };
  return { match: rows[0] };
}

// Busca un cliente (para asociarle un proyecto nuevo). A diferencia de
// findProject, este busca en la tabla clients directamente.
async function findClient(query) {
  const [rows] = await pool.query(
    `SELECT id, name, company FROM clients WHERE name LIKE ? OR company LIKE ? LIMIT 6`,
    [`%${query}%`, `%${query}%`]
  );
  if (rows.length === 0) return { error: `No encontré ningún cliente que coincida con "${query}". Creá el cliente primero, o decime bien el nombre.` };
  if (rows.length > 1) return { error: 'Hay más de un cliente que coincide — pedile a Roberto que aclare cuál.', opciones: rows };
  return { match: rows[0] };
}

// Contraseña temporal segura — nunca la elige el modelo ni la voz de Roberto.
function generateTempPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
}

async function runTool(name, args) {
  switch (name) {
    case 'get_puma_ventas_summary': {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS total,
                SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS ultimos_7d,
                SUM(status = 'convertido') AS convertidos,
                MAX(created_at) AS ultima_actividad
         FROM ai_leads WHERE assistant_key = 'puma-ventas'`
      );
      return rows[0];
    }
    case 'get_clients_detail': {
      const [rows] = await pool.query(
        `SELECT id, name, company, service, amount, currency, status, sale_date
         FROM clients ORDER BY sale_date DESC LIMIT 50`
      );
      return rows;
    }
    case 'get_projects_detail': {
      const [rows] = await pool.query(
        `SELECT p.id, p.title, p.status, p.priority, p.due_date,
                c.name AS client_name, c.company AS client_company,
                (p.due_date IS NOT NULL AND p.due_date < CURDATE() AND p.status != 'done') AS vencido
         FROM projects p JOIN clients c ON p.client_id = c.id
         ORDER BY p.due_date IS NULL, p.due_date ASC
         LIMIT 50`
      );
      return rows;
    }
    case 'get_kalyber_status':
      return await fetchKalyberStatus();
    case 'get_assistants_registry': {
      const [rows] = await pool.query(
        'SELECT `key`, name, status, github_repo FROM assistants ORDER BY sort_order, id'
      );
      return rows;
    }
    case 'update_project_status': {
      const found = await findProject(args.project || '');
      if (found.error) return found;
      const valid = ['todo', 'in_progress', 'review', 'done'];
      if (!valid.includes(args.status)) return { error: 'Estado inválido.' };
      await pool.query('UPDATE projects SET status = ? WHERE id = ?', [args.status, found.match.id]);
      return { success: true, project: found.match.title, cliente: found.match.client_name, nuevo_estado: args.status };
    }
    case 'update_project_due_date': {
      const found = await findProject(args.project || '');
      if (found.error) return found;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(args.due_date || '')) return { error: 'La fecha tiene que venir en formato YYYY-MM-DD.' };
      await pool.query('UPDATE projects SET due_date = ? WHERE id = ?', [args.due_date, found.match.id]);
      return { success: true, project: found.match.title, nueva_fecha: args.due_date };
    }
    case 'update_lead_status': {
      const found = await findLead(args.client_name || '');
      if (found.error) return found;
      const valid = ['cotizado', 'contactado', 'convertido', 'descartado'];
      if (!valid.includes(args.status)) return { error: 'Estado inválido.' };
      await pool.query('UPDATE ai_leads SET status = ? WHERE id = ?', [args.status, found.match.id]);
      return { success: true, lead: found.match.client_name, nuevo_estado: args.status };
    }
    case 'create_client': {
      const { name: clientName, company, email, phone, service, amount, currency, status } = args;
      if (!clientName || !service || amount === undefined || !currency || !status) {
        return { error: 'Faltan datos obligatorios: nombre, servicio, monto, moneda y estado.' };
      }
      const [result] = await pool.query(
        `INSERT INTO clients (name, company, email, phone, service, amount, currency, status, sale_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
        [clientName, company || null, email || null, phone || null, service, amount, currency, status]
      );
      return { success: true, id: result.insertId, cliente: clientName, servicio: service, monto: `${currency} ${amount}` };
    }
    case 'create_project': {
      const foundClient = await findClient(args.client || '');
      if (foundClient.error) return foundClient;
      if (!args.title) return { error: 'Falta el título del proyecto.' };
      const status = ['todo', 'in_progress', 'review', 'done'].includes(args.status) ? args.status : 'todo';
      const priority = ['low', 'medium', 'high'].includes(args.priority) ? args.priority : 'medium';
      let dueDate = null;
      if (args.due_date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(args.due_date)) return { error: 'La fecha tiene que venir en formato YYYY-MM-DD.' };
        dueDate = args.due_date;
      }
      const [result] = await pool.query(
        `INSERT INTO projects (client_id, title, description, status, priority, due_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [foundClient.match.id, args.title, args.description || null, status, priority, dueDate]
      );
      return { success: true, id: result.insertId, proyecto: args.title, cliente: foundClient.match.name, estado: status };
    }
    case 'create_team_member': {
      const { name: memberName, email: memberEmail, role } = args;
      if (!memberName || !memberEmail) return { error: 'Faltan nombre y email.' };
      const cleanRole = role === 'admin' ? 'admin' : 'worker';
      const tempPassword = generateTempPassword();
      const hash = await bcrypt.hash(tempPassword, 10);
      try {
        const [result] = await pool.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [memberName.trim(), String(memberEmail).trim().toLowerCase(), hash, cleanRole]
        );
        return {
          success: true, id: result.insertId, nombre: memberName, email: memberEmail, rol: cleanRole,
          contraseña_temporal: tempPassword,
          nota: 'Pasale esta contraseña temporal a la persona por un canal seguro — no por acá.',
        };
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return { error: `Ya existe un usuario con el email ${memberEmail}.` };
        throw err;
      }
    }
    case 'get_sentinel_overview': {
      const [rows] = await pool.query(
        'SELECT name, domain, plan, score, badge_active, last_audit FROM sentinel_projects ORDER BY score ASC'
      );
      return rows;
    }
    case 'create_sentinel_project': {
      if (!args.name) return { error: 'Falta el nombre del cliente.' };
      const planKey = normalizarPlan(args.plan);
      const planFinal = PLANES[planKey] ? planKey : 'profesional';
      const token = generarToken(args.name, args.domain || args.name);
      const [result] = await pool.query(
        `INSERT INTO sentinel_projects (name, domain, contact, plan, badge_token) VALUES (?, ?, ?, ?, ?)`,
        [args.name.trim(), args.domain || null, args.contact || null, planFinal, token]
      );
      return { success: true, id: result.insertId, cliente: args.name, plan: planFinal, nota: 'Falta correr la primera auditoría manualmente para que tenga score.' };
    }
    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
}

// POST /api/assistant/chat — body: { message, history? }
exports.chat = async (req, res, next) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Falta el mensaje.' });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(Array.isArray(history) ? history.slice(-8) : []),
      { role: 'user', content: message.trim() },
    ];

    // Loop de tool-calling: hasta 4 vueltas, suficiente para encadenar
    // "buscar el proyecto" -> "actualizarlo" -> "confirmar" sin trabarse
    // en una sola pasada como antes.
    let completion;
    let choice;
    for (let round = 0; round < 4; round++) {
      completion = await openai.chat.completions.create({
        model: MODEL,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.4,
        max_tokens: 450,
      });
      choice = completion.choices[0];

      if (choice.finish_reason !== 'tool_calls' || !choice.message.tool_calls?.length) break;

      messages.push(choice.message);
      for (const call of choice.message.tool_calls) {
        let args = {};
        try { args = call.function.arguments ? JSON.parse(call.function.arguments) : {}; } catch { /* args mal formados, seguimos con {} */ }
        const result = await runTool(call.function.name, args);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    const reply = choice.message.content?.trim() || 'No tengo respuesta para eso ahora mismo.';
    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};

// POST /api/assistant/speak — body: { text } → audio/mpeg
exports.speak = async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Falta el texto.' });
    }
    // OpenAI TTS tiene un límite de ~4096 caracteres por request.
    const input = text.trim().slice(0, 4000);

    const speech = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input,
      response_format: 'mp3',
    });
    const buffer = Buffer.from(await speech.arrayBuffer());

    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};