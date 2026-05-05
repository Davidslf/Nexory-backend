/**
 * In-memory mock store — all data lives here, no MongoDB needed.
 * Controllers import and mutate these arrays directly.
 */

export const newId = () => Math.random().toString(36).slice(2, 10);

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

// ─── Users ──────────────────────────────────────────────────────────
export const users = [
  { _id: 'user001', name: 'Administrador', email: 'admin@nexory.com',    password: 'admin123',    role: 'admin',    active: true },
  { _id: 'user002', name: 'Operador',       email: 'operator@nexory.com', password: 'operator123', role: 'operator', active: true },
];

// ─── Clients ────────────────────────────────────────────────────────
export const clients: any[] = [
  {
    _id: 'cli001',
    name: 'Angie Vanesa Sanchez Cañaveral',
    email: 'angie.sanchez@gmail.com',
    phone: '573003198321',
    address: 'Cra 7 #15-22, Zipaquirá, Cundinamarca',
    plan: 'Plan 50 Mbps',
    monthlyFee: 95000,
    status: 'active',
    paymentStatus: 'paid',
    identification: '1000641109',
    mikrotik: { routerIp: '192.168.1.1', username: 'asanchez', profile: 'plan-50mbps' },
    tags: ['residencial'],
    createdAt: daysAgo(90),
  },
  {
    _id: 'cli002',
    name: 'David Stiven Lujan Foronda',
    email: 'david.lujan@gmail.com',
    phone: '573126226684',
    address: 'Cl 12 #8-45, Zipaquirá, Cundinamarca',
    plan: 'Plan 100 Mbps',
    monthlyFee: 150000,
    status: 'active',
    paymentStatus: 'overdue',
    identification: '1001250342',
    mikrotik: { routerIp: '192.168.1.2', username: 'dlujan', profile: 'plan-100mbps' },
    tags: ['residencial'],
    createdAt: daysAgo(120),
  },
];

// ─── Support Tickets ─────────────────────────────────────────────────
export const tickets: any[] = [
  {
    _id: 'tkt001', title: 'Sin conexión a internet', description: 'El cliente reporta que no tiene acceso desde esta mañana.',
    clientId: 'cli002', clientName: 'David Stiven Lujan Foronda',
    status: 'open', priority: 'high', type: 'connectivity',
    diagnostics: { signal: -65, latency: 120, packetLoss: 45 },
    notes: [], createdAt: daysAgo(1),
  },
  {
    _id: 'tkt002', title: 'Velocidad lenta en horas pico', description: 'Baja velocidad entre 6pm y 9pm.',
    clientId: 'cli001', clientName: 'Angie Vanesa Sanchez Cañaveral',
    status: 'in_progress', priority: 'medium', type: 'performance',
    diagnostics: { signal: -55, latency: 38, packetLoss: 2 },
    notes: [{ text: 'Se revisó configuración del router. Posible saturación de nodo.', createdAt: daysAgo(0.5) }],
    createdAt: daysAgo(3),
  },
  {
    _id: 'tkt003', title: 'Solicitud de aumento de plan', description: 'El cliente solicita cambio de Plan 50 a Plan 100 Mbps.',
    clientId: 'cli001', clientName: 'Angie Vanesa Sanchez Cañaveral',
    status: 'open', priority: 'low', type: 'plan_change',
    diagnostics: null, notes: [], createdAt: daysAgo(5),
  },
];

// ─── Cut Logs ────────────────────────────────────────────────────────
export const cutLogs: any[] = [
  {
    _id: 'cut001', clientId: 'cli002', clientName: 'David Stiven Lujan Foronda',
    routerId: 'router01', routerName: 'Router Principal Zipaquirá',
    action: 'attempted', reason: 'Corte automático día 15 — deuda vencida',
    error: 'No se pudo conectar al router (timeout)',
    year: 2026, month: 3, createdAt: daysAgo(7),
  },
  {
    _id: 'cut002', clientId: 'cli002', clientName: 'David Stiven Lujan Foronda',
    routerId: 'router01', routerName: 'Router Principal Zipaquirá',
    action: 'suspended', reason: 'Corte automático día 15',
    year: 2026, month: 2, createdAt: daysAgo(37),
  },
  {
    _id: 'cut003', clientId: 'cli002', clientName: 'David Stiven Lujan Foronda',
    routerId: 'router01', routerName: 'Router Principal Zipaquirá',
    action: 'reconnected', reason: 'Pago recibido — reconexión manual',
    year: 2026, month: 2, createdAt: daysAgo(30),
  },
];

// ─── Communications ──────────────────────────────────────────────────
export const communications: any[] = [
  {
    _id: 'com001', title: 'Recordatorio de pago — Abril 2026',
    body: 'Hola {nombre} 👋\n\nLe recordamos amablemente que tiene un saldo pendiente de *$150.000* con su servicio de internet Nexory.\n\n📅 *Fecha límite:* 10 de abril\n\nPara evitar interrupciones en su servicio, le pedimos realizar el pago antes de la fecha indicada. 🙏\n\n¡Gracias por confiar en nosotros!\n*Equipo Nexory* 🌐',
    type: 'payment_reminder', status: 'sent',
    channels: ['whatsapp'], targetAll: true, targetTags: [],
    delivery: [
      { clientId: 'cli001', status: 'sent' },
      { clientId: 'cli002', status: 'sent' },
    ],
    sentAt: daysAgo(5), createdAt: daysAgo(6),
  },
  {
    _id: 'com002', title: 'Mantenimiento programado — 20 de Abril',
    body: 'Hola {nombre} 👋\n\nLe informamos que realizaremos un *mantenimiento programado* en su zona de servicio.\n\n🔧 *Motivo:* Cambio de fibra óptica en el sector\n🕐 *Inicio:* Domingo 20 de abril a las 2:00 a.m.\n⏱️ *Duración estimada:* 2 a 3 horas\n\nDurante este tiempo, es posible que experimente interrupciones momentáneas. Trabajamos para minimizar el impacto. 🛠️\n\nLe pedimos disculpas por los inconvenientes. 🙏\n*Equipo Nexory* 🌐',
    type: 'maintenance_alert', status: 'draft',
    channels: ['whatsapp'], targetAll: true, targetTags: [],
    delivery: [], sentAt: null, createdAt: daysAgo(2),
  },
];

// ─── Tasks ───────────────────────────────────────────────────────────
export const tasks: any[] = [
  {
    _id: 'task001', type: 'suspend_client', priority: 'urgent',
    title: 'Suspender por mora — David Lujan',
    description: 'Deuda vencida hace 15 días. Sin respuesta a comunicados enviados.',
    clientId: 'cli002', clientName: 'David Stiven Lujan Foronda',
    dueDate: new Date().toISOString(), completed: false, completedAt: null,
    createdAt: daysAgo(1),
  },
  {
    _id: 'task002', type: 'assign_ticket', priority: 'high',
    title: 'Asignar técnico — Sin conexión David Lujan',
    description: 'Ticket tkt001 sin técnico asignado hace 24h. Cliente esperando.',
    ticketId: 'tkt001', clientId: 'cli002', clientName: 'David Stiven Lujan Foronda',
    dueDate: new Date().toISOString(), completed: false, completedAt: null,
    createdAt: daysAgo(1),
  },
  {
    _id: 'task003', type: 'review_message', priority: 'normal',
    title: 'Revisar respuesta de comunicado — Angie Sanchez',
    description: 'El cliente respondió al comunicado de pago. Requiere acción.',
    clientId: 'cli001', clientName: 'Angie Vanesa Sanchez Cañaveral',
    dueDate: new Date(Date.now() + 86400000).toISOString(), completed: false, completedAt: null,
    createdAt: daysAgo(2),
  },
  {
    _id: 'task004', type: 'follow_up', priority: 'normal',
    title: 'Seguimiento velocidad — Angie Sanchez',
    description: 'Ticket de velocidad lenta en revisión. Confirmar mejoría después de ajuste de nodo.',
    clientId: 'cli001', clientName: 'Angie Vanesa Sanchez Cañaveral',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), completed: false, completedAt: null,
    createdAt: daysAgo(3),
  },
];

// ─── Network Health ───────────────────────────────────────────────────
export const networkHealth: any = {
  status: 'yellow',
  latencyAvg: 28,
  packetLoss: 1.8,
  routersOnline: 3,
  routersTotal: 4,
  lastChecked: new Date().toISOString(),
  issues: [
    { id: 'nh1', description: 'Router Sector Norte con latencia elevada (82ms)', severity: 'warning' },
  ],
};

// ─── Anomalies ────────────────────────────────────────────────────────
export const anomalies: any[] = [
  {
    _id: 'anom001', type: 'bandwidth_spike',
    title: 'Pico de consumo inusual — David Lujan',
    description: 'Consumo 340% sobre la línea base detectado en las últimas 2 horas.',
    clientId: 'cli002', clientName: 'David Stiven Lujan Foronda', severity: 'warning',
    detectedAt: new Date(Date.now() - 2 * 3600000).toISOString(), resolved: false,
  },
  {
    _id: 'anom002', type: 'repeated_disconnects',
    title: 'Desconexiones repetidas — Router Sector Norte',
    description: '14 reconexiones en 1 hora. Posible falla en enlace upstream.',
    routerId: 'router02', severity: 'error',
    detectedAt: new Date(Date.now() - 3600000).toISOString(), resolved: false,
  },
];

// ─── Notifications ───────────────────────────────────────────────────
export const notifications: any[] = [
  {
    _id: 'notif001', userId: null, title: 'Corte mensual ejecutado',
    message: 'David Lujan: corte intentado con error de conexión al router.',
    type: 'cut_summary', read: false, createdAt: daysAgo(7),
  },
  {
    _id: 'notif002', userId: null, title: 'Nuevo ticket de soporte',
    message: 'David Lujan reportó: Sin conexión a internet.',
    type: 'new_ticket', read: false, createdAt: daysAgo(1),
  },
  {
    _id: 'notif003', userId: null, title: 'Comunicado enviado',
    message: 'Recordatorio de pago enviado a 2 clientes (2 entregados).',
    type: 'communication_sent', read: true, createdAt: daysAgo(6),
  },
];
