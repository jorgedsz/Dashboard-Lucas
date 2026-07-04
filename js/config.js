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
  n8nBase: 'https://n8n.lmconsultingai.com',

  // Endpoints (webhooks de producción)
  sendUrl:      'https://n8n.lmconsultingai.com/webhook/wa-send',
  sendMediaUrl: 'https://n8n.lmconsultingai.com/webhook/wa-send-media',
  convUrl:   'https://n8n.lmconsultingai.com/webhook/wa-conversations',
  msgUrl:    'https://n8n.lmconsultingai.com/webhook/wa-messages',
  deleteUrl: 'https://n8n.lmconsultingai.com/webhook/wa-delete-conversation',
  ghlUrl:      'https://n8n.lmconsultingai.com/webhook/wa-ghl-contact',
  ghlFieldUrl: 'https://n8n.lmconsultingai.com/webhook/wa-ghl-set-field',
  ghlNameUrl:  'https://n8n.lmconsultingai.com/webhook/wa-ghl-name',

  // Prender/apagar el chatbot (activar/desactivar su workflow en n8n)
  botStateUrl: 'https://n8n.lmconsultingai.com/webhook/wa-bot-state',
  botSetUrl:   'https://n8n.lmconsultingai.com/webhook/wa-bot-set',

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
