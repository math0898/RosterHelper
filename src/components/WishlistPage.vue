<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { WishlistEntry } from '../models/WishlistEntry.js';
import { Raider } from '../models/Raider.js';
import { Boss } from '../models/Boss.js';
import { LootItem } from '../models/LootItem.js';
import { WOW_CLASSES } from '../models/wowData.js';

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

const emit = defineEmits([
  'add-to-wishlist',
  'remove-from-wishlist',
  'add-raider',
  'add-boss',
  'add-loot',
  'set-wishlist-updated-at',
]);

// ─── wowaudit import ──────────────────────────────────────────────────────────

const importApiKey      = ref('');
const importResult      = ref(null);    // condensed wishlist JSON string for display
const importWarnings    = ref([]);      // structured warning objects
const importError       = ref('');
const importLoading     = ref(false);
const importRawParsed   = ref(null);    // raw parsed JSON stored for re-parsing after adds
const importWishlists   = ref([]);      // parsed wishlist entries ready to apply

/** Per-warning class selection keyed by warning index (for ambiguous raiders). */
const warningClassSelections = ref({});

// ─── Spec / class helpers ─────────────────────────────────────────────────────

/** Reverse map: spec name → array of WoW classes that have that spec. */
const SPEC_TO_CLASSES = Object.entries(WOW_CLASSES).reduce((acc, [cls, specs]) => {
  for (const spec of specs) {
    if (!acc[spec]) acc[spec] = [];
    acc[spec].push(cls);
  }
  return acc;
}, {});

/**
 * Infer a WoW class from a list of spec names seen on a character.
 * Returns the class name when unambiguous, null when it cannot be determined.
 * @param {string[]} specNames
 * @returns {string|null}
 */
function inferClassFromSpecs(specNames) {
  let candidates = null;
  for (const spec of specNames) {
    const classesWithSpec = SPEC_TO_CLASSES[spec] ?? [];
    if (classesWithSpec.length === 0) continue;
    if (!candidates) {
      candidates = new Set(classesWithSpec);
    } else {
      for (const c of [...candidates]) {
        if (!classesWithSpec.includes(c)) candidates.delete(c);
      }
    }
    if (candidates.size === 1) break;
  }
  return candidates?.size === 1 ? [...candidates][0] : null;
}

/**
 * Count mythic-difficulty items per spec for a wowaudit character.
 * @param {object} char
 * @returns {Map<string, number>}
 */
function countItemsPerSpec(char) {
  const counts = new Map();
  for (const inst of char.instances ?? []) {
    const mythicDiff = inst.difficulties?.find((d) => d.difficulty === 'mythic');
    if (!mythicDiff) continue;
    for (const encounter of mythicDiff.wishlist?.encounters ?? []) {
      for (const item of encounter.items ?? []) {
        for (const spec of Object.keys(item.score_by_spec ?? {})) {
          counts.set(spec, (counts.get(spec) ?? 0) + 1);
        }
      }
    }
  }
  return counts;
}

/**
 * Choose which spec to use for a wowaudit character.
 * Prefers the spec that matches rosterSpec (case-insensitive);
 * falls back to the spec with the most mythic wishlist items.
 * @param {object} char
 * @param {string|null} rosterSpec
 * @returns {string}
 */
function pickSpecForChar(char, rosterSpec) {
  const specCounts = countItemsPerSpec(char);
  if (specCounts.size === 0) return '';
  if (rosterSpec) {
    for (const spec of specCounts.keys()) {
      if (spec.toLowerCase() === rosterSpec.toLowerCase()) return spec;
    }
  }
  let bestSpec  = '';
  let bestCount = 0;
  for (const [spec, count] of specCounts) {
    if (count > bestCount) { bestCount = count; bestSpec = spec; }
  }
  return bestSpec;
}

/**
 * Normalise a wowaudit slot string to a RosterHelper EQUIPMENT_SLOTS name.
 * @param {string} slot
 * @returns {string}
 */
function mapSlot(slot) {
  const SLOT_MAP = {
    finger:        'Ring',
    wrists:        'Wrist',
    feet:          'Feet',
    head:          'Head',
    neck:          'Neck',
    shoulder:      'Shoulder',
    back:          'Back',
    chest:         'Chest',
    hands:         'Hands',
    waist:         'Waist',
    legs:          'Legs',
    trinket:       'Trinket',
    'main hand':   'Main Hand',
    'off hand':    'Off Hand',
    'two-hand':    'Two-Hand',
    miscellaneous: 'Miscellaneous',
  };
  const key = slot?.toLowerCase() ?? '';
  return SLOT_MAP[key] ?? (slot ? slot.charAt(0).toUpperCase() + slot.slice(1) : '');
}

// ─── Parse / update helpers ───────────────────────────────────────────────────

/**
 * Convert the raw wowaudit API response into a condensed object.
 * Only mythic difficulty, only known Raiders/Bosses/LootItems.
 * Uses score_by_spec[chosenSpec].score as the item weight.
 * Unknown entities produce structured warning objects.
 *
 * @param {object} json  Parsed wowaudit /v1/wishlists response.
 * @returns {{ wishlists: object[], warnings: object[] }}
 */
function parseWowauditResponse(json) {
  const warnings  = [];
  const wishlists = [];
  const warnKeys  = new Set();

  function addWarning(w) {
    const key = JSON.stringify([w.type, w.name, w.bossName ?? '', w.instance ?? '']);
    if (!warnKeys.has(key)) { warnKeys.add(key); warnings.push(w); }
  }

  const raiderByName = new Map(props.raiders.map((r) => [r.username.toLowerCase(), r]));
  const bossByName   = new Map(props.bosses.map((b) => [b.name.toLowerCase(), b]));
  const lootByBoss   = new Map(
    props.bosses.map((b) => [
      b.name.toLowerCase(),
      new Map(b.loot.map((item) => [item.name.toLowerCase(), item])),
    ]),
  );

  for (const char of json.characters ?? []) {
    const raider = raiderByName.get(char.name.toLowerCase());
    if (!raider) {
      const specCounts    = countItemsPerSpec(char);
      const availableSpecs = Array.from(specCounts.keys());
      const chosenSpec    = pickSpecForChar(char, null);
      addWarning({
        type:           'raider',
        name:           char.name,
        realm:          char.realm ?? '',
        availableSpecs,
        chosenSpec,
        inferredClass:  inferClassFromSpecs(availableSpecs),
      });
      continue;
    }

    const chosenSpec = pickSpecForChar(char, raider.spec);
    if (!chosenSpec) continue;

    const entries = [];

    // Collect the most-recent non-null updated_at for the chosen spec across all instances.
    let updatedAt = null;
    for (const instance of char.instances ?? []) {
      const mythicDiff = instance.difficulties?.find((d) => d.difficulty === 'mythic');
      if (!mythicDiff) continue;
      const ts = mythicDiff.wishlist?.updated_at?.[chosenSpec];
      if (ts && (!updatedAt || new Date(ts) > new Date(updatedAt))) updatedAt = ts;
    }

    for (const instance of char.instances ?? []) {
      const mythicDiff = instance.difficulties?.find((d) => d.difficulty === 'mythic');
      if (!mythicDiff) continue;

      for (const encounter of mythicDiff.wishlist?.encounters ?? []) {
        if (!encounter.items?.length) continue;

        const boss = bossByName.get(encounter.name.toLowerCase());
        if (!boss) {
          addWarning({ type: 'boss', name: encounter.name, instance: instance.name });
          continue;
        }

        const lootMap = lootByBoss.get(boss.name.toLowerCase());

        for (const item of encounter.items) {
          const specScore = item.score_by_spec?.[chosenSpec];
          if (!specScore) continue;

          const lootItem = lootMap?.get(item.name.toLowerCase());
          if (!lootItem) {
            addWarning({
              type:     'item',
              name:     item.name,
              bossName: encounter.name,
              bossId:   boss.id,
              slot:     mapSlot(item.slot),
            });
            continue;
          }

          entries.push({
            bossId:   boss.id,
            bossName: boss.name,
            itemId:   lootItem.id,
            itemName: lootItem.name,
            score:    specScore.score,
          });
        }
      }
    }

    if (entries.length > 0) {
      wishlists.push({
        raiderId:   raider.id,
        raiderName: raider.username,
        chosenSpec,
        updatedAt,
        entries,
      });
    }
  }

  return { wishlists, warnings };
}

function updateParsedResult(json) {
  const { wishlists, warnings } = parseWowauditResponse(json);
  importWarnings.value         = warnings;
  importWishlists.value        = wishlists;
  importResult.value           = wishlists.length ? JSON.stringify(wishlists, null, 2) : null;
  warningClassSelections.value = {};
}

async function fetchWowauditWishlists() {
  if (!importApiKey.value.trim()) {
    importError.value    = 'Please enter an API key.';
    importResult.value   = null;
    importWarnings.value = [];
    return;
  }
  importLoading.value   = true;
  importError.value     = '';
  importResult.value    = null;
  importWarnings.value  = [];
  importRawParsed.value = null;
  try {
    const url      = `/api/wowaudit/v1/wishlists?api_key=${encodeURIComponent(importApiKey.value.trim())}`;
    const response = await fetch(url);
    const text     = await response.text();
    if (!response.ok) {
      importError.value = `Request failed (HTTP ${response.status}): ${text}`;
    } else {
      const parsed          = JSON.parse(text);
      importRawParsed.value = parsed;
      updateParsedResult(parsed);
    }
  } catch (err) {
    importError.value = `Network error: ${err.message}`;
  } finally {
    importLoading.value = false;
  }
}

// ─── Warning "Add" helpers ────────────────────────────────────────────────────

/**
 * Apply all resolved wishlist entries in one shot.
 * Emits one add-to-wishlist event per entry across all raiders.
 */
function applyAllWishlists() {
  for (const wl of importWishlists.value) {
    for (const entry of wl.entries) {
      emit('add-to-wishlist', {
        raiderId: wl.raiderId,
        entry:    new WishlistEntry(entry.itemId, entry.score),
      });
    }
    // Override the wishlist timestamp with the wowaudit-side update time.
    if (wl.updatedAt) {
      emit('set-wishlist-updated-at', { raiderId: wl.raiderId, updatedAt: wl.updatedAt });
    }
  }
}

function getWarningClass(index) {
  return warningClassSelections.value[index]
    ?? importWarnings.value[index]?.inferredClass
    ?? '';
}

function setWarningClass(index, cls) {
  warningClassSelections.value = { ...warningClassSelections.value, [index]: cls };
}

async function addMissingRaider(warning, index) {
  const cls    = getWarningClass(index);
  const raider = new Raider(warning.name, cls, warning.chosenSpec, 'Member');
  emit('add-raider', raider);
  await nextTick();
  if (importRawParsed.value) updateParsedResult(importRawParsed.value);
}

async function addMissingBoss(warning) {
  const boss = new Boss(warning.name, warning.instance);
  emit('add-boss', boss);
  await nextTick();
  if (importRawParsed.value) updateParsedResult(importRawParsed.value);
}

async function addMissingItem(warning) {
  const lootItem = new LootItem(warning.name, warning.slot);
  emit('add-loot', { bossId: warning.bossId, lootItem });
  await nextTick();
  if (importRawParsed.value) updateParsedResult(importRawParsed.value);
}

// ─── Raider selection ─────────────────────────────────────────────────────────

const selectedRaiderId = ref('');

const selectedRaider = computed(() =>
  props.raiders.find((r) => r.id === selectedRaiderId.value) ?? null,
);

/**
 * Compute the age class for the wishlist update timestamp.
 * @returns {'fresh' | 'stale' | 'old' | null}
 */
const wishlistAgeClass = computed(() => {
  const ts = selectedRaider.value?.wishlistUpdatedAt;
  if (!ts) return null;
  const days = (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 3)  return 'fresh';
  if (days < 7)  return 'stale';
  return 'old';
});

/**
 * Human-readable relative time for the wishlist update timestamp.
 * @returns {string}
 */
const wishlistUpdatedLabel = computed(() => {
  const ts = selectedRaider.value?.wishlistUpdatedAt;
  if (!ts) return 'Never updated';
  const ms   = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days  = Math.floor(ms / 86400000);
  if (mins < 1)   return 'Updated just now';
  if (mins < 60)  return `Updated ${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `Updated ${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `Updated ${days} day${days !== 1 ? 's' : ''} ago`;
});

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

    <!-- wowaudit import -->
    <section class="import-section">
      <h3 class="import-heading">Import from wowaudit</h3>
      <div class="import-controls">
        <label for="api-key-input" class="import-label">API Key</label>
        <input
          id="api-key-input"
          v-model="importApiKey"
          type="password"
          class="import-input"
          placeholder="Enter your wowaudit API key"
          :disabled="importLoading"
        />
        <button
          class="btn-import"
          :disabled="importLoading"
          @click="fetchWowauditWishlists"
        >
          {{ importLoading ? 'Loading…' : 'Fetch Wishlists' }}
        </button>
      </div>
      <p v-if="importError" class="import-error">{{ importError }}</p>
      <ul v-if="importWarnings.length" class="import-warnings">
        <li v-for="(w, i) in importWarnings" :key="i" class="import-warning">
          <span class="warning-text">
            <template v-if="w.type === 'raider'">
              ⚠ Raider <strong>{{ w.name }}</strong>
              <span class="warn-meta">({{ w.realm }}{{ w.chosenSpec ? ` · ${w.chosenSpec}` : '' }})</span>
              — not in roster
            </template>
            <template v-else-if="w.type === 'boss'">
              ⚠ Boss <strong>{{ w.name }}</strong>
              <span class="warn-meta">({{ w.instance }})</span>
              — not in RosterHelper
            </template>
            <template v-else-if="w.type === 'item'">
              ⚠ Item <strong>{{ w.name }}</strong>
              <span class="warn-meta">({{ w.slot }} · {{ w.bossName }})</span>
              — not in RosterHelper
            </template>
          </span>
          <span class="warning-actions">
            <template v-if="w.type === 'raider'">
              <select
                v-if="!w.inferredClass"
                class="warn-class-select"
                :value="getWarningClass(i)"
                @change="setWarningClass(i, $event.target.value)"
              >
                <option value="">Select class…</option>
                <option v-for="cls in Object.keys(WOW_CLASSES)" :key="cls" :value="cls">
                  {{ cls }}
                </option>
              </select>
              <button
                class="btn-warn-add"
                :disabled="!getWarningClass(i)"
                @click="addMissingRaider(w, i)"
              >
                + Add Raider
              </button>
            </template>
            <template v-else-if="w.type === 'boss'">
              <button class="btn-warn-add" @click="addMissingBoss(w)">+ Add Boss</button>
            </template>
            <template v-else-if="w.type === 'item'">
              <button class="btn-warn-add" @click="addMissingItem(w)">+ Add Item</button>
            </template>
          </span>
        </li>
      </ul>
      <div v-if="importWishlists.length > 0" class="import-apply-row">
        <span class="import-apply-info">
          {{ importWishlists.length }} raider{{ importWishlists.length !== 1 ? 's' : '' }} ready
          ({{ importWishlists.reduce((n, wl) => n + wl.entries.length, 0) }} item{{ importWishlists.reduce((n, wl) => n + wl.entries.length, 0) !== 1 ? 's' : '' }})
        </span>
        <button class="btn-apply-all" @click="applyAllWishlists">
          ✓ Apply All Wishlists
        </button>
      </div>
      <pre v-if="importResult" class="import-result">{{ importResult }}</pre>
    </section>

    <!-- Raider selector -->
    <div class="raider-selector">
      <label for="raider-select">Raider</label>
      <select id="raider-select" v-model="selectedRaiderId" class="raider-select">
        <option value="">— Select a raider —</option>
        <option v-for="raider in raiders" :key="raider.id" :value="raider.id">
          {{ raider.username }} ({{ raider.spec }} {{ raider.wowClass }})
        </option>
      </select>
      <span
        v-if="selectedRaider"
        class="wishlist-updated"
        :class="`wishlist-updated--${wishlistAgeClass ?? 'old'}`"
      >{{ wishlistUpdatedLabel }}</span>
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

/* ── wowaudit import ── */
.import-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.import-heading {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0;
}

.import-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.import-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.import-input {
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

.import-input:focus {
  border-color: var(--accent);
}

.btn-import {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 7px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.btn-import:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-import:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.import-error {
  color: var(--danger, #e05252);
  font-size: 0.85rem;
  margin: 0;
}

.import-warnings {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
}

.import-warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--warning, #c97b1a);
  background: color-mix(in srgb, var(--warning, #c97b1a) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--warning, #c97b1a) 30%, transparent);
  border-radius: 4px;
  padding: 5px 10px;
}

.warning-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.warn-meta {
  font-size: 0.75rem;
  opacity: 0.8;
}

.warning-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.warn-class-select {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-size: 0.75rem;
  padding: 3px 6px;
  outline: none;
}

.btn-warn-add {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 3px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.btn-warn-add:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-warn-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.import-apply-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px;
}

.import-apply-info {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.btn-apply-all {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.btn-apply-all:hover {
  opacity: 0.85;
}

.import-result {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text);
  font-size: 0.78rem;
  padding: 12px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

/* ── Wishlist update timestamp ── */
.wishlist-updated {
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
  padding: 2px 10px;
  white-space: nowrap;
}

.wishlist-updated--fresh {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.wishlist-updated--stale {
  background: rgba(234, 179, 8, 0.15);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.35);
}

.wishlist-updated--old {
  background: rgba(239, 68, 68, 0.13);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
</style>
