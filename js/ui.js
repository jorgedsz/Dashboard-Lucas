/* =========================================================
   ui.js — Renderizado del DOM
   ========================================================= */
(function (global) {
  'use strict';

  const $ = sel => document.querySelector(sel);

  // ---------- canales (plataformas) ----------
  const CHANNELS = {
    whatsapp: {
      label: 'WhatsApp', color: '#25d366', bg: '#25d366',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>'
    },
    instagram: {
      label: 'Instagram', color: '#e1306c',
      bg: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 70%, #285AEB 100%)',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.4 6.4 0 1018.4 12 6.4 6.4 0 0012 5.4zm0 2.2A4.2 4.2 0 117.8 12 4.2 4.2 0 0112 7.6zm6.6-2.3a1.5 1.5 0 10-1.5 1.5 1.5 1.5 0 001.5-1.5z"/></svg>'
    },
    facebook: {
      label: 'Facebook', color: '#0084ff', bg: '#0084ff',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.3 2 2 6.2 2 11.6c0 2.9 1.3 5.4 3.4 7.1V22l3.1-1.7c.8.2 1.7.3 2.5.3 5.7 0 10-4.2 10-9.6S17.7 2 12 2zm1 12.9-2.6-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.3 5.7z"/></svg>'
    }
  };
  const chMeta = ch => CHANNELS[ch] || CHANNELS.whatsapp;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- helpers de fecha ----------
  function timeShort(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }
  function relList(ts) {
    const d = new Date(ts), now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return Math.floor(diff / 60) + ' min';
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return timeShort(ts);
    const yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  }
  function dateLabel(ts) {
    const d = new Date(ts), now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Hoy';
    const yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // ticks de estado de mensaje
  const TICK = {
    sent:      '<svg viewBox="0 0 16 11"><path d="M11.07.65 5.4 6.32 3.5 4.43l-.7.7 2.6 2.6L11.77 1.35z" fill="currentColor"/></svg>',
    delivered: '<svg viewBox="0 0 16 11"><path d="M11.07.65 5.4 6.32 3.5 4.43l-.7.7 2.6 2.6L11.77 1.35zM15 .65 9.33 6.32l-.92-.92-.7.7 1.62 1.62L15.7 1.35z" fill="currentColor"/></svg>',
    read:      '<svg viewBox="0 0 16 11"><path d="M11.07.65 5.4 6.32 3.5 4.43l-.7.7 2.6 2.6L11.77 1.35zM15 .65 9.33 6.32l-.92-.92-.7.7 1.62 1.62L15.7 1.35z" fill="currentColor"/></svg>',
    failed:    '<svg viewBox="0 0 16 16"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.8 10.5H7.2V10h1.6v1.5zm0-2.7H7.2V4.5h1.6v4.3z" fill="currentColor"/></svg>'
  };

  // icono genérico de documento (para adjuntos no reproducibles)
  const DOC_ICON = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 2 4 4h-4V4zM8 13h8v1.5H8V13zm0 3h8v1.5H8V16zm0-6h4v1.5H8V10z" fill="currentColor"/></svg>';

  const UI = {
    // ---------- badge de conexión ----------
    renderConnBadge() {
      const b = $('#connBadge');
      const mode = Store.settings.mode;
      b.className = 'conn conn--' + (mode === 'live' ? 'live' : 'demo');
      b.textContent = mode === 'live' ? 'LIVE' : 'DEMO';
    },

    // ---------- lista de conversaciones ----------
    renderList() {
      const box = $('#convList');
      const list = Store.visibleConversations();
      box.innerHTML = '';
      if (!list.length) {
        box.appendChild(el('div', 'list__body-empty', '<p style="padding:30px;text-align:center;color:#9aa3b2">Sin conversaciones</p>'));
        return;
      }
      list.forEach(c => {
        const active = c.id === Store.activeId;
        const cm = chMeta(c.channel);
        const node = el('div', 'conv' + (active ? ' conv--active' : '') + (c.unreadCount > 0 ? ' conv--unread' : ''));
        const tick = c.lastDirection === 'out' ? `<span class="tick ${c.lastStatus === 'read' ? 'read' : ''}">${TICK[c.lastStatus] || TICK.sent}</span> ` : '';
        node.innerHTML = `
          <div class="conv__avatar">
            <div class="avatar" style="background:${c.avatar.color}">${esc(c.avatar.initials)}</div>
            <span class="conv__chan" style="background:${cm.bg}">${cm.icon}</span>
          </div>
          <div class="conv__main">
            <div class="conv__top">
              <span class="conv__name">${esc(c.name)}</span>
              <span class="conv__time">${relList(c.lastMessageAt)}</span>
            </div>
            <div class="conv__bottom">
              <span class="conv__preview">${tick}${esc(c.lastMessage)}</span>
              ${c.unreadCount > 0 ? `<span class="conv__badge">${c.unreadCount}</span>` : ''}
            </div>
          </div>`;
        node.addEventListener('click', () => global.App.openConversation(c.id));
        box.appendChild(node);
      });
    },

    // ---------- hilo de mensajes ----------
    renderThread() {
      const conv = Store.activeConversation();
      const empty = $('#threadEmpty'), inner = $('#threadInner'), details = $('#details');
      if (!conv) { empty.hidden = false; inner.hidden = true; details.hidden = true; return; }
      empty.hidden = true; inner.hidden = false; details.hidden = false;

      // cabecera
      $('#threadAvatar').textContent = conv.avatar.initials;
      $('#threadAvatar').style.background = conv.avatar.color;
      $('#threadName').textContent = conv.name;
      $('#threadPhone').textContent = conv.phone || (conv.contactId ? 'ID ' + conv.contactId : '');
      const hcm = chMeta(conv.channel);
      const chanEl = $('#threadChan');
      if (chanEl) { chanEl.innerHTML = hcm.icon + ' ' + hcm.label; chanEl.style.color = hcm.color; }

      // mensajes con separadores de fecha
      const box = $('#messages');
      box.innerHTML = '';
      let lastDay = null;
      Store.activeMessages().forEach(m => {
        const day = new Date(m.timestamp).toDateString();
        if (day !== lastDay) {
          box.appendChild(el('div', 'date-sep', dateLabel(m.timestamp)));
          lastDay = day;
        }
        box.appendChild(this.messageNode(m));
      });
      box.scrollTop = box.scrollHeight;

      // aviso ventana 24h (solo si el último entrante fue hace +24h)
      const outOfWindow = conv.lastInbound && (Date.now() - conv.lastInbound) > 24 * 3600 * 1000;
      $('#windowWarn').hidden = !outOfWindow;

      this.renderDetails(conv);
    },

    // Renderiza el adjunto según su tipo (imagen, audio, video, documento)
    mediaNode(m) {
      const url = m.mediaUrl;
      if (!url) return '';
      const u = esc(url);
      const mime = (m.mediaMime || '').toLowerCase();
      const type = m.type === 'sticker' ? 'image' : m.type;
      if (type === 'image' || mime.startsWith('image/')) {
        return `<div class="msg__media"><a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="" loading="lazy"></a></div>`;
      }
      if (type === 'audio' || mime.startsWith('audio/')) {
        return `<div class="msg__media msg__media--audio"><audio controls preload="none" src="${u}"></audio></div>`;
      }
      if (type === 'video' || mime.startsWith('video/')) {
        return `<div class="msg__media"><video controls preload="metadata" src="${u}"></video></div>`;
      }
      // documento / fallback genérico
      const name = esc(m.mediaFilename || 'Documento');
      return `<a class="msg__doc" href="${u}" target="_blank" rel="noopener" download>${DOC_ICON}<span class="msg__doc-name">${name}</span></a>`;
    },

    messageNode(m) {
      const out = m.direction === 'out';
      const cm = chMeta(m.channel);
      const hasMedia = !!m.mediaUrl;
      const node = el('div', 'msg ' + (out ? 'msg--out' : 'msg--in') + (m.type === 'template' ? ' msg--template' : '') + (hasMedia ? ' msg--media' : '') + (m.status === 'failed' ? ' msg--failed' : ''));
      let inner = '';
      if (m.type === 'template') inner += `<div class="msg__tplflag">Plantilla · ${esc(m.template || '')}</div>`;
      if (hasMedia) inner += this.mediaNode(m);
      if (m.text) inner += `<div class="msg__text">${esc(m.text)}</div>`;
      inner += `<div class="msg__meta"><span class="msg__chan" style="color:${cm.color}" title="${cm.label}">${cm.icon}</span><span class="msg__time">${timeShort(m.timestamp)}</span>`;
      if (out) inner += `<span class="msg__tick ${m.status === 'read' ? 'read' : ''}">${TICK[m.status] || TICK.sent}</span>`;
      inner += `</div>`;
      node.innerHTML = inner;
      return node;
    },

    // ---------- panel de detalles ----------
    renderDetails(conv) {
      $('#detAvatar').textContent = conv.avatar.initials;
      $('#detAvatar').style.background = conv.avatar.color;
      $('#detName').textContent = conv.name;
      $('#detPhone').textContent = conv.phone;
      $('#detTel').href = 'tel:' + conv.phone.replace(/\s/g, '');
      $('#detMail').href = 'mailto:' + (conv.contact.email || '');

      const tags = $('#detTags');
      tags.innerHTML = conv.contact.tags.length
        ? conv.contact.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')
        : '<span style="color:#9aa3b2;font-size:13px">Sin etiquetas</span>';

      const fields = [
        ['Teléfono', conv.phone],
        ['Email', conv.contact.email || '—'],
        ['Empresa', conv.contact.company || '—'],
        ['Origen', conv.contact.source || '—'],
        ['Propietario', conv.contact.owner || '—']
      ];
      $('#detFields').innerHTML = fields.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');

      document.querySelectorAll('.pill').forEach(p => p.classList.toggle('pill--active', p.dataset.status === conv.status));
    },

    // ---------- plantillas ----------
    renderTemplates() {
      const box = $('#templateList');
      box.innerHTML = '';
      Store.templates.forEach(t => {
        const node = el('div', 'tpl');
        node.innerHTML = `<div class="tpl__name">${esc(t.name)} <span class="tpl__cat">${esc(t.category)}</span></div><div class="tpl__body">${esc(t.body)}</div>`;
        node.addEventListener('click', () => global.App.useTemplate(t));
        box.appendChild(node);
      });
    },

    toast(msg) {
      const t = $('#toast');
      t.textContent = msg;
      t.hidden = false;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
    },

    scrollMessages() {
      const box = $('#messages');
      box.scrollTop = box.scrollHeight;
    }
  };

  global.UI = UI;
})(window);
