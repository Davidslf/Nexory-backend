/**
 * Datos mock para el backend - sin base de datos.
 * Misma estructura que el frontend para compatibilidad.
 */
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'operator';

export interface UserMock {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  avatar?: string;
}

export interface ClientMock {
  id: string;
  name: string;
  documentId: string;
  plan: string;
  planSpeed: number;
  status: 'active' | 'suspended' | 'pending';
  paymentDueDate: string;
  amount: number;
  createdAt: string;
  lastConnection?: string;
  bandwidthUsage?: number;
  latency?: number;
  uptime?: number;
  location?: string;
  tags?: string[];
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  installationDate?: string;
  contractNumber?: string;
  notes?: string;
}

const getDueDate = (daysFromNow: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

// Usuarios con password hasheado (admin123, operator123)
const ADMIN_HASH = bcrypt.hashSync('admin123', 10);
const OPERATOR_HASH = bcrypt.hashSync('operator123', 10);

export const mockUsers: UserMock[] = [
  { id: '1', email: 'admin@nexory.com', name: 'Administrador', password_hash: ADMIN_HASH, role: 'admin' },
  { id: '2', email: 'operator@nexory.com', name: 'Operador', password_hash: OPERATOR_HASH, role: 'operator' },
];

export const mockClients: ClientMock[] = [
  { id: '1', name: 'Juan Pérez', documentId: '12345678-9', plan: 'Fibra 200MB', planSpeed: 200, status: 'active', paymentDueDate: getDueDate(8), amount: 45000, createdAt: '2024-01-15', lastConnection: '2024-03-25T10:30:00', tags: ['VIP', 'Residencial'], phone: '+57 300 123 4567', email: 'juan.perez@email.com', address: 'Calle 123 #45-67', city: 'Bogotá', installationDate: '2024-01-15', contractNumber: 'CT-2024-001' },
  { id: '2', name: 'María González', documentId: '98765432-1', plan: 'Fibra 500MB', planSpeed: 500, status: 'active', paymentDueDate: getDueDate(2), amount: 75000, createdAt: '2024-02-20', lastConnection: '2024-03-25T09:15:00', tags: ['Empresarial', 'Prioritario'], phone: '+57 310 987 6543', email: 'maria.gonzalez@empresa.com', address: 'Avenida Principal #89-12', city: 'Medellín', installationDate: '2024-02-20', contractNumber: 'CT-2024-045' },
  { id: '3', name: 'Carlos Rodríguez', documentId: '11223344-5', plan: 'Fibra 100MB', planSpeed: 100, status: 'suspended', paymentDueDate: getDueDate(-5), amount: 35000, createdAt: '2024-01-10', lastConnection: '2024-03-20T14:20:00', tags: ['Residencial'], phone: '+57 315 234 5678', email: 'carlos.rodriguez@email.com', address: 'Carrera 56 #12-34', city: 'Cali', installationDate: '2024-01-10', contractNumber: 'CT-2024-012' },
  { id: '4', name: 'Ana Martínez', documentId: '55667788-9', plan: 'Fibra 200MB', planSpeed: 200, status: 'active', paymentDueDate: getDueDate(12), amount: 45000, createdAt: '2024-03-05', tags: ['Residencial'], phone: '+57 320 456 7890', email: 'ana.martinez@email.com', address: 'Transversal 78 #23-45', city: 'Barranquilla' },
  { id: '5', name: 'Luis Fernández', documentId: '22334455-6', plan: 'Fibra 1GB', planSpeed: 1000, status: 'active', paymentDueDate: getDueDate(1), amount: 95000, createdAt: '2024-02-28', tags: ['VIP', 'Empresarial'], phone: '+57 301 567 8901', email: 'luis.fernandez@empresa.com', address: 'Calle 100 #50-30', city: 'Bogotá' },
  { id: '6', name: 'Sofía López', documentId: '33445566-7', plan: 'Fibra 100MB', planSpeed: 100, status: 'suspended', paymentDueDate: getDueDate(-10), amount: 35000, createdAt: '2024-01-22', tags: ['Residencial'], phone: '+57 312 345 6789', address: 'Diagonal 34 #56-78', city: 'Pereira' },
  { id: '7', name: 'Diego Sánchez', documentId: '44556677-8', plan: 'Fibra 200MB', planSpeed: 200, status: 'active', paymentDueDate: getDueDate(15), amount: 45000, createdAt: '2024-03-12', tags: ['Residencial'], phone: '+57 313 456 7890', address: 'Calle 45 #67-89', city: 'Bucaramanga' },
  { id: '8', name: 'Laura Torres', documentId: '66778899-0', plan: 'Fibra 500MB', planSpeed: 500, status: 'active', paymentDueDate: getDueDate(3), amount: 75000, createdAt: '2024-02-15', tags: ['Empresarial'], phone: '+57 314 567 8901', address: 'Avenida 68 #12-45', city: 'Bogotá' },
  { id: '9', name: 'Roberto Díaz', documentId: '77889900-1', plan: 'Fibra 100MB', planSpeed: 100, status: 'suspended', paymentDueDate: getDueDate(-2), amount: 35000, createdAt: '2024-01-30', tags: ['Residencial'], phone: '+57 315 678 9012', address: 'Carrera 23 #45-67', city: 'Manizales' },
  { id: '10', name: 'Carmen Ruiz', documentId: '88990011-2', plan: 'Fibra 200MB', planSpeed: 200, status: 'active', paymentDueDate: getDueDate(5), amount: 45000, createdAt: '2024-03-01', tags: ['Residencial'], phone: '+57 316 789 0123', address: 'Calle 12 #34-56', city: 'Cartagena' },
];

export const mockRouters = [
  { id: 'r1', name: 'Router-Norte-01', ip: '192.168.1.1', status: 'online' as const, location: 'Sector Norte', model: 'MikroTik RB4011', firmware: '7.12', uptime: 99.9, cpuUsage: 25, memoryUsage: 45, bandwidthIn: 850, bandwidthOut: 420, connectedClients: 45, lastSeen: new Date().toISOString() },
  { id: 'r2', name: 'Router-Centro-01', ip: '192.168.1.2', status: 'online' as const, location: 'Sector Centro', model: 'MikroTik RB4011', firmware: '7.12', uptime: 99.5, cpuUsage: 42, memoryUsage: 58, bandwidthIn: 1200, bandwidthOut: 600, connectedClients: 78, lastSeen: new Date().toISOString() },
  { id: 'r3', name: 'Router-Sur-01', ip: '192.168.1.3', status: 'online' as const, location: 'Sector Sur', model: 'MikroTik RB3011', firmware: '7.11', uptime: 98.8, cpuUsage: 38, memoryUsage: 52, bandwidthIn: 650, bandwidthOut: 320, connectedClients: 32, lastSeen: new Date().toISOString() },
  { id: 'r4', name: 'Router-Este-01', ip: '192.168.1.4', status: 'offline' as const, location: 'Sector Este', model: 'MikroTik RB3011', firmware: '7.11', uptime: 0, cpuUsage: 0, memoryUsage: 0, bandwidthIn: 0, bandwidthOut: 0, connectedClients: 0, lastSeen: '2024-03-24T08:00:00' },
  { id: 'r5', name: 'Router-Oeste-01', ip: '192.168.1.5', status: 'maintenance' as const, location: 'Sector Oeste', model: 'MikroTik RB4011', firmware: '7.12', uptime: 99.2, cpuUsage: 0, memoryUsage: 0, bandwidthIn: 0, bandwidthOut: 0, connectedClients: 0, lastSeen: '2024-03-25T06:00:00' },
];

export const mockActivities = [
  { id: 'a1', type: 'client_suspended' as const, description: 'Cliente Carlos Rodríguez suspendido por falta de pago', clientName: 'Carlos Rodríguez', severity: 'warning' as const, timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 'a2', type: 'payment_received' as const, description: 'Pago recibido de Juan Pérez', clientName: 'Juan Pérez', severity: 'success' as const, timestamp: new Date(Date.now() - 43200000).toISOString() },
  { id: 'a3', type: 'router_offline' as const, description: 'Router Router-Este-01 desconectado', severity: 'error' as const, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a4', type: 'plan_upgraded' as const, description: 'María González actualizó a Fibra 500MB', clientName: 'María González', severity: 'info' as const, timestamp: new Date().toISOString() },
];

export const mockBillingData = [
  { id: 'b1', month: '2024-01', revenue: 125000, clients: 10, averageRevenuePerUser: 12500 },
  { id: 'b2', month: '2024-02', revenue: 132000, clients: 10, averageRevenuePerUser: 13200 },
  { id: 'b3', month: '2024-03', revenue: 128000, clients: 10, averageRevenuePerUser: 12800 },
];

const getDateStr = (daysAgo: number, hoursAgo = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};

export const mockTechnicalSupports = [
  { id: 'ts1', clientId: '1', clientName: 'Juan Pérez', clientDocumentId: '12345678-9', clientAddress: 'Calle 123 #45-67, Bogotá', clientPlan: 'Fibra 200MB', clientPhone: '+57 300 123 4567', clientEmail: 'juan.perez@email.com', type: 'failure' as const, isNewClient: false, status: 'pending' as const, reportedIssue: 'Intermitencia en la conexión.', reportedAt: getDateStr(0, 3), priority: 'high' as const, createdAt: getDateStr(0, 3), updatedAt: getDateStr(0, 3) },
  { id: 'ts2', clientId: '2', clientName: 'María González', clientDocumentId: '98765432-1', clientAddress: 'Avenida Principal #89-12, Medellín', clientPlan: 'Fibra 500MB', type: 'installation' as const, isNewClient: true, status: 'in_progress' as const, reportedIssue: 'Nueva instalación solicitada.', reportedAt: getDateStr(1, 5), assignedToName: 'Carlos Méndez', priority: 'high' as const, createdAt: getDateStr(1, 5), updatedAt: getDateStr(0, 2) },
  { id: 'ts3', clientId: '3', clientName: 'Carlos Rodríguez', clientDocumentId: '11223344-5', clientAddress: 'Carrera 56 #12-34, Cali', clientPlan: 'Fibra 100MB', type: 'failure' as const, isNewClient: false, status: 'reviewed' as const, reportedIssue: 'Sin conexión desde ayer.', reportedAt: getDateStr(1, 8), assignedToName: 'Ana López', priority: 'urgent' as const, createdAt: getDateStr(1, 8), updatedAt: getDateStr(0, 4), notes: 'Visita programada.' },
];

export const mockNotifications = [
  { id: 'n1', userId: '1', type: 'support_urgent' as const, title: 'Nuevo soporte urgente', message: 'Carlos Rodríguez reportó falla crítica', read: false, link: '/support', severity: 'error' as const, createdAt: getDateStr(0, 0.5) },
  { id: 'n2', userId: '1', type: 'support_new' as const, title: 'Nueva instalación', message: 'María González solicitó instalación empresarial', read: false, link: '/support', severity: 'info' as const, createdAt: getDateStr(2, 2) },
  { id: 'n3', userId: '1', type: 'client_suspended' as const, title: 'Cliente suspendido', message: 'Carlos Rodríguez suspendido por falta de pago', read: true, link: '/clients', severity: 'warning' as const, createdAt: getDateStr(5, 0) },
];

// In-memory stores (mutables para simular cambios)
let clientsStore = [...mockClients];
let routersStore = [...mockRouters];
let supportsStore = [...mockTechnicalSupports];
let notificationsStore = [...mockNotifications];

export const mockData = {
  getUsers: () => mockUsers,
  getUserByEmail: (email: string) => mockUsers.find(u => u.email === email),
  getClients: () => clientsStore,
  setClients: (c: ClientMock[]) => { clientsStore = c; },
  getRouters: () => routersStore,
  setRouters: (r: typeof mockRouters) => { routersStore = r; },
  getSupports: () => supportsStore,
  setSupports: (s: typeof supportsStore) => { supportsStore = s; },
  getNotifications: (userId: string) => notificationsStore.filter(n => n.userId === userId),
  setNotifications: (n: typeof notificationsStore) => { notificationsStore = n; },
};
