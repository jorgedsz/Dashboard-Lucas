# Despliegue n8n — WhatsApp Dashboard

n8n: https://primary-production-b7ae.up.railway.app
Estado: **funcionando** (entrante, conversaciones, mensajes y verificación de Meta probados).

## Workflows desplegados (activos)
| Workflow | ID | Webhook (producción) |
|---|---|---|
| WA · Incoming (Meta) | GHs0GyJLj6YZMT2a | `/webhook/wa-incoming` (GET verify + POST mensajes/estados) |
| WA · Send Message | Sw4OERszWK43Ra2N | `/webhook/wa-send` (POST) |
| WA · Get Conversations | hFnujBOqdNAFjiXA | `/webhook/wa-conversations` (GET) |
| WA · Get Messages | jG87Czw3OAhA6CCg | `/webhook/wa-messages` (GET ?conversationId=) |
| WA · DB Setup | R1VYzFowxtfihDNb | `/webhook/wa-db-setup` (GET, un solo uso) |
| WA · Save Inbound | UkBXFr1SyiAozJPV | `/webhook/wa-save-in` (POST) — guardar mensaje entrante a mano |
| WA · Save Outbound | INdmGsXWSafVvjJv | `/webhook/wa-save-out` (POST) — guardar mensaje saliente a mano |
| WA · Get Media | KG3XFlA8lcbUmb3c | `/webhook/wa-media?id=` (GET) — sirve el binario guardado (bytea) con su Content-Type |

## Guardado manual de mensajes (endpoints genéricos)

No envían nada por WhatsApp: solo registran en Postgres. Los llamas tú desde
tus propios flujos de n8n (nodo HTTP Request) o desde donde quieras.

**POST `/webhook/wa-save-in`** (entrante) y **POST `/webhook/wa-save-out`** (saliente)
aceptan el mismo cuerpo genérico:

```json
{
  "contactId": "ghl_AbC123",       // requerido — ID de contacto de GHL (clave de identidad, multicanal)
  "channel": "whatsapp",           // requerido — whatsapp | instagram | facebook
  "text": "contenido del mensaje", // requerido para type=text; opcional como caption en media
  "name": "Sofia",                 // opcional (nombre del contacto)
  "phone": "+52 55 4444 3333",     // opcional (para WhatsApp; se normaliza a dígitos)
  "wamid": "id-unico-opcional",    // opcional (dedupe; omítelo y siempre inserta)
  "timestamp": 1780964441,         // opcional (epoch s o ms; por defecto ahora)
  "type": "text",                  // opcional — text | image | audio | video | document | sticker
  "status": "sent",                // opcional (in→received, out→sent por defecto)

  // --- adjuntos: opción 1 (URL pública ya accesible) ---
  "mediaUrl": "https://.../archivo.pdf", // URL pública/accesible del adjunto
  "mediaMime": "application/pdf",        // opcional (alias: mimeType) — refuerza el render por tipo
  "filename": "cotizacion.pdf",          // opcional (alias: mediaFilename) — nombre mostrado en documentos

  // --- adjuntos: opción 2 (subir el binario, p.ej. media de Meta) ---
  "mediaBase64": "<base64 del archivo>", // alias: mediaData. Acepta también data:...;base64,xxxx
  "mediaMime": "audio/ogg",              // recomendado cuando subes binario
  "filename": "nota.ogg"                 // opcional
}
```

Respuesta: `{ "ok": true, "id": "3", "conversationId": "2" }`.

- **Identidad por `contactId` de GHL** (no por teléfono) → unifica WhatsApp, Instagram y
  Facebook bajo el mismo contacto. El teléfono es opcional.
- El **`channel`** se guarda por mensaje y por conversación; el dashboard muestra el
  icono de la plataforma en cada burbuja y en la lista.
- El entrante incrementa `unread_count` y actualiza `last_inbound`; el saliente no.
  Ambos crean el contacto/conversación si no existen.
- **Adjuntos:** si mandas `mediaUrl`, se guarda en `messages.media_url` (+ `media_mime`,
  `media_filename`). El `type` se infiere a `document` si no lo indicas. El dashboard
  renderiza imagen, reproductor de audio/video o tarjeta de documento descargable según
  el tipo. La vista previa en la lista muestra `📷 Imagen`, `🎵 Audio`, `📄 nombre.pdf`, etc.
  cuando no hay texto. **Requiere correr `wa-db-setup` una vez** para crear las columnas
  `media_mime`, `media_filename` y `media_data`.

## Media de Meta (URLs `lookaside.fbsbx.com`)

Las URLs de media que manda Meta **no sirven directo** en el dashboard: requieren el
`Bearer` token de WhatsApp y **expiran a los ~5 min**. Hay que **descargar el binario
y guardarlo en nuestro lado** (no guardar la URL de Meta).

Patrón en tu flujo de n8n (entrante):
1. **HTTP Request** `GET` a la URL `lookaside...` con *Predefined Credential Type → WhatsApp API*
   → devuelve el binario (p. ej. `File.ogg`, `audio/ogg`). n8n lo deja en la propiedad
   binaria `data`, y su base64 queda accesible en `{{ $binary.data.data }}`.
2. **HTTP Request** `POST` a `/webhook/wa-save-in` con cuerpo JSON:
   ```
   contactId, channel, type:"audio",
   mediaBase64: {{ $binary.data.data }},
   mediaMime:  {{ $binary.data.mimeType }},
   filename:   {{ $binary.data.fileName }}
   ```
3. `wa-save-in` decodifica el base64 y lo guarda en `messages.media_data` (`bytea`).
4. El dashboard recibe `mediaUrl = .../webhook/wa-media?id=<msgId>` (lo arma `wa-messages`),
   y **`wa-media`** sirve el binario con su Content-Type. Carga perezosa, sin servicios externos.

> Probado: subir base64 → `media_data` → `GET /wa-media?id=` devuelve los bytes idénticos
> con el `Content-Type` correcto y CORS `*`.

## Credenciales
- **Postgres (en uso):** `2W6eREXRp7yllk50` — "WA Postgres Direct".
  Valores **directos** (no env vars), apuntando al **host público** del Postgres de Railway.
- WhatsApp Business Cloud: `ULnicJG1cKVoq6dg` — Phone Number ID `1117263431478161`.

## Decisiones / lecciones del despliegue
1. **No usamos variables de entorno de n8n.** Esta imagen tiene
   `N8N_BLOCK_ENV_ACCESS_IN_NODE` activo y bloquea `$env` en nodos y credenciales
   (`access to env vars denied`). Poner el flag en `false` no surtió efecto.
   → Los valores van **directos** en la credencial (cifrados dentro de n8n, nunca en el repo).
2. **Host público, no interno.** `postgres.railway.internal` resolvía a **otra** base
   (la interna de la plantilla de n8n) → `password authentication failed`.
   → Se usa el **host público** del Postgres: `DATABASE_PUBLIC_URL`
   (`xxxx.proxy.rlwy.net:PUERTO`). Conecta sin ambigüedad.
3. **Verify token hardcodeado** en el nodo "Check Token" del workflow Incoming
   (porque `$env` está bloqueado). En el repo va un **placeholder**
   (`REEMPLAZA_CON_TU_VERIFY_TOKEN`); el valor real solo vive en el workflow desplegado.

> Si reimportas los JSON de este repo en otra instancia de n8n, hay que:
> (a) crear/asignar una credencial Postgres con los valores directos, y
> (b) poner tu verify token real en el nodo "Check Token".

## Configurar el webhook en Meta
- Callback URL: `https://primary-production-b7ae.up.railway.app/webhook/wa-incoming`
- Verify token: el valor real configurado en el nodo "Check Token".
- Suscribir el campo **messages**.

## Dashboard
Ajustes → modo **LIVE** con estas URLs (ya pre-cargadas en `js/config.js`):
- Enviar: `/webhook/wa-send`
- Conversaciones: `/webhook/wa-conversations`
- Mensajes: `/webhook/wa-messages`
