/* =========================================================
   app.js — Orquestación: init, eventos y flujo de envío/recepción
   ========================================================= */
(function (global) {
  'use strict';

  const $ = sel => document.querySelector(sel);
  let pollTimer = null;

  const App = {
    async init() {
      this.applyTheme(localStorage.getItem('wa_dashboard_theme') || 'light');
      UI.renderConnBadge();
      await this.refreshData();
      this.bindEvents();
      this.startPolling();
    },

    // ---------- tema claro / oscuro ----------
    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const dark = theme === 'dark';
      const moon = document.querySelector('#btnTheme .icon-moon');
      const sun = document.querySelector('#btnTheme .icon-sun');
      if (moon && sun) { moon.style.display = dark ? 'none' : ''; sun.style.display = dark ? '' : 'none'; }
    },
    toggleTheme() {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      this.applyTheme(next);
      localStorage.setItem('wa_dashboard_theme', next);
    },

    // ---------- carga / recarga de datos ----------
    async refreshData() {
      try {
        const data = await Api.loadConversations();
        Store.setData(data.conversations, data.messagesByConv, data.templates);
        UI.renderList();
        UI.renderTemplates();
        if (Store.activeId) UI.renderThread();
      } catch (e) {
        UI.toast('Error al cargar: ' + e.message);
        $('#connBadge').className = 'conn conn--error';
        $('#connBadge').textContent = 'ERROR';
      }
    },

    // ---------- abrir conversación ----------
    async openConversation(id) {
      Store.activeId = id;
      Store.markRead(id);
      // En LIVE carga mensajes bajo demanda si aún no están
      if (Store.settings.mode === 'live' && !(Store.messagesByConv[id] || []).length) {
        try { Store.messagesByConv[id] = await Api.loadMessages(id); }
        catch (e) { UI.toast('No se pudieron cargar los mensajes'); }
      }
      UI.renderList();
      UI.renderThread();
    },

    // ---------- enviar mensaje ----------
    async send(text, opts) {
      opts = opts || {};
      const conv = Store.activeConversation();
      if (!conv || (!text.trim() && !opts.template)) return;

      const optimistic = {
        id: 'tmp' + Date.now(),
        conversationId: conv.id,
        direction: 'out',
        type: opts.template ? 'template' : 'text',
        text: text,
        template: opts.template || null,
        timestamp: Date.now(),
        status: 'sent'
      };
      Store.addMessage(conv.id, optimistic);
      UI.renderThread();
      UI.renderList();

      // Payload que recibe n8n -> WhatsApp Cloud API
      const payload = {
        conversationId: conv.id,
        to: conv.phone.replace(/[^\d]/g, ''),
        type: optimistic.type,
        text: text,
        template: opts.template ? { name: opts.template, params: opts.params || [] } : null
      };

      try {
        const res = await Api.sendMessage(payload);
        optimistic.id = res.id || optimistic.id;
        optimistic.status = res.status || 'delivered';
        // En DEMO simulamos progresión de ticks
        if (Store.settings.mode === 'demo') this.simulateTicks(optimistic, conv.id);
      } catch (e) {
        optimistic.status = 'failed';
        UI.toast('Error al enviar: ' + e.message);
      }
      UI.renderThread();
      UI.renderList();
    },

    // DEMO: avanza ticks sent -> delivered -> read
    simulateTicks(msg, convId) {
      setTimeout(() => { msg.status = 'delivered'; this.refreshIfActive(convId); }, 800);
      setTimeout(() => { msg.status = 'read'; this.refreshIfActive(convId); }, 2200);
    },
    refreshIfActive(convId) {
      if (Store.activeId === convId) { UI.renderThread(); UI.renderList(); }
    },

    // DEMO: simular un mensaje entrante
    simulateIncoming() {
      const conv = Store.activeConversation();
      if (!conv) return;
      const samples = ['Perfecto, gracias 🙏', '¿Me puedes dar más información?', 'De acuerdo, quedo atento', 'Sí, me interesa', '👍'];
      const msg = {
        id: 'in' + Date.now(),
        conversationId: conv.id,
        direction: 'in',
        type: 'text',
        text: samples[Math.floor(Math.random() * samples.length)],
        timestamp: Date.now(),
        status: 'received'
      };
      Store.addMessage(conv.id, msg);
      UI.renderThread();
      UI.renderList();
    },

    useTemplate(tpl) {
      $('#templateModal').hidden = true;
      const conv = Store.activeConversation();
      if (!conv) { UI.toast('Selecciona una conversación primero'); return; }
      // sustituye {{1}} por el nombre como demostración
      const filled = tpl.body.replace('{{1}}', conv.name.split(' ')[0]);
      this.send(filled, { template: tpl.name });
    },

    // ---------- polling (modo LIVE) ----------
    startPolling() {
      clearInterval(pollTimer);
      const ms = Number(Store.settings.pollInterval) || 0;
      if (Store.settings.mode !== 'live' || ms <= 0) return;
      pollTimer = setInterval(async () => {
        const res = await Api.poll();
        if (res && res.conversations) {
          // fusiona contadores / últimos mensajes
          Store.conversations = res.conversations;
          UI.renderList();
          if (Store.activeId) {
            try {
              Store.messagesByConv[Store.activeId] = await Api.loadMessages(Store.activeId);
              UI.renderThread();
            } catch (_) {}
          }
        }
      }, ms);
    },

    // ---------- ajustes ----------
    openSettings() {
      const s = Store.settings;
      document.querySelector(`input[name=mode][value="${s.mode}"]`).checked = true;
      $('#cfgSendUrl').value = s.sendUrl;
      $('#cfgConvUrl').value = s.convUrl;
      $('#cfgMsgUrl').value = s.msgUrl;
      $('#cfgPoll').value = String(s.pollInterval);
      $('#cfgToken').value = s.token;
      $('#settingsModal').hidden = false;
    },
    async saveSettings() {
      const mode = (document.querySelector('input[name=mode]:checked') || {}).value || 'demo';
      Object.assign(Store.settings, {
        mode,
        sendUrl: $('#cfgSendUrl').value.trim(),
        convUrl: $('#cfgConvUrl').value.trim(),
        msgUrl: $('#cfgMsgUrl').value.trim(),
        pollInterval: Number($('#cfgPoll').value),
        token: $('#cfgToken').value.trim()
      });
      if (mode === 'live' && !Store.settings.convUrl) {
        UI.toast('Modo LIVE requiere al menos la URL de conversaciones');
      }
      Store.saveSettings(Store.settings);
      $('#settingsModal').hidden = true;
      UI.renderConnBadge();
      UI.toast('Ajustes guardados');
      await this.refreshData();
      this.startPolling();
    },

    // ---------- eventos ----------
    bindEvents() {
      // búsqueda
      $('#searchInput').addEventListener('input', e => { Store.search = e.target.value; UI.renderList(); });
      // tabs
      document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('tab--active'));
        t.classList.add('tab--active');
        Store.filter = t.dataset.filter;
        UI.renderList();
      }));
      // composer: autoexpandir
      const input = $('#msgInput');
      input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handleSend(); }
      });
      $('#btnSend').addEventListener('click', () => this.handleSend());
      // simular entrante
      $('#btnSimulate').addEventListener('click', () => {
        if (Store.settings.mode !== 'demo') { UI.toast('Solo disponible en modo DEMO'); return; }
        this.simulateIncoming();
      });
      // destacar
      $('#btnStar').addEventListener('click', () => {
        const c = Store.activeConversation(); if (!c) return;
        c.starred = !c.starred; UI.renderList(); UI.toast(c.starred ? 'Destacada' : 'Sin destacar');
      });
      // estado abierta/cerrada
      document.querySelectorAll('.pill').forEach(p => p.addEventListener('click', () => {
        const c = Store.activeConversation(); if (!c) return;
        c.status = p.dataset.status; UI.renderDetails(c);
      }));
      // plantillas
      $('#btnTemplate').addEventListener('click', () => { $('#templateModal').hidden = false; });
      // tema claro/oscuro
      $('#btnTheme').addEventListener('click', () => this.toggleTheme());
      // ajustes
      $('#btnSettings').addEventListener('click', () => this.openSettings());
      $('#btnSaveSettings').addEventListener('click', () => this.saveSettings());
      // cerrar modales
      document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
        $('#settingsModal').hidden = true; $('#templateModal').hidden = true;
      }));
      document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#settingsModal').hidden = true; $('#templateModal').hidden = true; } });
    },

    handleSend() {
      const input = $('#msgInput');
      const text = input.value;
      if (!text.trim()) return;
      input.value = ''; input.style.height = 'auto';
      this.send(text);
    }
  };

  global.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());
})(window);
