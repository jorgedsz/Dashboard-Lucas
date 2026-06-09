/* =========================================================
   data.js — Datos simulados (modo DEMO)
   Estructura idéntica a la que devolverá n8n en modo LIVE,
   para que el resto del código no cambie al conectar.
   ========================================================= */
(function (global) {
  'use strict';

  // Paleta para avatares según inicial
  const AVATAR_COLORS = ['#2f6df6', '#e2497a', '#1aa179', '#f59e0b', '#7c3aed', '#0ea5e9', '#ef4444', '#10b981'];

  function colorFor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  // Helper de fechas relativas a "ahora" (las marcas reales las pone n8n/Meta)
  const now = Date.now();
  const min = 60 * 1000, hour = 60 * min, day = 24 * hour;

  // ---------- PLANTILLAS (deben existir aprobadas en Meta) ----------
  const TEMPLATES = [
    { name: 'recordatorio_cita',   category: 'UTILITY',  body: 'Hola {{1}}, te recordamos tu cita el {{2}} a las {{3}}. Responde CONFIRMAR para confirmarla.' },
    { name: 'bienvenida',          category: 'MARKETING', body: '¡Hola {{1}}! Gracias por contactarnos. ¿En qué podemos ayudarte hoy?' },
    { name: 'seguimiento_pago',    category: 'UTILITY',  body: 'Hola {{1}}, tu pago de {{2}} está pendiente. Puedes completarlo aquí: {{3}}' },
    { name: 'reactivacion',        category: 'MARKETING', body: '¡Te extrañamos {{1}}! Tenemos una oferta especial para ti este mes.' }
  ];

  // ---------- CONVERSACIONES ----------
  const CONTACTS = [
    {
      name: 'María González', phone: '+52 55 1234 5678', email: 'maria.g@gmail.com', company: 'Boutique Aurora',
      tags: ['Cliente VIP', 'Ventas'], source: 'Anuncio Facebook', owner: 'Jorge D.',
      lastInbound: now - 4 * min,
      messages: [
        { dir: 'in',  text: 'Hola, vi su anuncio de los vestidos de verano 😍', at: now - 3 * hour },
        { dir: 'out', text: '¡Hola María! Gracias por escribirnos. Sí, tenemos la nueva colección disponible. ¿Buscas algún color en particular?', at: now - 3 * hour + 4 * min, status: 'read' },
        { dir: 'in',  text: 'Me gusta el azul rey, ¿tienen talla M?', at: now - 2 * hour },
        { dir: 'out', text: 'Sí, tenemos talla M en azul rey. Te mando una foto:', at: now - 2 * hour + 1 * min, status: 'read' },
        { dir: 'out', text: '', type: 'image', mediaUrl: 'https://picsum.photos/seed/vestido/320/220', mediaMime: 'image/jpeg', at: now - 2 * hour + 2 * min, status: 'read' },
        { dir: 'in',  text: '', type: 'audio', mediaUrl: 'https://www.w3schools.com/html/horse.mp3', mediaMime: 'audio/mpeg', at: now - 30 * min },
        { dir: 'out', text: 'Aquí tienes la cotización formal 👇', type: 'document', mediaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'cotizacion_vestido.pdf', mediaMime: 'application/pdf', at: now - 20 * min, status: 'delivered' },
        { dir: 'in',  text: 'Perfecto, ¿cómo hago el apartado?', at: now - 4 * min }
      ]
    },
    {
      name: 'Carlos Ramírez', phone: '+52 33 9876 5432', email: 'cramirez@outlook.com', company: 'Talleres CR',
      tags: ['Soporte'], source: 'Sitio web', owner: 'Jorge D.',
      lastInbound: now - 35 * min,
      messages: [
        { dir: 'in',  text: 'Buenos días, necesito reagendar mi cita de mañana', at: now - 50 * min },
        { dir: 'out', text: 'Claro Carlos, ¿para qué día te gustaría moverla?', at: now - 48 * min, status: 'delivered' },
        { dir: 'in',  text: 'Para el viernes si es posible', at: now - 35 * min }
      ]
    },
    {
      name: 'Ana Lucía Torres', phone: '+52 81 2468 1357', email: 'ana.torres@empresa.mx', company: 'Despacho Torres',
      tags: ['Cliente VIP', 'Legal'], source: 'Referido', owner: 'Sofía M.',
      lastInbound: now - 2 * hour,
      messages: [
        { dir: 'out', text: 'Hola Ana, te comparto el documento que solicitaste.', at: now - 5 * hour, status: 'read', type: 'template', template: 'seguimiento_pago' },
        { dir: 'in',  text: 'Muchas gracias, lo reviso y te confirmo', at: now - 2 * hour }
      ]
    },
    {
      name: 'Roberto Méndez', phone: '+52 55 3692 5814', email: 'rob.mendez@gmail.com', company: '',
      tags: ['Prospecto'], source: 'WhatsApp directo', owner: 'Jorge D.',
      lastInbound: now - 26 * hour,
      messages: [
        { dir: 'in',  text: '¿Tienen disponibilidad para el evento del sábado?', at: now - 27 * hour },
        { dir: 'out', text: 'Hola Roberto, déjame verificar la disponibilidad y te confirmo.', at: now - 26.5 * hour, status: 'read' },
        { dir: 'in',  text: 'Quedo atento, gracias', at: now - 26 * hour }
      ]
    },
    {
      name: 'Fernanda Ríos', phone: '+52 442 159 7530', email: 'fer.rios@hotmail.com', company: 'Estudio FR',
      tags: ['Marketing'], source: 'Instagram', owner: 'Sofía M.',
      lastInbound: now - 3 * day,
      messages: [
        { dir: 'in',  text: 'Hola! me interesa el paquete de fotografía', at: now - 3 * day - 20 * min },
        { dir: 'out', text: '¡Hola Fernanda! Con gusto te comparto los paquetes disponibles.', at: now - 3 * day, status: 'read' }
      ]
    }
  ];

  // Construye el dataset normalizado (conversaciones + mensajes)
  let cId = 1, mId = 1;
  const conversations = [];
  const messagesByConv = {};

  const CHAN_BY_NAME = { 'Ana Lucía Torres': 'instagram', 'Roberto Méndez': 'facebook', 'Fernanda Ríos': 'instagram' };

  CONTACTS.forEach(c => {
    const id = 'c' + (cId++);
    const channel = CHAN_BY_NAME[c.name] || 'whatsapp';
    const msgs = c.messages.map(m => ({
      id: 'm' + (mId++),
      conversationId: id,
      direction: m.dir,
      type: m.type || 'text',
      text: m.text,
      template: m.template || null,
      mediaUrl: m.mediaUrl || null,
      mediaMime: m.mediaMime || null,
      mediaFilename: m.filename || null,
      timestamp: m.at,
      status: m.dir === 'out' ? (m.status || 'sent') : 'received',
      channel: channel
    }));
    const last = msgs[msgs.length - 1];
    const unread = msgs.filter(m => m.direction === 'in' && m.timestamp > (now - 6 * hour)).length;

    conversations.push({
      id,
      name: c.name,
      phone: c.phone,
      avatar: { initials: initials(c.name), color: colorFor(c.name) },
      channel: channel,
      contactId: 'demo_' + id,
      lastMessage: last.text,
      lastMessageAt: last.timestamp,
      lastDirection: last.direction,
      lastStatus: last.status,
      unreadCount: last.direction === 'in' ? Math.max(1, unread) : 0,
      starred: c.tags.includes('Cliente VIP'),
      status: 'open',
      lastInbound: c.lastInbound,
      contact: {
        email: c.email, company: c.company, tags: c.tags,
        source: c.source, owner: c.owner
      }
    });
    messagesByConv[id] = msgs;
  });

  global.DemoData = { conversations, messagesByConv, templates: TEMPLATES, colorFor, initials };
})(window);
