import 'reflect-metadata';
import { DataSource, Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, ILike } from 'typeorm';
import { Client, Product, Sale, Payment, ExchangeRate, DashboardStats, SaleStatus, UserProfile, AuditLog, CreateAuditLogInput } from '@/types';
import { CreateClientInput, UpdateClientInput } from '@/schemas/client.schema';
import { CreateProductInput, UpdateProductInput } from '@/schemas/product.schema';
import { CreateSaleInput } from '@/schemas/sale.schema';
import { CreatePaymentInput } from '@/schemas/payment.schema';
import { DatabaseAdapter } from './interface';

// =========================================================================
// ENTIDADES DE TYPEORM
// =========================================================================

@Entity({ name: 'profiles' })
export class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column()
  role!: 'ADMIN' | 'EMPLOYEE';

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}

@Entity({ name: 'clients' })
export class ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @OneToMany(() => SaleEntity, (sale) => sale.client)
  sales!: SaleEntity[];
}

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price_usd!: number;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}

@Entity({ name: 'sales' })
export class SaleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'client_id' })
  client_id!: string;

  @ManyToOne(() => ClientEntity, (client) => client.sales)
  @JoinColumn({ name: 'client_id' })
  client!: ClientEntity;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total_usd!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_bs!: number;

  @Column()
  status!: string;

  @Column({ name: 'created_by', nullable: true })
  created_by!: string;

  @ManyToOne(() => ProfileEntity)
  @JoinColumn({ name: 'created_by' })
  creator_profile!: ProfileEntity;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @OneToMany(() => SaleItemEntity, (item) => item.sale)
  items!: SaleItemEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.sale)
  payments!: PaymentEntity[];
}

@Entity({ name: 'sale_items' })
export class SaleItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sale_id' })
  sale_id!: string;

  @ManyToOne(() => SaleEntity, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: SaleEntity;

  @Column({ name: 'product_id' })
  product_id!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity;

  @Column()
  quantity!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  unit_price!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal!: number;
}

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sale_id' })
  sale_id!: string;

  @ManyToOne(() => SaleEntity, (sale) => sale.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: SaleEntity;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount_usd!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount_bs!: number;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}

@Entity({ name: 'exchange_rates' })
export class ExchangeRateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  rate!: number;

  @Column()
  source!: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  user_id!: string;

  @ManyToOne(() => ProfileEntity)
  @JoinColumn({ name: 'user_id' })
  user!: ProfileEntity;

  @Column()
  action!: string;

  @Column({ name: 'entity_type', nullable: true })
  entity_type!: string;

  @Column({ name: 'entity_id', nullable: true })
  entity_id!: string;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, any>;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}

// =========================================================================
// DATA SOURCE MANAGER
// =========================================================================

let AppDataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (AppDataSource && AppDataSource.isInitialized) {
    return AppDataSource;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  const sslEnabled = process.env.DATABASE_SSL === 'true';

  AppDataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [
      ProfileEntity,
      ClientEntity,
      ProductEntity,
      SaleEntity,
      SaleItemEntity,
      PaymentEntity,
      ExchangeRateEntity,
      AuditLogEntity,
    ],
    synchronize: false,
    logging: false,
    extra: {
      ssl: false,
    },
  });

  await AppDataSource.initialize();
  return AppDataSource;
}

// Helper para mapear strings de tipo numeric a numbers de javascript
const toNumber = (val: any): number => (val !== undefined && val !== null ? Number(val) : 0);

// =========================================================================
// ADAPTER IMPLEMENTATION
// =========================================================================

export class PostgresAdapter implements DatabaseAdapter {
  // --- CLIENTES ---
  async getClients(page?: number, limit?: number): Promise<{ data: Client[]; total: number }> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ClientEntity);

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    // Obtenemos clientes paginados con sales y sus payments
    const [clients, total] = await repo.findAndCount({
      relations: {
        sales: {
          payments: true,
        },
      },
      order: { name: 'ASC' },
      skip,
      take,
    });

    return {
      data: clients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || null,
        created_at: c.created_at.toISOString(),
        sales: c.sales?.map((s) => ({
          id: s.id,
          total_usd: toNumber(s.total_usd),
          status: s.status,
          payments: s.payments?.map((p) => ({
            amount_usd: toNumber(p.amount_usd),
          })),
        })),
      })) as any[],
      total,
    };
  }

  async getClientById(id: string): Promise<Client> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ClientEntity);
    const client = await repo.findOne({ where: { id } });
    if (!client) throw new Error('Cliente no encontrado');
    return {
      id: client.id,
      name: client.name,
      phone: client.phone || null,
      created_at: client.created_at.toISOString(),
    };
  }

  async getClientByName(name: string): Promise<Client> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ClientEntity);
    const client = await repo.findOne({ where: { name: ILike(`%${name}%`) } });
    if (!client) throw new Error('Cliente no encontrado');
    return {
      id: client.id,
      name: client.name,
      phone: client.phone || null,
      created_at: client.created_at.toISOString(),
    };
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ClientEntity);
    const client = repo.create({
      name: input.name,
      phone: input.phone || undefined,
    });
    const saved = await repo.save(client);
    return {
      id: saved.id,
      name: saved.name,
      phone: saved.phone || null,
      created_at: saved.created_at.toISOString(),
    };
  }

  async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ClientEntity);
    const client = await repo.findOne({ where: { id } });
    if (!client) throw new Error('Cliente no encontrado');
    
    if (input.name !== undefined) client.name = input.name;
    if (input.phone !== undefined) client.phone = input.phone || '';

    const saved = await repo.save(client);
    return {
      id: saved.id,
      name: saved.name,
      phone: saved.phone || null,
      created_at: saved.created_at.toISOString(),
    };
  }

  async deleteClient(id: string): Promise<void> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ClientEntity);
    await repo.delete(id);
  }

  // --- PRODUCTOS ---
  async getProducts(): Promise<Product[]> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProductEntity);
    const list = await repo.find({ order: { name: 'ASC' } });
    return list.map((p) => ({
      id: p.id,
      name: p.name,
      price_usd: toNumber(p.price_usd),
      created_at: p.created_at.toISOString(),
    }));
  }

  async getProductById(id: string): Promise<Product> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProductEntity);
    const product = await repo.findOne({ where: { id } });
    if (!product) throw new Error('Producto no encontrado');
    return {
      id: product.id,
      name: product.name,
      price_usd: toNumber(product.price_usd),
      created_at: product.created_at.toISOString(),
    };
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProductEntity);
    const product = repo.create({
      name: input.name,
      price_usd: input.price_usd,
    });
    const saved = await repo.save(product);
    return {
      id: saved.id,
      name: saved.name,
      price_usd: toNumber(saved.price_usd),
      created_at: saved.created_at.toISOString(),
    };
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProductEntity);
    const product = await repo.findOne({ where: { id } });
    if (!product) throw new Error('Producto no encontrado');

    if (input.name !== undefined) product.name = input.name;
    if (input.price_usd !== undefined) product.price_usd = input.price_usd;

    const saved = await repo.save(product);
    return {
      id: saved.id,
      name: saved.name,
      price_usd: toNumber(saved.price_usd),
      created_at: saved.created_at.toISOString(),
    };
  }

  async deleteProduct(id: string): Promise<void> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProductEntity);
    await repo.delete(id);
  }

  // --- VENTAS ---
  private mapSaleEntity(s: SaleEntity): Sale {
    return {
      id: s.id,
      client_id: s.client_id,
      total_usd: toNumber(s.total_usd),
      total_bs: toNumber(s.total_bs),
      status: s.status as SaleStatus,
      created_by: s.created_by || null,
      created_at: s.created_at.toISOString(),
      client: s.client ? {
        id: s.client.id,
        name: s.client.name,
        phone: s.client.phone || null,
        created_at: s.client.created_at.toISOString(),
      } : undefined,
      items: s.items?.map((item) => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: toNumber(item.unit_price),
        subtotal: toNumber(item.subtotal),
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          price_usd: toNumber(item.product.price_usd),
          created_at: item.product.created_at.toISOString(),
        } : undefined,
      })),
      payments: s.payments?.map((p) => ({
        id: p.id,
        sale_id: p.sale_id,
        amount_usd: toNumber(p.amount_usd),
        amount_bs: toNumber(p.amount_bs),
        created_at: p.created_at.toISOString(),
      })),
      creator_profile: s.creator_profile ? {
        id: s.creator_profile.id,
        name: s.creator_profile.name,
        role: s.creator_profile.role,
        created_at: s.creator_profile.created_at.toISOString(),
      } : undefined,
    };
  }

  async getSales(): Promise<Sale[]> {
    const ds = await getDataSource();
    const repo = ds.getRepository(SaleEntity);
    const list = await repo.find({
      relations: {
        client: true,
        items: {
          product: true,
        },
        creator_profile: true,
      },
      order: { created_at: 'DESC' },
    });
    return list.map((s) => this.mapSaleEntity(s));
  }

  async getSaleById(id: string): Promise<Sale> {
    const ds = await getDataSource();
    const repo = ds.getRepository(SaleEntity);
    const s = await repo.findOne({
      where: { id },
      relations: {
        client: true,
        items: {
          product: true,
        },
        payments: true,
        creator_profile: true,
      },
    });
    if (!s) throw new Error('Venta no encontrada');
    return this.mapSaleEntity(s);
  }

  async createSale(input: CreateSaleInput): Promise<Sale> {
    const ds = await getDataSource();
    
    // Usamos TypeORM Transaction para garantizar consistencia y replicar el comportamiento de rollback
    return await ds.transaction(async (manager) => {
      // 1. Crear la cabecera
      const saleRepo = manager.getRepository(SaleEntity);
      const sale = saleRepo.create({
        client_id: input.client_id,
        total_usd: input.total_usd,
        total_bs: input.total_bs,
        status: input.status,
        created_by: input.created_by || undefined,
        created_at: input.created_at || new Date(),
      });
      const savedSale = await saleRepo.save(sale);
      const saleId = savedSale.id;

      // 2. Crear los items
      const itemRepo = manager.getRepository(SaleItemEntity);
      const itemsToInsert = input.items.map((item) => {
        return itemRepo.create({
          sale_id: saleId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.quantity * item.unit_price,
        });
      });
      await itemRepo.save(itemsToInsert);

      // 3. Crear pagos automáticos si aplica
      const paymentRepo = manager.getRepository(PaymentEntity);
      if (input.status === 'PAID') {
        const payment = paymentRepo.create({
          sale_id: saleId,
          amount_usd: input.total_usd,
          amount_bs: input.total_bs,
        });
        await paymentRepo.save(payment);
      } else if (input.status === 'PARTIAL' && input.partial_payment_usd && input.partial_payment_usd > 0) {
        const partialUsd = input.partial_payment_usd;
        const rate = input.total_usd > 0 ? (input.total_bs / input.total_usd) : 0;
        const partialBs = Math.round(partialUsd * rate * 100) / 100;

        const payment = paymentRepo.create({
          sale_id: saleId,
          amount_usd: partialUsd,
          amount_bs: partialBs,
        });
        await paymentRepo.save(payment);
      }

      // 4. Retornar la venta creada con todas sus relaciones
      const finalSale = await manager.getRepository(SaleEntity).findOne({
        where: { id: saleId },
        relations: {
          client: true,
          items: {
            product: true,
          },
          payments: true,
          creator_profile: true,
        },
      });
      
      if (!finalSale) throw new Error('Error al recuperar venta creada');
      return this.mapSaleEntity(finalSale);
    });
  }

  async updateSaleStatus(id: string, status: SaleStatus): Promise<Sale> {
    const ds = await getDataSource();
    const repo = ds.getRepository(SaleEntity);
    const sale = await repo.findOne({ where: { id } });
    if (!sale) throw new Error('Venta no encontrada');
    sale.status = status;
    await repo.save(sale);
    return this.getSaleById(id);
  }

  async getDebts(): Promise<Sale[]> {
    const ds = await getDataSource();
    const repo = ds.getRepository(SaleEntity);
    // Consulta similar a getDebts de Supabase (.in('status', ['PENDING', 'PARTIAL']))
    const debts = await repo.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.client', 'client')
      .leftJoinAndSelect('sale.payments', 'payment')
      .leftJoinAndSelect('sale.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('sale.creator_profile', 'creator_profile')
      .where('sale.status IN (:...statuses)', { statuses: ['PENDING', 'PARTIAL'] })
      .orderBy('sale.created_at', 'DESC')
      .getMany();

    return debts.map((s) => this.mapSaleEntity(s));
  }

  async getClientDebts(clientId: string): Promise<any[]> {
    const ds = await getDataSource();
    const repo = ds.getRepository(SaleEntity);
    
    const sales = await repo.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.payments', 'payment')
      .where('sale.client_id = :clientId', { clientId })
      .andWhere('sale.status IN (:...statuses)', { statuses: ['PENDING', 'PARTIAL'] })
      .orderBy('sale.created_at', 'ASC')
      .getMany();

    return sales.map((s) => ({
      id: s.id,
      total_usd: toNumber(s.total_usd),
      created_at: s.created_at.toISOString(),
      payments: s.payments?.map((p) => ({
        amount_usd: toNumber(p.amount_usd),
      })),
    }));
  }

  // --- PAGOS ---
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const ds = await getDataSource();
    const repo = ds.getRepository(PaymentEntity);
    const payment = repo.create({
      sale_id: input.sale_id,
      amount_usd: input.amount_usd,
      amount_bs: input.amount_bs,
    });
    const saved = await repo.save(payment);
    return {
      id: saved.id,
      sale_id: saved.sale_id,
      amount_usd: toNumber(saved.amount_usd),
      amount_bs: toNumber(saved.amount_bs),
      created_at: saved.created_at.toISOString(),
    };
  }

  async getPaymentsBySaleId(saleId: string): Promise<Payment[]> {
    const ds = await getDataSource();
    const repo = ds.getRepository(PaymentEntity);
    const list = await repo.find({ where: { sale_id: saleId } });
    return list.map((p) => ({
      id: p.id,
      sale_id: p.sale_id,
      amount_usd: toNumber(p.amount_usd),
      amount_bs: toNumber(p.amount_bs),
      created_at: p.created_at.toISOString(),
    }));
  }

  // --- TASA DE CAMBIO ---
  async getLatestExchangeRate(): Promise<ExchangeRate | null> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ExchangeRateEntity);
    const rate = await repo.findOne({
      where: {},
      order: { created_at: 'DESC' },
    });
    if (!rate) return null;
    return {
      id: rate.id,
      rate: toNumber(rate.rate),
      source: rate.source,
      created_at: rate.created_at.toISOString(),
    };
  }

  async createExchangeRate(rate: number, source: string): Promise<ExchangeRate> {
    const ds = await getDataSource();
    const repo = ds.getRepository(ExchangeRateEntity);
    const entity = repo.create({ rate, source });
    const saved = await repo.save(entity);
    return {
      id: saved.id,
      rate: toNumber(saved.rate),
      source: saved.source,
      created_at: saved.created_at.toISOString(),
    };
  }

  // --- DASHBOARD ---
  async getDashboardStats(todayStart: string, weekStart: string, monthStart: string): Promise<DashboardStats> {
    const ds = await getDataSource();
    const saleRepo = ds.getRepository(SaleEntity);

    // Parsear fechas ISO recibidas a objetos Date de JS
    const todayDate = new Date(todayStart);
    const weekDate = new Date(weekStart);
    const monthDate = new Date(monthStart);

    // 1. Ventas de Hoy
    const todaySalesData = await saleRepo.createQueryBuilder('sale')
      .select('SUM(sale.total_usd)', 'sum')
      .where('sale.created_at >= :todayDate', { todayDate })
      .getRawOne();
    const todaySales = toNumber(todaySalesData?.sum);

    // 2. Ventas de la Semana
    const weekSalesData = await saleRepo.createQueryBuilder('sale')
      .select('SUM(sale.total_usd)', 'sum')
      .where('sale.created_at >= :weekDate', { weekDate })
      .getRawOne();
    const weekSales = toNumber(weekSalesData?.sum);

    // 3. Ventas del Mes
    const monthSalesData = await saleRepo.createQueryBuilder('sale')
      .select('SUM(sale.total_usd)', 'sum')
      .where('sale.created_at >= :monthDate', { monthDate })
      .getRawOne();
    const monthSales = toNumber(monthSalesData?.sum);

    // 4. Monto pendiente por cobrar (deudas)
    const pendingSales = await saleRepo.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.payments', 'payment')
      .where('sale.status IN (:...statuses)', { statuses: ['PENDING', 'PARTIAL'] })
      .getMany();

    let pendingAmount = 0;
    pendingSales.forEach((sale) => {
      const totalPaid = (sale.payments || []).reduce((acc, curr) => acc + toNumber(curr.amount_usd), 0);
      const outstanding = toNumber(sale.total_usd) - totalPaid;
      if (outstanding > 0) {
        pendingAmount += outstanding;
      }
    });

    // 5. Clientes top (más compras)
    const allSalesWithClients = await saleRepo.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.client', 'client')
      .getMany();

    const clientMap: Record<string, { name: string; totalSpent: number; count: number }> = {};
    allSalesWithClients.forEach((sale) => {
      if (sale.client) {
        const cId = sale.client.id;
        if (!clientMap[cId]) {
          clientMap[cId] = { name: sale.client.name, totalSpent: 0, count: 0 };
        }
        clientMap[cId].totalSpent += toNumber(sale.total_usd);
        clientMap[cId].count += 1;
      }
    });

    const topClients = Object.entries(clientMap)
      .map(([id, info]) => ({
        client_id: id,
        client_name: info.name,
        total_spent: info.totalSpent,
        sales_count: info.count,
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 5);

    // 6. Datos semanales para el gráfico (últimos 7 días)
    const weekSalesList = await saleRepo.createQueryBuilder('sale')
      .where('sale.created_at >= :weekDate', { weekDate })
      .getMany();

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dayName = daysOfWeek[d.getDay()];
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayAmount = weekSalesList.reduce((acc, sale) => {
        const saleTime = sale.created_at.getTime();
        if (saleTime >= dayStart && saleTime < dayEnd) {
          return acc + toNumber(sale.total_usd);
        }
        return acc;
      }, 0);

      return {
        day: dayName,
        amount: dayAmount,
      };
    });

    return {
      todaySales,
      weekSales,
      monthSales,
      pendingAmount,
      topClients,
      weeklyChartData,
    };
  }

  // --- AUDITORIA ---
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const ds = await getDataSource();
    const repo = ds.getRepository(AuditLogEntity);
    const logs = await repo.find({
      relations: { user: true },
      order: { created_at: 'DESC' },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      user_id: log.user_id,
      user_name: log.user?.name || 'Usuario desconocido',
      action: log.action,
      entity_type: log.entity_type || null,
      entity_id: log.entity_id || null,
      details: log.details || null,
      created_at: log.created_at.toISOString(),
      formatted_datetime: log.created_at.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    }));
  }

  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
    const ds = await getDataSource();
    const repo = ds.getRepository(AuditLogEntity);
    const log = repo.create({
      user_id: input.user_id,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      details: input.details,
    });
    const saved = await repo.save(log);
    const withUser = await repo.findOne({
      where: { id: saved.id },
      relations: { user: true },
    });
    const user = withUser?.user;
    return {
      id: saved.id,
      user_id: saved.user_id,
      user_name: user?.name || 'Usuario desconocido',
      action: saved.action,
      entity_type: saved.entity_type || null,
      entity_id: saved.entity_id || null,
      details: saved.details || null,
      created_at: saved.created_at.toISOString(),
      formatted_datetime: saved.created_at.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    };
  }
}
