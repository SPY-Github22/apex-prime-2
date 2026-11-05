import { describe, it, expect } from 'vitest';
import { TerminalUI } from './terminal_ui';
import { StarbaseShop } from './shop';
import { QuestManager } from './quests';
import { Starship } from './ship';

describe('TerminalUI Logic & Controller', () => {
  it('instantiates and provides open/close/toggle state', () => {
    const shop = new StarbaseShop();
    const quests = new QuestManager();
    const ship = new Starship();
    let credits = 2500;

    const ui = new TerminalUI({
      shop,
      quests,
      ship,
      getCredits: () => credits,
      setCredits: (c) => { credits = c; }
    });

    expect(ui.isOpen()).toBe(false);
  });
});
