
import React, { useState, useRef, useEffect } from 'react';
import { useBox, useCylinder, useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { playImpactSound, playWoodBreakSound, playGlassBreakSound } from './SoundUtils';

export const PhysicsBox = ({ position, color = '#e67e22' }: { position: [number, number, number], color?: string }) => {
  const [ref] = useBox(() => ({
    mass: 1,
    position,
    args: [1, 1, 1],
    onCollide: (e) => {
        const impactVelocity = e.contact.impactVelocity;
        playImpactSound(impactVelocity);
    }
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
      {/* Crate border effect */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="black" />
      </lineSegments>
    </mesh>
  );
};

export const PhysicsBarrel = ({ position, color = '#636e72' }: { position: [number, number, number], color?: string }) => {
  const [ref] = useCylinder(() => ({
    mass: 5,
    position,
    rotation: [0, 0, 0],
    args: [0.5, 0.5, 1.5, 12],
    onCollide: (e) => {
        const impactVelocity = e.contact.impactVelocity;
        playImpactSound(impactVelocity);
    }
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <cylinderGeometry args={[0.5, 0.5, 1.5, 12]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
    </mesh>
  );
};

export const PhysicsSphere = ({ position, color = '#3498db' }: { position: [number, number, number], color?: string }) => {
    const [ref] = useSphere(() => ({
      mass: 2,
      position,
      args: [0.5],
      onCollide: (e) => {
          playImpactSound(e.contact.impactVelocity);
      }
    }));
  
    return (
      <mesh ref={ref as any} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.1} />
      </mesh>
    );
};

export const PhysicsCone = ({ position, color = '#e74c3c' }: { position: [number, number, number], color?: string }) => {
    // Cannon uses cylinder for cones (topRadius = 0)
    const [ref] = useCylinder(() => ({
      mass: 1,
      position,
      args: [0, 0.5, 1.5, 16],
      onCollide: (e) => {
          playImpactSound(e.contact.impactVelocity);
      }
    }));
  
    return (
      <mesh ref={ref as any} castShadow receiveShadow>
        <cylinderGeometry args={[0, 0.5, 1.5, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
};

// --- DESTRUCTIBLE OBJECTS ---

interface DebrisProps {
    position: [number, number, number];
    velocity: [number, number, number];
    size?: number;
    color: string;
    materialType?: 'wood' | 'glass';
}

const Debris: React.FC<DebrisProps> = ({ position, velocity, size = 0.5, color, materialType = 'wood' }) => {
    const [ref] = useBox(() => ({
        mass: 0.1,
        position,
        velocity,
        args: [size, size, size],
        linearDamping: 0.1,
        angularDamping: 0.1
    }));

    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            <boxGeometry args={[size, size, size]} />
            <meshStandardMaterial 
                color={color} 
                transparent={materialType === 'glass'} 
                opacity={materialType === 'glass' ? 0.4 : 1}
                metalness={materialType === 'glass' ? 0.9 : 0.1}
                roughness={materialType === 'glass' ? 0.1 : 0.8}
            />
        </mesh>
    );
};

export const BreakableCrate = ({ position }: { position: [number, number, number] }) => {
    const [isBroken, setIsBroken] = useState(false);
    const pos = useRef(new THREE.Vector3(...position));
    
    const [ref, api] = useBox(() => ({
        mass: 1,
        position,
        args: [1, 1, 1],
        onCollide: (e) => {
            if (e.contact.impactVelocity > 8) { // Break threshold
                setIsBroken(true);
                playWoodBreakSound();
            }
        }
    }));

    useEffect(() => {
        const unsub = api.position.subscribe(v => pos.current.set(v[0], v[1], v[2]));
        return unsub;
    }, [api.position]);

    if (isBroken) {
        // Spawn 8 small chunks
        const chunks = [];
        const offsets = [
            [-0.25, -0.25, -0.25], [0.25, -0.25, -0.25], [-0.25, 0.25, -0.25], [0.25, 0.25, -0.25],
            [-0.25, -0.25, 0.25], [0.25, -0.25, 0.25], [-0.25, 0.25, 0.25], [0.25, 0.25, 0.25]
        ];
        
        for (let i = 0; i < 8; i++) {
            const p = pos.current.clone().add(new THREE.Vector3(...offsets[i] as any));
            const v = new THREE.Vector3(
                (Math.random() - 0.5) * 5, 
                (Math.random() * 5), 
                (Math.random() - 0.5) * 5
            );
            chunks.push(<Debris key={i} position={[p.x, p.y, p.z]} velocity={[v.x, v.y, v.z]} size={0.45} color="#8B4513" />);
        }
        return <group>{chunks}</group>;
    }

    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#8B4513" />
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
                <lineBasicMaterial color="#3e2723" />
            </lineSegments>
            {/* Cross pattern */}
            <mesh position={[0,0,0.51]}>
                 <planeGeometry args={[0.9, 0.9]} />
                 <meshBasicMaterial color="#5D4037" />
            </mesh>
             <mesh position={[0,0,-0.51]} rotation={[0, Math.PI, 0]}>
                 <planeGeometry args={[0.9, 0.9]} />
                 <meshBasicMaterial color="#5D4037" />
            </mesh>
        </mesh>
    );
};

export const BreakableGlassPane = ({ position, rotation = [0,0,0] }: { position: [number, number, number], rotation?: [number, number, number] }) => {
    const [isBroken, setIsBroken] = useState(false);
    const pos = useRef(new THREE.Vector3(...position));
    
    const [ref, api] = useBox(() => ({
        mass: 10,
        position,
        rotation,
        args: [4, 2, 0.1],
        onCollide: (e) => {
            if (e.contact.impactVelocity > 5) {
                setIsBroken(true);
                playGlassBreakSound();
            }
        }
    }));

    useEffect(() => {
        const unsub = api.position.subscribe(v => pos.current.set(v[0], v[1], v[2]));
        return unsub;
    }, [api.position]);

    if (isBroken) {
        const shards = [];
        for(let i=0; i<6; i++) {
             const v = new THREE.Vector3(
                (Math.random() - 0.5) * 3, 
                (Math.random() * 2), 
                (Math.random() - 0.5) * 3
            );
             shards.push(
                <Debris 
                    key={i} 
                    position={[
                        pos.current.x + (Math.random()-0.5)*3, 
                        pos.current.y + (Math.random()-0.5)*1.5, 
                        pos.current.z
                    ]} 
                    velocity={[v.x, v.y, v.z]} 
                    size={0.4} 
                    color="#A8D8EA"
                    materialType="glass"
                />
             );
        }
        return <group>{shards}</group>;
    }

    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            <boxGeometry args={[4, 2, 0.1]} />
            <meshStandardMaterial 
                color="#A8D8EA" 
                transparent 
                opacity={0.3} 
                metalness={0.9} 
                roughness={0.0} 
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

export const ConcreteWall = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
  const args: [number, number, number] = [8, 4, 1];
  const [ref] = useBox(() => ({
    type: 'Static',
    mass: 0,
    position,
    rotation: rotation as any,
    args,
  }));

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#95a5a6" />
      <mesh position={[0, -1.8, 0.6]}>
         <boxGeometry args={[8.2, 0.4, 0.2]} />
         <meshStandardMaterial color="#7f8c8d" />
      </mesh>
    </mesh>
  );
};
