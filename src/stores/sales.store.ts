import { create } from 'zustand';
import { Product, SaleStatus } from '@/types';

export interface CartItem {
  product_id: string;
  name: string;
  price_usd: number;
  quantity: number;
}

interface SalesStoreState {
  items: CartItem[];
  client_id: string | null;
  status: SaleStatus;
  exchangeRate: number;
  
  // Acciones
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setClientId: (clientId: string | null) => void;
  setStatus: (status: SaleStatus) => void;
  setExchangeRate: (rate: number) => void;
  
  // Calculadores
  calculateTotal: () => { totalUsd: number; totalBs: number };
}

export const useSalesStore = create<SalesStoreState>((set, get) => ({
  items: [],
  client_id: null,
  status: 'PENDING',
  exchangeRate: 40.0, // Tasa por defecto
  
  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (item) => item.product_id === product.id
      );
      
      let newItems = [...state.items];
      
      if (existingItemIndex > -1) {
        // Incrementar cantidad
        const existingItem = newItems[existingItemIndex];
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
        };
      } else {
        // Agregar nuevo producto
        newItems.push({
          product_id: product.id,
          name: product.name,
          price_usd: Number(product.price_usd),
          quantity,
        });
      }
      
      return { items: newItems };
    });
  },
  
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product_id !== productId),
    }));
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    set((state) => ({
      items: state.items.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      ),
    }));
  },
  
  clearCart: () => set({ items: [], client_id: null, status: 'PENDING' }),
  
  setClientId: (client_id) => set({ client_id }),
  
  setStatus: (status) => set({ status }),
  
  setExchangeRate: (exchangeRate) => set({ exchangeRate }),
  
  calculateTotal: () => {
    const state = get();
    const totalUsd = state.items.reduce(
      (acc, item) => acc + item.price_usd * item.quantity,
      0
    );
    const totalBs = totalUsd * state.exchangeRate;
    
    return {
      totalUsd: Number(totalUsd.toFixed(2)),
      totalBs: Number(totalBs.toFixed(2)),
    };
  },
}));
