<script setup>
import { ref, computed } from 'vue';
import { Boss } from '../models/Boss.js';
import { LootItem, EQUIPMENT_SLOTS } from '../models/LootItem.js';

const props = defineProps({
  /** @type {import('../models/Boss.js').Boss[]} */
  bosses: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['add-boss', 'remove-boss', 'add-loot', 'remove-loot']);

// ─── Add-boss form ────────────────────────────────────────────────────────────

const bossName     = ref('');
const bossInstance = ref('');

function handleAddBoss() {
  if (!bossName.value.trim()) return;
  const boss = new Boss(bossName.value.trim(), bossInstance.value.trim());
  emit('add-boss', boss);
  bossName.value     = '';
  bossInstance.value = '';
}

// ─── Group bosses by instance ─────────────────────────────────────────────────

/**
 * Returns bosses grouped by instance, preserving insertion order within each
 * group.  Bosses with no instance are grouped under an empty-string key and
 * displayed as "No Instance".
 * @type {import('vue').ComputedRef<{ instance: string, bosses: Boss[] }[]>}
 */
const bossGroups = computed(() => {
  const map = new Map();
  for (const boss of props.bosses) {
    const key = boss.instance || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(boss);
  }
  return Array.from(map.entries()).map(([instance, bosses]) => ({ instance, bosses }));
});

// ─── Per-boss loot form state ─────────────────────────────────────────────────

/** Map of bossId → { name, slot } for the inline add-loot forms. */
const lootForms = ref({});

function lootForm(bossId) {
  if (!lootForms.value[bossId]) {
    lootForms.value[bossId] = { name: '', slot: EQUIPMENT_SLOTS[0] };
  }
  return lootForms.value[bossId];
}

function handleAddLoot(boss) {
  const form = lootForm(boss.id);
  if (!form.name.trim()) return;
  const item = new LootItem(form.name.trim(), form.slot);
  emit('add-loot', { bossId: boss.id, lootItem: item });
  form.name = '';
  form.slot = EQUIPMENT_SLOTS[0];
}

function handleRemoveLoot(bossId, lootItemId) {
  emit('remove-loot', { bossId, lootItemId });
}

// ─── Expand / collapse loot panels ───────────────────────────────────────────

const expandedLoot = ref(new Set());

function toggleLoot(bossId) {
  if (expandedLoot.value.has(bossId)) {
    expandedLoot.value.delete(bossId);
  } else {
    expandedLoot.value.add(bossId);
  }
  // Trigger Vue reactivity on the Set by reassigning
  expandedLoot.value = new Set(expandedLoot.value);
}
</script>

<template>
  <div class="bosses-page">

    <!-- ── Add-boss form ── -->
    <form class="add-boss-form" @submit.prevent="handleAddBoss">
      <h2 class="form-title">Add Boss</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="boss-name">Boss Name</label>
          <input
            id="boss-name"
            v-model="bossName"
            type="text"
            placeholder="e.g. Fyrakk the Blazing"
            autocomplete="off"
            required
          />
        </div>
        <div class="form-group">
          <label for="boss-instance">Raid Instance (optional)</label>
          <input
            id="boss-instance"
            v-model="bossInstance"
            type="text"
            placeholder="e.g. Amirdrassil"
            autocomplete="off"
          />
        </div>
      </div>
      <div class="form-footer">
        <button type="submit" class="btn-add" :disabled="!bossName.trim()">
          + Add Boss
        </button>
      </div>
    </form>

    <!-- ── Empty state ── -->
    <p v-if="bosses.length === 0" class="empty-global">
      No bosses yet — add one above.
    </p>

    <!-- ── Boss groups ── -->
    <section
      v-for="group in bossGroups"
      :key="group.instance"
      class="instance-group"
    >
      <h3 class="instance-heading">
        {{ group.instance || 'No Instance' }}
        <span class="instance-count">{{ group.bosses.length }} boss{{ group.bosses.length !== 1 ? 'es' : '' }}</span>
      </h3>

      <div
        v-for="boss in group.bosses"
        :key="boss.id"
        class="boss-card"
      >
        <!-- Boss header row -->
        <div class="boss-header">
          <span class="boss-name">{{ boss.name }}</span>

          <div class="boss-actions">
            <button
              class="btn-toggle-loot"
              :class="{ active: expandedLoot.has(boss.id) }"
              @click="toggleLoot(boss.id)"
              :title="expandedLoot.has(boss.id) ? 'Hide loot' : 'Show loot'"
            >
              🎁 Loot
              <span class="loot-count">{{ boss.loot.length }}</span>
            </button>
            <button
              class="btn-remove"
              title="Remove boss"
              @click="emit('remove-boss', boss.id)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Loot panel (expanded) -->
        <div v-if="expandedLoot.has(boss.id)" class="loot-panel">

          <!-- Add-loot form -->
          <form class="add-loot-form" @submit.prevent="handleAddLoot(boss)">
            <input
              v-model="lootForm(boss.id).name"
              type="text"
              class="loot-input"
              placeholder="Item name…"
              autocomplete="off"
              required
            />
            <select v-model="lootForm(boss.id).slot" class="loot-select">
              <option v-for="slot in EQUIPMENT_SLOTS" :key="slot" :value="slot">
                {{ slot }}
              </option>
            </select>
            <button type="submit" class="btn-add-loot" :disabled="!lootForm(boss.id).name.trim()">
              + Add
            </button>
          </form>

          <!-- Loot list -->
          <div v-if="boss.loot.length === 0" class="loot-empty">
            No loot added yet.
          </div>
          <table v-else class="loot-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Slot</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in boss.loot" :key="item.id">
                <td class="loot-col-name">{{ item.name }}</td>
                <td class="loot-col-slot">{{ item.slot }}</td>
                <td class="loot-col-actions">
                  <button
                    class="btn-remove"
                    title="Remove loot item"
                    @click="handleRemoveLoot(boss.id, item.id)"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.bosses-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ── Add-boss form ── */
.add-boss-form {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px 24px;
}

.form-title {
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-heading);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

input,
select {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text);
  font-size: 0.9rem;
  padding: 8px 10px;
  outline: none;
  transition: border-color 0.2s;
}

input:focus,
select:focus {
  border-color: var(--accent);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.btn-add {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 8px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-add:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Global empty state ── */
.empty-global {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
}

/* ── Instance group ── */
.instance-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.instance-heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  margin: 0;
}

.instance-count {
  font-size: 0.72rem;
  font-weight: 500;
  opacity: 0.7;
}

/* ── Boss card ── */
.boss-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.boss-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.boss-name {
  font-weight: 600;
  color: var(--text-heading);
  font-size: 0.95rem;
}

.boss-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-toggle-loot {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 4px 12px;
  transition: color 0.15s, border-color 0.15s;
}

.btn-toggle-loot:hover,
.btn-toggle-loot.active {
  color: var(--accent);
  border-color: var(--accent);
}

.loot-count {
  background: var(--border);
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 0.7rem;
  font-weight: 700;
}

.btn-remove {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 3px 7px;
  transition: color 0.2s, border-color 0.2s;
}

.btn-remove:hover {
  color: var(--danger);
  border-color: var(--danger);
}

/* ── Loot panel ── */
.loot-panel {
  border-top: 1px solid var(--border);
  padding: 14px 16px;
  background: color-mix(in srgb, var(--surface-2) 60%, var(--surface));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-loot-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.loot-input {
  flex: 1;
  min-width: 160px;
  padding: 6px 10px;
  font-size: 0.85rem;
}

.loot-select {
  min-width: 120px;
  padding: 6px 10px;
  font-size: 0.85rem;
}

.btn-add-loot {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.btn-add-loot:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-add-loot:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.loot-empty {
  font-size: 0.82rem;
  color: var(--text-muted);
  font-style: italic;
}

/* ── Loot table ── */
.loot-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.loot-table thead tr {
  background: transparent;
}

.loot-table th {
  padding: 6px 10px;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.loot-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.loot-table tbody tr:last-child td {
  border-bottom: none;
}

.loot-table tbody tr:hover td {
  background: var(--surface-2);
}

.loot-col-name {
  font-weight: 500;
  color: var(--text-heading);
}

.loot-col-slot {
  color: var(--text-muted);
  font-size: 0.82rem;
  width: 110px;
}

.loot-col-actions {
  text-align: right;
  width: 40px;
}
</style>
