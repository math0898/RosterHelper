/**
 * Represents a single raider in the roster.
 *
 * Fields collected at creation: username, wowClass, spec.
 * Fields stored but set later:  itemLevel, bossData.
 */
export class Raider {
  /**
   * @param {string} username  - The player's in-game name.
   * @param {string} wowClass  - The WoW class (e.g. "Paladin").
   * @param {string} spec      - The specialisation (e.g. "Holy").
   * @param {number} [itemLevel=0]      - Average item level.
   * @param {BossEntry[]} [bossData=[]] - Per-boss statistics array.
   */
  constructor(username, wowClass, spec, itemLevel = 0, bossData = []) {
    this.id = crypto.randomUUID();
    this.username = username;
    this.wowClass = wowClass;
    this.spec = spec;
    this.itemLevel = itemLevel;
    this.bossData = bossData;
  }

  /** Serialise to a plain object suitable for JSON.stringify. */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      wowClass: this.wowClass,
      spec: this.spec,
      itemLevel: this.itemLevel,
      bossData: this.bossData,
    };
  }

  /**
   * Reconstruct a Raider from a plain JSON object.
   * @param {object} obj
   * @returns {Raider}
   */
  static fromJSON(obj) {
    const raider = new Raider(
      obj.username,
      obj.wowClass,
      obj.spec,
      obj.itemLevel ?? 0,
      obj.bossData ?? [],
    );
    raider.id = obj.id;
    return raider;
  }
}

/**
 * @typedef {object} BossEntry
 * @property {string} bossName  - Name of the boss.
 * @property {number} kills     - Number of kills.
 * @property {boolean} attended - Whether the raider attended this encounter.
 */
