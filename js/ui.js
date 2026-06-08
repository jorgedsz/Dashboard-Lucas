/* =========================================================
   ui.js — Renderizado del DOM
   ========================================================= */
(function (global) {
  'use strict';

  const $ = sel => document.querySelector(sel);
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
        const node = el('div', 'conv' + (active ? ' conv--active' : '') + (c.unreadCount > 0 ? ' conv--unread' : ''));
        const tick = c.lastDirection === 'out' ? `<span class="tick ${c.lastStatus === 'read' ? 'read' : ''}">${TICK[c.lastStatus] || TICK.sent}</span> ` : '';
        node.innerHTML = `
          <div class="conv__avatar">
            <div class="avatar" style="background:${c.avatar.color}">${esc(c.avatar.initials)}</div>
            <span class="conv__chan"><svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg></span>
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
      $('#threadPhone').textContent = conv.phone;

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

    messageNode(m) {
      const out = m.direction === 'out';
      const node = el('div', 'msg ' + (out ? 'msg--out' : 'msg--in') + (m.type === 'template' ? ' msg--template' : '') + (m.status === 'failed' ? ' msg--failed' : ''));
      let inner = '';
      if (m.type === 'template') inner += `<div class="msg__tplflag">Plantilla · ${esc(m.template || '')}</div>`;
      if (m.mediaUrl) inner += `<div class="msg__media"><img src="${esc(m.mediaUrl)}" alt=""></div>`;
      inner += `<div class="msg__text">${esc(m.text)}</div>`;
      inner += `<div class="msg__meta"><span class="msg__time">${timeShort(m.timestamp)}</span>`;
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
