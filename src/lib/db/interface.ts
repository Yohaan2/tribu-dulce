import { Client, Product, Sale, Payment, ExchangeRate, DashboardStats, SaleStatus, AuditLog, CreateAuditLogInput } from '@/types';
import { CreateClientInput, UpdateClientInput } from '@/schemas/client.schema';
import { CreateProductInput, UpdateProductInput } from '@/schemas/product.schema';
import { CreateSaleInput } from '@/schemas/sale.schema';
import { CreatePaymentInput } from '@/schemas/payment.schema';

export interface DatabaseAdapter {
  // --- CLIENTES ---
  getClients(page?: number, limit?: number, search?: string): Promise<{ data: Client[]; total: number }>;
  getClientById(id: string): Promise<Client>;
  getClientByName(name: string): Promise<Client>;
  createClient(input: CreateClientInput): Promise<Client>;
  updateClient(id: string, input: UpdateClientInput): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // --- PRODUCTOS ---
  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product>;
  createProduct(input: CreateProductInput): Promise<Product>;
  updateProduct(id: string, input: UpdateProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // --- VENTAS ---
  getSales(): Promise<Sale[]>;
  getSaleById(id: string): Promise<Sale>;
  createSale(input: CreateSaleInput): Promise<Sale>;
  updateSaleStatus(id: string, status: SaleStatus): Promise<Sale>;
  updateSale(
    id: string,
    input: {
      status?: SaleStatus;
      items?: Array<{ product_id: string; quantity: number; unit_price: number }>;
    }
  ): Promise<Sale>;
  getDebts(): Promise<Sale[]>;
  getClientDebts(clientId: string): Promise<any[]>;

  // --- PAGOS ---
  createPayment(input: CreatePaymentInput): Promise<Payment>;
  getPaymentsBySaleId(saleId: string): Promise<Payment[]>;

  // --- TASA DE CAMBIO ---
  getLatestExchangeRate(): Promise<ExchangeRate | null>;
  createExchangeRate(rate: number, source: string): Promise<ExchangeRate>;

  // --- DASHBOARD ---
  getDashboardStats(todayStart: string, weekStart: string, monthStart: string): Promise<DashboardStats>;

  // --- AUDITORIA ---
  getAuditLogs(page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{ data: AuditLog[]; total: number }>;
  createAuditLog(input: CreateAuditLogInput): Promise<AuditLog>;
}
