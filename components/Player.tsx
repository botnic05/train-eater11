
import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { playShootSound, playShotgunSound, playMachineGunSound } from './SoundUtils';
import { WeaponType } from '../types';

const SPEED = 5;
const RUN_SPEED = 10;
const JUMP_FORCE = 5;
const BULLET_SPEED = 40;

interface WeaponConfig {
    fireRate: number; // Seconds between shots
    count: number;    // Bullets per shot
    spread: number;   // Spread factor
    sound: () => void;
}

const WEAPONS: Record<WeaponType, WeaponConfig> = {
    pistol: { fireRate: 0.25, count: 1, spread: 0.0, sound: playShootSound },
    shotgun: { fireRate: 0.8, count: 6, spread: 0.15, sound: playShotgunSound },
    smg: { fireRate: 0.1, count: 1, spread: 0.05, sound: playMachineGunSound }
};

interface PlayerProps {
  onShoot: (pos: [number, number, number], vel: [number, number, number]) => void;
  currentWeapon: WeaponType;
  setWeapon: (w: WeaponType) => void;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}

export const Player: React.FC<PlayerProps> = ({ onShoot, currentWeapon, setWeapon, playerPos }) => {
  const { camera } = useThree();
  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [0, 2, 10],
    args: [0.5], // Radius
    fixedRotation: true, // Prevent player from rolling like a ball
    damping: 0.1
  }));

  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

  const pos = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);

  const [subscribeKeys, getKeys] = useKeyboardControls();
  
  // Weapon recoil/animation state
  const weaponRef = useRef<THREE.Group>(null);
  const lastShotTime = useRef(0);

  // Weapon Switch Logic
  useEffect(() => {
    const unsubscribe = subscribeKeys(
        (state) => {
            if (state.slot1) setWeapon('pistol');
            if (state.slot2) setWeapon('shotgun');
            if (state.slot3) setWeapon('smg');
        }
    );
    return unsubscribe;
  }, [subscribeKeys, setWeapon]);

  useFrame((state, delta) => {
    const { forward, backward, left, right, jump, run, shoot } = getKeys();
    const time = state.clock.getElapsedTime();

    // Update shared player position for enemies
    if (playerPos.current) {
        playerPos.current.set(pos.current[0], pos.current[1], pos.current[2]);
    }

    // Movement Logic
    const currentSpeed = run ? RUN_SPEED : SPEED;
    const frontVector = new THREE.Vector3(0, 0, Number(backward) - Number(forward));
    const sideVector = new THREE.Vector3(Number(left) - Number(right), 0, 0);
    const direction = new THREE.Vector3();

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(currentSpeed)
      .applyEuler(camera.rotation);

    api.velocity.set(direction.x, velocity.current[1], direction.z);

    if (jump && Math.abs(velocity.current[1]) < 0.05) {
      api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2]);
    }

    camera.position.copy(new THREE.Vector3(pos.current[0], pos.current[1] + 0.8, pos.current[2]));

    // Shooting Logic
    const weaponConfig = WEAPONS[currentWeapon];
    if (shoot && time - lastShotTime.current > weaponConfig.fireRate) {
        lastShotTime.current = time;
        weaponConfig.sound();

        // Calculate bullet trajectory
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const startPos = new THREE.Vector3().copy(camera.position).add(direction.clone().multiplyScalar(1));
        
        // Fire Loop for shotgun
        for(let i=0; i<weaponConfig.count; i++) {
            // Apply spread
            const spreadVector = new THREE.Vector3(
                (Math.random() - 0.5) * weaponConfig.spread,
                (Math.random() - 0.5) * weaponConfig.spread,
                (Math.random() - 0.5) * weaponConfig.spread
            );
            
            const aimDir = direction.clone().add(spreadVector).normalize();
            const vel = aimDir.multiplyScalar(BULLET_SPEED);

            onShoot(
                [startPos.x, startPos.y, startPos.z],
                [vel.x, vel.y, vel.z]
            );
        }

        // Recoil
        if (weaponRef.current) {
            weaponRef.current.position.z = 0.2;
            weaponRef.current.rotation.x = 0.1; // Barrel climb
        }
    }

    // Weapon Animation (Recoil recovery and Sway)
    if (weaponRef.current) {
        // Recoil recovery
        weaponRef.current.position.z = THREE.MathUtils.lerp(weaponRef.current.position.z, 0, 0.1);
        weaponRef.current.rotation.x = THREE.MathUtils.lerp(weaponRef.current.rotation.x, 0, 0.1);
        
        // Sway
        const swayX = (Math.abs(direction.x) + Math.abs(direction.z)) > 0.1 ? Math.sin(time * 10) * 0.02 : 0;
        const swayY = (Math.abs(direction.x) + Math.abs(direction.z)) > 0.1 ? Math.cos(time * 20) * 0.02 : 0;
        
        weaponRef.current.position.x = THREE.MathUtils.lerp(weaponRef.current.position.x, 0.3 + swayX, 0.1);
        weaponRef.current.position.y = THREE.MathUtils.lerp(weaponRef.current.position.y, -0.3 + swayY, 0.1);
    }
  });

  // Render different gun models based on type
  const renderWeaponModel = () => {
    switch(currentWeapon) {
        case 'shotgun':
            return (
                <group>
                    {/* Double Barrel Body */}
                    <mesh castShadow position={[0, 0, 0.1]}>
                        <boxGeometry args={[0.15, 0.12, 0.6]} />
                        <meshStandardMaterial color="#444" />
                    </mesh>
                    {/* Barrels */}
                    <mesh position={[-0.03, 0.05, -0.3]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.6, 16]} rotation={[Math.PI/2, 0, 0]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                    <mesh position={[0.03, 0.05, -0.3]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.6, 16]} rotation={[Math.PI/2, 0, 0]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                    {/* Pump Handle */}
                    <mesh position={[0, -0.05, -0.2]}>
                        <boxGeometry args={[0.16, 0.05, 0.3]} />
                        <meshStandardMaterial color="#8B4513" />
                    </mesh>
                </group>
            );
        case 'smg':
            return (
                <group>
                    {/* Compact Body */}
                    <mesh castShadow position={[0, 0, 0.1]}>
                        <boxGeometry args={[0.1, 0.15, 0.4]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                    {/* Barrel */}
                    <mesh position={[0, 0.05, -0.2]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.4, 16]} rotation={[Math.PI/2, 0, 0]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    {/* Magazine (Side) */}
                    <mesh position={[-0.1, 0, 0.1]} rotation={[0,0, -0.2]}>
                        <boxGeometry args={[0.05, 0.2, 0.1]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                </group>
            );
        default: // Pistol
            return (
                <group>
                    <mesh castShadow position={[0, 0, 0.2]}>
                        <boxGeometry args={[0.1, 0.15, 0.6]} />
                        <meshStandardMaterial color="#333" roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.05, -0.3]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.6, 16]} rotation={[Math.PI/2, 0, 0]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    <mesh position={[0, 0.05, -0.55]}>
                        <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} rotation={[Math.PI/2, 0, 0]} />
                        <meshStandardMaterial color="orange" emissive="orange" emissiveIntensity={2} />
                    </mesh>
                </group>
            );
    }
  };

  return (
    <>
      <PointerLockControls />
      <mesh ref={ref as any} /> 
      
      {/* First Person Weapon Model attached to Camera */}
      <group ref={weaponRef} position={[0.3, -0.3, -0.5]} rotation={[0, 0, 0]}>
         {renderWeaponModel()}
      </group>
    </>
  );
};
