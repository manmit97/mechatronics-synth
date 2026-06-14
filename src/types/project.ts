// ─── Project & Requirements Types ───────────────────────────────────────────
// These types represent the user's original idea and the AI-extracted
// structured requirements that drive the entire design pipeline.

export interface UserIdea {
  rawDescription: string;
  timestamp: string;
}

export type MobilityType = 'wheeled' | 'tracked' | 'legged' | 'stationary' | 'flying';
export type TerrainType = 'indoor_smooth' | 'indoor_rough' | 'outdoor_paved' | 'outdoor_rough' | 'all_terrain';
export type ManipulationType = 'gripper' | 'arm' | 'conveyor' | 'none';
export type SensorType = 'camera' | 'ultrasonic' | 'lidar' | 'ir' | 'imu' | 'gps' | 'encoder' | 'temperature' | 'force';
export type ControllerType = 'esp32' | 'arduino_mega' | 'raspberry_pi' | 'stm32' | 'custom';
export type CommunicationType = 'wifi' | 'bluetooth' | 'lora' | 'usb' | 'can_bus' | 'serial';
export type PowerType = 'lipo' | 'liion' | 'nimh' | 'dc_supply';

export interface RequirementsSpec {
  projectName: string;
  projectType: string;
  description: string;

  mobility: {
    type: MobilityType;
    terrain: TerrainType;
    speed?: string;
  };

  manipulation?: {
    type: ManipulationType;
    payloadKg?: number;
    degreesOfFreedom?: number;
  };

  sensing: {
    types: SensorType[];
  };

  control: {
    controller: ControllerType;
    communication: CommunicationType[];
  };

  power: {
    type: PowerType;
    voltageV?: number;
    capacityMah?: number;
  };

  constraints: {
    budgetUsd?: number;
    maxDimensionsMm?: { x: number; y: number; z: number };
    maxWeightKg?: number;
    environment?: 'indoor' | 'outdoor' | 'both';
  };
}
