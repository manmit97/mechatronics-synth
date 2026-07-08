// ─── LLM Tool Definitions ───────────────────────────────────────────────────
// Vercel AI SDK v6 tool schemas (Zod-validated) that the LLM can invoke.
// Tools: generate_design, refine_design, search_components, lookup_datasheet

import { z } from 'zod';
import { tool } from 'ai';

// ─── Shared Schemas ─────────────────────────────────────────────────────────

const PartCategorySchema = z.enum([
  'chassis', 'actuator', 'sensor', 'controller', 'power',
  'structural', 'fastener', 'wheel', 'transmission', 'end_effector', 'wiring',
]);

const ManufacturingMethodSchema = z.enum([
  '3d_printed_fdm', '3d_printed_sla', 'cnc_milled',
  'laser_cut', 'off_the_shelf', 'pcb_manufactured',
]);

const SourceTypeSchema = z.enum(['manufactured', 'sourced']);

const PartSchema = z.object({
  name: z.string().describe('Full part name with specifications, e.g. "NEMA 17 Stepper Motor (42×34mm, 1.8°)"'),
  category: PartCategorySchema,
  sourceType: SourceTypeSchema,
  manufacturingMethod: ManufacturingMethodSchema,
  description: z.string().describe('Brief technical description of the part and its role in the system'),
  dimensions: z.object({
    x: z.number().describe('Width in mm'),
    y: z.number().describe('Height in mm'),
    z: z.number().describe('Depth in mm'),
  }),
  weight: z.number().describe('Weight in grams'),
  material: z.string().describe('Primary material (e.g. "Aluminum 6061-T6", "PLA+", "PCB/FR4")'),
  color: z.string().describe('Hex color code for 3D visualization'),
  unitCost: z.number().describe('Unit cost in USD'),
  sourcingUrl: z.string().optional().describe('Real URL to purchase this part'),
  supplierName: z.string().optional().describe('Supplier name (DigiKey, Mouser, Amazon, etc.)'),
  supplierSKU: z.string().optional().describe('Supplier-specific part number or SKU'),
  leadTimeDays: z.number().describe('Estimated lead time in business days'),
  specs: z.record(z.string(), z.string()).describe('Key technical specifications as key-value pairs'),
  assemblyNotes: z.string().optional().describe('Notes for assembly instructions'),
});

const CrossDomainImpactSchema = z.object({
  domain: z.enum(['mechanics', 'electronics', 'software']),
  severity: z.enum(['info', 'warning', 'critical']),
  description: z.string(),
  recommendation: z.string(),
});

// ─── Input Schemas ──────────────────────────────────────────────────────────

const generateDesignInputSchema = z.object({
  projectName: z.string().describe('Short, catchy project name'),
  projectDescription: z.string().describe('2-3 sentence project description'),
  projectType: z.string().describe('Project category: rover, arm, hexapod, drone, cnc, printer, conveyor, generic'),
  parts: z.array(PartSchema).min(3).describe('Complete list of parts for the build'),
  requirements: z.object({
    mobility: z.object({
      type: z.enum(['wheeled', 'tracked', 'legged', 'stationary', 'flying']),
      terrain: z.enum(['indoor_smooth', 'indoor_rough', 'outdoor_paved', 'outdoor_rough', 'all_terrain']),
      speed: z.string().optional(),
    }),
    sensing: z.object({
      types: z.array(z.enum(['camera', 'ultrasonic', 'lidar', 'ir', 'imu', 'gps', 'encoder', 'temperature', 'force'])),
    }),
    control: z.object({
      controller: z.enum(['esp32', 'arduino_mega', 'raspberry_pi', 'stm32', 'custom']),
      communication: z.array(z.enum(['wifi', 'bluetooth', 'lora', 'usb', 'can_bus', 'serial'])),
    }),
    power: z.object({
      type: z.enum(['lipo', 'liion', 'nimh', 'dc_supply']),
      voltageV: z.number().optional(),
      capacityMah: z.number().optional(),
    }),
    constraints: z.object({
      budgetUsd: z.number().optional(),
      environment: z.enum(['indoor', 'outdoor', 'both']).optional(),
    }),
  }),
  summary: z.string().describe('Brief summary of the design for the user. Include total cost, part count, and key design decisions.'),
});

const refineDesignInputSchema = z.object({
  intent: z.enum([
    'swap_component', 'resize_part', 'add_capability', 'remove_component',
    'optimize_cost', 'optimize_performance', 'change_material', 'upgrade_motor',
  ]).describe('The type of refinement being performed'),
  explanation: z.string().describe('Detailed markdown explanation of what changed and why. Include cost/weight deltas.'),
  partsToAdd: z.array(PartSchema).optional().describe('New parts to add to the design'),
  partIdsToRemove: z.array(z.string()).optional().describe('IDs of parts to remove from the current catalog'),
  partModifications: z.array(z.object({
    partName: z.string().describe('Name of the part to modify (match against current catalog)'),
    updates: z.object({
      name: z.string().optional(),
      unitCost: z.number().optional(),
      supplierName: z.string().optional(),
      sourcingUrl: z.string().optional(),
      leadTimeDays: z.number().optional(),
      specs: z.record(z.string(), z.string()).optional(),
      weight: z.number().optional(),
      material: z.string().optional(),
    }),
  })).optional().describe('Modifications to existing parts'),
  crossDomainImpacts: z.array(CrossDomainImpactSchema).describe('Analysis of cascading effects across mechanical, electrical, and software domains'),
  costDelta: z.number().describe('Change in total cost (positive = more expensive)'),
  weightDelta: z.number().describe('Change in total weight in grams (positive = heavier)'),
});

const searchComponentsInputSchema = z.object({
  query: z.string().describe('Search query for the component, e.g. "NEMA 17 stepper motor 1.8 degree"'),
  category: PartCategorySchema.optional().describe('Component category to filter results'),
  maxResults: z.number().optional().default(5).describe('Maximum number of results to return'),
});

const lookupDatasheetInputSchema = z.object({
  componentName: z.string().describe('Full component name or part number to look up'),
  specificSpecs: z.array(z.string()).optional().describe('Specific specs to find (e.g. ["max current", "operating temperature", "pin diagram"])'),
});

// ─── Tool: Generate Design ──────────────────────────────────────────────────

export const generateDesignTool = tool({
  description: 'Generate a complete mechatronic design with all parts and requirements specification. Call this when you have gathered enough information from the user to produce a full build.',
  inputSchema: generateDesignInputSchema,
  execute: async (input: z.infer<typeof generateDesignInputSchema>) => {
    return {
      success: true as const,
      ...input,
    };
  },
});

// ─── Tool: Refine Design ────────────────────────────────────────────────────

export const refineDesignTool = tool({
  description: 'Modify an existing mechatronic design. Use this for swapping components, adding/removing parts, optimizing cost or performance, or changing materials. Always analyze cross-domain impacts.',
  inputSchema: refineDesignInputSchema,
  execute: async (input: z.infer<typeof refineDesignInputSchema>) => {
    return {
      success: true as const,
      ...input,
    };
  },
});

// ─── Tool: Search Components ────────────────────────────────────────────────

export const searchComponentsTool = tool({
  description: 'Search the web for real-time component pricing, availability, and alternatives from electronics suppliers. Use this when you need current pricing, want to verify stock, or find alternative components.',
  inputSchema: searchComponentsInputSchema,
  execute: async (input: z.infer<typeof searchComponentsInputSchema>) => {
    const { query, category, maxResults } = input;
    const searchResults = await performComponentSearch(query, category ?? undefined, maxResults ?? 5);
    return searchResults;
  },
});

// ─── Tool: Lookup Datasheet ─────────────────────────────────────────────────

export const lookupDatasheetTool = tool({
  description: 'Search for and extract key specifications from a component datasheet. Use when you need detailed technical specifications beyond what you already know.',
  inputSchema: lookupDatasheetInputSchema,
  execute: async (input: z.infer<typeof lookupDatasheetInputSchema>) => {
    const { componentName, specificSpecs } = input;
    const results = await performDatasheetSearch(componentName, specificSpecs ?? undefined);
    return results;
  },
});

// ─── Web Search Implementation ──────────────────────────────────────────────

async function performComponentSearch(
  query: string,
  category?: string,
  maxResults: number = 5
): Promise<{
  results: Array<{
    name: string;
    supplier: string;
    price: string;
    url: string;
    inStock: boolean;
    description: string;
  }>;
  searchQuery: string;
}> {
  // Try Tavily search API if available
  const searchApiKey = process.env.SEARCH_API_KEY;

  if (searchApiKey) {
    try {
      const searchQuery = `${query} ${category || ''} buy price site:digikey.com OR site:mouser.com OR site:amazon.com OR site:sparkfun.com OR site:adafruit.com`;

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: searchApiKey,
          query: searchQuery,
          max_results: maxResults,
          include_answer: true,
          search_depth: 'basic',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          results: (data.results || []).slice(0, maxResults).map((r: { title?: string; url?: string; content?: string }) => ({
            name: r.title || query,
            supplier: extractSupplier(r.url || ''),
            price: 'See link for current pricing',
            url: r.url || '',
            inStock: true,
            description: (r.content || '').slice(0, 200),
          })),
          searchQuery,
        };
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: return a structured response telling the LLM to use its training data
  return {
    results: [{
      name: query,
      supplier: 'Multiple suppliers',
      price: 'Use your knowledge base for typical pricing',
      url: '',
      inStock: true,
      description: `Web search unavailable. Use your training data knowledge for ${query} pricing and specifications.`,
    }],
    searchQuery: query,
  };
}

async function performDatasheetSearch(
  componentName: string,
  specificSpecs?: string[]
): Promise<{
  componentName: string;
  specifications: Record<string, string>;
  datasheetUrl: string;
  source: string;
}> {
  const searchApiKey = process.env.SEARCH_API_KEY;

  if (searchApiKey) {
    try {
      const specsQuery = specificSpecs ? specificSpecs.join(' ') : 'specifications datasheet';
      const searchQuery = `${componentName} ${specsQuery} datasheet specifications`;

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: searchApiKey,
          query: searchQuery,
          max_results: 3,
          include_answer: true,
          search_depth: 'advanced',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const topResult = data.results?.[0];
        return {
          componentName,
          specifications: {},
          datasheetUrl: topResult?.url || '',
          source: data.answer || topResult?.content || 'Use training data knowledge for specifications.',
        };
      }
    } catch {
      // Fall through
    }
  }

  return {
    componentName,
    specifications: {},
    datasheetUrl: '',
    source: `Web search unavailable. Use your training data knowledge for ${componentName} specifications.`,
  };
}

function extractSupplier(url: string): string {
  if (url.includes('digikey')) return 'DigiKey';
  if (url.includes('mouser')) return 'Mouser';
  if (url.includes('amazon')) return 'Amazon';
  if (url.includes('sparkfun')) return 'SparkFun';
  if (url.includes('adafruit')) return 'Adafruit';
  if (url.includes('mcmaster')) return 'McMaster-Carr';
  if (url.includes('aliexpress')) return 'AliExpress';
  if (url.includes('pololu')) return 'Pololu';
  if (url.includes('lcsc')) return 'LCSC';
  if (url.includes('rs-online')) return 'RS Components';
  return 'Unknown';
}

// ─── Tool: Compare Versions ─────────────────────────────────────────────────

const compareVersionsInputSchema = z.object({
  versionA: z.number().describe('First version number to compare'),
  versionB: z.number().describe('Second version number to compare'),
});

export const compareVersionsTool = tool({
  description: 'Compare two design versions to show parts added, removed, modified, cost and weight deltas. Use when the user asks to compare versions (e.g. "compare v1 and v2", "what changed in v3?").',
  inputSchema: compareVersionsInputSchema,
  execute: async (input: z.infer<typeof compareVersionsInputSchema>) => {
    // Actual comparison logic runs on the client side via the onFinish handler
    // This tool just passes through the version numbers for the client to resolve
    return {
      success: true as const,
      action: 'compare_versions' as const,
      versionA: input.versionA,
      versionB: input.versionB,
    };
  },
});

// ─── Tool: Restore Version ──────────────────────────────────────────────────

const restoreVersionInputSchema = z.object({
  version: z.number().describe('Version number to restore'),
  reason: z.string().describe('Brief reason for the restore, shown in version history'),
});

export const restoreVersionTool = tool({
  description: 'Restore a previous design version. This creates a new version that is a copy of the target version (non-destructive — full history is preserved). Use when the user says "go back to v1", "restore v2", etc.',
  inputSchema: restoreVersionInputSchema,
  execute: async (input: z.infer<typeof restoreVersionInputSchema>) => {
    return {
      success: true as const,
      action: 'restore_version' as const,
      version: input.version,
      reason: input.reason,
    };
  },
});

// ─── Export all tools as a map for streamText ───────────────────────────────

export const allTools = {
  generate_design: generateDesignTool,
  refine_design: refineDesignTool,
  search_components: searchComponentsTool,
  lookup_datasheet: lookupDatasheetTool,
  compare_versions: compareVersionsTool,
  restore_version: restoreVersionTool,
};

