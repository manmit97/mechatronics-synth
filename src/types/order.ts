// ─── Order & Checkout Types ─────────────────────────────────────────────────

import type { RobotConfiguration } from './configuration';
import type { BOMEntry, CostBreakdown } from './bom';

export interface OrderLineItem {
  type: 'physical_component' | 'digital_file' | 'assembly_service';
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingInfo {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export type BuildPhase =
  | '3d_printing'
  | 'pcb_fabrication'
  | 'component_sourcing'
  | 'assembly'
  | 'quality_check'
  | 'shipping';

export interface BuildTimeline {
  phase: BuildPhase;
  label: string;
  startDay: number;
  endDay: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export type OrderStatus = 'draft' | 'confirmed' | 'manufacturing' | 'shipping' | 'delivered';

export interface Order {
  orderId: string;
  configuration: RobotConfiguration;
  lineItems: OrderLineItem[];
  costBreakdown: CostBreakdown;
  shipping: ShippingInfo;
  timeline: BuildTimeline[];
  estimatedDeliveryDate: string;
  status: OrderStatus;
}
