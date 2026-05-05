/**
 * Represents a loot item that can drop from a boss encounter.
 *
 * Eventually Raiders will have these on their wishlists with a weight
 * representing the rough power gain from equipping the item.
 */
export class LootItem {
  /**
   * @param {string} name - Item name (e.g. "Greatstaff of the Murkwater Arcanist").
   * @param {string} slot - Equipment slot (e.g. "Head", "Trinket", "Weapon").
   */
  constructor(name, slot) {
    this.id   = crypto.randomUUID();
    this.name = name;
    this.slot = slot;
  }

  /** Serialise to a plain object suitable for JSON.stringify. */
  toJSON() {
    return {
      id:   this.id,
      name: this.name,
      slot: this.slot,
    };
  }

  /**
   * Reconstruct a LootItem from a plain JSON object.
   * @param {object} obj
   * @returns {LootItem}
   */
  static fromJSON(obj) {
    const item = new LootItem(obj.name, obj.slot ?? '');
    item.id = obj.id;
    return item;
  }
}

/**
 * Ordered list of equipment slot names used in the add-loot form selector.
 */
export const EQUIPMENT_SLOTS = [
  'Head',
  'Neck',
  'Shoulder',
  'Back',
  'Chest',
  'Wrist',
  'Hands',
  'Waist',
  'Legs',
  'Feet',
  'Ring',
  'Trinket',
  'Main Hand',
  'Off Hand',
  'Two-Hand',
];
