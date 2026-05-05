<script setup>
import { ref } from 'vue';
import { Boss } from '../models/Boss.js';

const props = defineProps({
  /** @type {import('../models/Boss.js').Boss[]} */
  bosses: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['add-boss', 'remove-boss']);

const name = ref('');
const instance = ref('');

const isValid = () => name.value.trim().length > 0;

function handleSubmit() {
  if (!isValid()) return;
  const boss = new Boss(name.value.trim(), instance.value.trim());
  emit('add-boss', boss);
  name.value = '';
  instance.value = '';
}
</script>

<template>
  <div class="bosses-page">
    <!-- Add boss form -->
    <form class="add-boss-form" @submit.prevent="handleSubmit">
      <h2 class="form-title">Add Boss</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="boss-name">Boss Name</label>
          <input
            id="boss-name"
            v-model="name"
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
            v-model="instance"
            type="text"
            placeholder="e.g. Amirdrassil"
            autocomplete="off"
          />
        </div>
      </div>
      <div class="form-footer">
        <button type="submit" class="btn-add" :disabled="!name.trim()">
          + Add Boss
        </button>
      </div>
    </form>

    <!-- Boss list -->
    <div class="boss-list-wrapper">
      <table class="boss-table">
        <thead>
          <tr>
            <th>Boss Name</th>
            <th>Instance</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="bosses.length === 0">
            <td colspan="3" class="empty-state">No bosses yet — add one above.</td>
          </tr>
          <tr v-for="boss in bosses" :key="boss.id">
            <td class="col-name">{{ boss.name }}</td>
            <td class="col-instance">{{ boss.instance || '—' }}</td>
            <td class="col-actions">
              <button
                class="btn-remove"
                title="Remove boss"
                @click="emit('remove-boss', boss.id)"
              >
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.bosses-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Form ── */
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

input {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text);
  font-size: 0.9rem;
  padding: 8px 10px;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
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

/* ── Boss table ── */
.boss-list-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.boss-table {
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

.col-name {
  font-weight: 600;
  color: var(--text-heading);
}

.col-instance {
  color: var(--text-muted);
  font-size: 0.85rem;
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
