export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ShipTelemetry {
  pos: Vector3D;
  vel: Vector3D;
  speed: number;
  maxSpeed: number;
  boostMultiplier: number;
  isBoosting: boolean;
  shields: number;
  maxShields: number;
  hull: number;
  maxHull: number;
  credits: number;
  currentSector: string;
}

export type FactionType = 'ALLIANCE' | 'MINERS' | 'PIRATES' | 'APEX_ROGUE';

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardCredits: number;
  isCompleted: boolean;
  targetSector: string;
  type: 'BOUNTY' | 'SALVAGE' | 'PATROL';
}

export interface StationItem {
  id: string;
  name: string;
  category: 'WEAPON' | 'SHIELD' | 'ENGINE' | 'HULL';
  cost: number;
  description: string;
  statBonus: number;
}
