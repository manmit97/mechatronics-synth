// ─── Assembly Types ─────────────────────────────────────────────────────────

export interface AssemblyStep {
  stepNumber: number;
  title: string;
  description: string;
  partsUsed: string[];
  toolsRequired: string[];
  estimatedMinutes: number;
  cameraFocus: {
    position: [number, number, number];
    target: [number, number, number];
  };
  highlightParts: string[];
  tips?: string;
}

export type ExportFormat = 'STL' | 'STEP' | 'GERBER' | 'PDF';

export interface ExportFile {
  filename: string;
  format: ExportFormat;
  partId: string;
  fileSizeKB: number;
  description: string;
}
