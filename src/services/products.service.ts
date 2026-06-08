import { createServerClient } from '@/lib/supabase/server';
import { Product } from '@/types';
import { CreateProductInput, UpdateProductInput } from '@/schemas/product.schema';

export class ProductsService {
  static async getAll(): Promise<Product[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getById(id: string): Promise<Product> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Producto no encontrado: ${error.message}`);
    return data;
  }

  static async create(input: CreateProductInput): Promise<Product> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, input: UpdateProductInput): Promise<Product> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
