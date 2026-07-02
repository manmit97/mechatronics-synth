'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows, TransformControls, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { Geometry, Base, Subtraction, Addition } from '@react-three/csg';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { ZoomControls } from './ZoomControls';
import * as THREE from 'three';

// ─── Procedural Part Renderer ───────────────────────────────────────────────

function ProceduralMesh({ config, color, isSelected, onClick }: {
  config: import('@/types/parts').ProceduralConfig;
  color: string;
  isSelected: boolean;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [w, h, d] = config.dimensions;

  const materialProps = {
    metallic: { metalness: 0.8, roughness: 0.2 },
    plastic: { metalness: 0.1, roughness: 0.6 },
    rubber: { metalness: 0.0, roughness: 0.9 },
    pcb: { metalness: 0.3, roughness: 0.4 },
    carbon_fiber: { metalness: 0.5, roughness: 0.3 },
    wood: { metalness: 0.0, roughness: 0.8 },
  }[config.materialType] || { metalness: 0.3, roughness: 0.5 };

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      castShadow
      receiveShadow
    >
      <Geometry>
        <Base>
          {config.baseShape === 'cylinder' ? (
            <cylinderGeometry args={[w / 2, w / 2, h, 32]} />
          ) : config.baseShape === 'sphere' ? (
            <sphereGeometry args={[w / 2, 32, 32]} />
          ) : (
            <boxGeometry args={[w, h, d]} />
          )}
        </Base>
        {config.features?.map((feature, i) => {
          const isSubtraction = ['hole', 'slot', 'bevel', 'fillet'].includes(feature.type);
          const Op = isSubtraction ? Subtraction : Addition;
          const fw = feature.dimensions.width || 0.1;
          const fh = feature.dimensions.height || 0.1;
          const fd = feature.dimensions.depth || 0.1;
          const fr = feature.dimensions.radius || 0.1;

          return (
            <Op key={i} position={feature.position}>
              {feature.type === 'hole' || feature.type === 'shaft' ? (
                <cylinderGeometry args={[fr, fr, fh || d, 16]} />
              ) : (
                <boxGeometry args={[fw, fh, fd]} />
              )}
            </Op>
          );
        })}
      </Geometry>
      <meshStandardMaterial
        color={color}
        {...materialProps}
        emissive={isSelected ? '#06b6d4' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
      {isSelected && (
        <mesh scale={[1.05, 1.05, 1.05]}>
          <Geometry>
            <Base>
              {config.baseShape === 'cylinder' ? (
                <cylinderGeometry args={[w / 2, w / 2, h, 32]} />
              ) : config.baseShape === 'sphere' ? (
                <sphereGeometry args={[w / 2, 32, 32]} />
              ) : (
                <boxGeometry args={[w, h, d]} />
              )}
            </Base>
            {config.features?.map((feature, i) => {
              const isSubtraction = ['hole', 'slot', 'bevel', 'fillet'].includes(feature.type);
              const Op = isSubtraction ? Subtraction : Addition;
              const fw = feature.dimensions.width || 0.1;
              const fh = feature.dimensions.height || 0.1;
              const fd = feature.dimensions.depth || 0.1;
              const fr = feature.dimensions.radius || 0.1;

              return (
                <Op key={i} position={feature.position}>
                  {feature.type === 'hole' || feature.type === 'shaft' ? (
                    <cylinderGeometry args={[fr, fr, fh || d, 16]} />
                  ) : (
                    <boxGeometry args={[fw, fh, fd]} />
                  )}
                </Op>
              );
            })}
          </Geometry>
          <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.15} />
        </mesh>
      )}
    </mesh>
  );
}

// ─── Robot Assembly ─────────────────────────────────────────────────────────

function RobotAssembly() {
  const config = useConfiguratorStore((s) => s.config);
  const catalog = useConfiguratorStore((s) => s.catalog);
  const selectedId = useConfiguratorStore((s) => s.selectedPartInstanceId);
  const selectPart = useConfiguratorStore((s) => s.selectPart);

  if (!config) return null;

  return (
    <group>
      {config.parts.map((placed) => {
        const partDef = catalog.find((p) => p.id === placed.partId);
        if (!partDef?.asset.proceduralConfig) return null;

        const isSelected = selectedId === placed.instanceId;
        const meshElement = (
          <ProceduralMesh
            config={partDef.asset.proceduralConfig}
            color={placed.color}
            isSelected={isSelected}
            onClick={() => selectPart(placed.instanceId)}
          />
        );

        return (
          <group
            key={placed.instanceId}
            position={placed.position}
            rotation={placed.rotation.map((r) => r * Math.PI / 180) as [number, number, number]}
            scale={placed.scale}
          >
            {isSelected ? (
              <TransformControls
                mode="translate"
                onMouseUp={(e) => {
                  const target = e?.target as any;
                  if (target?.object) {
                    const obj = target.object;
                    useConfiguratorStore.getState().updatePartTransform(placed.instanceId, {
                      position: [obj.position.x, obj.position.y, obj.position.z],
                    });
                  }
                }}
              >
                {meshElement}
              </TransformControls>
            ) : (
              meshElement
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── Scene Setup ────────────────────────────────────────────────────────────

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 12, 8]} intensity={1.2} castShadow shadow-mapSize={2048} />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />
      <pointLight position={[0, 10, 0]} intensity={0.3} color="#06b6d4" />

      <Environment preset="city" environmentIntensity={0.3} />

      <Grid
        args={[40, 40]}
        position={[0, -0.01, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#06b6d4"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />

      <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={20} blur={2} far={10} />

      <RobotAssembly />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
      />
      
      <GizmoHelper
        alignment="top-right"
        margin={[80, 80]}
      >
        <GizmoViewcube 
          color="#1a1b1e"
          textColor="#f3f4f6"
          strokeColor="#374151"
          hoverColor="#60a5fa"
        />
      </GizmoHelper>

      <ZoomControls />
    </>
  );
}

// ─── Canvas Wrapper ─────────────────────────────────────────────────────────

export function Scene3D({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [4, 3, 4], fov: 50 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        onPointerMissed={() => useConfiguratorStore.getState().selectPart(null)}
      >
        <color attach="background" args={['#060a13']} />
        <fog attach="fog" args={['#060a13', 15, 30]} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
