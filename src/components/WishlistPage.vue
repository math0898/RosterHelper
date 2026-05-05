<script setup>
import { ref, computed, watch } from 'vue';
import { WishlistEntry } from '../models/WishlistEntry.js';

const props = defineProps({
  /** @type {import('../models/Raider.js').Raider[]} */
  raiders: {
    type: Array,
    required: true,
  },
  /** @type {import('../models/Boss.js').Boss[]} */
  bosses: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['add-to-wishlist', 'remove-from-wishlist']);

// ─── Raider selection ─────────────────────────────────────────────────────────

const selectedRaiderId = ref('');

const selectedRaider = computed(() =>
  props.raiders.find((r) => r.id === selectedRaiderId.value) ?? null,
);

/** Fast lookup: lootItemId → WishlistEntry for the selected raider. */
const wishlistMap = computed(() => {
  const map = new Map();
  if (selectedRaider.value) {
    for (const entry of (selectedRaider.value.wishlist ?? [])) {
      map.set(entry.lootItemId, entry);
    }
  }
  return map;
});

// ─── Loot items grouped by instance → boss ───────────────────────────────────

/**
 * Bosses that have at least one loot item, grouped by instance.
 * @type {import('vue').ComputedRef<{ instance: string, bosses: import('../models/Boss.js').Boss[] }[]>}
 */
const lootGroups = computed(() => {
  const map = new Map();
  for (const boss of props.bosses) {
    if (boss.loot.length === 0) continue;
    const key = boss.instance || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(boss);
  }
  return Array.from(map.entries()).map(([instance, bosses]) => ({ instance, bosses }));
});

// ─── Pending weight inputs ────────────────────────────────────────────────────

/**
 * Stores the current value of weight inputs that have not yet been saved.
 * Keyed by lootItemId.  Once a raider is changed the pending state is cleared.
 * @type {import('vue').Ref<Record<string, string>>}
 */
const pendingWeights = ref({});

watch(selectedRaiderId, () => {
  pendingWeights.value = {};
});

function getWeightInput(lootItemId) {
  if (Object.prototype.hasOwnProperty.call(pendingWeights.value, lootItemId)) {
    return pendingWeights.value[lootItemId];
  }
  const entry = wishlistMap.value.get(lootItemId);
  return entry ? String(entry.weight) : '';
}

function setWeightInput(lootItemId, val) {
  pendingWeights.value = { ...pendingWeights.value, [lootItemId]: val };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function handleAdd(lootItemId) {
  const raw    = getWeightInput(lootItemId);
  const weight = parseFloat(raw) || 0;
  const entry  = new WishlistEntry(lootItemId, weight);
  emit('add-to-wishlist', { raiderId: selectedRaiderId.value, entry });
  const updated = { ...pendingWeights.value };
  delete updated[lootItemId];
  pendingWeights.value = updated;
}

function handleRemove(lootItemId) {
  emit('remove-from-wishlist', { raiderId: selectedRaiderId.value, lootItemId });
  const updated = { ...pendingWeights.value };
  delete updated[lootItemId];
  pendingWeights.value = updated;
}
</script>

<template>
  <div class="wishlist-page">
    <h2 class="page-title">Wishlist Editor</h2>

    <!-- Raider selector -->
    <div class="raider-selector">
      <label for="raider-select">Raider</label>
      <select id="raider-select" v-model="selectedRaiderId" class="raider-select">
        <option value="">— Select a raider —</option>
        <option v-for="raider in raiders" :key="raider.id" :value="raider.id">
          {{ raider.username }} ({{ raider.spec }} {{ raider.wowClass }})
        </option>
      </select>
    </div>

    <!-- No raider selected -->
    <p v-if="!selectedRaider" class="empty-state">
      Select a raider above to view and edit their wishlist.
    </p>

    <!-- No loot items exist at all -->
    <p v-else-if="lootGroups.length === 0" class="empty-state">
      No loot items have been added to any boss yet.
      Go to the <strong>Bosses</strong> page to add items.
    </p>

    <!-- Loot groups -->
    <template v-else>
      <section
        v-for="group in lootGroups"
        :key="group.instance"
        class="instance-group"
      >
        <h3 class="instance-heading">
          {{ group.instance || 'No Instance' }}
        </h3>

        <div
          v-for="boss in group.bosses"
          :key="boss.id"
          class="boss-section"
        >
          <h4 class="boss-heading">{{ boss.name }}</h4>

          <table class="loot-table">
            <thead>
              <tr>
                <th class="th-name">Item Name</th>
                <th class="th-slot">Slot</th>
                <th class="th-weight">Weight</th>
                <th class="th-hint">100 % = 100 000</th>
                <th class="th-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in boss.loot"
                :key="item.id"
                :class="{ 'row--wishlisted': wishlistMap.has(item.id) }"
              >
                <td class="td-name">{{ item.name }}</td>
                <td class="td-slot">{{ item.slot }}</td>
                <td class="td-weight">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    class="weight-input"
                    :value="getWeightInput(item.id)"
                    placeholder="0"
                    @input="setWeightInput(item.id, $event.target.value)"
                  />
                </td>
                <td class="td-hint">
                  <span v-if="getWeightInput(item.id) && parseFloat(getWeightInput(item.id)) > 0" class="weight-hint">
                    {{ (parseFloat(getWeightInput(item.id)) / 1000).toFixed(1) }} %
                  </span>
                </td>
                <td class="td-actions">
                  <template v-if="wishlistMap.has(item.id)">
                    <button class="btn-save" @click="handleAdd(item.id)" title="Update weight">
                      ✓ Save
                    </button>
                    <button class="btn-remove" @click="handleRemove(item.id)" title="Remove from wishlist">
                      ✕
                    </button>
                  </template>
                  <button v-else class="btn-add" @click="handleAdd(item.id)" title="Add to wishlist">
                    + Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.wishlist-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.page-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-heading);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Raider selector ── */
.raider-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.raider-selector label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.raider-select {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text);
  font-size: 0.9rem;
  padding: 7px 12px;
  outline: none;
  min-width: 260px;
  transition: border-color 0.2s;
}

.raider-select:focus {
  border-color: var(--accent);
}

/* ── Empty state ── */
.empty-state {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  margin: 0;
}

/* ── Instance group ── */
.instance-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.instance-heading {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  margin: 0;
}

/* ── Boss section ── */
.boss-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.boss-heading {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-heading);
  margin: 0;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

/* ── Loot table ── */
.loot-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.loot-table th {
  padding: 8px 14px;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  background: transparent;
}

.loot-table td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
}

.loot-table tbody tr:last-child td {
  border-bottom: none;
}

.loot-table tbody tr:hover td {
  background: var(--surface-2);
}

.row--wishlisted td {
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

.row--wishlisted:hover td {
  background: color-mix(in srgb, var(--accent) 10%, var(--surface-2));
}

.td-name {
  font-weight: 500;
  color: var(--text-heading);
  min-width: 180px;
}

.td-slot {
  color: var(--text-muted);
  width: 100px;
  font-size: 0.82rem;
}

.td-weight {
  width: 110px;
}

.td-hint {
  width: 70px;
}

.weight-input {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-size: 0.85rem;
  padding: 5px 8px;
  width: 90px;
  outline: none;
  transition: border-color 0.2s;
}

.weight-input:focus {
  border-color: var(--accent);
}

.weight-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.th-hint,
.td-hint {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.td-actions {
  text-align: right;
  white-space: nowrap;
  width: 120px;
}

.btn-add,
.btn-save {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-add:hover,
.btn-save:hover {
  opacity: 0.85;
}

.btn-remove {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 4px 8px;
  margin-left: 6px;
  transition: color 0.2s, border-color 0.2s;
}

.btn-remove:hover {
  color: var(--danger);
  border-color: var(--danger);
}
</style>
