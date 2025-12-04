export type Vector3Array = [number, number, number];

export type WeaponType = 'pistol' | 'shotgun' | 'smg';

export interface WeaponState {
  isFiring: boolean;
  ammo: number;
}

export interface GameState {
  monsterHealth: number;
  score: number;
  damageMonster: (amount: number) => void;
  resetGame: () => void;
}