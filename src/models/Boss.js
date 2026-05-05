/**
 * Represents a boss encounter that raiders can be tracked against.
 */
export class Boss {
  /**
   * @param {string} name       - Boss name (e.g. "Fyrakk the Blazing").
   * @param {string} [instance=''] - Raid instance / tier name.
   */
  constructor(name, instance = '') {
    this.id = crypto.randomUUID();
    this.name = name;
    this.instance = instance;
  }

  /** Serialise to a plain object suitable for JSON.stringify. */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      instance: this.instance,
    };
  }

  /**
   * Reconstruct a Boss from a plain JSON object.
   * @param {object} obj
   * @returns {Boss}
   */
  static fromJSON(obj) {
    const boss = new Boss(obj.name, obj.instance ?? '');
    boss.id = obj.id;
    return boss;
  }
}
