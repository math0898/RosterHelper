import { Boss } from '../models/Boss.js';

const STORAGE_KEY = 'rosterhelper_bosses';

/**
 * Manages the collection of Bosses and persists them to localStorage.
 * Mirrors the RosterStore pattern.
 */
export class BossStore {
  constructor() {
    /** @type {Boss[]} */
    this._bosses = [];
    this._load();
  }

  /** Returns a shallow copy of the bosses array. */
  getAll() {
    return [...this._bosses];
  }

  /**
   * Add a new Boss and persist immediately.
   * @param {Boss} boss
   */
  add(boss) {
    this._bosses.push(boss);
    this._save();
  }

  /**
   * Remove a Boss by id and persist immediately.
   * @param {string} id
   */
  remove(id) {
    this._bosses = this._bosses.filter((b) => b.id !== id);
    this._save();
  }

  /**
   * Replace an existing Boss (matched by id) and persist.
   * @param {Boss} updated
   */
  update(updated) {
    const index = this._bosses.findIndex((b) => b.id === updated.id);
    if (index !== -1) {
      this._bosses[index] = updated;
      this._save();
    }
  }

  /** Persist the current boss list to localStorage. */
  _save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this._bosses.map((b) => b.toJSON())),
      );
    } catch (e) {
      console.warn('BossStore: failed to save to localStorage', e);
    }
  }

  /** Hydrate the boss list from localStorage (called once in the constructor). */
  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this._bosses = parsed.map((obj) => Boss.fromJSON(obj));
      }
    } catch (e) {
      console.warn('BossStore: failed to load from localStorage', e);
      this._bosses = [];
    }
  }
}
