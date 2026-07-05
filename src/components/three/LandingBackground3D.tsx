'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Box, Cylinder, Sphere } from '@react-three/drei';

// A shared glowing wireframe material for the "engineering sketch" look
const sketchMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#818cf8'), // indigo-400
  wireframe: true,
  transparent: true,
  opacity: 0.2,
});

const highlightMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#c084fc'), // purple-400
  wireframe: true,
  transparent: true,
  opacity: 0.8,
});

function Quadcopter({ position, offset, speed = 1 }: { position: [number, number, number]; offset: number; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const rotorsRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!groupRef.current || !rotorsRef.current) return;

    // Bobbing and circling animation
    const t = state.clock.getElapsedTime() * speed + offset;
    
    // Smooth flight path
    groupRef.current.position.y = position[1] + Math.sin(t) * 1.5;
    groupRef.current.position.x = position[0] + Math.cos(t * 0.5) * 4;
    groupRef.current.position.z = position[2] + Math.sin(t * 0.8) * 3;

    // Tilt based on movement
    groupRef.current.rotation.z = Math.cos(t * 0.5) * 0.2;
    groupRef.current.rotation.x = Math.sin(t * 0.8) * 0.2;

    // Spin rotors rapidly, faster if hovered
    const rotorSpeed = hovered ? 30 : 10;
    rotorsRef.current.children.forEach((rotor, i) => {
      rotor.rotation.y += delta * rotorSpeed * (i % 2 === 0 ? 1 : -1);
    });
  });

  const material = hovered ? highlightMaterial : sketchMaterial;

  return (
    <group 
      ref={groupRef} 
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }} 
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Central Body */}
      <Box args={[1, 0.2, 1]} material={material} />
      {/* Arms */}
      <Box args={[2.5, 0.05, 0.2]} rotation={[0, Math.PI / 4, 0]} material={material} />
      <Box args={[2.5, 0.05, 0.2]} rotation={[0, -Math.PI / 4, 0]} material={material} />
      
      {/* Rotors */}
      <group ref={rotorsRef}>
        <Cylinder args={[0.4, 0.4, 0.05, 8]} position={[1, 0.1, 1]} material={material} />
        <Cylinder args={[0.4, 0.4, 0.05, 8]} position={[-1, 0.1, 1]} material={material} />
        <Cylinder args={[0.4, 0.4, 0.05, 8]} position={[1, 0.1, -1]} material={material} />
        <Cylinder args={[0.4, 0.4, 0.05, 8]} position={[-1, 0.1, -1]} material={material} />
      </group>
    </group>
  );
}

function HumanoidRobot({ position, scale = 1, delay = 0 }: { position: [number, number, number], scale?: number, delay?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  
  const [hovered, setHovered] = useState(false);
  const walkPosRef = useRef(position[0]);

  useFrame((state) => {
    if (!groupRef.current || !leftArmRef.current || !rightArmRef.current || !leftLegRef.current || !rightLegRef.current || !headRef.current) return;
    
    const t = state.clock.getElapsedTime() + delay;

    if (hovered) {
      // 1. Turn to face camera
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
      
      // 2. Head looks at mouse
      const mouse = state.pointer;
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, (mouse.x * Math.PI) / 4, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -(mouse.y * Math.PI) / 4, 0.1);

      // 3. Waving (right arm raises and oscillates)
      const waveAngle = -Math.PI * 0.8 + Math.sin(t * 15) * 0.25;
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, waveAngle, 0.1);
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1);

      // Left arm relaxed
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, Math.PI / 8, 0.1);
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1);

      // Legs standing
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);

    } else {
      // Walking state
      const walkSpeed = 0.5;
      const walkRange = 3;
      
      // Oscillate position back and forth (walk left, then walk right)
      const currentX = position[0] + Math.sin(t * walkSpeed) * walkRange;
      const directionX = Math.cos(t * walkSpeed);
      
      walkPosRef.current = currentX;
      groupRef.current.position.x = currentX;

      // Rotate group to face walking direction
      const targetRotationY = directionX > 0 ? Math.PI / 2 : -Math.PI / 2;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.1);

      // Head looks forward
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.1);

      // Stride animation (legs move opposite to each other)
      const strideSpeed = walkSpeed * 4;
      const strideLength = 0.5;
      const legAngle = Math.sin(t * strideSpeed) * strideLength;
      
      leftLegRef.current.rotation.x = legAngle;
      rightLegRef.current.rotation.x = -legAngle;

      // Arms swing opposite to legs
      leftArmRef.current.rotation.x = -legAngle;
      rightArmRef.current.rotation.x = legAngle;
      
      // Keep arms slightly away from body
      leftArmRef.current.rotation.z = Math.PI / 8;
      rightArmRef.current.rotation.z = -Math.PI / 8;
    }

    // Bounce slightly simulating steps or breathing
    groupRef.current.position.y = position[1] + Math.abs(Math.sin(t * (hovered ? 2 : 2))) * 0.15;
  });

  const material = hovered ? highlightMaterial : sketchMaterial;

  return (
    <group 
      ref={groupRef} 
      position={position} 
      scale={scale}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Torso */}
      <Box args={[1.2, 1.8, 0.6]} position={[0, 1.5, 0]} material={material} />
      
      {/* Neck Joint */}
      <Cylinder args={[0.15, 0.2, 0.3, 8]} position={[0, 2.5, 0]} material={material} />

      {/* Head */}
      <Sphere ref={headRef} args={[0.5, 16, 16]} position={[0, 3.1, 0]} material={material} />
      
      {/* Shoulders */}
      <Sphere args={[0.3, 12, 12]} position={[-0.8, 2.2, 0]} material={material} />
      <Sphere args={[0.3, 12, 12]} position={[0.8, 2.2, 0]} material={material} />

      {/* Left Arm */}
      <group position={[-0.8, 2.2, 0]} ref={leftArmRef}>
        <Cylinder args={[0.15, 0.15, 1.2, 8]} position={[0, -0.7, 0]} material={material} />
        <Sphere args={[0.18, 8, 8]} position={[0, -1.4, 0]} material={material} />
        <Cylinder args={[0.12, 0.1, 1.0, 8]} position={[0, -2.0, 0]} material={material} />
      </group>

      {/* Right Arm */}
      <group position={[0.8, 2.2, 0]} ref={rightArmRef}>
        <Cylinder args={[0.15, 0.15, 1.2, 8]} position={[0, -0.7, 0]} material={material} />
        <Sphere args={[0.18, 8, 8]} position={[0, -1.4, 0]} material={material} />
        <Cylinder args={[0.12, 0.1, 1.0, 8]} position={[0, -2.0, 0]} material={material} />
      </group>

      {/* Hips */}
      <Box args={[1.0, 0.4, 0.5]} position={[0, 0.4, 0]} material={sketchMaterial} />

      {/* Left Leg */}
      <group position={[-0.35, 0.2, 0]} ref={leftLegRef}>
        <Cylinder args={[0.2, 0.15, 1.4, 8]} position={[0, -0.8, 0]} material={sketchMaterial} />
        <Sphere args={[0.18, 8, 8]} position={[0, -1.6, 0]} material={sketchMaterial} />
        <Cylinder args={[0.15, 0.1, 1.2, 8]} position={[0, -2.3, 0]} material={sketchMaterial} />
      </group>
      
      {/* Right Leg */}
      <group position={[0.35, 0.2, 0]} ref={rightLegRef}>
        <Cylinder args={[0.2, 0.15, 1.4, 8]} position={[0, -0.8, 0]} material={sketchMaterial} />
        <Sphere args={[0.18, 8, 8]} position={[0, -1.6, 0]} material={sketchMaterial} />
        <Cylinder args={[0.15, 0.1, 1.2, 8]} position={[0, -2.3, 0]} material={sketchMaterial} />
      </group>
      
      {/* Decorative Ground Ring */}
      <Cylinder args={[2, 2, 0.02, 32]} position={[0, -3.0, 0]} material={sketchMaterial} />
    </group>
  );
}

function CityGrid() {
  // A subtle floor grid that looks like a futuristic city blueprint
  return (
    <group position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper args={[100, 50, '#4f46e5', '#1e1b4b']} />
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    // Parallax effect based on mouse pointer
    const targetX = (state.pointer.x * 3);
    const targetY = (state.pointer.y * 3) + 2;
    
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function LandingBackground3D() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 2, 12], fov: 50 }}>
        {/* Lights (even though wireframes don't strictly need them, it sets the stage) */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* The Scene */}
        <CityGrid />
        
        {/* Humanoids framing the center text */}
        <HumanoidRobot position={[-5, 0, -3]} scale={1.2} delay={0} />
        <HumanoidRobot position={[5, -1, -6]} scale={1.0} delay={1.5} />
        
        {/* Quadcopters */}
        <Quadcopter position={[-6, 5, -4]} offset={0} speed={0.8} />
        <Quadcopter position={[6, 7, -8]} offset={Math.PI} speed={0.6} />
        <Quadcopter position={[0, 9, -12]} offset={Math.PI / 2} speed={1.2} />

        <CameraRig />
      </Canvas>
    </div>
  );
}
