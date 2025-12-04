
import React, { useState, useRef } from 'react';
import { usePlane, useSphere } from '@react-three/cannon';
import { Player } from './Player';
import { TrainEater } from './TrainEater';
import { PhysicsBox, PhysicsBarrel, ConcreteWall, PhysicsSphere, PhysicsCone, BreakableCrate, BreakableGlassPane } from './PhysicsObjects';
import * as THREE from 'three';
import { playBulletImpactSound } from './SoundUtils';
import { WeaponType } from '../types';

interface GameWorldProps {
  onMonsterHit: (damage: number) => void;
  monsterHealth: number;
  playerHealth: number;
  onPlayerDamage: (amount: number) => void;
  currentWeapon: WeaponType;
  setWeapon: (w: WeaponType) => void;
  isDead: boolean;
}

const Ground = () => {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, 0, 0],
    material: { friction: 0.1, restitution: 0.1 } 
  }));

  // Create a large grass texture procedurally or use color
  return (
    <group>
      <mesh ref={ref as any} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#5C8C46" roughness={0.8} />
      </mesh>
      {/* Grid helper for that "Construct" feel */}
      <gridHelper args={[1000, 500, 0x000000, 0x000000]} position={[0, 0.01, 0]} rotation={[0,0,0]}>
         <meshBasicMaterial attach="material" transparent opacity={0.05} />
      </gridHelper>
    </group>
  );
};

// Physics Bullet Component
interface BulletProps {
  position: [number, number, number];
  velocity: [number, number, number];
}

const Bullet: React.FC<BulletProps> = ({ position, velocity }) => {
  const [ref] = useSphere(() => ({
    mass: 0.2,
    position,
    velocity,
    args: [0.1],
    type: 'Dynamic',
    onCollide: (e) => {
        // Only play if hitting something substantial (not just spawning)
        if (e.contact.impactVelocity > 1) {
            playBulletImpactSound();
        }
    }
  }));

  return (
    <mesh ref={ref as any}>
      <sphereGeometry args={[0.1]} />
      <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={0.5} />
    </mesh>
  );
};

const GameWorld: React.FC<GameWorldProps> = ({ 
    onMonsterHit,
    monsterHealth, 
    playerHealth,
    onPlayerDamage,
    currentWeapon, 
    setWeapon,
    isDead
}) => {
  const [bullets, setBullets] = useState<{ id: number; position: [number, number, number]; velocity: [number, number, number] }[]>([]);
  
  // Shared reference for player position
  const playerPos = useRef(new THREE.Vector3(0, 0, 0));
  
  // Shared reference for Monster position
  const monsterPos = useRef(new THREE.Vector3(0, 0, -20));

  const handleShoot = (position: [number, number, number], velocity: [number, number, number]) => {
    const id = Date.now() + Math.random();
    setBullets((prev) => [...prev, { id, position, velocity }]);
    
    setTimeout(() => {
      setBullets((prev) => prev.filter((b) => b.id !== id));
    }, 2000);
  };

  return (
    <group>
      <Ground />
      
      {/* The Player */}
      <Player 
        onShoot={handleShoot} 
        currentWeapon={currentWeapon} 
        setWeapon={setWeapon} 
        playerPos={playerPos}
        isDead={isDead}
      />

      {/* THE MONSTER */}
      <TrainEater 
        position={[0, 0, -20]} 
        health={monsterHealth} 
        onHit={() => onMonsterHit(2)}
        playerPos={playerPos} // Main target
        selfRef={monsterPos}
        onAttack={(dmg) => onPlayerDamage(dmg)} // Damages player
        onPlayerDamage={onPlayerDamage}
        color="#8B0000"
      />

      {/* Standard Props */}
      <PhysicsBox position={[5, 0.5, 5]} />
      <PhysicsBox position={[5, 1.5, 5]} />
      <PhysicsBox position={[6, 0.5, 5]} />
      
      <PhysicsBarrel position={[-5, 1, 5]} color="#2d3436" />
      <PhysicsBarrel position={[-6, 1, 6]} color="#e17055" />
      <PhysicsBarrel position={[-4, 1, 4]} color="#0984e3" />

      <ConcreteWall position={[20, 2, -10]} rotation={[0, -0.5, 0]} />
      <ConcreteWall position={[-20, 2, -15]} rotation={[0, 0.5, 0]} />
      
      {/* New Physics Objects */}
      
      {/* Bowling Setup */}
      <group position={[0, 0, 15]}>
          <PhysicsCone position={[-1, 0.75, 0]} color="#fff" />
          <PhysicsCone position={[1, 0.75, 0]} color="#fff" />
          <PhysicsCone position={[-0.5, 0.75, 1]} color="#fff" />
          <PhysicsCone position={[0.5, 0.75, 1]} color="#fff" />
          <PhysicsCone position={[0, 0.75, 2]} color="#fff" />
          
          <PhysicsSphere position={[0, 2, -5]} color="#2c3e50" />
      </group>

      {/* Destructible Stack */}
      <group position={[15, 0, 5]}>
          <BreakableCrate position={[0, 0.5, 0]} />
          <BreakableCrate position={[1.1, 0.5, 0]} />
          <BreakableCrate position={[0.5, 1.5, 0]} />
          <BreakableCrate position={[0.5, 2.5, 0]} />
      </group>

      {/* Glass Walls */}
      <BreakableGlassPane position={[0, 1, 25]} rotation={[0, 0, 0]} />
      <BreakableGlassPane position={[5, 1, 25]} rotation={[0, 0.2, 0]} />
      <BreakableGlassPane position={[-5, 1, 25]} rotation={[0, -0.2, 0]} />

      {bullets.map((bullet) => (
        <Bullet 
          key={bullet.id} 
          position={bullet.position} 
          velocity={bullet.velocity} 
        />
      ))}
    </group>
  );
};

export default GameWorld;
