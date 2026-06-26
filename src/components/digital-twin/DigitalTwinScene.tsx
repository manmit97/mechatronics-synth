'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { KinematicChain } from './KinematicChain';
import { GhostArm } from './GhostArm';
import { SpatialOverlays } from './SpatialOverlay';

// ─── Scene Content ──────────────────────────────────────────────────────────

function SceneContent() {
  return (
    <>
      {/* Lighting — dramatic 3-point + cyan accent */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[8, 14, 8]}
        intensity={1.4}
        castShadow
        shadow-mapSize={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={40}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-6, 10, -6]} intensity={0.3} color="#6366f1" />
      <pointLight position={[0, 6, 0]} intensity={0.4} color="#00ffff" distance={15} decay={2} />
      <pointLight position={[3, 1, 3]} intensity={0.15} color="#f59e0b" distance={10} decay={2} />

      {/* Environment for reflections */}
      <Environment preset="city" environmentIntensity={0.2} />

      {/* Infinite grid floor */}
      <Grid
        args={[60, 60]}
        position={[0, -0.01, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#0f1a2e"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#00ffff"
        fadeDistance={30}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* Contact shadows for grounding */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.5}
        scale={25}
        blur={2.5}
        far={12}
        color="#000020"
      />

      {/* ── The Robot Arms ──────────────────────────────────────── */}
      <KinematicChain />
      <GhostArm />
      <SpatialOverlays />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1.5, 0]}
      />
    </>
  );
}

// ─── Canvas Wrapper ─────────────────────────────────────────────────────────

export function DigitalTwinScene({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full relative ${className}`} id="digital-twin-viewport">
      <Canvas
        camera={{ position: [5, 4, 5], fov: 45 }}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <color attach="background" args={['#050810']} />
        <fog attach="fog" args={['#050810', 18, 35]} />
        <SceneContent />
      </Canvas>

      {/* Viewport corner badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none select-none">
        <span className="dt-led active" style={{ '--led-color': '#4ade80' } as React.CSSProperties} />
        <span className="silkscreen-label text-[0.6rem]" style={{ color: '#4ade80' }}>
          DIGITAL TWIN · LIVE
        </span>
      </div>
    </div>
  );
}
