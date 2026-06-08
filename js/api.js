/* =========================================================
   api.js — Adaptador de datos.
   Una sola interfaz que el resto de la app consume. Por dentro
   conmuta entre DEMO (datos locales) y LIVE (webhooks de n8n).

   >>> AQUÍ ESTÁN LOS PUNTOS DE INTEGRACIÓN CON n8n / META <<<
   Cuando pases a modo LIVE, n8n es el backend:
     · sendUrl  -> tu Webhook de n8n que llama a la WhatsApp Cloud API
     · convUrl  -> tu Webhook de n8n que devuelve las conversaciones
     · msgUrl   -> tu Webhook de n8n que devuelve los mensajes de una conversación
   El formato JSON esperado es idéntico al de DemoData (ver data.js),
   así que el frontend no cambia: solo cambian las URLs.
   ========================================================= */
(function (global) {
  'use strict';

  const S = () => Store.settings;

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
    // Cargar conversaciones + mensajes iniciales
    // ---------------------------------------------------------------
    async loadConversations() {
      if (S().mode === 'demo') {
        return {
          conversations: structuredClone(DemoData.conversations),
          messagesByConv: structuredClone(DemoData.messagesByConv),
          templates: DemoData.templates
        };
      }
      // LIVE: GET al webhook de n8n. Se espera { conversations: [...] }
      const data = await http(S().convUrl, { method: 'GET', headers: headers() });
      return {
        conversations: data.conversations || data || [],
        messagesByConv: data.messagesByConv || {},
        templates: data.templates || DemoData.templates
      };
    },

    // ---------------------------------------------------------------
    // Mensajes de una conversación (lazy load en LIVE)
    // ---------------------------------------------------------------
    async loadMessages(conversationId) {
      if (S().mode === 'demo') {
        return structuredClone(DemoData.messagesByConv[conversationId] || []);
      }
      const url = S().msgUrl + (S().msgUrl.includes('?') ? '&' : '?') + 'conversationId=' + encodeURIComponent(conversationId);
      const data = await http(url, { method: 'GET', headers: headers() });
      return data.messages || data || [];
    },

    // ---------------------------------------------------------------
    // Enviar mensaje
    // Payload que recibe tu webhook de n8n:
    //   { conversationId, to, type:'text'|'template', text, template, params }
    // En n8n -> nodo HTTP Request -> POST a:
    //   https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
    //   { messaging_product:'whatsapp', to, type, text:{ body } }
    // ---------------------------------------------------------------
    async sendMessage(payload) {
      if (S().mode === 'demo') {
        // Simula latencia y confirmación de envío
        await new Promise(r => setTimeout(r, 350));
        return { id: 'm' + Date.now(), status: 'sent', wamid: 'wamid.DEMO' + Date.now() };
      }
      const data = await http(S().sendUrl, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload)
      });
      // Se espera { id, status, wamid } desde n8n (respuesta de la Cloud API)
      return data || { id: 'm' + Date.now(), status: 'sent' };
    },

    // ---------------------------------------------------------------
    // Sondeo de novedades (polling). En LIVE, n8n debe exponer en convUrl
    // las conversaciones con su último mensaje y unreadCount actualizados.
    // (Si más adelante montas WebSocket/SSE en n8n, se sustituye esto.)
    // ---------------------------------------------------------------
    async poll() {
      if (S().mode === 'demo') return null;
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
