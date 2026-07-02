'use client';

import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Plus, Minus } from 'lucide-react';
import { playClickSound } from '@/utils/audio';

export function ZoomControls() {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as { update?: () => void } | null;

  const handleZoom = (factor: number) => {
    playClickSound(true);
    camera.position.multiplyScalar(factor);
    camera.updateProjectionMatrix();
    if (controls && controls.update) {
      controls.update();
    }
  };

  const btnClass = "h-10 px-3 text-xs font-mono font-bold tracking-wider hover:bg-[#1a1b1e] hover:text-[#60a5fa] active:text-[#3b82f6] transition-colors flex items-center justify-center";

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div 
        className="absolute bottom-6 right-6 flex flex-row items-center gap-4 pointer-events-auto shadow-xl"
        style={{ zIndex: 100 }}
      >
        <div className="flex flex-row bg-[#111] border border-[#374151] rounded-md divide-x divide-[#374151] text-[#9ca3af] overflow-hidden">
          <button
            onClick={() => handleZoom(0.8)}
            className={`${btnClass} w-10 px-0`}
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(1.2)}
            className={`${btnClass} w-10 px-0`}
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Html>
  );
}
