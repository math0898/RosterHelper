/**
 * Represents a single entry on a raider's wishlist.
 *
 * The weight is a raw numeric power-gain value.  For reference, 100 000 (100k)
 * corresponds to 100 % of the baseline power budget, so percentages and
 * k-values are interchangeable (50 000 ≡ 50k ≡ 50 %).
 */
export class WishlistEntry {
  /**
   * @param {string} lootItemId - The id of the LootItem this entry refers to.
   * @param {number} weight     - Approximate power gain (raw numeric value).
   */
  constructor(lootItemId, weight) {
    this.lootItemId = lootItemId;
    this.weight     = weight;
  }

  /** Serialise to a plain object suitable for JSON.stringify. */
  toJSON() {
    return {
      lootItemId: this.lootItemId,
      weight:     this.weight,
    };
  }

  /**
   * Reconstruct a WishlistEntry from a plain JSON object.
   * @param {object} obj
   * @returns {WishlistEntry}
   */
  static fromJSON(obj) {
    return new WishlistEntry(obj.lootItemId, obj.weight ?? 0);
  }
}
