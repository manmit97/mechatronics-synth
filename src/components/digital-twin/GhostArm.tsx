'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ARM_CONFIG, JOINT_IDS } from '@/types/digital-twin';
import type { JointId } from '@/types/digital-twin';
import { useDigitalTwinStore } from '@/stores/digital-twin-store';

// ─── Constants ──────────────────────────────────────────────────────────────

const DEG2RAD = Math.PI / 180;
const GHOST_COLOR = new THREE.Color('#00ffff');

// ─── Ghost Arm Component ────────────────────────────────────────────────────
// Renders the COMMANDED state — translucent holographic overlay.
// Mirrors the exact kinematic hierarchy of KinematicChain but uses
// commandedAngle instead of actualAngle.

export function GhostArm() {
  const showGhost = useDigitalTwinStore((s) => s.showGhost);

  const baseRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  const refs: Record<JointId, React.RefObject<THREE.Group | null>> = {
    base: baseRef,
    shoulder: shoulderRef,
    elbow: elbowRef,
    wrist: wristRef,
  };

  // Pulse emissive intensity when following error is high
  const emissiveRef = useRef(0.3);

  useFrame((_, delta) => {
    if (!showGhost || !groupRef.current) return;

    const state = useDigitalTwinStore.getState();
    const { joints, followingErrorThreshold } = state;

    // Check max following error across all joints
    let maxError = 0;
    for (const jointId of JOINT_IDS) {
      const error = Math.abs(joints[jointId].commandedAngle - joints[jointId].actualAngle);
      maxError = Math.max(maxError, error);
    }

    // Pulse emissive when error is high
    const targetEmissive = maxError > followingErrorThreshold ? 0.8 : 0.3;
    emissiveRef.current += (targetEmissive - emissiveRef.current) * Math.min(1, delta * 5);

    // Update ghost material emissive intensity across all meshes
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
        child.material.emissiveIntensity = emissiveRef.current;
      }
    });

    // Apply commanded angles
    for (const jointId of JOINT_IDS) {
      const ref = refs[jointId];
      if (!ref.current) continue;

      const angle = joints[jointId].commandedAngle * DEG2RAD;
      const axis = ARM_CONFIG[jointId].axis;

      if (axis === 'y') {
        ref.current.rotation.y = angle;
      } else if (axis === 'z') {
        ref.current.rotation.z = angle;
      } else {
        ref.current.rotation.x = angle;
      }
    }
  });

  if (!showGhost) return null;

  const baseCfg = ARM_CONFIG.base;
  const shoulderCfg = ARM_CONFIG.shoulder;
  const elbowCfg = ARM_CONFIG.elbow;
  const wristCfg = ARM_CONFIG.wrist;

  // Shared ghost material props
  const ghostMat = {
    color: GHOST_COLOR,
    emissive: GHOST_COLOR,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.18,
    roughness: 0.1,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    depthWrite: false,
  } as const;

  return (
    <group ref={groupRef} renderOrder={999}>
      {/* ── Base ────────────────────────────────────────────────────── */}
      <mesh position={[0, baseCfg.linkLength / 4, 0]}>
        <cylinderGeometry args={[baseCfg.linkRadius * 1.2, baseCfg.linkRadius * 1.3, baseCfg.linkLength / 2, 32]} />
        <meshPhysicalMaterial {...ghostMat} />
      </mesh>

      <group ref={baseRef} position={[0, baseCfg.linkLength / 2, 0]}>
        <mesh>
          <cylinderGeometry args={[baseCfg.linkRadius, baseCfg.linkRadius, baseCfg.linkLength / 2, 32]} />
          <meshPhysicalMaterial {...ghostMat} />
        </mesh>

        {/* ── Shoulder ──────────────────────────────────────────── */}
        <group position={[0, baseCfg.linkLength / 4 + 0.05, 0]}>
          <mesh>
            <sphereGeometry args={[shoulderCfg.linkRadius * 1.3, 16, 16]} />
            <meshPhysicalMaterial {...ghostMat} />
          </mesh>

          <group ref={shoulderRef}>
            <mesh position={[0, shoulderCfg.linkLength / 2, 0]}>
              <boxGeometry args={[
                shoulderCfg.linkRadius * 2,
                shoulderCfg.linkLength,
                shoulderCfg.linkRadius * 1.5,
              ]} />
              <meshPhysicalMaterial {...ghostMat} />
            </mesh>

            {/* ── Elbow ────────────────────────────────────────── */}
            <group position={[0, shoulderCfg.linkLength, 0]}>
              <mesh>
                <sphereGeometry args={[elbowCfg.linkRadius * 1.2, 16, 16]} />
                <meshPhysicalMaterial {...ghostMat} />
              </mesh>

              <group ref={elbowRef}>
                <mesh position={[0, elbowCfg.linkLength / 2, 0]}>
                  <boxGeometry args={[
                    elbowCfg.linkRadius * 2,
                    elbowCfg.linkLength,
                    elbowCfg.linkRadius * 1.5,
                  ]} />
                  <meshPhysicalMaterial {...ghostMat} />
                </mesh>

                {/* ── Wrist ──────────────────────────────────── */}
                <group position={[0, elbowCfg.linkLength, 0]}>
                  <mesh>
                    <sphereGeometry args={[wristCfg.linkRadius * 1.0, 16, 16]} />
                    <meshPhysicalMaterial {...ghostMat} />
                  </mesh>

                  <group ref={wristRef}>
                    <mesh position={[0, wristCfg.linkLength / 2, 0]}>
                      <cylinderGeometry args={[
                        wristCfg.linkRadius * 0.6,
                        wristCfg.linkRadius,
                        wristCfg.linkLength,
                        16,
                      ]} />
                      <meshPhysicalMaterial {...ghostMat} />
                    </mesh>

                    <mesh position={[0, wristCfg.linkLength + 0.06, 0]}>
                      <coneGeometry args={[wristCfg.linkRadius * 0.5, 0.12, 12]} />
                      <meshPhysicalMaterial {...ghostMat} />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
