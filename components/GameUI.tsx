
import React from 'react';
import { WeaponType } from '../types';

interface GameUIProps {
  monsterHealth: number;
  playerHealth: number;
  currentWeapon: WeaponType;
  isDead: boolean;
}

const WEAPON_NAMES: Record<WeaponType, string> = {
  pistol: 'GRAVITY PISTOL',
  shotgun: 'SCATTER BLASTER',
  smg: 'RAPID REPEATER'
};

export const GameUI: React.FC<GameUIProps> = ({ monsterHealth, playerHealth, currentWeapon, isDead }) => {
  if (isDead) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 overflow-hidden">
      
      {/* Damage Overlay - Red Vignette */}
      <div 
        className="absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none"
        style={{
            background: 'radial-gradient(circle, transparent 50%, rgba(255,0,0,0.5) 100%)',
            opacity: playerHealth < 100 ? (100 - playerHealth) / 100 : 0
        }}
      />

      {/* Top HUD - Single Boss Bar */}
      <div className="flex justify-center items-start z-10 w-full">
        <div className="bg-black/50 p-4 rounded text-white backdrop-blur-sm w-1/2 max-w-2xl">
          <h1 className="text-xl font-bold text-red-500 tracking-wider text-center">TRAIN EATER</h1>
          <div className="w-full h-4 bg-gray-800 rounded mt-2 border border-gray-600 overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
              style={{ width: `${monsterHealth}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Weapon & Map Info (Top Right - shifted down slightly) */}
      <div className="absolute top-24 right-6 flex flex-col items-end gap-2 z-10">
            <div className="bg-blue-900/50 p-4 rounded text-white backdrop-blur-sm text-right">
              <h2 className="text-xl font-bold">SANDBOX</h2>
              <p className="text-sm opacity-80">Free Play</p>
            </div>
            
            {/* Weapon Display */}
            <div className="bg-gray-900/70 p-4 rounded text-white backdrop-blur-sm text-right border-r-4 border-yellow-500">
                <h3 className="text-sm text-gray-400 uppercase tracking-widest">Equipped</h3>
                <p className="text-2xl font-black italic">{WEAPON_NAMES[currentWeapon]}</p>
                <div className="flex gap-2 justify-end mt-2 text-xs opacity-50">
                    <span className={currentWeapon === 'pistol' ? 'text-yellow-400 font-bold' : ''}>[1] PISTOL</span>
                    <span className={currentWeapon === 'shotgun' ? 'text-yellow-400 font-bold' : ''}>[2] SHOTGUN</span>
                    <span className={currentWeapon === 'smg' ? 'text-yellow-400 font-bold' : ''}>[3] SMG</span>
                </div>
            </div>
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-1 h-1 bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/30 rounded-full transition-all duration-200 
            ${currentWeapon === 'shotgun' ? 'w-16 h-16 border-2' : ''}
            ${currentWeapon === 'smg' ? 'w-6 h-6 border-dashed' : ''}
            ${currentWeapon === 'pistol' ? 'w-8 h-8' : ''}
        `} />
      </div>

      {/* Bottom HUD - Controls & Health */}
      <div className="flex justify-between items-end z-10">
        
        {/* Player Health */}
        <div className="flex flex-col gap-1">
            <div className="bg-black/60 p-4 rounded-tr-xl border-l-4 border-green-500 backdrop-blur-sm">
                <h3 className="text-green-400 font-bold tracking-widest text-sm uppercase">Vitality</h3>
                <div className="flex items-end gap-2">
                    <span className={`text-4xl font-black ${playerHealth < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {Math.ceil(playerHealth)}
                    </span>
                    <span className="text-gray-400 mb-1">%</span>
                </div>
                {/* Health Bar */}
                <div className="w-48 h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${playerHealth < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${playerHealth}%` }}
                    />
                </div>
            </div>
        </div>

        {/* Info */}
        <div className="flex flex-col items-end gap-4">
             <div className="bg-black/50 p-4 rounded text-white text-sm space-y-1 backdrop-blur-sm text-right">
                <p><span className="font-bold text-yellow-400">WASD</span> to Move</p>
                <p><span className="font-bold text-yellow-400">SPACE</span> to Jump</p>
                <p><span className="font-bold text-yellow-400">L-CLICK</span> to Shoot</p>
                <p><span className="font-bold text-yellow-400">1-3</span> to Switch Weapon</p>
            </div>
        </div>
      </div>
    </div>
  );
};
