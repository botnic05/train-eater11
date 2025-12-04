
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { playMonsterHitSound } from './SoundUtils';

interface TrainEaterProps {
  position: [number, number, number];
  health: number;
  onHit: () => void;
  targetRef?: React.MutableRefObject<THREE.Vector3>;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  onAttack: (amount: number) => void;
  selfRef?: React.MutableRefObject<THREE.Vector3>;
  color?: string;
}

const PARTICLE_COUNT = 30;

export const TrainEater: React.FC<TrainEaterProps> = ({ 
    position, 
    health, 
    onHit, 
    targetRef, 
    playerPos, 
    onAttack, 
    selfRef,
    color = "#8B0000"
}) => {
  // Use a physics body for the head to interact with bullets
  const [headRef, api] = useBox(() => ({
    mass: 1000, // Heavier
    position,
    args: [3.5, 3.5, 6], // Hitbox size (Width, Height, Depth)
    fixedRotation: true, // Keep it upright mostly
    type: 'Kinematic' // Use Kinematic to control movement manually
  }));

  const groupRef = useRef<THREE.Group>(null);
  const [flash, setFlash] = useState(0);
  
  // Track previous health to detect external damage (melee from other monsters)
  const prevHealth = useRef(health);
  
  // Physics Animation Refs
  const recoil = useRef(new THREE.Vector3(0, 0, 0));
  const stunTimer = useRef(0);
  const attackCooldown = useRef(0);
  
  // Track current monster position for movement logic
  const currentPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));

  // Particle System References
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const particleDummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useRef<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    rotationAxis: THREE.Vector3;
  }[]>([]);

  // Initialize particle pool
  useEffect(() => {
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      life: 0,
      rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize()
    }));
  }, []);

  const spawnParticles = (hitPoint: THREE.Vector3) => {
    let spawned = 0;
    const countToSpawn = 8;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (spawned >= countToSpawn) break;
      const p = particles.current[i];
      
      // Find a dead particle to recycle
      if (p.life <= 0) {
        p.life = 1.0; // Reset life
        p.position.copy(hitPoint);
        
        // Randomize start position slightly
        p.position.x += (Math.random() - 0.5) * 1.0;
        p.position.y += (Math.random() - 0.5) * 1.0;
        p.position.z += (Math.random() - 0.5) * 0.5;

        // Explosion velocity outward + up
        p.velocity.set(
          (Math.random() - 0.5) * 10,
          (Math.random() * 5) + 2,
          (Math.random() * 5) + 5 
        );
        spawned++;
      }
    }
  };

  const bodyColor = new THREE.Color(color);
  const hitColor = new THREE.Color("#FF8888"); // Bright tint of whatever color

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // Manage Stun Timer
    if (stunTimer.current > 0) {
        stunTimer.current -= delta;
    }
    const isStunned = stunTimer.current > 0;

    // Attack Cooldown
    if (attackCooldown.current > 0) {
        attackCooldown.current -= delta;
    }

    // Check for damage received via props (melee from another monster)
    if (health < prevHealth.current) {
        // We took damage!
        setFlash(1);
        playMonsterHitSound();
        spawnParticles(currentPos.current); // Particles at center
        recoil.current.y += 0.5; // Hop
        stunTimer.current = 0.2; // Brief stun
        prevHealth.current = health;
    }

    // Recoil Recovery
    recoil.current.lerp(new THREE.Vector3(0, 0, 0), delta * 5);

    // AI Movement & Animation
    if (groupRef.current && health > 0) {
       // Determine Target: Prefer `targetRef`, fallback to `playerPos`
       let activeTarget = targetRef?.current || playerPos.current;

       if (activeTarget) {
         // Calculate vector to target
         const toTarget = new THREE.Vector3().copy(activeTarget).sub(currentPos.current);
         const dist = toTarget.length();

         // ATTACK LOGIC
         if (dist < 6.0 && attackCooldown.current <= 0 && !isStunned) {
             onAttack(10); // Deal 10 Damage per bite
             attackCooldown.current = 1.0; // Cooldown
             // Lunge
             recoil.current.z += 1.5; 
             // Roar sound? (Reuse shoot or damage for now)
         }

         // CHASE LOGIC
         if (!isStunned && dist > 5.0) {
             toTarget.normalize();
             toTarget.y = 0; 
             
             const moveSpeed = 2.0; // Much slower for easier kiting
             currentPos.current.addScaledVector(toTarget, moveSpeed * delta);
             
             // Rotate towards target
             const targetRotation = Math.atan2(toTarget.x, toTarget.z);
             api.rotation.set(0, targetRotation, 0); 
         }
       }

       // --- POSITIONAL UPDATE ---
       let targetX = currentPos.current.x;
       let targetY = currentPos.current.y;
       let targetZ = currentPos.current.z;

       if (isStunned) {
           targetX += (Math.random() - 0.5) * 0.5;
           targetY += (Math.random() - 0.5) * 0.5;
       } else {
           const sway = Math.sin(time * 0.5) * 0.5;
           targetX += sway;
       }

       targetX += recoil.current.x;
       targetY += recoil.current.y;
       targetZ += recoil.current.z;

       api.position.set(targetX, targetY, targetZ);
       
       // Update shared selfRef if provided
       if (selfRef) {
           selfRef.current.set(targetX, targetY, targetZ);
       }

       // --- ROTATION UPDATE ---
       if (isStunned) {
           const currentRot = groupRef.current.rotation.y; 
           api.rotation.set(-0.5 + (Math.random() * 0.1), currentRot, (Math.random()-0.5) * 0.2);
       } 
    //    else if (activeTarget) {
    //       // Smooth rotation handled in movement block mostly, but add sway here
    //    }

    } else if (health <= 0) {
       // Dead pose
       api.position.set(currentPos.current.x, -10, currentPos.current.z);
    }

    // Hit flash effect logic
    if (flash > 0) {
      setFlash(f => Math.max(0, f - 5 * delta));
    }

    // Update Particles
    if (particlesRef.current) {
      particles.current.forEach((p, i) => {
        if (p.life > 0) {
          p.life -= delta * 1.5; 
          p.velocity.y -= 20 * delta; 
          p.position.addScaledVector(p.velocity, delta);

          particleDummy.position.copy(p.position);
          const scale = p.life * 0.4; 
          particleDummy.scale.set(scale, scale, scale);
          particleDummy.rotation.x += delta * 10;
          particleDummy.rotation.y += delta * 10;
          particleDummy.updateMatrix();
          
          particlesRef.current!.setMatrixAt(i, particleDummy.matrix);
        } else {
          particleDummy.scale.set(0,0,0);
          particleDummy.updateMatrix();
          particlesRef.current!.setMatrixAt(i, particleDummy.matrix);
        }
      });
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  React.useEffect(() => {
     const unsubscribe = api.position.subscribe((p) => {
         if (groupRef.current) {
             groupRef.current.position.set(p[0], p[1], p[2]);
         }
     });
     return unsubscribe;
  }, [api.position]);

  React.useEffect(() => {
    const unsubscribe = api.rotation.subscribe((r) => {
        if (groupRef.current) {
            groupRef.current.rotation.set(r[0], r[1], r[2]);
        }
    });
    return unsubscribe;
 }, [api.rotation]);

  const handleHit = (e: any) => {
    let hitPoint = new THREE.Vector3(currentPos.current.x, currentPos.current.y, currentPos.current.z + 3.5); 
    if (e && e.point) {
        hitPoint.copy(e.point);
    }
    
    playMonsterHitSound();
    spawnParticles(hitPoint);
    onHit();
    setFlash(1);

    stunTimer.current = 0.5; 
    
    recoil.current.y += 0.5;
    recoil.current.x += (Math.random() - 0.5) * 1.5;
    recoil.current.z += (Math.random() - 0.5) * 1.5;
  };

  return (
    <group ref={groupRef}>
      {/* Monster Visuals */}
      <group scale={[health > 0 ? 1 : 0.9, health > 0 ? 1 : 0.5, 1]}>
          
          {/* HEAD */}
          <mesh castShadow receiveShadow onClick={handleHit}>
            <boxGeometry args={[4, 4, 7]} />
            <meshStandardMaterial 
                color={flash > 0 ? hitColor : bodyColor} 
                roughness={0.3}
                bumpScale={0.2}
                emissive={flash > 0 ? "#ff0000" : color}
                emissiveIntensity={flash > 0 ? 0.5 : 0.2}
            />
          </mesh>

          {/* MOUTH */}
          <mesh position={[0, 0, 3.51]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[1.8, 1.8, 0.5, 24]} />
             <meshStandardMaterial color="#000000" roughness={1} />
          </mesh>

          {/* TEETH Outer */}
          {Array.from({ length: 18 }).map((_, i) => (
             <mesh 
                key={`tooth-outer-${i}`} 
                position={[
                    Math.cos((i / 18) * Math.PI * 2) * 1.5,
                    Math.sin((i / 18) * Math.PI * 2) * 1.5,
                    3.6
                ]}
                rotation={[Math.PI/2, 0, (i / 18) * Math.PI * 2]}
             >
                <coneGeometry args={[0.1, 1.2, 8]} />
                <meshStandardMaterial color="#F5F5DC" roughness={0.2} />
             </mesh>
          ))}

          {/* TEETH Inner */}
          {Array.from({ length: 10 }).map((_, i) => (
             <mesh 
                key={`tooth-inner-${i}`} 
                position={[
                    Math.cos((i / 10) * Math.PI * 2 + 0.3) * 1.0,
                    Math.sin((i / 10) * Math.PI * 2 + 0.3) * 1.0,
                    3.4
                ]}
                rotation={[Math.PI/2 - 0.2, 0, (i / 10) * Math.PI * 2 + 0.3]}
             >
                <coneGeometry args={[0.08, 0.9, 8]} />
                <meshStandardMaterial color="#E0E0C0" roughness={0.3} />
             </mesh>
          ))}

          {/* EYES */}
          {Array.from({ length: 14 }).map((_, i) => (
             <mesh 
                key={`spot-${i}`} 
                position={[
                    (Math.random() - 0.5) * 3.8,
                    (Math.random() - 0.5) * 3.8,
                    (Math.random() - 0.5) * 6.5
                ]}
             >
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial 
                    color={stunTimer.current > 0 ? "#FFFFFF" : "#F1C40F"} 
                    emissive={stunTimer.current > 0 ? "#FFFFFF" : "#F39C12"} 
                    emissiveIntensity={stunTimer.current > 0 ? 0.5 : 0.2} 
                />
             </mesh>
          ))}

          {/* BODY SEGMENTS */}
          {Array.from({ length: 6 }).map((_, i) => (
              <mesh key={`tail-${i}`} position={[0, -0.3 * i, -3.5 - (i * 1.8)]} castShadow>
                  <cylinderGeometry args={[1.8 - (i*0.2), 1.5 - (i*0.2), 2.0, 16]} rotation={[Math.PI/2, 0, 0]} />
                  <meshStandardMaterial color={bodyColor} />
              </mesh>
          ))}

          {/* ARMS */}
           <mesh position={[2.2, -1.5, 0]} rotation={[0, 0, -0.5]}>
                <capsuleGeometry args={[0.3, 1.5, 4, 8]} />
                <meshStandardMaterial color={bodyColor} />
           </mesh>
           <mesh position={[-2.2, -1.5, 0]} rotation={[0, 0, 0.5]}>
                <capsuleGeometry args={[0.3, 1.5, 4, 8]} />
                <meshStandardMaterial color={bodyColor} />
           </mesh>
      </group>

      {/* Particle System Mesh */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial 
            color="#FFD700" 
            emissive="#FF4500" 
            emissiveIntensity={1} 
            roughness={0.4} 
            metalness={0.6}
        />
      </instancedMesh>
    </group>
  );
};
