// ─── Mock Refinement Engine ─────────────────────────────────────────────────
// Handles iterative design modifications requested through the chat agent.
// Detects user intent (swap, resize, add, remove, optimize) and returns
// updated parts + explanation text.

import type { PartDefinition, PartCategory, ManufacturingMethod, SourceType } from '@/types/parts';
import { generateProceduralConfig } from './mock-parts-generator';

export type RefinementIntent =
  | 'swap_component'
  | 'resize_part'
  | 'add_capability'
  | 'remove_component'
  | 'optimize_cost'
  | 'optimize_performance'
  | 'change_material'
  | 'upgrade_motor'
  | 'unknown';

interface RefinementResult {
  intent: RefinementIntent;
  explanation: string;
  partsAdded: PartDefinition[];
  partsRemoved: string[]; // part IDs to remove
  partsModified: { partId: string; updates: Partial<PartDefinition> }[];
  costDelta: number;
  weightDelta: number;
  crossDomainImpacts: CrossDomainImpact[];
}

interface CrossDomainImpact {
  domain: 'mechanics' | 'electronics' | 'software';
  severity: 'info' | 'warning' | 'critical';
  description: string;
  recommendation: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Build a complete PartDefinition with proper asset wrapping */
function makeRefinementPart(overrides: {
  id: string;
  name: string;
  category: PartCategory;
  sourceType: SourceType;
  manufacturingMethod: ManufacturingMethod;
  unitCost: number;
  weight: number;
  dimensions: { x: number; y: number; z: number };
  color: string;
  specs: Record<string, string>;
  description?: string;
  material?: string;
  supplierName?: string;
  sourcingUrl?: string;
  leadTimeDays?: number;
}): PartDefinition {
  return {
    id: overrides.id,
    name: overrides.name,
    category: overrides.category,
    sourceType: overrides.sourceType,
    manufacturingMethod: overrides.manufacturingMethod,
    description: overrides.description ?? '',
    dimensions: overrides.dimensions,
    weight: overrides.weight,
    material: overrides.material ?? 'Mixed',
    color: overrides.color,
    unitCost: overrides.unitCost,
    sourcingUrl: overrides.sourcingUrl,
    supplierName: overrides.supplierName,
    leadTimeDays: overrides.leadTimeDays ?? 3,
    specs: overrides.specs,
    asset: {
      type: 'procedural',
      generationStatus: 'ready',
      proceduralConfig: generateProceduralConfig(overrides.category, overrides.dimensions),
    },
    mountPoints: [],
  };
}

// ─── Intent Detection ─────────────────────────────────────────────────────

const INTENT_PATTERNS: { pattern: RegExp; intent: RefinementIntent }[] = [
  { pattern: /swap|replace|switch|alternative|instead/i, intent: 'swap_component' },
  { pattern: /resize|bigger|smaller|larger|shrink|expand|dimension/i, intent: 'resize_part' },
  { pattern: /add|include|integrate|attach|mount|extra/i, intent: 'add_capability' },
  { pattern: /remove|delete|drop|eliminate|strip/i, intent: 'remove_component' },
  { pattern: /cheap|cost|budget|save|affordable|economize/i, intent: 'optimize_cost' },
  { pattern: /strong|torque|power|performance|fast|speed|heavy|load|lift|capacity/i, intent: 'optimize_performance' },
  { pattern: /material|metal|aluminum|plastic|carbon|steel|wood/i, intent: 'change_material' },
  { pattern: /motor|upgrade|nema|stepper|servo|brushless/i, intent: 'upgrade_motor' },
];

function detectIntent(message: string): RefinementIntent {
  for (const { pattern, intent } of INTENT_PATTERNS) {
    if (pattern.test(message)) return intent;
  }
  return 'unknown';
}

// ─── Refinement Generators ─────────────────────────────────────────────────

function generateSwapResult(message: string, catalog: PartDefinition[]): RefinementResult {
  const targetPart = catalog.find(
    (p) => p.category === 'actuator' || p.category === 'controller'
  );

  if (!targetPart) {
    return emptyResult('swap_component', 'No swappable component found. Try specifying which part to replace.');
  }

  const isActuator = targetPart.category === 'actuator';
  const replacement = makeRefinementPart({
    id: `part_swap_${Date.now()}`,
    name: isActuator ? 'MG996R Servo Motor' : 'Raspberry Pi Pico W',
    category: isActuator ? 'actuator' : 'controller',
    sourceType: 'sourced',
    manufacturingMethod: 'off_the_shelf',
    unitCost: isActuator ? 4.99 : 5.49,
    weight: isActuator ? 55 : 3,
    specs: isActuator
      ? { torque: '11kg·cm', speed: '0.17s/60°', voltage: '4.8-7.2V', type: 'servo' }
      : { cores: '2', clock: '133MHz', ram: '264KB', wireless: 'Wi-Fi + BLE' },
    supplierName: isActuator ? 'Amazon' : 'Sparkfun',
    sourcingUrl: isActuator ? 'https://amazon.com/mg996r' : 'https://sparkfun.com/pico-w',
    dimensions: isActuator ? { x: 40, y: 19, z: 43 } : { x: 51, y: 21, z: 3.3 },
    color: isActuator ? '#1a1a2e' : '#0d47a1',
    material: isActuator ? 'Plastic/Metal Gears' : 'PCB/FR4',
  });

  const costDelta = replacement.unitCost - targetPart.unitCost;
  const weightDelta = replacement.weight - targetPart.weight;

  return {
    intent: 'swap_component',
    explanation: `## 🔄 Component Swapped\n\n**${targetPart.name}** → **${replacement.name}**\n\n### Changes\n- Cost: ${costDelta >= 0 ? '+' : ''}$${costDelta.toFixed(2)}\n- Weight: ${weightDelta >= 0 ? '+' : ''}${weightDelta}g\n- ${isActuator ? 'Now using servo control (PWM) instead of stepper (step/dir)' : 'Upgraded to wireless-capable microcontroller'}\n\n${isActuator ? 'The servo provides simpler control at the expense of positional accuracy.' : 'The Pico W adds native Wi-Fi and BLE for wireless control.'}`,
    partsAdded: [replacement],
    partsRemoved: [targetPart.id],
    partsModified: [],
    costDelta,
    weightDelta,
    crossDomainImpacts: [
      {
        domain: 'software',
        severity: 'warning',
        description: isActuator
          ? 'Motor control code must switch from step/dir to PWM servo library'
          : 'Firmware must be recompiled for RP2040 architecture',
        recommendation: isActuator
          ? 'Use Servo.h library with 50Hz PWM signal'
          : 'Port to Pico SDK or MicroPython',
      },
      {
        domain: 'electronics',
        severity: 'info',
        description: isActuator
          ? 'Servo needs separate 5-6V power rail — cannot share with logic'
          : 'Pico W runs on 3.3V logic — check sensor voltage compatibility',
        recommendation: isActuator
          ? 'Add a voltage regulator or use BEC from battery'
          : 'Add level shifters for 5V sensors',
      },
    ],
  };
}

function generateUpgradeMotorResult(message: string, catalog: PartDefinition[]): RefinementResult {
  const motor = catalog.find((p) => p.category === 'actuator');

  if (!motor) {
    return emptyResult('upgrade_motor', 'No motor found in current design to upgrade.');
  }

  const upgraded = makeRefinementPart({
    id: `part_upgrade_${Date.now()}`,
    name: 'NEMA 23 Stepper Motor (2.8A)',
    category: 'actuator',
    sourceType: 'sourced',
    manufacturingMethod: 'off_the_shelf',
    unitCost: 24.99,
    weight: 600,
    specs: { torque: '1.26N·m', stepAngle: '1.8°', current: '2.8A', holdingTorque: '1.26N·m' },
    dimensions: { x: 57, y: 57, z: 56 },
    color: '#2a2a2a',
    material: 'Steel/Aluminum',
  });

  const costDelta = upgraded.unitCost - motor.unitCost;
  const weightDelta = upgraded.weight - motor.weight;

  return {
    intent: 'upgrade_motor',
    explanation: `## ⚡ Motor Upgraded\n\n**${motor.name}** → **${upgraded.name}**\n\n### Performance Gains\n- Torque: **3× increase** (1.26 N·m vs ~0.4 N·m)\n- Holding torque: 1.26 N·m — excellent for heavy loads\n- Cost: +$${costDelta.toFixed(2)} per motor\n- Weight: +${weightDelta}g per motor\n\n### Trade-offs\n⚠️ Higher current draw (2.8A vs 1.2A) — power system must be reviewed\n⚠️ Larger physical size (NEMA 23 frame) — mounting brackets need redesign\n\nThe upgraded motor can handle significantly heavier payloads and provides better positional accuracy under load.`,
    partsAdded: [upgraded],
    partsRemoved: [motor.id],
    partsModified: [],
    costDelta,
    weightDelta,
    crossDomainImpacts: [
      {
        domain: 'electronics',
        severity: 'critical',
        description: 'Motor draws 2.8A — existing TMC2209 driver may overheat without heatsink',
        recommendation: 'Add active cooling to driver or upgrade to TMC5160 (up to 4.4A)',
      },
      {
        domain: 'mechanics',
        severity: 'warning',
        description: 'NEMA 23 frame is 57×57mm vs NEMA 17 42×42mm — bracket redesign needed',
        recommendation: 'Regenerate motor mounting brackets for NEMA 23 bolt pattern (47.14mm)',
      },
      {
        domain: 'electronics',
        severity: 'warning',
        description: 'Higher current draw may exceed battery discharge rate',
        recommendation: 'Consider upgrading to 3S 3300mAh LiPo or add second battery pack',
      },
    ],
  };
}

function generateAddCapabilityResult(message: string, _catalog: PartDefinition[]): RefinementResult {
  const isCamera = /camera|vision|image|see|opencv/i.test(message);
  const isGPS = /gps|location|position|navigate|map/i.test(message);
  const isLidar = /lidar|laser|scan|map|3d scan/i.test(message);

  let newPart: PartDefinition;

  if (isCamera) {
    newPart = makeRefinementPart({
      id: `part_camera_${Date.now()}`,
      name: 'OV5647 Camera Module (5MP)',
      category: 'sensor',
      sourceType: 'sourced',
      manufacturingMethod: 'off_the_shelf',
      unitCost: 7.99,
      weight: 3,
      dimensions: { x: 25, y: 24, z: 9 },
      color: '#0d47a1',
      specs: { resolution: '2592×1944', fov: '62.2°', interface: 'CSI', fps: '30fps@1080p' },
      supplierName: 'Amazon',
      sourcingUrl: 'https://amazon.com/ov5647',
      leadTimeDays: 3,
      material: 'PCB/Plastic',
    });
  } else if (isGPS) {
    newPart = makeRefinementPart({
      id: `part_gps_${Date.now()}`,
      name: 'NEO-6M GPS Module',
      category: 'sensor',
      sourceType: 'sourced',
      manufacturingMethod: 'off_the_shelf',
      unitCost: 6.49,
      weight: 12,
      dimensions: { x: 36, y: 25, z: 4 },
      color: '#1b5e20',
      specs: { channels: '50', accuracy: '2.5m CEP', updateRate: '5Hz', interface: 'UART' },
      supplierName: 'Amazon',
      sourcingUrl: 'https://amazon.com/neo6m',
      leadTimeDays: 3,
      material: 'PCB/FR4',
    });
  } else if (isLidar) {
    newPart = makeRefinementPart({
      id: `part_lidar_${Date.now()}`,
      name: 'TF-Luna LiDAR (0.2-8m)',
      category: 'sensor',
      sourceType: 'sourced',
      manufacturingMethod: 'off_the_shelf',
      unitCost: 24.99,
      weight: 5,
      dimensions: { x: 35, y: 21, z: 13.5 },
      color: '#4a148c',
      specs: { range: '0.2-8m', accuracy: '±6cm', fov: '2°', interface: 'UART/I2C' },
      supplierName: 'Sparkfun',
      sourcingUrl: 'https://sparkfun.com/tf-luna',
      leadTimeDays: 5,
      material: 'Metal/Optical',
    });
  } else {
    newPart = makeRefinementPart({
      id: `part_imu_${Date.now()}`,
      name: 'MPU-6050 IMU (6-Axis)',
      category: 'sensor',
      sourceType: 'sourced',
      manufacturingMethod: 'off_the_shelf',
      unitCost: 2.99,
      weight: 2,
      dimensions: { x: 20, y: 16, z: 3 },
      color: '#e65100',
      specs: { axes: '6 (3-accel + 3-gyro)', interface: 'I2C', resolution: '16-bit', range: '±16g / ±2000°/s' },
      supplierName: 'Amazon',
      sourcingUrl: 'https://amazon.com/mpu6050',
      leadTimeDays: 3,
      material: 'PCB/FR4',
    });
  }

  const mountBracket = makeRefinementPart({
    id: `part_mount_${Date.now() + 1}`,
    name: `${newPart.name.split(' ')[0]} Mounting Bracket`,
    category: 'structural',
    sourceType: 'manufactured',
    manufacturingMethod: '3d_printed_fdm',
    unitCost: 1.25,
    weight: 8,
    dimensions: { x: newPart.dimensions.x + 10, y: 3, z: newPart.dimensions.z + 10 },
    color: '#b0b8c4',
    specs: { material: 'PLA', printTime: '35min', infill: '40%' },
    leadTimeDays: 1,
    material: 'PLA',
  });

  return {
    intent: 'add_capability',
    explanation: `## ➕ New Component Added\n\n**${newPart.name}** has been integrated into your design.\n\n### Component Details\n${Object.entries(newPart.specs).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}\n\n### Also Added\n- **${mountBracket.name}** — 3D printed mounting bracket ($${mountBracket.unitCost.toFixed(2)})\n\n### Total Impact\n- Cost: +$${(newPart.unitCost + mountBracket.unitCost).toFixed(2)}\n- Weight: +${newPart.weight + mountBracket.weight}g\n\nThe sensor has been placed on the chassis and wired to the main controller.`,
    partsAdded: [newPart, mountBracket],
    partsRemoved: [],
    partsModified: [],
    costDelta: newPart.unitCost + mountBracket.unitCost,
    weightDelta: newPart.weight + mountBracket.weight,
    crossDomainImpacts: [
      {
        domain: 'software',
        severity: 'info',
        description: `Driver library needed for ${newPart.name.split(' ')[0]} sensor`,
        recommendation: `Install appropriate Arduino/MicroPython library and add initialization code`,
      },
      {
        domain: 'electronics',
        severity: 'info',
        description: `${newPart.name} uses ${newPart.specs.interface || 'I2C'} — check bus availability`,
        recommendation: 'Verify I2C/UART pins are available on the microcontroller',
      },
    ],
  };
}

function generateOptimizeCostResult(catalog: PartDefinition[]): RefinementResult {
  const modifications: { partId: string; updates: Partial<PartDefinition> }[] = [];
  let totalSaved = 0;

  for (const part of catalog) {
    if (part.sourceType === 'sourced' && part.unitCost > 10) {
      const savings = part.unitCost * 0.2;
      modifications.push({
        partId: part.id,
        updates: {
          unitCost: parseFloat((part.unitCost - savings).toFixed(2)),
          supplierName: 'AliExpress',
          leadTimeDays: (part.leadTimeDays || 3) + 7,
        },
      });
      totalSaved += savings;
    }
  }

  return {
    intent: 'optimize_cost',
    explanation: `## 💰 Cost Optimization Applied\n\nI've found equivalent components from alternative suppliers at lower cost.\n\n### Savings Summary\n- **${modifications.length} components** switched to budget suppliers\n- **Total savings: $${totalSaved.toFixed(2)}**\n- Trade-off: Lead time increased by ~7 days for sourced components\n\n### Details\n${modifications.map((m) => {
      const part = catalog.find((p) => p.id === m.partId);
      return `- **${part?.name}**: $${part?.unitCost.toFixed(2)} → $${m.updates.unitCost?.toFixed(2)} (via ${m.updates.supplierName})`;
    }).join('\n')}\n\n> 💡 Tip: You can mix suppliers — keep critical components from premium vendors and switch commodity parts to budget alternatives.`,
    partsAdded: [],
    partsRemoved: [],
    partsModified: modifications,
    costDelta: -totalSaved,
    weightDelta: 0,
    crossDomainImpacts: [
      {
        domain: 'mechanics',
        severity: 'info',
        description: 'Budget components may have wider tolerances',
        recommendation: 'Consider adding ±0.5mm tolerance to structural fitments',
      },
    ],
  };
}

function emptyResult(intent: RefinementIntent, explanation: string): RefinementResult {
  return {
    intent,
    explanation,
    partsAdded: [],
    partsRemoved: [],
    partsModified: [],
    costDelta: 0,
    weightDelta: 0,
    crossDomainImpacts: [],
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────

export function processRefinementRequest(
  userMessage: string,
  currentCatalog: PartDefinition[]
): RefinementResult {
  const intent = detectIntent(userMessage);

  switch (intent) {
    case 'swap_component':
      return generateSwapResult(userMessage, currentCatalog);
    case 'upgrade_motor':
      return generateUpgradeMotorResult(userMessage, currentCatalog);
    case 'add_capability':
      return generateAddCapabilityResult(userMessage, currentCatalog);
    case 'optimize_cost':
      return generateOptimizeCostResult(currentCatalog);
    case 'resize_part':
      return emptyResult('resize_part', `## 📐 Resize Request\n\nI've noted your dimension change. In a production system, this would trigger parametric model regeneration.\n\n> This feature requires the parametric CAD engine (Phase 2).`);
    case 'remove_component':
      return emptyResult('remove_component', `## 🗑️ Remove Component\n\nPlease select the part in the 3D configurator and click "Remove Part" in the inspector panel, or tell me the specific component name to remove.`);
    case 'change_material':
      return emptyResult('change_material', `## 🧱 Material Change\n\nMaterial changes are queued. In a production system, this would update manufacturing parameters and cost estimates.\n\n> Parametric material system coming in Phase 2.`);
    case 'optimize_performance':
      return generateUpgradeMotorResult(userMessage, currentCatalog);
    default:
      return emptyResult('unknown', `I understand you want to modify the design. Could you be more specific?\n\nI can help you:\n- **Swap** a component for an alternative\n- **Add** new sensors, actuators, or capabilities\n- **Upgrade** motors for more torque/speed\n- **Optimize** for cost or performance\n- **Remove** unnecessary components\n\nTry: "upgrade the motors for higher torque" or "add a camera sensor"`);
  }
}

export function formatCrossDomainImpacts(impacts: CrossDomainImpact[]): string {
  if (impacts.length === 0) return '';

  const domainEmoji: Record<string, string> = {
    mechanics: '⚙️',
    electronics: '⚡',
    software: '💻',
  };

  let md = '\n\n### 🔗 Cross-Domain Impact Analysis\n\n';
  for (const impact of impacts) {
    const emoji = domainEmoji[impact.domain] || '📌';
    const sev = impact.severity.toUpperCase();
    md += `${emoji} **[${sev}] ${impact.domain}**: ${impact.description}\n`;
    md += `→ _${impact.recommendation}_\n\n`;
  }
  return md;
}
