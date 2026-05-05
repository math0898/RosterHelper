<script setup>
import { ref, onMounted } from 'vue';
import AddRaiderForm from './components/AddRaiderForm.vue';
import RaiderTable from './components/RaiderTable.vue';
import { RosterStore } from './store/RosterStore.js';

const store = new RosterStore();
const raiders = ref(store.getAll());

function handleAddRaider(raider) {
  store.add(raider);
  raiders.value = store.getAll();
}

function handleRemoveRaider(id) {
  store.remove(id);
  raiders.value = store.getAll();
}
</script>

<template>
  <div id="app-shell">
    <header class="app-header">
      <div class="header-inner">
        <span class="logo-icon">⚔</span>
        <h1 class="app-title">RosterHelper</h1>
        <span class="raider-count">{{ raiders.length }} raider{{ raiders.length !== 1 ? 's' : '' }}</span>
      </div>
    </header>

    <main class="app-main">
      <AddRaiderForm @add-raider="handleAddRaider" />
      <RaiderTable :raiders="raiders" @remove-raider="handleRemoveRaider" />
    </main>
  </div>
</template>

<style scoped>
#app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1100px;
  margin: 0 auto;
  height: 60px;
}

.logo-icon {
  font-size: 1.4rem;
  line-height: 1;
}

.app-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-heading);
  margin: 0;
  letter-spacing: 0.02em;
}

.raider-count {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 3px 12px;
}

.app-main {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
}
</style>

