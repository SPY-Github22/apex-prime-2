import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { QuestManager } from './quests';

describe('Quest Board & Mission Engine', () => {
  it('initializes with Act 1 and Act 2 available missions', () => {
    const qm = new QuestManager();
    const available = qm.getAvailableQuests();
    expect(available.length).toBe(6);
    expect(qm.getActiveQuests().length).toBe(0);
    expect(qm.getCompletedQuests().length).toBe(0);

    const minQuest = qm.getQuest('quest-act1-minerals');
    expect(minQuest).toBeDefined();
    expect(minQuest!.issuer).toBe('Kaelen Voss');
    expect(minQuest!.rewardCredits).toBe(1200);

    const salvageQuest = qm.getQuest('quest-act2-salvage');
    expect(salvageQuest).toBeDefined();
    expect(salvageQuest!.issuer).toBe('Dr. Elena Ruiz');
    expect(salvageQuest!.rewardCredits).toBe(2800);
  });

  it('accepts available missions into active quest log', () => {
    const qm = new QuestManager();
    const res = qm.acceptQuest('quest-act1-minerals');
    expect(res.success).toBe(true);
    expect(res.quest?.status).toBe('ACTIVE');
    expect(qm.getActiveQuests().length).toBe(1);

    // Cannot re-accept already active quest
    const res2 = qm.acceptQuest('quest-act1-minerals');
    expect(res2.success).toBe(false);
  });

  it('advances asteroid mining quests and transitions to READY_TO_CLAIM', () => {
    const qm = new QuestManager();
    qm.acceptQuest('quest-act1-minerals'); // requires 3 asteroids

    // First asteroid mined
    const r1 = qm.onAsteroidMined();
    expect(r1.updated.length).toBe(1);
    expect(r1.newlyReady.length).toBe(0);
    expect(qm.getQuest('quest-act1-minerals')!.currentCount).toBe(1);

    // Second asteroid
    qm.onAsteroidMined();
    expect(qm.getQuest('quest-act1-minerals')!.currentCount).toBe(2);

    // Third asteroid completes requirement
    const r3 = qm.onAsteroidMined();
    expect(r3.newlyReady.length).toBe(1);
    expect(qm.getQuest('quest-act1-minerals')!.status).toBe('READY_TO_CLAIM');
  });

  it('advances enemy kill quests and transitions to READY_TO_CLAIM', () => {
    const qm = new QuestManager();
    qm.acceptQuest('quest-act1-pirates'); // requires 4 enemy kills

    for (let i = 0; i < 3; i++) {
      qm.onEnemyDestroyed();
    }
    const q = qm.getQuest('quest-act1-pirates')!;
    expect(q.currentCount).toBe(3);
    expect(q.status).toBe('ACTIVE');

    const res = qm.onEnemyDestroyed();
    expect(res.newlyReady.length).toBe(1);
    expect(q.status).toBe('READY_TO_CLAIM');
  });

  it('advances navigation coordinates quest upon entering radius', () => {
    const qm = new QuestManager();
    qm.acceptQuest('quest-act1-beacon'); // Target: (150, 0, -450), radius: 45

    // Ship far away (0, 0, 0)
    const farRes = qm.onPositionUpdate(new THREE.Vector3(0, 0, 0));
    expect(farRes.newlyReady.length).toBe(0);
    expect(qm.getQuest('quest-act1-beacon')!.status).toBe('ACTIVE');

    // Ship arrives at (140, 5, -440) -> dist ~17 < 45
    const nearRes = qm.onPositionUpdate(new THREE.Vector3(140, 5, -440));
    expect(nearRes.newlyReady.length).toBe(1);
    expect(qm.getQuest('quest-act1-beacon')!.status).toBe('READY_TO_CLAIM');
  });

  it('claims rewards, credits, and updates quest status to COMPLETED', () => {
    const qm = new QuestManager();
    qm.acceptQuest('quest-act1-minerals');

    // Attempting to claim before ready fails
    const failClaim = qm.claimReward('quest-act1-minerals', 1000);
    expect(failClaim.success).toBe(false);
    expect(failClaim.newCredits).toBe(1000);

    // Complete objectives
    qm.onAsteroidMined();
    qm.onAsteroidMined();
    qm.onAsteroidMined();

    // Successful claim
    const winClaim = qm.claimReward('quest-act1-minerals', 1000);
    expect(winClaim.success).toBe(true);
    expect(winClaim.newCredits).toBe(2200); // 1000 + 1200
    expect(winClaim.quest?.status).toBe('COMPLETED');
    expect(qm.getCompletedQuests().length).toBe(1);
    expect(qm.getActiveQuests().length).toBe(0);
  });

  it('advances derelict salvage quests and transitions to READY_TO_CLAIM', () => {
    const qm = new QuestManager();
    qm.acceptQuest('quest-act2-salvage'); // requires 3 salvages

    qm.onDerelictSalvaged();
    qm.onDerelictSalvaged();
    const res = qm.onDerelictSalvaged();

    expect(res.newlyReady.length).toBe(1);
    expect(qm.getQuest('quest-act2-salvage')!.status).toBe('READY_TO_CLAIM');
  });

  it('advances phantom purge quests on phantom destruction', () => {
    const qm = new QuestManager();
    qm.acceptQuest('quest-act2-phantoms'); // requires 4 phantom kills

    for (let i = 0; i < 3; i++) {
      qm.onPhantomDestroyed();
    }
    expect(qm.getQuest('quest-act2-phantoms')!.currentCount).toBe(3);

    const res = qm.onPhantomDestroyed();
    expect(res.newlyReady.length).toBe(1);
    expect(qm.getQuest('quest-act2-phantoms')!.status).toBe('READY_TO_CLAIM');
  });
});
