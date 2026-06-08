# WhatsApp Dashboard (estilo GoHighLevel)

Panel de conversaciones de WhatsApp standalone que replica el inbox de GoHighLevel.
**100% frontend, sin build, sin instalar nada.** Pensado para que **n8n sea el backend**
(recibe webhooks de Meta y envía mensajes vía WhatsApp Cloud API).

## Cómo abrirlo

Doble clic en `index.html` (o clic derecho → abrir con tu navegador).
Arranca en **modo DEMO** con datos simulados; todo es funcional:

- Lista de conversaciones con búsqueda y filtros (Todas / No leídas / Destacadas)
- Hilo de chat estilo WhatsApp: burbujas, ticks ✓/✓✓ (gris=entregado, azul=leído), separadores de fecha
- Composer: escribir, plantillas, adjuntos (UI), emoji (UI), Enter para enviar
- Panel de contacto: etiquetas, campos, estado abierta/cerrada
- Botón **"Simular entrante"** para ver mensajes llegando (solo DEMO)
- Aviso automático de **ventana de 24 h** (cuando solo se puede enviar plantilla aprobada)

## Pasar a modo LIVE (conectar a n8n)

Abre **Ajustes** (icono engranaje, abajo del rail izquierdo) → elige **Modo LIVE** y pega las URLs
de tus webhooks de n8n. Se guardan en `localStorage` del navegador.

| Campo en Ajustes | Método | Qué hace en n8n |
|---|---|---|
| **Enviar mensaje** | `POST` | Webhook → HTTP Request a la WhatsApp Cloud API |
| **Obtener conversaciones** | `GET` | Webhook que devuelve la lista (también se usa para polling) |
| **Obtener mensajes** | `GET ?conversationId=` | Webhook que devuelve los mensajes de una conversación |
| **Polling** | — | Cada cuántos segundos refresca conversaciones/mensajes |
| **Token** | — | Se envía como header `x-dashboard-token` para validar en n8n |

> El JSON que esperan/devuelven los webhooks es **idéntico** al de los datos demo
> (ver `js/data.js`). Así el frontend no cambia: solo cambian las URLs.

### Contratos de datos

**GET conversaciones** → responde:
```json
{ "conversations": [
  { "id":"c1", "name":"María González", "phone":"+52 55 1234 5678",
    "avatar": {"initials":"MG","color":"#2f6df6"},
    "channel":"whatsapp", "lastMessage":"...", "lastMessageAt":1733600000000,
    "lastDirection":"in", "lastStatus":"received", "unreadCount":1,
    "starred":false, "status":"open", "lastInbound":1733600000000,
    "contact": {"email":"...","company":"...","tags":["VIP"],"source":"...","owner":"..."} }
] }
```

**GET mensajes** (`?conversationId=c1`) → responde:
```json
{ "messages": [
  { "id":"m1","conversationId":"c1","direction":"in","type":"text",
    "text":"Hola","timestamp":1733600000000,"status":"received" }
] }
```

**POST enviar** ← el dashboard envía:
```json
{ "conversationId":"c1", "to":"525512345678", "type":"text",
  "text":"Hola María", "template": null }
```
…y tu n8n responde `{ "id":"m99", "status":"sent", "wamid":"wamid.XXX" }`.

## Esquema sugerido de flujos n8n

1. **Entrante (Meta → n8n):**
   `Webhook (verify + recibir)` → normaliza el payload de Meta → guarda en tu BD/almacén →
   (opcional) notifica al dashboard.

2. **Salida (dashboard → n8n → Meta):**
   `Webhook (POST enviar)` → `HTTP Request`:
   ```
   POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
   Authorization: Bearer {ACCESS_TOKEN}
   { "messaging_product":"whatsapp", "to":"{{to}}", "type":"text",
     "text": { "body":"{{text}}" } }
   ```
   → devuelve `{ id, status, wamid }`.

3. **Lectura (dashboard → n8n):** dos `Webhook (GET)` que leen de tu BD y devuelven
   conversaciones y mensajes con el formato de arriba.

> ⚠️ Recuerda habilitar **CORS** en los nodos Webhook de n8n (header
> `Access-Control-Allow-Origin`) para que el navegador pueda llamarlos desde `file://`.
> Alternativa: servir esta carpeta desde el mismo dominio que n8n.

## Estructura

```
ghl-whatsapp-dashboard/
├── index.html              # estructura (3 paneles + modales)
├── css/styles.css          # estilos tipo GHL (claro + oscuro)
├── js/
│   ├── config.js           # URLs de n8n por defecto (NO secretas)
│   ├── data.js             # datos DEMO (= formato LIVE)
│   ├── store.js            # estado + ajustes (localStorage)
│   ├── api.js              # ADAPTADOR: conmuta DEMO/LIVE  ← puntos de integración
│   ├── ui.js               # renderizado del DOM
│   └── app.js              # eventos, tema y flujo enviar/recibir
├── n8n/                    # workflows del backend (ver n8n/DEPLOY.md)
│   ├── wf-incoming.json    # webhook de Meta (verify + mensajes/estados)
│   ├── wf-send.json        # enviar (WhatsApp Business Cloud)
│   ├── wf-conversations.json
│   ├── wf-messages.json
│   └── wf-db-setup.json    # crea las tablas Postgres
├── Dockerfile              # servir el dashboard estático (nginx) en Railway
├── nginx.conf.template
├── railway.json
└── .env.example            # variables que van en Railway (no en el repo)
```

Todo el "cableado" externo vive en **`js/api.js`** y las URLs en **`js/config.js`**.

## Despliegue (git + Railway)

Los **secretos nunca van en el repo** — viven en las variables de entorno del
servicio n8n en Railway (ver `.env.example` y `n8n/DEPLOY.md`).

### Backend (n8n)
Ya desplegado vía API. Solo falta, en Railway, crear el servicio **Postgres** y poner
estas variables en el servicio **n8n** (luego se redespliega solo):

```
N8N_BLOCK_ENV_ACCESS_IN_NODE=false   # crítico: desbloquea $env
WA_PGHOST=${{Postgres.PGHOST}}
WA_PGDATABASE=${{Postgres.PGDATABASE}}
WA_PGUSER=${{Postgres.PGUSER}}
WA_PGPASSWORD=${{Postgres.PGPASSWORD}}
WA_VERIFY_TOKEN=<tu-token>
```

Luego: `GET /webhook/wa-db-setup` una vez para crear las tablas.

### Frontend (dashboard)
Dos opciones:
- **Local:** abre `index.html` con doble clic.
- **Railway (sitio estático):** crea un servicio nuevo apuntando a este repo. El
  `Dockerfile` + `railway.json` sirven los archivos con nginx en el `$PORT` de Railway.
  Las URLs de n8n están en `js/config.js` (no son secretas).
