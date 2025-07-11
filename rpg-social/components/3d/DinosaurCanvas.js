'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';

// Dinosaur Model Component
function Dinosaur({ isDragging, setIsDragging, position, setPosition }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [throwVelocity, setThrowVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [isThrown, setIsThrown] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [mouseStart, setMouseStart] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(0);

  // Animation for idle movement
  useFrame((state, delta) => {
    if (meshRef.current && !isDragging && !isThrown) {
      // Idle animations
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
      
      // Small random movements
      if (Math.random() > 0.98) {
        meshRef.current.position.x += (Math.random() - 0.5) * 0.5;
        meshRef.current.position.z += (Math.random() - 0.5) * 0.5;
      }
      
      // Keep within bounds
      meshRef.current.position.x = Math.max(-3, Math.min(3, meshRef.current.position.x));
      meshRef.current.position.z = Math.max(-2, Math.min(2, meshRef.current.position.z));
    }

    // Throw physics
    if (isThrown && meshRef.current) {
      meshRef.current.position.x += throwVelocity.x * delta * 50;
      meshRef.current.position.y += throwVelocity.y * delta * 50;
      meshRef.current.position.z += throwVelocity.z * delta * 50;
      
      // Add gravity
      setThrowVelocity(prev => ({ ...prev, y: prev.y - delta * 9.8 }));
      
      // Rotation during throw
      meshRef.current.rotation.x += delta * 10;
      meshRef.current.rotation.z += delta * 8;
      
      // Reset when out of bounds
      if (meshRef.current.position.y < -5 || 
          Math.abs(meshRef.current.position.x) > 10 || 
          Math.abs(meshRef.current.position.z) > 10) {
        setIsThrown(false);
        setThrowVelocity({ x: 0, y: 0, z: 0 });
        meshRef.current.position.set(0, 0, 0);
        meshRef.current.rotation.set(0, 0, 0);
      }
    }

    setTime(state.clock.elapsedTime);
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setIsThrown(false);
    setMouseStart({ x: e.point.x, y: e.point.y });
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = 'grab';
      
      // Calculate throw velocity based on drag
      const dragDistance = {
        x: e.point.x - mouseStart.x,
        y: e.point.y - mouseStart.y
      };
      
      if (Math.abs(dragDistance.x) > 0.5 || Math.abs(dragDistance.y) > 0.5) {
        setThrowVelocity({
          x: dragDistance.x * 2,
          y: Math.abs(dragDistance.y) * 3 + 2,
          z: -Math.abs(dragDistance.x) * 0.5
        });
        setIsThrown(true);
      }
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging && meshRef.current) {
      meshRef.current.position.x = e.point.x;
      meshRef.current.position.z = e.point.z;
      meshRef.current.position.y = Math.max(0, e.point.y);
    }
  };

  // Create dinosaur geometry
  const createDinosaurGeometry = () => {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: hovered ? 0x00ff00 : 0x228B22,
      shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 0.8, 0.7);
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ 
      color: hovered ? 0x00ff00 : 0x2E8B57,
      shininess: 100
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.6, 0.5, 0);
    head.scale.set(1.2, 1, 1);
    group.add(head);

    // Snout
    const snoutGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
    const snoutMaterial = new THREE.MeshPhongMaterial({ 
      color: hovered ? 0x00ff00 : 0x3CB371,
      shininess: 100
    });
    const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(1.1, 0.5, 0);
    group.add(snout);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x000000,
      shininess: 200
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.8, 0.7, 0.3);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.8, 0.7, -0.3);
    group.add(rightEye);

    // Tail
    const tailGeometry = new THREE.ConeGeometry(0.4, 1.5, 8);
    const tailMaterial = new THREE.MeshPhongMaterial({ 
      color: hovered ? 0x00ff00 : 0x228B22,
      shininess: 100
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.rotation.z = Math.PI / 3;
    tail.position.set(-0.8, -0.2, 0);
    group.add(tail);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
    const legMaterial = new THREE.MeshPhongMaterial({ 
      color: hovered ? 0x00ff00 : 0x228B22,
      shininess: 100
    });
    
    const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontLeftLeg.position.set(0.3, -0.8, 0.3);
    group.add(frontLeftLeg);
    
    const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    frontRightLeg.position.set(0.3, -0.8, -0.3);
    group.add(frontRightLeg);
    
    const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
    backLeftLeg.position.set(-0.3, -0.8, 0.3);
    group.add(backLeftLeg);
    
    const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
    backRightLeg.position.set(-0.3, -0.8, -0.3);
    group.add(backRightLeg);

    // Spikes on back
    for (let i = 0; i < 5; i++) {
      const spikeGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
      const spikeMaterial = new THREE.MeshPhongMaterial({ 
        color: hovered ? 0x00ff00 : 0x90EE90,
        shininess: 100
      });
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(-0.4 + i * 0.2, 0.8, 0);
      spike.rotation.z = -Math.PI / 6;
      group.add(spike);
    }

    return group;
  };

  return (
    <group ref={meshRef} position={position}>
      <primitive 
        object={createDinosaurGeometry()}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      />
    </group>
  );
}

// Main Canvas Component
export default function DinosaurCanvas() {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState([0, 0, 0]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 5 }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={false}
          enableRotate={!isDragging}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        
        {/* Dinosaur */}
        <Suspense fallback={null}>
          <Dinosaur 
            isDragging={isDragging} 
            setIsDragging={setIsDragging}
            position={position}
            setPosition={setPosition}
          />
        </Suspense>
        
        {/* Ground */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -1.5, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#f0f0f0" opacity={0.5} transparent />
        </mesh>
      </Canvas>
      
      {/* Instructions */}
      <motion.div 
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        Dinozoru tutup sürükle ve fırlat! 🦕
      </motion.div>
    </div>
  );
}