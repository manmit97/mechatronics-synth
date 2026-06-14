// ─── Bill of Materials Types ────────────────────────────────────────────────

import type { ManufacturingMethod, PartCategory, SourceType } from './parts';

export interface BOMEntry {
  partId: string;
  partName: string;
  category: PartCategory;
  sourceType: SourceType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  manufacturingMethod: ManufacturingMethod;
  sourcingUrl?: string;
  supplierName?: string;
  leadTimeDays: number;
}

export interface CostBreakdown {
  manufacturedPartsTotal: number;
  sourcedPartsTotal: number;
  assemblyLabor: number;
  shippingEstimate: number;
  subtotal: number;
  tax: number;
  grandTotal: number;
}
