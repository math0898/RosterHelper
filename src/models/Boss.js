import { LootItem } from './LootItem.js';

/**
 * Represents a boss encounter that raiders can be tracked against.
 */
export class Boss {
  /**
   * @param {string} name          - Boss name (e.g. "Fyrakk the Blazing").
   * @param {string} [instance=''] - Raid instance / tier name.
   * @param {LootItem[]} [loot=[]] - Loot items that can drop from this boss.
   */
  constructor(name, instance = '', loot = []) {
    this.id       = crypto.randomUUID();
    this.name     = name;
    this.instance = instance;
    this.loot     = loot;
  }

  /** Serialise to a plain object suitable for JSON.stringify. */
  toJSON() {
    return {
      id:       this.id,
      name:     this.name,
      instance: this.instance,
      loot:     this.loot.map((item) => item.toJSON()),
    };
  }

  /**
   * Reconstruct a Boss from a plain JSON object.
   * @param {object} obj
   * @returns {Boss}
   */
  static fromJSON(obj) {
    const loot = (obj.loot ?? []).map((i) => LootItem.fromJSON(i));
    const boss = new Boss(obj.name, obj.instance ?? '', loot);
    boss.id = obj.id;
    return boss;
  }
}
