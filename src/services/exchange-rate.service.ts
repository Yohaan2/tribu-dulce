import { createServerClient } from '@/lib/supabase/server';
import { ExchangeRate } from '@/types';

export class ExchangeRateService {
  static async getLatest(): Promise<ExchangeRate> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching exchange rate:', error.message);
    }

    if (data && data.length > 0) {
      // Verificar si la tasa es del día de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const rateDate = new Date(data[0].created_at);
      rateDate.setHours(0, 0, 0, 0);

      // Si la tasa no es de hoy, intentar sincronizar con la API externa
      if (rateDate.getTime() !== today.getTime()) {
        try {
          const syncedRate = await this.syncFromAPI();
          return syncedRate;
        } catch (syncError) {
          console.error('Error syncing from API, using cached rate:', syncError);
          return data[0];
        }
      }

      return data[0];
    }

    // Si no hay registros, intentar sincronizar con la API externa
    try {
      const syncedRate = await this.syncFromAPI();
      return syncedRate;
    } catch (syncError) {
      console.error('Error syncing from API, using default rate:', syncError);
      // Retornar una tasa por defecto si no hay registros en la BD
      return {
        id: 'default',
        rate: 40.0, // Tasa de cambio por defecto para inicialización
        source: 'BCV (Por Defecto)',
        created_at: new Date().toISOString(),
      };
    }
  }

  static async syncFromAPI(): Promise<ExchangeRate> {
    try {
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await response.json();

      if (!data || !data.promedio) {
        throw new Error('Invalid response from exchange rate API');
      }

      const rate = data.promedio;
      const source = `BCV Oficial (${data.fechaActualizacion})`;

      return await this.create(rate, source);
    } catch (error) {
      throw new Error(`Failed to sync exchange rate from API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async create(rate: number, source: string): Promise<ExchangeRate> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('exchange_rates')
      .insert({ rate, source })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
