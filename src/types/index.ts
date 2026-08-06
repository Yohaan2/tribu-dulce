export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'SUPERADMIN';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  // Estadísticas calculadas
  total_purchased?: number;
  debt_pending?: number;
}

export interface Product {
  id: string;
  name: string;
  price_usd: number;
  created_at: string;
}

export type SaleStatus = 'PAID' | 'PENDING' | 'PARTIAL';

export interface Sale {
  id: string;
  client_id: string;
  total_usd: number;
  total_bs: number;
  status: SaleStatus;
  created_by: string | null;
  created_at: string;
  // Relaciones opcionales para facilitar consultas
  client?: Client;
  items?: SaleItem[];
  payments?: Payment[];
  creator_profile?: UserProfile;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // Relaciones opcionales
  product?: Product;
}

export interface Payment {
  id: string;
  sale_id: string;
  amount_usd: number;
  amount_bs: number;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  rate: number;
  source: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  formatted_datetime: string;
}

export interface CreateAuditLogInput {
  user_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
}

// Interfaz para el Dashboard
export interface DashboardStats {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  pendingAmount: number; // Suma de lo que falta por pagar en ventas PENDING/PARTIAL
  topClients: Array<{
    client_id: string;
    client_name: string;
    total_spent: number;
    sales_count: number;
  }>;
  weeklyChartData: Array<{
    day: string;
    amount: number;
  }>;
}
