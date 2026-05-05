<script setup>
import { ref, computed } from 'vue';
import { CLASS_COLORS, RANK_COLORS } from '../models/wowData.js';

const props = defineProps({
  /** @type {import('../models/Raider.js').Raider[]} */
  raiders: {
    type: Array,
    required: true,
  },
  /**
   * When provided the table switches to boss-view mode, showing per-raider
   * data for this specific boss alongside the base raider columns.
   * @type {import('../models/Boss.js').Boss | null}
   */
  activeBoss: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['remove-raider']);

// ─── Sorting ────────────────────────────────────────────────────────────────

const sortKey = ref('username');
const sortDir = ref('asc'); // 'asc' | 'desc'

function toggleSort(key) {
  if (key === '_actions') return;
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
}

function sortIndicator(key) {
  if (sortKey.value !== key) return '';
  return sortDir.value === 'asc' ? ' ▲' : ' ▼';
}

// ─── Column definitions ──────────────────────────────────────────────────────

const BASE_COLUMNS = [
  { key: 'username',  label: 'Username',   sortable: true },
  { key: 'wowClass',  label: 'Class',      sortable: true },
  { key: 'spec',      label: 'Spec',       sortable: true },
  { key: 'itemLevel', label: 'Item Level', sortable: true },
];

const BOSS_COLUMNS = [
  { key: '_vault', label: 'Vault', sortable: true },
  { key: '_kills', label: 'Kills', sortable: true },
];

const ACTION_COLUMN = { key: '_actions', label: '', sortable: false };

const columns = computed(() => {
  if (props.activeBoss) {
    return [...BASE_COLUMNS, ...BOSS_COLUMNS, ACTION_COLUMN];
  }
  return [...BASE_COLUMNS, ACTION_COLUMN];
});

// ─── Boss-view helpers ───────────────────────────────────────────────────────

function bossEntryFor(raider) {
  return raider.bossData.find((e) => e.bossId === props.activeBoss?.id) ?? null;
}

// ─── Sorted raiders ──────────────────────────────────────────────────────────

const sortedRaiders = computed(() => {
  const list = [...props.raiders];
  const key = sortKey.value;
  const dir = sortDir.value === 'asc' ? 1 : -1;

  list.sort((a, b) => {
    let va, vb;

    if (key === '_vault') {
      va = bossEntryFor(a)?.vault ? 1 : 0;
      vb = bossEntryFor(b)?.vault ? 1 : 0;
    } else if (key === '_kills') {
      va = bossEntryFor(a)?.kills ?? 0;
      vb = bossEntryFor(b)?.kills ?? 0;
    } else {
      va = a[key] ?? '';
      vb = b[key] ?? '';
    }

    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * dir;
    }
    return String(va).localeCompare(String(vb)) * dir;
  });

  return list;
});

// ─── Display helpers ─────────────────────────────────────────────────────────

function classColor(wowClass) {
  return CLASS_COLORS[wowClass] ?? '#ffffff';
}

function rankColor(rank) {
  return RANK_COLORS[rank] ?? '#6b7280';
}
</script>

<template>
  <div class="table-wrapper">
    <div v-if="activeBoss" class="boss-mode-banner">
      Boss view: <strong>{{ activeBoss.name }}</strong>
      <span v-if="activeBoss.instance" class="instance-label">{{ activeBoss.instance }}</span>
    </div>

    <table class="raider-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="{ sortable: col.sortable, active: sortKey === col.key }"
            @click="toggleSort(col.key)"
          >
            {{ col.label }}{{ sortIndicator(col.key) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="sortedRaiders.length === 0">
          <td :colspan="columns.length" class="empty-state">
            No raiders yet — add one above.
          </td>
        </tr>
        <tr v-for="raider in sortedRaiders" :key="raider.id">
          <!-- Username + rank badge -->
          <td class="col-username">
            <span
              class="rank-badge"
              :style="{ color: rankColor(raider.rank), borderColor: rankColor(raider.rank) }"
              :title="raider.rank"
            >{{ raider.rank.slice(0, 2).toUpperCase() }}</span>
            {{ raider.username }}
          </td>

          <td class="col-class" :style="{ color: classColor(raider.wowClass) }">
            {{ raider.wowClass }}
          </td>

          <td class="col-spec">{{ raider.spec }}</td>

          <td class="col-ilvl">
            {{ raider.itemLevel > 0 ? raider.itemLevel : '—' }}
          </td>

          <!-- Boss-specific columns (only rendered in boss-view mode) -->
          <template v-if="activeBoss">
            <td class="col-vault">
              <span
                :class="bossEntryFor(raider)?.vault ? 'pill pill--yes' : 'pill pill--no'"
              >
                {{ bossEntryFor(raider)?.vault ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="col-kills">
              {{ bossEntryFor(raider)?.kills ?? 0 }}
            </td>
          </template>

          <td class="col-actions">
            <button
              class="btn-remove"
              title="Remove raider"
              @click="emit('remove-raider', raider.id)"
            >
              ✕
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.boss-mode-banner {
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
  border-bottom: 1px solid var(--border);
  padding: 8px 16px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.boss-mode-banner strong {
  color: var(--text-heading);
}

.instance-label {
  margin-left: 8px;
  font-size: 0.75rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
  color: var(--text-muted);
}

.raider-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

thead tr {
  background: var(--surface-2);
}

th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  user-select: none;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  color: var(--text-heading);
}

th.active {
  color: var(--accent);
}

td {
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover td {
  background: var(--surface-2);
}

/* ── Rank badge ── */
.rank-badge {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  border: 1px solid currentColor;
  border-radius: 3px;
  padding: 1px 4px;
  margin-right: 6px;
  vertical-align: middle;
  opacity: 0.9;
  line-height: 1.4;
}

.col-username {
  font-weight: 600;
  color: var(--text-heading);
}

.col-class {
  font-weight: 600;
}

.col-ilvl,
.col-kills {
  text-align: center;
  color: var(--text-muted);
}

.col-vault {
  text-align: center;
}

.col-actions {
  text-align: right;
  width: 40px;
}

/* ── Attended pills ── */
.pill {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
  padding: 2px 10px;
}

.pill--yes {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.pill--no {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
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

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  padding: 32px 16px;
}
</style>
