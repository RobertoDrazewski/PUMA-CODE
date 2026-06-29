# 🐆 Puma Code · Panel de control + Base de datos

Guía rápida de lo que se agregó y cómo ponerlo a andar.

## Qué se agregó

- **Base de datos MySQL** (Railway) con tablas para usuarios, clientes/ventas, tickets de trabajo y el módulo Sentinel.
- **API del panel** en el backend (Express): login con JWT, clientes, proyectos/tickets, métricas y cybersecurity.
- **Panel de control** en el frontend, en la ruta **`/admin`**, con pestañas:
  - **Resumen**: ventas del mes (USD/ARS), clientes, trabajo activo, gráfico mensual y últimas ventas.
  - **Clientes y ventas**: cada cliente es una venta con el precio pagado. Alta, edición y filtros.
  - **Proyectos**: tablero Kanban (Por hacer / En progreso / En revisión / Finalizado), tipo Trello/Jira simplificado. Se arrastran las tarjetas.
  - **Cybersecurity (Sentinel)**: estado de seguridad de los proyectos, score, hallazgos y actividad.
  - **Equipo** (solo admin): agregar trabajadores y definir quién es administrador.

## 1) Base de datos

El esquema está en `backend/src/config/schema.sql`. **No hace falta importarlo a mano**: el backend lo crea solo al arrancar (`src/config/initDb.js`), de forma idempotente. Si preferís importarlo manualmente en Railway, podés pegar ese archivo en la consola de MySQL.

La primera vez que arranca con la base vacía, se crea un **admin inicial**:

- Email: `admin@puma-code.com`
- Contraseña: `PumaAdmin2026!`  ← cambiala desde la pestaña Equipo / o variables de entorno.

## 2) Variables de entorno (backend)

Ya están en `backend/.env`. Las importantes:

```
DATABASE_URL=mysql://root:****@reseau.proxy.rlwy.net:58827/railway
JWT_SECRET=<secreto largo ya generado>
ADMIN_EMAIL=admin@puma-code.com
ADMIN_PASSWORD=PumaAdmin2026!
ALLOWED_ORIGINS=http://localhost:3000,https://puma-code.com
```

> En Railway, en producción conviene usar la URL **interna** de MySQL
> (`mysql://...@mysql.railway.internal:3306/railway`): es más rápida y no
> tiene costo de egreso. La pública (proxy) sirve para conectarte desde afuera.

## 3) Deploy automático en Railway (backend)

Archivos incluidos en `backend/`: `railway.json`, `nixpacks.toml`, `Procfile`.

Pasos en Railway:
1. New Project → Deploy from GitHub → elegí el repo.
2. En el servicio, **Settings → Root Directory = `backend`**.
3. Variables: pegá las de `backend/.env` (o referenciá la base con `${{MySQL.MYSQL_URL}}`).
4. Railway detecta `railway.json` y levanta con `npm start`. El healthcheck pega a `/health`.

La base MySQL ya la tenés creada en Railway (la del `DATABASE_URL`).

## 4) Frontend

El panel vive en `/admin`. Necesita saber dónde está la API:

```
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://TU-BACKEND.up.railway.app
```

Local:
```bash
cd backend  && npm install && npm run dev
cd frontend && npm install && npm run dev
# Panel: http://localhost:3000/admin
```

## ⚠️ Seguridad — rotá estas credenciales

Las siguientes claves estuvieron expuestas y conviene **regenerarlas**:
- La contraseña de MySQL de Railway.
- La `OPENAI_API_KEY`.
- La `GMAIL_APP_PASSWORD`.

Ninguna está hardcodeada en el código: todo se lee de variables de entorno.
