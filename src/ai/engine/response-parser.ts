// ─── Response Parser ────────────────────────────────────────────────────────
// Transforms LLM tool call results into existing TypeScript types for
// the configurator, BOM, and design history stores.

import type { PartDefinition, PartCategory } from '@/types/parts';
import type { RequirementsSpec } from '@/types/project';
import { generateProceduralConfig } from '@/ai/mock/mock-parts-generator';

// ─── Part ID Generator ──────────────────────────────────────────────────────

let aiPartCounter = 0;

function nextAIPartId(category: string): string {
  aiPartCounter++;
  return `ai-${category}-${Date.now()}-${aiPartCounter.toString().padStart(3, '0')}`;
}

/** Reset the counter (e.g., for a new design generation) */
export function resetPartCounter(): void {
  aiPartCounter = 0;
}

// ─── Parse generate_design Tool Result ──────────────────────────────────────

export interface GenerateDesignResult {
  projectName: string;
  projectDescription: string;
  projectType: string;
  parts: RawPart[];
  requirements: RawRequirements;
  summary: string;
}

interface RawPart {
  name: string;
  category: PartCategory;
  sourceType: 'manufactured' | 'sourced';
  manufacturingMethod: string;
  description: string;
  dimensions: { x: number; y: number; z: number };
  weight: number;
  material: string;
  color: string;
  unitCost: number;
  sourcingUrl?: string;
  supplierName?: string;
  supplierSKU?: string;
  leadTimeDays: number;
  specs: Record<string, string>;
  assemblyNotes?: string;
}

interface RawRequirements {
  mobility: {
    type: string;
    terrain: string;
    speed?: string;
  };
  sensing: { types: string[] };
  control: {
    controller: string;
    communication: string[];
  };
  power: {
    type: string;
    voltageV?: number;
    capacityMah?: number;
  };
  constraints: {
    budgetUsd?: number;
    environment?: string;
  };
}

export function parseGenerateDesignResult(result: GenerateDesignResult): {
  parts: PartDefinition[];
  requirements: RequirementsSpec;
} {
  resetPartCounter();

  const parts: PartDefinition[] = result.parts.map((raw) => rawPartToDefinition(raw));

  const requirements: RequirementsSpec = {
    pillar: 'physical',
    projectName: result.projectName || 'Untitled Project',
    projectType: result.projectType || 'generic',
    description: result.projectDescription || '',
    mobility: {
      type: (result.requirements.mobility?.type as RequirementsSpec['mobility']['type']) || 'wheeled',
      terrain: (result.requirements.mobility?.terrain as RequirementsSpec['mobility']['terrain']) || 'outdoor_rough',
      speed: result.requirements.mobility?.speed,
    },
    sensing: {
      types: (result.requirements.sensing?.types || ['ultrasonic']) as RequirementsSpec['sensing']['types'],
    },
    control: {
      controller: (result.requirements.control?.controller as RequirementsSpec['control']['controller']) || 'esp32',
      communication: (result.requirements.control?.communication || ['wifi']) as RequirementsSpec['control']['communication'],
    },
    power: {
      type: (result.requirements.power?.type as RequirementsSpec['power']['type']) || 'lipo',
      voltageV: result.requirements.power?.voltageV,
      capacityMah: result.requirements.power?.capacityMah,
    },
    constraints: {
      budgetUsd: result.requirements.constraints?.budgetUsd,
      environment: result.requirements.constraints?.environment as 'indoor' | 'outdoor' | 'both' | undefined,
    },
  };

  return { parts, requirements };
}

// ─── Parse refine_design Tool Result ────────────────────────────────────────

export interface RefineDesignResult {
  intent: string;
  explanation: string;
  partsToAdd?: RawPart[];
  partIdsToRemove?: string[];
  partModifications?: Array<{
    partName: string;
    updates: Partial<{
      name: string;
      unitCost: number;
      supplierName: string;
      sourcingUrl: string;
      leadTimeDays: number;
      specs: Record<string, string>;
      weight: number;
      material: string;
    }>;
  }>;
  crossDomainImpacts: Array<{
    domain: 'mechanics' | 'electronics' | 'software';
    severity: 'info' | 'warning' | 'critical';
    description: string;
    recommendation: string;
  }>;
  costDelta: number;
  weightDelta: number;
}

export function parseRefineDesignResult(
  result: RefineDesignResult,
  currentCatalog: PartDefinition[]
) {
  const partsAdded: PartDefinition[] = (result.partsToAdd || []).map((raw) =>
    rawPartToDefinition(raw)
  );

  // Match part modifications by name (since the LLM doesn't know internal IDs)
  const partsModified: Array<{ partId: string; updates: Partial<PartDefinition> }> = [];
  for (const mod of result.partModifications || []) {
    const match = currentCatalog.find(
      (p) => p.name.toLowerCase().includes(mod.partName.toLowerCase()) ||
             mod.partName.toLowerCase().includes(p.name.toLowerCase().split('(')[0].trim())
    );
    if (match) {
      partsModified.push({
        partId: match.id,
        updates: mod.updates as Partial<PartDefinition>,
      });
    }
  }

  // Match part removals by name if IDs are names rather than actual IDs
  const partsRemoved: string[] = [];
  for (const idOrName of result.partIdsToRemove || []) {
    const directMatch = currentCatalog.find((p) => p.id === idOrName);
    if (directMatch) {
      partsRemoved.push(directMatch.id);
    } else {
      const nameMatch = currentCatalog.find(
        (p) => p.name.toLowerCase().includes(idOrName.toLowerCase()) ||
               idOrName.toLowerCase().includes(p.name.toLowerCase().split('(')[0].trim())
      );
      if (nameMatch) {
        partsRemoved.push(nameMatch.id);
      }
    }
  }

  return {
    intent: result.intent,
    explanation: result.explanation,
    partsAdded,
    partsRemoved,
    partsModified,
    crossDomainImpacts: result.crossDomainImpacts || [],
    costDelta: result.costDelta || 0,
    weightDelta: result.weightDelta || 0,
  };
}

// ─── Shared: Raw Part → PartDefinition ──────────────────────────────────────

function rawPartToDefinition(raw: RawPart): PartDefinition {
  const id = nextAIPartId(raw.category);
  const dims = raw.dimensions || { x: 40, y: 40, z: 40 };

  return {
    id,
    name: raw.name,
    category: raw.category,
    sourceType: raw.sourceType || 'sourced',
    manufacturingMethod: (raw.manufacturingMethod as PartDefinition['manufacturingMethod']) || 'off_the_shelf',
    description: raw.description || '',
    dimensions: dims,
    weight: raw.weight || 50,
    material: raw.material || 'Mixed',
    color: raw.color || '#555555',
    unitCost: raw.unitCost || 0,
    sourcingUrl: raw.sourcingUrl,
    supplierName: raw.supplierName,
    supplierSKU: raw.supplierSKU,
    leadTimeDays: raw.leadTimeDays || 3,
    specs: raw.specs || {},
    asset: {
      type: 'procedural',
      generationStatus: 'ready',
      proceduralConfig: generateProceduralConfig(raw.category, dims),
    },
    mountPoints: [],
    assemblyNotes: raw.assemblyNotes,
  };
}
