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

// --- PREVISIONES ---
export type PredictionStatus = 'ACTIVE' | 'ARCHIVED';

export interface PredictionItem {
  id: string;
  prediction_id: string;
  product_id: string;
  estimated_quantity: number;
  total_cost: number;
  unit_cost: number;
  created_at: string;
  product?: Product;
}

export interface Prediction {
  id: string;
  status: PredictionStatus;
  started_at: string;
  finished_at: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: PredictionItem[];
}

export interface PredictionItemComparison {
  id: string;
  prediction_id: string;
  product_id: string;
  product_name: string;
  estimated_quantity: number;
  unit_price: number;
  total_cost: number;
  unit_cost: number;
  estimated_sales: number;
  estimated_profit: number;
  sold_quantity: number;
  real_sales: number;
  real_profit: number;
  remaining_quantity: number;
  is_exceeded: boolean;
  exceeded_quantity: number;
  fulfillment_rate: number; // porcentaje (ej: 75.5)
}

export interface PredictionSummary {
  prediction: Prediction;
  items: PredictionItemComparison[];
  totals: {
    total_estimated_quantity: number;
    total_sold_quantity: number;
    total_remaining_quantity: number;
    total_estimated_sales: number;
    total_real_sales: number;
    total_estimated_cost: number;
    total_estimated_profit: number;
    total_real_profit: number;
    overall_quantity_rate: number;
    overall_sales_rate: number;
    overall_profit_rate: number;
  };
}


export interface PredictionHistoryItem {
  id: string;
  status: PredictionStatus;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  items_count: number;
  total_estimated_quantity: number;
  total_sold_quantity: number;
  total_estimated_sales: number;
  total_real_sales: number;
  total_estimated_profit: number;
  total_real_profit: number;
}

