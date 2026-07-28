import { db } from '@/lib/db';
import { Product } from '@/types';
import { CreateProductInput, UpdateProductInput } from '@/schemas/product.schema';

export class ProductsService {
  static async getAll(): Promise<Product[]> {
    return await db.getProducts();
  }

  static async getById(id: string): Promise<Product> {
    return await db.getProductById(id);
  }

  static async create(input: CreateProductInput): Promise<Product> {
    return await db.createProduct(input);
  }

  static async update(id: string, input: UpdateProductInput): Promise<Product> {
    return await db.updateProduct(id, input);
  }

  static async delete(id: string): Promise<void> {
    await db.deleteProduct(id);
  }
}
