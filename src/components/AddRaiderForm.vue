<script setup>
import { ref, computed } from 'vue';
import { WOW_CLASSES, CLASS_COLORS } from '../models/wowData.js';
import { Raider } from '../models/Raider.js';

const emit = defineEmits(['add-raider']);

const username = ref('');
const wowClass = ref('');
const spec = ref('');

const availableSpecs = computed(() =>
  wowClass.value ? WOW_CLASSES[wowClass.value] : [],
);

const classColor = computed(() =>
  wowClass.value ? CLASS_COLORS[wowClass.value] : 'transparent',
);

const isValid = computed(
  () => username.value.trim() && wowClass.value && spec.value,
);

function handleSubmit() {
  if (!isValid.value) return;
  const raider = new Raider(username.value.trim(), wowClass.value, spec.value);
  emit('add-raider', raider);
  username.value = '';
  wowClass.value = '';
  spec.value = '';
}
</script>

<template>
  <form class="add-raider-form" @submit.prevent="handleSubmit">
    <h2 class="form-title">Add Raider</h2>

    <div class="form-grid">
      <div class="form-group">
        <label for="username">Username</label>
        <input
          id="username"
          v-model="username"
          type="text"
          placeholder="e.g. Thrall"
          autocomplete="off"
          required
        />
      </div>

      <div class="form-group">
        <label for="wow-class">Class</label>
        <select
          id="wow-class"
          v-model="wowClass"
          @change="spec = ''"
          required
        >
          <option value="" disabled>Select class…</option>
          <option
            v-for="cls in Object.keys(WOW_CLASSES)"
            :key="cls"
            :value="cls"
          >
            {{ cls }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="spec">Specialisation</label>
        <select id="spec" v-model="spec" :disabled="!wowClass" required>
          <option value="" disabled>Select spec…</option>
          <option v-for="s in availableSpecs" :key="s" :value="s">
            {{ s }}
          </option>
        </select>
      </div>
    </div>

    <div class="form-footer">
      <span
        v-if="wowClass"
        class="class-badge"
        :style="{ color: classColor, borderColor: classColor }"
      >
        {{ spec || wowClass }}
      </span>
      <button type="submit" :disabled="!isValid" class="btn-add">
        + Add to Roster
      </button>
    </div>
  </form>
</template>

<style scoped>
.add-raider-form {
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

select:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 18px;
}

.class-badge {
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 2px 8px;
  opacity: 0.9;
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
</style>
