'use client';

import { create } from 'zustand';
import type { OrderLineItem, ShippingInfo, BuildTimeline, OrderStatus } from '@/types/order';
import type { CostBreakdown } from '@/types/bom';

interface CartState {
  lineItems: OrderLineItem[];
  shipping: ShippingInfo | null;
  timeline: BuildTimeline[];
  orderStatus: OrderStatus;
  orderId: string | null;
  estimatedDeliveryDate: string | null;

  setLineItems: (items: OrderLineItem[]) => void;
  setShipping: (info: ShippingInfo) => void;
  setTimeline: (timeline: BuildTimeline[]) => void;
  setOrderStatus: (status: OrderStatus) => void;
  confirmOrder: () => void;
  reset: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  lineItems: [],
  shipping: null,
  timeline: [],
  orderStatus: 'draft',
  orderId: null,
  estimatedDeliveryDate: null,

  setLineItems: (items) => set({ lineItems: items }),
  setShipping: (info) => set({ shipping: info }),
  setTimeline: (timeline) => set({ timeline }),
  setOrderStatus: (status) => set({ orderStatus: status }),

  confirmOrder: () => {
    const orderId = `MSW-${Date.now().toString(36).toUpperCase()}`;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 21); // 3-week estimate

    set({
      orderId,
      orderStatus: 'confirmed',
      estimatedDeliveryDate: deliveryDate.toISOString(),
    });
  },

  reset: () =>
    set({
      lineItems: [],
      shipping: null,
      timeline: [],
      orderStatus: 'draft',
      orderId: null,
      estimatedDeliveryDate: null,
    }),
}));
