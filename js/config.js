/* =========================================================
   config.js — Configuración del dashboard (modo LIVE).
   Estas URLs NO son secretas (son endpoints públicos de n8n).
   Los secretos (Postgres, verify token) viven en las variables
   de entorno del servicio n8n, nunca aquí.

   El usuario puede sobreescribir las URLs desde Ajustes (se
   guarda en localStorage y tiene prioridad sobre estos valores).
   ========================================================= */
window.WA_CONFIG = {
  // Base de tu instancia n8n
  n8nBase: 'https://primary-production-b7ae.up.railway.app',

  // Endpoints (webhooks de producción)
  sendUrl:   'https://primary-production-b7ae.up.railway.app/webhook/wa-send',
  convUrl:   'https://primary-production-b7ae.up.railway.app/webhook/wa-conversations',
  msgUrl:    'https://primary-production-b7ae.up.railway.app/webhook/wa-messages',
  deleteUrl: 'https://primary-production-b7ae.up.railway.app/webhook/wa-delete-conversation',

  // Sondeo de novedades (ms). 0 = desactivado.
  pollInterval: 10000,

  // Plantillas disponibles (deben existir aprobadas en Meta).
  templates: [
    { name: 'recordatorio_cita', category: 'UTILITY',   body: 'Hola {{1}}, te recordamos tu cita el {{2}} a las {{3}}. Responde CONFIRMAR para confirmarla.' },
    { name: 'bienvenida',        category: 'MARKETING',  body: '¡Hola {{1}}! Gracias por contactarnos. ¿En qué podemos ayudarte hoy?' },
    { name: 'seguimiento_pago',  category: 'UTILITY',    body: 'Hola {{1}}, tu pago de {{2}} está pendiente. Puedes completarlo aquí: {{3}}' },
    { name: 'reactivacion',      category: 'MARKETING',  body: '¡Te extrañamos {{1}}! Tenemos una oferta especial para ti este mes.' }
  ]
};
