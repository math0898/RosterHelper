<script setup>
import { ref } from 'vue';
import AddRaiderForm from './components/AddRaiderForm.vue';
import RaiderTable from './components/RaiderTable.vue';
import BossesPage from './components/BossesPage.vue';
import { RosterStore } from './store/RosterStore.js';
import { BossStore } from './store/BossStore.js';

// ─── Stores ──────────────────────────────────────────────────────────────────

const rosterStore = new RosterStore();
const bossStore   = new BossStore();

const raiders = ref(rosterStore.getAll());
const bosses  = ref(bossStore.getAll());

// ─── Navigation ──────────────────────────────────────────────────────────────

/** @type {'roster' | 'bosses'} */
const currentPage = ref('roster');

// ─── Roster actions ──────────────────────────────────────────────────────────

function handleAddRaider(raider) {
  rosterStore.add(raider);
  raiders.value = rosterStore.getAll();
}

function handleRemoveRaider(id) {
  rosterStore.remove(id);
  raiders.value = rosterStore.getAll();
}

// ─── Boss actions ─────────────────────────────────────────────────────────────

function handleAddBoss(boss) {
  bossStore.add(boss);
  bosses.value = bossStore.getAll();
}

function handleRemoveBoss(id) {
  bossStore.remove(id);
  bosses.value = bossStore.getAll();
  // If the deleted boss was active in the table, clear it
  if (activeBoss.value?.id === id) activeBoss.value = null;
}

// ─── Boss-view mode ───────────────────────────────────────────────────────────

/** The boss currently selected for boss-view mode in the roster table. Null = normal mode. */
const activeBoss = ref(null);

function selectBossView(boss) {
  activeBoss.value = activeBoss.value?.id === boss.id ? null : boss;
}
</script>

<template>
  <div id="app-shell">
    <!-- Header / navigation -->
    <header class="app-header">
      <div class="header-inner">
        <span class="logo-icon">⚔</span>
        <h1 class="app-title">RosterHelper</h1>

        <nav class="app-nav">
          <button
            class="nav-btn"
            :class="{ active: currentPage === 'roster' }"
            @click="currentPage = 'roster'"
          >
            Roster
          </button>
          <button
            class="nav-btn"
            :class="{ active: currentPage === 'bosses' }"
            @click="currentPage = 'bosses'"
          >
            Bosses
          </button>
        </nav>

        <span class="raider-count">
          {{ raiders.length }} raider{{ raiders.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </header>

    <!-- Roster page -->
    <main v-if="currentPage === 'roster'" class="app-main">
      <AddRaiderForm @add-raider="handleAddRaider" />

      <!-- Boss-view selector (only shown when bosses exist) -->
      <div v-if="bosses.length > 0" class="boss-selector">
        <span class="boss-selector-label">Boss view:</span>
        <button
          v-for="boss in bosses"
          :key="boss.id"
          class="boss-pill"
          :class="{ active: activeBoss?.id === boss.id }"
          @click="selectBossView(boss)"
        >
          {{ boss.name }}
        </button>
        <button
          v-if="activeBoss"
          class="boss-pill boss-pill--clear"
          @click="activeBoss = null"
        >
          ✕ Clear
        </button>
      </div>

      <RaiderTable
        :raiders="raiders"
        :active-boss="activeBoss"
        @remove-raider="handleRemoveRaider"
      />
    </main>

    <!-- Bosses page -->
    <main v-else-if="currentPage === 'bosses'" class="app-main">
      <BossesPage
        :bosses="bosses"
        @add-boss="handleAddBoss"
        @remove-boss="handleRemoveBoss"
      />
    </main>
  </div>
</template>

<style scoped>
#app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Header ── */
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

/* ── Nav ── */
.app-nav {
  display: flex;
  gap: 4px;
  margin-left: 20px;
}

.nav-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 5px 14px;
  transition: color 0.15s, background 0.15s;
}

.nav-btn:hover {
  color: var(--text-heading);
  background: var(--surface-2);
}

.nav-btn.active {
  color: var(--accent);
  border-color: var(--border);
  background: var(--surface-2);
}

/* ── Raider count pill ── */
.raider-count {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 3px 12px;
}

/* ── Main ── */
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

/* ── Boss selector bar ── */
.boss-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.boss-selector-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.boss-pill {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.82rem;
  padding: 4px 14px;
  transition: color 0.15s, border-color 0.15s;
}

.boss-pill:hover {
  color: var(--text-heading);
  border-color: var(--accent);
}

.boss-pill.active {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--surface-2));
}

.boss-pill--clear {
  color: var(--danger);
  border-color: var(--danger);
  background: transparent;
}

.boss-pill--clear:hover {
  background: rgba(239, 68, 68, 0.1);
}
</style>
