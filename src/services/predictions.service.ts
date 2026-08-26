import { db } from '@/lib/db';
import {
  Prediction,
  PredictionSummary,
  PredictionItemComparison,
  PredictionHistoryItem,
} from '@/types';
import { CreatePredictionItemInput } from '@/schemas/prediction.schema';

export class PredictionsService {
  /**
   * Helper to calculate item comparisons and totals given a prediction and its sales
   */
  private static calculateSummary(prediction: Prediction, sales: any[]): PredictionSummary {
    let totalEstQty = 0;
    let totalSoldQty = 0;
    let totalEstSales = 0;
    let totalRealSales = 0;
    let totalEstCost = 0;
    let totalEstProfit = 0;
    let totalRealProfit = 0;

    const itemsComparison: PredictionItemComparison[] = (prediction.items || []).map((item) => {
      const estQty = item.estimated_quantity || 0;
      const unitPrice = Number(item.unit_price) || 0;
      let unitCost = Number(item.unit_cost) || 0;
      let totalCost = Number(item.total_cost) || 0;

      if (totalCost === 0 && unitCost > 0 && estQty > 0) {
        totalCost = unitCost * estQty;
      } else if (unitCost === 0 && totalCost > 0 && estQty > 0) {
        unitCost = totalCost / estQty;
      }

      const estimatedSales = estQty * unitPrice;
      const estimatedProfit = estimatedSales - totalCost;

      // Calcular ventas reales correspondientes a este producto
      let soldQty = 0;
      let realSales = 0;

      for (const sale of sales) {
        for (const sItem of sale.items || []) {
          if (sItem.product_id === item.product_id) {
            soldQty += Number(sItem.quantity) || 0;
            realSales += Number(sItem.subtotal) || 0;
          }
        }
      }

      const realProfit = realSales - totalCost;
      const remainingQty = Math.max(0, estQty - soldQty);
      const isExceeded = soldQty > estQty;
      const exceededQty = Math.max(0, soldQty - estQty);
      const fulfillmentRate = estQty > 0 ? (soldQty / estQty) * 100 : 0;

      // Acumular totales
      totalEstQty += estQty;
      totalSoldQty += soldQty;
      totalEstSales += estimatedSales;
      totalRealSales += realSales;
      totalEstCost += totalCost;
      totalEstProfit += estimatedProfit;
      totalRealProfit += realProfit;

      return {
        id: item.id,
        prediction_id: item.prediction_id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Producto',
        estimated_quantity: estQty,
        unit_price: unitPrice,
        total_cost: Math.round(totalCost * 100) / 100,
        unit_cost: Math.round(unitCost * 10000) / 10000,
        estimated_sales: estimatedSales,
        estimated_profit: estimatedProfit,
        sold_quantity: soldQty,
        real_sales: realSales,
        real_profit: realProfit,
        remaining_quantity: remainingQty,
        is_exceeded: isExceeded,
        exceeded_quantity: exceededQty,
        fulfillment_rate: Math.round(fulfillmentRate * 10) / 10,
      };
    });

    const totalRemaining = Math.max(0, totalEstQty - totalSoldQty);
    const overallQtyRate = totalEstQty > 0 ? (totalSoldQty / totalEstQty) * 100 : 0;
    const overallSalesRate = totalEstSales > 0 ? (totalRealSales / totalEstSales) * 100 : 0;
    const overallProfitRate = totalEstProfit > 0 ? (totalRealProfit / totalEstProfit) * 100 : 0;

    return {
      prediction,
      items: itemsComparison,
      totals: {
        total_estimated_quantity: totalEstQty,
        total_sold_quantity: totalSoldQty,
        total_remaining_quantity: totalRemaining,
        total_estimated_sales: Math.round(totalEstSales * 100) / 100,
        total_real_sales: Math.round(totalRealSales * 100) / 100,
        total_estimated_cost: Math.round(totalEstCost * 100) / 100,
        total_estimated_profit: Math.round(totalEstProfit * 100) / 100,
        total_real_profit: Math.round(totalRealProfit * 100) / 100,
        overall_quantity_rate: Math.round(overallQtyRate * 10) / 10,
        overall_sales_rate: Math.round(overallSalesRate * 10) / 10,
        overall_profit_rate: Math.round(overallProfitRate * 10) / 10,
      },
    };

  }

  /**
   * Obtiene el resumen de la previsión activa actual con sus ventas reales calculadas
   */
  static async getActiveSummary(): Promise<PredictionSummary | null> {
    const active = await db.getActivePrediction();
    if (!active) return null;

    const startDate = new Date(active.started_at);
    const sales = await db.getSalesBetweenDates(startDate);

    return this.calculateSummary(active, sales);
  }

  /**
   * Obtiene el detalle de una previsión histórica por su ID
   */
  static async getByIdSummary(id: string): Promise<PredictionSummary | null> {
    const prediction = await db.getPredictionById(id);
    if (!prediction) return null;

    const startDate = new Date(prediction.started_at);
    const endDate = prediction.finished_at ? new Date(prediction.finished_at) : undefined;
    const sales = await db.getSalesBetweenDates(startDate, endDate);

    return this.calculateSummary(prediction, sales);
  }

  /**
   * Agrega un producto o suma cantidad a la previsión activa (creándola si no existe)
   */
  static async addItem(input: CreatePredictionItemInput): Promise<Prediction> {
    return await db.createOrAddItemToPrediction(input);
  }

  /**
   * Elimina un item de la previsión activa
   */
  static async deleteItem(itemId: string): Promise<void> {
    await db.deletePredictionItem(itemId);
  }

  /**
   * Reinicia la previsión activa, archivándola con fecha de finalización
   */
  static async reset(notes?: string): Promise<Prediction | null> {
    return await db.resetPrediction(notes);
  }

  /**
   * Obtiene el listado del historial de previsiones pasadas y actuales
   */
  static async getHistory(): Promise<PredictionHistoryItem[]> {
    return await db.getPredictionHistory();
  }
}
