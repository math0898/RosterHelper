import { WishlistEntry } from './WishlistEntry.js';

/**
 * Represents a single raider in the roster.
 *
 * Fields collected at creation: username, wowClass, spec, rank.
 * Fields stored but set later:  itemLevel, bossData, wishlist.
 */
export class Raider {
  /**
   * @param {string} username  - The player's in-game name.
   * @param {string} wowClass  - The WoW class (e.g. "Paladin").
   * @param {string} spec      - The specialisation (e.g. "Holy").
   * @param {string} [rank='Member']              - Raid rank (Guild Master/Officer/Member/Bench/Trial).
   * @param {number} [itemLevel=0]                - Average item level.
   * @param {BossEntry[]} [bossData=[]]           - Per-boss statistics array.
   * @param {WishlistEntry[]} [wishlist=[]]       - Loot items the raider wants, with power-gain weights.
   */
  constructor(username, wowClass, spec, rank = 'Member', itemLevel = 0, bossData = [], wishlist = []) {
    this.id        = crypto.randomUUID();
    this.username  = username;
    this.wowClass  = wowClass;
    this.spec      = spec;
    this.rank      = rank;
    this.itemLevel = itemLevel;
    this.bossData  = bossData;
    this.wishlist  = wishlist;
  }

  /** Serialise to a plain object suitable for JSON.stringify. */
  toJSON() {
    return {
      id:        this.id,
      username:  this.username,
      wowClass:  this.wowClass,
      spec:      this.spec,
      rank:      this.rank,
      itemLevel: this.itemLevel,
      bossData:  this.bossData,
      wishlist:  this.wishlist.map((e) => e.toJSON()),
    };
  }

  /**
   * Reconstruct a Raider from a plain JSON object.
   * @param {object} obj
   * @returns {Raider}
   */
  static fromJSON(obj) {
    const wishlist = (obj.wishlist ?? []).map((e) => WishlistEntry.fromJSON(e));
    const raider = new Raider(
      obj.username,
      obj.wowClass,
      obj.spec,
      obj.rank      ?? 'Member',
      obj.itemLevel ?? 0,
      obj.bossData  ?? [],
      wishlist,
    );
    raider.id = obj.id;
    return raider;
  }
}

/**
 * @typedef {object} BossEntry
 * @property {string} bossId    - The id of the Boss this entry refers to.
 * @property {string} bossName  - Name of the boss (denormalised for display).
 * @property {number} kills     - Number of kills.
 * @property {boolean} vault    - Whether this boss is unlocked for the raider's Great Vault.
 */

