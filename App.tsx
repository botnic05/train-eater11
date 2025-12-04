
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Loader, KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import GameWorld from './components/GameWorld';
import { GameUI } from './components/GameUI';
import { WeaponType } from './types';
import { playPlayerDamageSound } from './components/SoundUtils';

// Define keyboard map
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
  { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
  { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
  { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
  { name: 'shoot', keys: ['Click', 'e', 'E'] }, // We'll handle click separately usually, but E is interact
  { name: 'slot1', keys: ['1'] },
  { name: 'slot2', keys: ['2'] },
  { name: 'slot3', keys: ['3'] },
];

const App: React.FC = () => {
  const [ready, setReady] = useState(false);

  // Game State
  const [monsterHealth, setMonsterHealth] = useState(100);
  
  const [playerHealth, setPlayerHealth] = useState(100);
  const [isDead, setIsDead] = useState(false);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('pistol');
  
  // Track last damage time for regeneration
  const [lastDamageTime, setLastDamageTime] = useState(0);

  const handleMonsterHit = (damage: number = 2) => {
    setMonsterHealth((prev) => Math.max(0, prev - damage));
  };

  const handlePlayerDamage = (amount: number) => {
    if (playerHealth <= 0 || isDead) return;
    
    const newHealth = Math.max(0, playerHealth - amount);
    setPlayerHealth(newHealth);
    setLastDamageTime(Date.now());
    playPlayerDamageSound();

    if (newHealth <= 0) {
        setIsDead(true);
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }
  };

  const handleRespawn = () => {
      setPlayerHealth(100);
      setIsDead(false);
      setMonsterHealth(100);
  };

  // Health Regeneration Logic
  useEffect(() => {
    const regenInterval = setInterval(() => {
        // If 3 seconds passed since last damage, and health is not full, and player is not dead
        if (!isDead && Date.now() - lastDamageTime > 3000 && playerHealth < 100 && playerHealth > 0) {
            setPlayerHealth(prev => Math.min(100, prev + 5)); // Regen 5 HP per second
        }
    }, 1000);
    return () => clearInterval(regenInterval);
  }, [playerHealth, lastDamageTime, isDead]);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className="w-full h-full relative bg-blue-300">
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          camera={{ fov: 75, position: [0, 5, 10] }}
          gl={{ alpha: false, antialias: true }}
          onPointerDown={(e) => {
            // Setup pointer lock on click if not locked and player is alive
            if (!isDead && document.pointerLockElement !== e.target) {
              (e.target as HTMLElement).requestPointerLock();
            }
          }}
        >
          {/* Lighting based on gm_flatgrass: Bright, sunny */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[50, 100, 50]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={200}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          <Sky sunPosition={[100, 20, 100]} rayleigh={0.5} turbidity={10} exposure={0.5} />
          
          <Physics gravity={[0, -9.81, 0]}>
            <GameWorld 
              onMonsterHit={handleMonsterHit} 
              monsterHealth={monsterHealth}
              playerHealth={playerHealth}
              onPlayerDamage={handlePlayerDamage}
              currentWeapon={currentWeapon}
              setWeapon={setCurrentWeapon}
              isDead={isDead}
            />
          </Physics>
        </Canvas>
      </KeyboardControls>
      
      {!isDead && (
          <GameUI 
            monsterHealth={monsterHealth} 
            playerHealth={playerHealth}
            currentWeapon={currentWeapon}
            isDead={isDead}
          />
      )}
      
      {/* Death Screen */}
      {isDead && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <h1 className="text-8xl font-black text-red-600 mb-4 tracking-tighter">YOU DIED</h1>
              <p className="text-gray-400 mb-8 text-xl">The ecosystem has claimed you.</p>
              <button 
                onClick={handleRespawn}
                className="px-8 py-4 bg-white text-black font-bold text-2xl rounded hover:bg-gray-200 transition-colors uppercase tracking-widest"
              >
                  Respawn
              </button>
          </div>
      )}

      <Loader />
    </div>
  );
};

export default App;
