// ─── Service Pillar Types ────────────────────────────────────────────────────
// Four integrated service pillars that define the platform's capabilities.
// Each pillar adapts the configurator, simulation, and output artifacts.

import type { PartCategory } from './parts';

export type ServicePillar = 'digital' | 'physical' | 'integrated' | 'additive';

export interface PillarConfig {
  id: ServicePillar;
  name: string;
  tagline: string;
  description: string;
  icon: string; // lucide icon name
  gradient: {
    from: string;
    to: string;
  };
  accentColor: string;
  capabilities: string[];
  partCategories: PartCategory[];
  simulationModes: SimulationMode[];
  outputArtifacts: OutputArtifact[];
  chatSystemPrompt: string;
  navLinks: PillarNavLink[];
}

export type SimulationMode =
  | 'structural'
  | 'kinematic'
  | 'electrical'
  | 'thermal'
  | 'dynamic'
  | 'impact'
  | 'print_feasibility'
  | 'network_load'
  | 'latency';

export type OutputArtifact =
  | 'bom'
  | 'assembly_instructions'
  | 'stl_files'
  | 'gcode'
  | 'firmware_spec'
  | 'pcb_gerber'
  | 'wiring_diagram'
  | 'api_spec'
  | 'architecture_diagram'
  | 'deployment_config'
  | 'print_profile';

export interface PillarNavLink {
  href: string;
  label: string;
  icon: string; // lucide icon name
}

// ─── Pillar Definitions ─────────────────────────────────────────────────────

export const PILLAR_CONFIGS: Record<ServicePillar, PillarConfig> = {
  digital: {
    id: 'digital',
    name: 'Digital Systems',
    tagline: 'Intelligence in Code',
    description:
      'AI-native applications, enterprise resource planning, autonomous agent workflows, and complex protocol implementation — software designed to make physical operations smarter.',
    icon: 'Monitor',
    gradient: { from: '#6366f1', to: '#8b5cf6' },
    accentColor: '#818cf8',
    capabilities: [
      'AI-native applications & LLM agent orchestration',
      'Enterprise Resource Planning (ERP) development',
      'Autonomous agent workflows & automation',
      'Protocol implementation (IEEE 2030.5, CSIP-Aus)',
      'Real-time data pipelines & telemetry systems',
      'Full-stack web applications (React, Next.js, Node.js)',
    ],
    partCategories: ['controller', 'sensor', 'wiring'],
    simulationModes: ['network_load', 'latency'],
    outputArtifacts: ['api_spec', 'architecture_diagram', 'deployment_config'],
    chatSystemPrompt: `You are a Digital Systems design agent. Help users architect AI-native applications, ERP systems, autonomous agent workflows, protocol implementations, and full-stack web applications. Focus on software architecture, API design, data pipelines, and deployment strategies. When the user describes their system, extract requirements for: technology stack, integrations, data flow, authentication, scaling needs, and deployment targets.`,
    navLinks: [
      { href: '/configurator', label: 'Architect', icon: 'LayoutDashboard' },
      { href: '/simulate', label: 'Test', icon: 'FlaskConical' },
      { href: '/bom', label: 'Stack', icon: 'Layers' },
    ],
  },

  physical: {
    id: 'physical',
    name: 'Physical Systems',
    tagline: 'Precision in the Real World',
    description:
      'Mechatronics design, robotics assembly and fine-tuning, embedded systems — engineering tangible solutions from concept to tested, functional hardware.',
    icon: 'Cog',
    gradient: { from: '#06b6d4', to: '#84cc16' },
    accentColor: '#06b6d4',
    capabilities: [
      'Mechatronics design & electromechanical systems',
      'Robotics assembly, calibration & fine-tuning',
      'PCB design & embedded firmware (ESP32, Arduino)',
      'Sensor fusion & signal processing',
      'Hardware testing & validation workflows',
      'Jig, fixture, and enclosure engineering',
    ],
    partCategories: [
      'chassis',
      'actuator',
      'sensor',
      'controller',
      'power',
      'structural',
      'fastener',
      'wheel',
      'transmission',
      'end_effector',
      'wiring',
    ],
    simulationModes: ['structural', 'kinematic', 'electrical', 'thermal', 'dynamic', 'impact'],
    outputArtifacts: ['bom', 'assembly_instructions', 'firmware_spec', 'pcb_gerber', 'wiring_diagram'],
    chatSystemPrompt: `You are a Physical Systems design agent specializing in mechatronics, robotics, and embedded systems engineering. Help users design and build real hardware — from concept to tested, functional prototypes. When the user describes their system, extract requirements for: mobility, manipulation, sensing, control, power, physical constraints, and manufacturing methods. Search real component databases for optimal parts.`,
    navLinks: [
      { href: '/configurator', label: 'Configurator', icon: 'Box' },
      { href: '/simulate', label: 'Simulate', icon: 'FlaskConical' },
      { href: '/bom', label: 'BOM', icon: 'ClipboardList' },
      { href: '/assembly', label: 'Assembly', icon: 'Package' },
      { href: '/checkout', label: 'Checkout', icon: 'ShoppingCart' },
    ],
  },

  integrated: {
    id: 'integrated',
    name: 'Integrated Design',
    tagline: 'Where Bits Meet Atoms',
    description:
      'The intersection that defines this practice — CNC automation, precision hardware-software interfaces, robotic control systems, and IoT-connected physical infrastructure.',
    icon: 'Workflow',
    gradient: { from: '#f59e0b', to: '#06b6d4' },
    accentColor: '#f59e0b',
    capabilities: [
      'CNC automation & compensation algorithms',
      'Precision hardware-software interfaces',
      'Robotic control systems & servo calibration',
      'IoT-connected physical infrastructure',
      'Digital twins & real-time simulation',
      'Energy system control & grid-edge intelligence',
    ],
    partCategories: [
      'chassis',
      'actuator',
      'sensor',
      'controller',
      'power',
      'structural',
      'wiring',
      'transmission',
    ],
    simulationModes: ['structural', 'kinematic', 'electrical', 'dynamic', 'network_load'],
    outputArtifacts: [
      'bom',
      'assembly_instructions',
      'firmware_spec',
      'wiring_diagram',
      'api_spec',
      'architecture_diagram',
    ],
    chatSystemPrompt: `You are an Integrated Design agent specializing in the intersection of hardware and software — CNC automation, robotic control systems, IoT infrastructure, digital twins, and energy system control. Help users design systems where software precisely controls physical processes. Extract requirements for: control algorithms, communication protocols, real-time constraints, sensor-actuator loops, and system integration.`,
    navLinks: [
      { href: '/configurator', label: 'Design', icon: 'Workflow' },
      { href: '/simulate', label: 'Simulate', icon: 'FlaskConical' },
      { href: '/bom', label: 'BOM', icon: 'ClipboardList' },
      { href: '/assembly', label: 'Assembly', icon: 'Package' },
      { href: '/checkout', label: 'Checkout', icon: 'ShoppingCart' },
    ],
  },

  additive: {
    id: 'additive',
    name: 'Additive Manufacturing',
    tagline: 'Scratchpad to Finished Product',
    description:
      'A full-service prototyping hub — from a rough sketch or idea to production-ready prototypes using advanced engineering printers and materials.',
    icon: 'Printer',
    gradient: { from: '#f43f5e', to: '#f97316' },
    accentColor: '#f43f5e',
    capabilities: [
      'End-to-end part prototyping (concept → CAD → print → finish)',
      'Bambu Lab X1E production with engineering-grade materials',
      'Multi-material builds (PLA, PETG, ABS, TPU, PA, CF-Nylon)',
      'Parametric CAD modeling (OpenSCAD, SolidWorks)',
      'Batch production runs with repeatable quality control',
      'Post-processing: heat-set inserts, surface finishing, assembly',
    ],
    partCategories: ['chassis', 'structural', 'fastener', 'end_effector'],
    simulationModes: ['structural', 'thermal', 'impact', 'print_feasibility'],
    outputArtifacts: ['stl_files', 'gcode', 'print_profile', 'bom', 'assembly_instructions'],
    chatSystemPrompt: `You are an Additive Manufacturing design agent. Help users go from rough ideas or sketches to production-ready 3D-printed parts. Focus on: material selection (PLA, PETG, ABS, TPU, PA, CF-Nylon), print orientation for strength, infill strategies, support structures, multi-material builds, and post-processing. Use Bambu Lab X1E production capabilities. Extract requirements for: part dimensions, material properties needed, batch size, finish quality, and assembly integration.`,
    navLinks: [
      { href: '/configurator', label: 'Model', icon: 'Box' },
      { href: '/simulate', label: 'Analyze', icon: 'FlaskConical' },
      { href: '/bom', label: 'Materials', icon: 'ClipboardList' },
      { href: '/checkout', label: 'Order', icon: 'ShoppingCart' },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPillarConfig(pillar: ServicePillar): PillarConfig {
  return PILLAR_CONFIGS[pillar];
}

export function getPillarGradientCSS(pillar: ServicePillar): string {
  const { gradient } = PILLAR_CONFIGS[pillar];
  return `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`;
}

export function getAllPillars(): PillarConfig[] {
  return Object.values(PILLAR_CONFIGS);
}
