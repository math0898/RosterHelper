<script setup>
import { CLASS_COLORS } from '../models/wowData.js';

const props = defineProps({
  /** @type {import('../models/Raider.js').Raider[]} */
  raiders: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['remove-raider']);

/** Column definitions – order here controls display order. */
const COLUMNS = [
  { key: 'username', label: 'Username' },
  { key: 'wowClass', label: 'Class' },
  { key: 'spec', label: 'Spec' },
  { key: 'itemLevel', label: 'Item Level' },
  { key: '_actions', label: '' },
];

function classColor(wowClass) {
  return CLASS_COLORS[wowClass] ?? '#ffffff';
}
</script>

<template>
  <div class="table-wrapper">
    <table class="raider-table">
      <thead>
        <tr>
          <th v-for="col in COLUMNS" :key="col.key">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="raiders.length === 0">
          <td :colspan="COLUMNS.length" class="empty-state">
            No raiders yet — add one above.
          </td>
        </tr>
        <tr v-for="raider in raiders" :key="raider.id">
          <td class="col-username">{{ raider.username }}</td>
          <td
            class="col-class"
            :style="{ color: classColor(raider.wowClass) }"
          >
            {{ raider.wowClass }}
          </td>
          <td class="col-spec">{{ raider.spec }}</td>
          <td class="col-ilvl">
            {{ raider.itemLevel > 0 ? raider.itemLevel : '—' }}
          </td>
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

.col-username {
  font-weight: 600;
  color: var(--text-heading) !important;
}

.col-class {
  font-weight: 600;
}

.col-ilvl {
  text-align: center;
  color: var(--text-muted);
}

.col-actions {
  text-align: right;
  width: 40px;
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
