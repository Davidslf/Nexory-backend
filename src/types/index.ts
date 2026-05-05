// User Types
export type UserRole = 'admin' | 'operator';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  role: UserRole;
  avatar?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Client Types
export interface Client {
  id: string;
  name: string;
  document_id: string;
  plan: string;
  plan_speed: number;
  status: 'active' | 'suspended' | 'pending';
  payment_due_date: Date | string;
  amount: number;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  location?: string;
  installation_date?: Date | string;
  contract_number?: string;
  notes?: string;
  last_connection?: Date | string;
  created_at?: Date;
  updated_at?: Date;
  tags?: string[];
}

// Router Types
export interface Router {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'maintenance';
  location: string;
  model?: string;
  firmware?: string;
  uptime: number;
  cpu_usage: number;
  memory_usage: number;
  bandwidth_in: number;
  bandwidth_out: number;
  connected_clients: number;
  last_seen?: Date | string;
  created_at?: Date;
  updated_at?: Date;
}

// Technical Support Types
export interface TechnicalSupport {
  id: string;
  client_id: string;
  type: 'installation' | 'failure' | 'removal';
  is_new_client: boolean;
  status: 'pending' | 'in_progress' | 'reviewed' | 'resolved' | 'cancelled';
  reported_issue?: string;
  reported_at: Date | string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  resolved_at?: Date | string;
  created_at?: Date;
  updated_at?: Date;
  // Joined data
  client_name?: string;
  client_document_id?: string;
  client_address?: string;
  client_plan?: string;
  client_phone?: string;
  client_email?: string;
  assigned_to_name?: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'support_new' | 'support_urgent' | 'client_suspended' | 'router_offline' | 'payment_due' | 'system_alert';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  created_at?: Date;
}

// Activity Types
export interface Activity {
  id: string;
  type: 'client_suspended' | 'client_reactivated' | 'router_offline' | 'router_online' | 'payment_received' | 'plan_upgraded' | 'alert';
  description: string;
  client_name?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  created_at?: Date;
}

// Dashboard Stats Types
export interface DashboardStats {
  total_clients: number;
  online_clients: number;
  suspended_clients: number;
  monthly_revenue: number;
  average_latency: number;
  network_uptime: number;
  total_bandwidth: number;
  active_routers: number;
  total_routers: number;
  revenue_growth: number;
  client_growth: number;
}

// Billing Data Types
export interface BillingData {
  id: string;
  month: string;
  revenue: number;
  clients: number;
  average_revenue_per_user: number;
  created_at?: Date;
}

// Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
