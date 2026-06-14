// ─── Mock Parts Generator ───────────────────────────────────────────────────
// Generates realistic part specifications based on detected project type.
// No API key required — provides full testability.

import type { PartDefinition, PartCategory, SourceType, ManufacturingMethod, MaterialType } from '@/types/parts';

export type ProjectTemplate = 'rover' | 'arm' | 'hexapod' | 'generic';

function detectProjectType(description: string): ProjectTemplate {
  const lower = description.toLowerCase();
  if (/rover|wheel|car|vehicle|mobile|drive|navigate/.test(lower)) return 'rover';
  if (/arm|gripper|pick|manipulat|grab|robot\s*arm|delta/.test(lower)) return 'arm';
  if (/hexapod|walk|leg|spider|biped|quadruped/.test(lower)) return 'hexapod';
  return 'generic';
}

let partIdCounter = 0;
function nextPartId(prefix: string): string {
  partIdCounter++;
  return `${prefix}-${partIdCounter.toString().padStart(3, '0')}`;
}

function makePart(
  overrides: Partial<PartDefinition> & { name: string; category: PartCategory }
): PartDefinition {
  const id = nextPartId(overrides.category);
  return {
    id,
    name: overrides.name,
    category: overrides.category,
    sourceType: overrides.sourceType ?? 'sourced',
    manufacturingMethod: overrides.manufacturingMethod ?? 'off_the_shelf',
    description: overrides.description ?? '',
    dimensions: overrides.dimensions ?? { x: 40, y: 40, z: 40 },
    weight: overrides.weight ?? 100,
    material: overrides.material ?? 'ABS Plastic',
    color: overrides.color ?? '#555555',
    unitCost: overrides.unitCost ?? 10,
    sourcingUrl: overrides.sourcingUrl,
    supplierName: overrides.supplierName,
    supplierSKU: overrides.supplierSKU,
    leadTimeDays: overrides.leadTimeDays ?? 3,
    specs: overrides.specs ?? {},
    asset: overrides.asset ?? {
      type: 'procedural',
      generationStatus: 'ready',
      proceduralConfig: {
        baseShape: 'box',
        dimensions: [1, 1, 1],
        features: [],
        materialType: 'plastic',
      },
    },
    mountPoints: overrides.mountPoints ?? [],
    assemblyNotes: overrides.assemblyNotes,
  };
}

// ─── ROVER TEMPLATE ───────────────────────────────────────────────────────

function generateRoverParts(): PartDefinition[] {
  return [
    makePart({
      name: 'Aluminum Chassis Plate (200×150×3mm)',
      category: 'chassis',
      sourceType: 'manufactured',
      manufacturingMethod: 'laser_cut',
      description: 'Main structural chassis plate, 6061 aluminum, laser-cut with mounting holes for motors and electronics.',
      dimensions: { x: 200, y: 3, z: 150 },
      weight: 243,
      material: 'Aluminum 6061-T6',
      color: '#b0b8c4',
      unitCost: 18.50,
      supplierName: 'SendCutSend',
      leadTimeDays: 5,
      specs: { 'Thickness': '3mm', 'Finish': 'Brushed', 'Tolerance': '±0.1mm' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [2, 0.06, 1.5], features: [], materialType: 'metallic', color: '#b0b8c4' } },
      mountPoints: [
        { id: 'mp-fl', position: [-0.8, -0.03, 0.6], rotation: [0, 0, 0], compatibleCategories: ['actuator', 'structural'] },
        { id: 'mp-fr', position: [0.8, -0.03, 0.6], rotation: [0, 0, 0], compatibleCategories: ['actuator', 'structural'] },
        { id: 'mp-rl', position: [-0.8, -0.03, -0.6], rotation: [0, 0, 0], compatibleCategories: ['actuator', 'structural'] },
        { id: 'mp-rr', position: [0.8, -0.03, -0.6], rotation: [0, 0, 0], compatibleCategories: ['actuator', 'structural'] },
        { id: 'mp-top', position: [0, 0.03, 0], rotation: [0, 0, 0], compatibleCategories: ['controller', 'power', 'sensor'] },
      ],
    }),
    makePart({
      name: 'NEMA 17 Stepper Motor (42×34mm)',
      category: 'actuator',
      sourceType: 'sourced',
      description: 'Bipolar stepper motor, 200 steps/rev, 1.8° step angle. Ideal for precise wheel control.',
      dimensions: { x: 42, y: 34, z: 42 },
      weight: 280,
      material: 'Steel/Aluminum',
      color: '#2a2a2a',
      unitCost: 12.99,
      sourcingUrl: 'https://www.digikey.com/en/products/detail/example/nema17',
      supplierName: 'DigiKey',
      supplierSKU: 'MOT-NEMA17-42-34',
      leadTimeDays: 2,
      specs: { 'Torque': '0.45 Nm', 'Current': '1.5A', 'Steps/Rev': '200', 'Voltage': '12V', 'Shaft Dia.': '5mm' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'cylinder', dimensions: [0.42, 0.34, 0.42], features: [{ type: 'shaft', position: [0, 0.17, 0], dimensions: { diameter: 0.05, length: 0.24 } }], materialType: 'metallic', color: '#2a2a2a' } },
    }),
    makePart({
      name: 'Motor Mounting Bracket (L-Shape)',
      category: 'structural',
      sourceType: 'manufactured',
      manufacturingMethod: '3d_printed_fdm',
      description: 'Custom L-bracket for NEMA 17 motor mounting. PLA+ with 80% infill for rigidity.',
      dimensions: { x: 50, y: 45, z: 42 },
      weight: 22,
      material: 'PLA+',
      color: '#1a1a2e',
      unitCost: 2.10,
      leadTimeDays: 1,
      specs: { 'Infill': '80%', 'Layer Height': '0.2mm', 'Print Time': '~45min' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [0.5, 0.45, 0.42], features: [], materialType: 'plastic', color: '#1a1a2e' } },
    }),
    makePart({
      name: 'Rubber Wheel (65mm Diameter)',
      category: 'wheel',
      sourceType: 'sourced',
      description: '65mm diameter rubber wheel with 5mm bore hub, high-grip tread pattern.',
      dimensions: { x: 65, y: 28, z: 65 },
      weight: 35,
      material: 'Rubber/Plastic Hub',
      color: '#1a1a1a',
      unitCost: 3.49,
      sourcingUrl: 'https://www.amazon.com/dp/example-wheel',
      supplierName: 'Amazon',
      leadTimeDays: 2,
      specs: { 'Diameter': '65mm', 'Width': '28mm', 'Bore': '5mm', 'Tread': 'High-grip' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'cylinder', dimensions: [0.65, 0.28, 0.65], features: [], materialType: 'rubber', color: '#1a1a1a' } },
    }),
    makePart({
      name: 'ESP32-WROOM-32E DevKit',
      category: 'controller',
      sourceType: 'sourced',
      description: 'ESP32 development board with WiFi/BT, dual-core 240MHz, 4MB flash. Main controller.',
      dimensions: { x: 51, y: 7, z: 25 },
      weight: 10,
      material: 'PCB/FR4',
      color: '#1b5e20',
      unitCost: 8.99,
      sourcingUrl: 'https://www.mouser.com/ProductDetail/example-esp32',
      supplierName: 'Mouser',
      supplierSKU: 'ESP32-DEVKITC-32E',
      leadTimeDays: 2,
      specs: { 'CPU': 'Dual-core 240MHz', 'RAM': '520KB', 'Flash': '4MB', 'WiFi': '802.11 b/g/n', 'BT': '4.2 + BLE', 'GPIO': '34 pins' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [0.51, 0.07, 0.25], features: [], materialType: 'pcb', color: '#1b5e20' } },
    }),
    makePart({
      name: 'TMC2209 Stepper Driver Module',
      category: 'controller',
      sourceType: 'sourced',
      description: 'Silent stepper driver with StealthChop2, up to 2A RMS. UART interface.',
      dimensions: { x: 20, y: 8, z: 15 },
      weight: 4,
      material: 'PCB/FR4',
      color: '#4a148c',
      unitCost: 5.49,
      sourcingUrl: 'https://www.digikey.com/en/products/detail/example/tmc2209',
      supplierName: 'DigiKey',
      supplierSKU: 'TMC2209-V3',
      leadTimeDays: 2,
      specs: { 'Max Current': '2A RMS', 'Microstepping': 'up to 256', 'Interface': 'UART/Step-Dir', 'Voltage': '4.75-29V' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [0.2, 0.08, 0.15], features: [], materialType: 'pcb', color: '#4a148c' } },
    }),
    makePart({
      name: 'Li-Po Battery 2200mAh 3S 11.1V',
      category: 'power',
      sourceType: 'sourced',
      description: '3-cell LiPo battery, 25C continuous discharge, XT60 connector.',
      dimensions: { x: 105, y: 34, z: 24 },
      weight: 183,
      material: 'Lithium Polymer',
      color: '#e65100',
      unitCost: 19.99,
      sourcingUrl: 'https://www.amazon.com/dp/example-lipo',
      supplierName: 'Amazon',
      supplierSKU: 'TATTU-2200-3S',
      leadTimeDays: 2,
      specs: { 'Capacity': '2200mAh', 'Voltage': '11.1V (3S)', 'Discharge': '25C', 'Connector': 'XT60', 'Runtime': '~90 min' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [1.05, 0.34, 0.24], features: [], materialType: 'plastic', color: '#e65100' } },
    }),
    makePart({
      name: 'HC-SR04 Ultrasonic Sensor',
      category: 'sensor',
      sourceType: 'sourced',
      description: 'Ultrasonic ranging module, 2cm-400cm range, 15° beam angle.',
      dimensions: { x: 45, y: 20, z: 15 },
      weight: 9,
      material: 'PCB/Plastic',
      color: '#0d47a1',
      unitCost: 2.99,
      sourcingUrl: 'https://www.digikey.com/en/products/detail/example/hcsr04',
      supplierName: 'DigiKey',
      leadTimeDays: 2,
      specs: { 'Range': '2cm - 400cm', 'Accuracy': '±3mm', 'Beam Angle': '15°', 'Voltage': '5V', 'Trigger': '10µs pulse' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [0.45, 0.2, 0.15], features: [{ type: 'hole', position: [-0.12, 0, 0.07], dimensions: { diameter: 0.16 } }, { type: 'hole', position: [0.12, 0, 0.07], dimensions: { diameter: 0.16 } }], materialType: 'pcb', color: '#0d47a1' } },
    }),
    makePart({
      name: 'Sensor Mounting Bracket',
      category: 'structural',
      sourceType: 'manufactured',
      manufacturingMethod: '3d_printed_fdm',
      description: 'Front-facing sensor mount, adjustable angle. PLA+ construction.',
      dimensions: { x: 55, y: 30, z: 20 },
      weight: 8,
      material: 'PLA+',
      color: '#1a1a2e',
      unitCost: 0.95,
      leadTimeDays: 1,
      specs: { 'Infill': '60%', 'Adjustable': 'Yes (±30°)' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [0.55, 0.3, 0.2], features: [], materialType: 'plastic', color: '#1a1a2e' } },
    }),
    makePart({
      name: 'M3×8mm Socket Head Cap Screw (pack of 24)',
      category: 'fastener',
      sourceType: 'sourced',
      description: 'ISO 4762, Grade 12.9, black oxide finish.',
      dimensions: { x: 3, y: 8, z: 3 },
      weight: 2,
      material: 'Alloy Steel',
      color: '#333333',
      unitCost: 4.99,
      sourcingUrl: 'https://www.mcmaster.com/91290A113',
      supplierName: 'McMaster-Carr',
      supplierSKU: '91290A113',
      leadTimeDays: 1,
      specs: { 'Thread': 'M3×0.5', 'Length': '8mm', 'Head': 'Socket Cap', 'Grade': '12.9', 'Qty': '24' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'cylinder', dimensions: [0.03, 0.08, 0.03], features: [], materialType: 'metallic', color: '#333333' } },
    }),
    makePart({
      name: 'M3 Hex Nut DIN 934 (pack of 24)',
      category: 'fastener',
      sourceType: 'sourced',
      description: 'Standard hex nut, zinc plated.',
      dimensions: { x: 5.5, y: 2.4, z: 5.5 },
      weight: 1,
      material: 'Steel (Zinc)',
      color: '#aaaaaa',
      unitCost: 2.49,
      sourcingUrl: 'https://www.mcmaster.com/90591A250',
      supplierName: 'McMaster-Carr',
      supplierSKU: '90591A250',
      leadTimeDays: 1,
      specs: { 'Thread': 'M3×0.5', 'Width': '5.5mm', 'Height': '2.4mm', 'Qty': '24' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'cylinder', dimensions: [0.055, 0.024, 0.055], features: [], materialType: 'metallic', color: '#aaaaaa' } },
    }),
    makePart({
      name: 'GT2 Timing Belt (200mm loop)',
      category: 'transmission',
      sourceType: 'sourced',
      description: '2mm pitch, 6mm width closed loop timing belt for power transmission.',
      dimensions: { x: 64, y: 6, z: 64 },
      weight: 8,
      material: 'Neoprene/Fiberglass',
      color: '#222222',
      unitCost: 3.99,
      sourcingUrl: 'https://www.amazon.com/dp/example-gt2belt',
      supplierName: 'Amazon',
      leadTimeDays: 2,
      specs: { 'Pitch': '2mm', 'Width': '6mm', 'Length': '200mm', 'Teeth': '100' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'cylinder', dimensions: [0.64, 0.06, 0.64], features: [], materialType: 'rubber', color: '#222222' } },
    }),
  ];
}

// ─── ARM TEMPLATE ─────────────────────────────────────────────────────────

function generateArmParts(): PartDefinition[] {
  return [
    makePart({
      name: 'Circular Base Plate (Ø160×5mm)',
      category: 'chassis',
      sourceType: 'manufactured',
      manufacturingMethod: 'cnc_milled',
      description: 'Heavy base plate for robotic arm stability. CNC machined aluminum with mounting holes.',
      dimensions: { x: 160, y: 5, z: 160 },
      weight: 540,
      material: 'Aluminum 6061-T6',
      color: '#c0c8d0',
      unitCost: 24.00,
      leadTimeDays: 5,
      specs: { 'Diameter': '160mm', 'Thickness': '5mm', 'Finish': 'Anodized' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'cylinder', dimensions: [1.6, 0.05, 1.6], features: [], materialType: 'metallic', color: '#c0c8d0' } },
    }),
    makePart({
      name: 'MG996R Servo Motor (High Torque)',
      category: 'actuator',
      sourceType: 'sourced',
      description: 'Metal gear digital servo, 11kg·cm torque at 6V. For joint actuation.',
      dimensions: { x: 40, y: 36, z: 20 },
      weight: 55,
      material: 'Plastic/Metal Gears',
      color: '#1565c0',
      unitCost: 6.99,
      sourcingUrl: 'https://www.amazon.com/dp/example-mg996r',
      supplierName: 'Amazon',
      leadTimeDays: 2,
      specs: { 'Torque': '11 kg·cm (6V)', 'Speed': '0.17s/60° (6V)', 'Voltage': '4.8-7.2V', 'Gear': 'Metal' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [0.4, 0.36, 0.2], features: [{ type: 'shaft', position: [0, 0.18, 0], dimensions: { diameter: 0.06, length: 0.08 } }], materialType: 'plastic', color: '#1565c0' } },
    }),
    makePart({
      name: 'Arm Link Segment (120mm)',
      category: 'structural',
      sourceType: 'manufactured',
      manufacturingMethod: '3d_printed_fdm',
      description: 'Structural arm link connecting joints. PETG for strength and slight flex tolerance.',
      dimensions: { x: 30, y: 120, z: 15 },
      weight: 28,
      material: 'PETG',
      color: '#37474f',
      unitCost: 3.20,
      leadTimeDays: 1,
      specs: { 'Length': '120mm', 'Infill': '70%', 'Print Time': '~1.5hr' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [0.3, 1.2, 0.15], features: [], materialType: 'plastic', color: '#37474f' } },
    }),
    makePart({
      name: 'Parallel Jaw Gripper Assembly',
      category: 'end_effector',
      sourceType: 'manufactured',
      manufacturingMethod: '3d_printed_fdm',
      description: 'Two-finger parallel gripper with SG90 servo actuation. 40mm max opening.',
      dimensions: { x: 60, y: 45, z: 35 },
      weight: 42,
      material: 'PLA+',
      color: '#ff6f00',
      unitCost: 4.50,
      leadTimeDays: 1,
      specs: { 'Max Opening': '40mm', 'Grip Force': '~5N', 'Actuation': 'SG90 Servo' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [0.6, 0.45, 0.35], features: [], materialType: 'plastic', color: '#ff6f00' } },
    }),
    makePart({
      name: 'Arduino Mega 2560 R3',
      category: 'controller',
      sourceType: 'sourced',
      description: 'ATmega2560 microcontroller, 54 digital I/O, 16 analog inputs. For multi-servo control.',
      dimensions: { x: 101, y: 15, z: 53 },
      weight: 37,
      material: 'PCB/FR4',
      color: '#006064',
      unitCost: 14.99,
      sourcingUrl: 'https://www.digikey.com/en/products/detail/example/mega2560',
      supplierName: 'DigiKey',
      leadTimeDays: 2,
      specs: { 'MCU': 'ATmega2560', 'Clock': '16MHz', 'Digital I/O': '54', 'Analog': '16', 'PWM': '15' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'box', dimensions: [1.01, 0.15, 0.53], features: [], materialType: 'pcb', color: '#006064' } },
    }),
    makePart({
      name: 'Bearing 608ZZ (8×22×7mm)',
      category: 'transmission',
      sourceType: 'sourced',
      description: 'Deep groove ball bearing, double-shielded. For smooth joint rotation.',
      dimensions: { x: 22, y: 7, z: 22 },
      weight: 12,
      material: 'Chrome Steel',
      color: '#9e9e9e',
      unitCost: 1.29,
      sourcingUrl: 'https://www.mcmaster.com/57155K367',
      supplierName: 'McMaster-Carr',
      supplierSKU: '57155K367',
      leadTimeDays: 1,
      specs: { 'Bore': '8mm', 'OD': '22mm', 'Width': '7mm', 'Type': 'Deep Groove', 'Shield': '2Z (Metal)' },
      asset: { type: 'procedural', generationStatus: 'ready', proceduralConfig: { baseShape: 'cylinder', dimensions: [0.22, 0.07, 0.22], features: [{ type: 'hole', position: [0, 0, 0], dimensions: { diameter: 0.08 } }], materialType: 'metallic', color: '#9e9e9e' } },
    }),
  ];
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────

export function generatePartsForProject(description: string): {
  template: ProjectTemplate;
  parts: PartDefinition[];
  projectName: string;
  projectDescription: string;
} {
  partIdCounter = 0; // Reset for consistent IDs
  const template = detectProjectType(description);

  switch (template) {
    case 'rover':
      return {
        template,
        parts: generateRoverParts(),
        projectName: 'Scout Rover MK-I',
        projectDescription: 'A 4-wheeled autonomous rover platform designed for outdoor terrain navigation with ultrasonic obstacle avoidance and ESP32-based WiFi control.',
      };
    case 'arm':
      return {
        template,
        parts: generateArmParts(),
        projectName: 'Delta Manipulator A3',
        projectDescription: 'A 3-DOF articulated robotic arm with parallel jaw gripper, designed for desktop pick-and-place tasks up to 500g payload.',
      };
    case 'hexapod':
    default:
      // For hexapod and generic, reuse rover template with modified name
      return {
        template,
        parts: generateRoverParts(),
        projectName: 'Mechatronic Platform V1',
        projectDescription: 'A custom mechatronic system designed to your specifications with modular components and expandable architecture.',
      };
  }
}

export { detectProjectType };

// Reusable procedural config generator for the refinement engine
export function generateProceduralConfig(
  category: string,
  dimensions: { x: number; y: number; z: number }
): NonNullable<PartDefinition['asset']>['proceduralConfig'] {
  const isRound = ['actuator', 'wheel', 'transmission'].includes(category);
  const materialMap: Record<string, string> = {
    chassis: 'metallic',
    actuator: 'metallic',
    structural: 'plastic',
    wheel: 'rubber',
    controller: 'pcb',
    power: 'plastic',
    sensor: 'pcb',
    fastener: 'metallic',
    transmission: 'rubber',
    end_effector: 'plastic',
    wiring: 'plastic',
  };
  return {
    baseShape: isRound ? 'cylinder' : 'box',
    dimensions: [
      dimensions.x / 100,
      dimensions.y / 100,
      dimensions.z / 100,
    ],
    features: [],
    materialType: (materialMap[category] || 'plastic') as 'metallic' | 'plastic' | 'pcb' | 'rubber',
  };
}

