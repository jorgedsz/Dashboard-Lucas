/* =========================================================
   api.js — Adaptador de datos (modo LIVE, backend n8n).
   Una sola interfaz que el resto de la app consume.

   >>> PUNTOS DE INTEGRACIÓN CON n8n / META <<<
   n8n es el backend:
     · sendUrl   -> Webhook que llama a la WhatsApp Cloud API
     · convUrl   -> Webhook que devuelve las conversaciones
     · msgUrl    -> Webhook que devuelve los mensajes de una conversación
     · deleteUrl -> Webhook que elimina una conversación (y sus mensajes)
   ========================================================= */
(function (global) {
  'use strict';

  const S = () => Store.settings;
  const CFG = () => (global.WA_CONFIG || {});

  function headers() {
    const h = { 'Content-Type': 'application/json' };
    if (S().token) h['x-dashboard-token'] = S().token;
    return h;
  }

  async function http(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  const Api = {
    // ---------------------------------------------------------------
    // Cargar conversaciones. GET al webhook -> { conversations: [...] }
    // ---------------------------------------------------------------
    async loadConversations() {
      const data = await http(S().convUrl, { method: 'GET', headers: headers() });
      return {
        conversations: data.conversations || data || [],
        messagesByConv: data.messagesByConv || {},
        templates: data.templates || CFG().templates || []
      };
    },

    // ---------------------------------------------------------------
    // Mensajes de una conversación (lazy load)
    // ---------------------------------------------------------------
    async loadMessages(conversationId) {
      const url = S().msgUrl + (S().msgUrl.includes('?') ? '&' : '?') + 'conversationId=' + encodeURIComponent(conversationId);
      const data = await http(url, { method: 'GET', headers: headers() });
      return data.messages || data || [];
    },

    // ---------------------------------------------------------------
    // Enviar mensaje. POST a n8n -> WhatsApp Cloud API.
    //   { conversationId, to, type:'text'|'template', text, template, params }
    // Se espera { id, status, wamid } de vuelta.
    // ---------------------------------------------------------------
    async sendMessage(payload) {
      const data = await http(S().sendUrl, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload)
      });
      return data || { id: 'm' + Date.now(), status: 'sent' };
    },

    // ---------------------------------------------------------------
    // Eliminar una conversación (y sus mensajes, vía CASCADE en Postgres).
    // POST { conversationId } -> { ok: true }
    // ---------------------------------------------------------------
    async deleteConversation(conversationId) {
      const data = await http(S().deleteUrl, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ conversationId })
      });
      return data || { ok: true };
    },

    // ---------------------------------------------------------------
    // Sondeo de novedades (polling). n8n expone en convUrl las
    // conversaciones con su último mensaje y unreadCount actualizados.
    // ---------------------------------------------------------------
    async poll() {
      try {
        const data = await http(S().convUrl, { method: 'GET', headers: headers() });
        return { conversations: data.conversations || data || [] };
      } catch (e) {
        return { error: e.message };
      }
    }
  };

  global.Api = Api;
})(window);
