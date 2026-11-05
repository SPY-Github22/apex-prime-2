import * as THREE from 'three';

export type QuestType = 'MINE_ASTEROIDS' | 'KILL_ENEMIES' | 'NAVIGATE_COORDS';
export type QuestStatus = 'AVAILABLE' | 'ACTIVE' | 'READY_TO_CLAIM' | 'COMPLETED';

export interface Quest {
  id: string;
  act: number;
  title: string;
  issuer: string;
  issuerTitle: string;
  description: string;
  dialogue: string;
  completionDialogue: string;
  type: QuestType;
  targetCoords?: { x: number; y: number; z: number };
  targetDistance?: number;
  requiredCount: number;
  currentCount: number;
  rewardCredits: number;
  rewardItem: string;
  status: QuestStatus;
}

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest-act1-minerals',
    act: 1,
    title: 'Titanium Extraction Run',
    issuer: 'Kaelen Voss',
    issuerTitle: 'Belter Prospector & Smuggler',
    description: 'Valles Rim asteroids contain high-density titanium pockets. Blast apart 3 asteroids to extract rare minerals.',
    dialogue: 'Look kid, station defenses are draining our energy cells faster than we can recharge. Shoot down 3 asteroids out in the rim and bring back the raw titanium. Pay is solid.',
    completionDialogue: 'Fine shooting out there! Those titanium nodules will keep our station shields humming for weeks.',
    type: 'MINE_ASTEROIDS',
    requiredCount: 3,
    currentCount: 0,
    rewardCredits: 1200,
    rewardItem: 'Belter Smuggler Frequency',
    status: 'AVAILABLE'
  },
  {
    id: 'quest-act1-pirates',
    act: 1,
    title: 'Obsidian Syndicate Suppression',
    issuer: 'Commander Vance',
    issuerTitle: 'Alliance Garrison Commander',
    description: 'Obsidian Syndicate pirate drones are raiding civilian freighters along Rim Corridor 4. Hunt and destroy 4 pirate drones.',
    dialogue: 'Vanguard pilot, rogue drones bearing Syndicate telemetry are swarming outer perimeter buoy 7. Clean them out of our airspace and you will earn the Alliance’s gratitude.',
    completionDialogue: 'Outstanding combat marksmanship. Alliance command has authorized full combat bounty transfer to your ship account.',
    type: 'KILL_ENEMIES',
    requiredCount: 4,
    currentCount: 0,
    rewardCredits: 1800,
    rewardItem: 'Alliance Security Passcode',
    status: 'AVAILABLE'
  },
  {
    id: 'quest-act1-beacon',
    act: 1,
    title: 'The Whispering Monolith',
    issuer: 'AURA',
    issuerTitle: 'Tactical Ship Co-Pilot AI',
    description: 'Unidentified tachyon signals detected from deep space coordinates (150, 0, -450). Fly within 45 units to investigate.',
    dialogue: 'Pilot, my deep-wave sensors are registering harmonic resonance spikes that match no known human alloy. I have marked nav-coordinates at [150, 0, -450]. Let us investigate.',
    completionDialogue: 'Sensor telemetry uploaded. Fascinating... the beacon is sending encrypted sub-space pings directly toward Sector 2: The Neon Graveyard.',
    type: 'NAVIGATE_COORDS',
    targetCoords: { x: 150, y: 0, z: -450 },
    targetDistance: 45,
    requiredCount: 1,
    currentCount: 0,
    rewardCredits: 2500,
    rewardItem: 'Obsidian Monolith Coordinates',
    status: 'AVAILABLE'
  }
];

export class QuestManager {
  public quests: Quest[];

  constructor(initialList: Quest[] = INITIAL_QUESTS) {
    // Deep clone initial quests to keep state isolated
    this.quests = initialList.map(q => ({ ...q }));
  }

  public getQuest(id: string): Quest | undefined {
    return this.quests.find(q => q.id === id);
  }

  public getAvailableQuests(): Quest[] {
    return this.quests.filter(q => q.status === 'AVAILABLE');
  }

  public getActiveQuests(): Quest[] {
    return this.quests.filter(q => q.status === 'ACTIVE' || q.status === 'READY_TO_CLAIM');
  }

  public getCompletedQuests(): Quest[] {
    return this.quests.filter(q => q.status === 'COMPLETED');
  }

  public acceptQuest(id: string): { success: boolean; message: string; quest?: Quest } {
    const quest = this.getQuest(id);
    if (!quest) {
      return { success: false, message: 'Quest not found.' };
    }
    if (quest.status !== 'AVAILABLE') {
      return { success: false, message: `Quest is already ${quest.status.toLowerCase()}.` };
    }

    quest.status = 'ACTIVE';
    return {
      success: true,
      message: `Accepted Mission: "${quest.title}"`,
      quest
    };
  }

  public onAsteroidMined(): { updated: Quest[]; newlyReady: Quest[] } {
    const updated: Quest[] = [];
    const newlyReady: Quest[] = [];

    for (const q of this.quests) {
      if (q.status === 'ACTIVE' && q.type === 'MINE_ASTEROIDS') {
        q.currentCount = Math.min(q.requiredCount, q.currentCount + 1);
        updated.push(q);
        if (q.currentCount >= q.requiredCount) {
          q.status = 'READY_TO_CLAIM';
          newlyReady.push(q);
        }
      }
    }

    return { updated, newlyReady };
  }

  public onEnemyDestroyed(): { updated: Quest[]; newlyReady: Quest[] } {
    const updated: Quest[] = [];
    const newlyReady: Quest[] = [];

    for (const q of this.quests) {
      if (q.status === 'ACTIVE' && q.type === 'KILL_ENEMIES') {
        q.currentCount = Math.min(q.requiredCount, q.currentCount + 1);
        updated.push(q);
        if (q.currentCount >= q.requiredCount) {
          q.status = 'READY_TO_CLAIM';
          newlyReady.push(q);
        }
      }
    }

    return { updated, newlyReady };
  }

  public onPositionUpdate(pos: THREE.Vector3): { updated: Quest[]; newlyReady: Quest[] } {
    const updated: Quest[] = [];
    const newlyReady: Quest[] = [];

    for (const q of this.quests) {
      if (q.status === 'ACTIVE' && q.type === 'NAVIGATE_COORDS' && q.targetCoords) {
        const target = new THREE.Vector3(q.targetCoords.x, q.targetCoords.y, q.targetCoords.z);
        const dist = pos.distanceTo(target);
        const reqDist = q.targetDistance || 45;

        if (dist <= reqDist) {
          q.currentCount = 1;
          q.status = 'READY_TO_CLAIM';
          updated.push(q);
          newlyReady.push(q);
        }
      }
    }

    return { updated, newlyReady };
  }

  public claimReward(
    id: string,
    currentCredits: number
  ): { success: boolean; newCredits: number; message: string; quest?: Quest } {
    const quest = this.getQuest(id);
    if (!quest) {
      return { success: false, newCredits: currentCredits, message: 'Quest not found.' };
    }

    if (quest.status !== 'READY_TO_CLAIM') {
      return {
        success: false,
        newCredits: currentCredits,
        message: `Quest is not ready to claim (Current status: ${quest.status}).`
      };
    }

    quest.status = 'COMPLETED';
    const newCredits = currentCredits + quest.rewardCredits;

    return {
      success: true,
      newCredits,
      message: `Completed "${quest.title}"! Received ${quest.rewardCredits.toLocaleString()} CR and ${quest.rewardItem}.`,
      quest
    };
  }
}
