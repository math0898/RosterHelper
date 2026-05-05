import { Raider } from '../models/Raider.js';

const STORAGE_KEY = 'rosterhelper_raiders';

/**
 * Manages the collection of Raiders and persists them to localStorage.
 * Follows a simple repository / store pattern.
 */
export class RosterStore {
  constructor() {
    /** @type {Raider[]} */
    this._raiders = [];
    this._load();
  }

  /** Returns a shallow copy of the raiders array. */
  getAll() {
    return [...this._raiders];
  }

  /**
   * Add a new Raider and persist immediately.
   * @param {Raider} raider
   */
  add(raider) {
    this._raiders.push(raider);
    this._save();
  }

  /**
   * Remove a Raider by id and persist immediately.
   * @param {string} id
   */
  remove(id) {
    this._raiders = this._raiders.filter((r) => r.id !== id);
    this._save();
  }

  /**
   * Replace an existing Raider (matched by id) and persist.
   * @param {Raider} updated
   */
  update(updated) {
    const index = this._raiders.findIndex((r) => r.id === updated.id);
    if (index !== -1) {
      this._raiders[index] = updated;
      this._save();
    }
  }

  /**
   * Update the spec for a specific raider and persist.
   * @param {string} raiderId
   * @param {string} spec
   */
  updateSpec(raiderId, spec) {
    const raider = this._raiders.find((r) => r.id === raiderId);
    if (raider) {
      raider.spec = spec;
      this._save();
    }
  }

  /**
   * Add or update a wishlist entry for a specific raider and persist.
   * If an entry for the same lootItemId already exists it is replaced.
   * @param {string} raiderId
   * @param {import('../models/WishlistEntry.js').WishlistEntry} entry
   */
  addToWishlist(raiderId, entry) {
    const raider = this._raiders.find((r) => r.id === raiderId);
    if (raider) {
      raider.wishlist = raider.wishlist.filter((w) => w.lootItemId !== entry.lootItemId);
      raider.wishlist.push(entry);
      this._save();
    }
  }

  /**
   * Remove a wishlist entry from a specific raider and persist.
   * @param {string} raiderId
   * @param {string} lootItemId
   */
  removeFromWishlist(raiderId, lootItemId) {
    const raider = this._raiders.find((r) => r.id === raiderId);
    if (raider) {
      raider.wishlist = raider.wishlist.filter((w) => w.lootItemId !== lootItemId);
      this._save();
    }
  }

  /** Persist the current roster to localStorage. */
  _save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this._raiders.map((r) => r.toJSON())),
      );
    } catch (e) {
      console.warn('RosterStore: failed to save to localStorage', e);
    }
  }

  /** Hydrate the roster from localStorage (called once in the constructor). */
  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this._raiders = parsed.map((obj) => Raider.fromJSON(obj));
      }
    } catch (e) {
      console.warn('RosterStore: failed to load from localStorage', e);
      this._raiders = [];
    }
  }
}
