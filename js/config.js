/* =========================================================
   config.js — Configuración por defecto del dashboard.
   Estas URLs NO son secretas (son endpoints públicos de n8n).
   Los secretos (Postgres, verify token) viven en las variables
   de entorno de Railway, nunca aquí.

   El usuario puede sobreescribir todo esto desde Ajustes (se
   guarda en localStorage y tiene prioridad sobre estos valores).
   ========================================================= */
window.WA_CONFIG = {
  // Base de tu instancia n8n
  n8nBase: 'https://primary-production-b7ae.up.railway.app',

  // Endpoints (webhooks de producción)
  sendUrl: 'https://primary-production-b7ae.up.railway.app/webhook/wa-send',
  convUrl: 'https://primary-production-b7ae.up.railway.app/webhook/wa-conversations',
  msgUrl:  'https://primary-production-b7ae.up.railway.app/webhook/wa-messages',

  // Modo inicial: 'demo' hasta que la base de datos esté lista.
  // Cambia a 'live' aquí o desde Ajustes cuando todo esté conectado.
  defaultMode: 'demo',

  // Sondeo de novedades en modo LIVE (ms). 0 = desactivado.
  pollInterval: 10000
};
