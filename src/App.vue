<script setup>
import { ref, computed } from 'vue';
import AddRaiderForm from './components/AddRaiderForm.vue';
import RaiderTable from './components/RaiderTable.vue';
import BossesPage from './components/BossesPage.vue';
import WishlistPage from './components/WishlistPage.vue';
import { RosterStore } from './store/RosterStore.js';
import { BossStore } from './store/BossStore.js';
import { RAID_RANKS, SPEC_ROLES } from './models/wowData.js';

// ─── Stores ──────────────────────────────────────────────────────────────────

const rosterStore = new RosterStore();
const bossStore   = new BossStore();

const raiders = ref(rosterStore.getAll());
const bosses  = ref(bossStore.getAll());

// ─── Navigation ──────────────────────────────────────────────────────────────

/** @type {'roster' | 'bosses' | 'wishlist'} */
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

function handleUpdateRaiderSpec({ raiderId, spec }) {
  rosterStore.updateSpec(raiderId, spec);
  raiders.value = rosterStore.getAll();
}

function handleUpdateRaiderRank({ raiderId, rank }) {
  rosterStore.updateRank(raiderId, rank);
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

// ─── Loot actions ─────────────────────────────────────────────────────────────

function handleAddLoot({ bossId, lootItem }) {
  bossStore.addLootToBoss(bossId, lootItem);
  bosses.value = bossStore.getAll();
}

function handleRemoveLoot({ bossId, lootItemId }) {
  bossStore.removeLootFromBoss(bossId, lootItemId);
  bosses.value = bossStore.getAll();
}

// ─── Wishlist actions ─────────────────────────────────────────────────────────

function handleAddToWishlist({ raiderId, entry }) {
  rosterStore.addToWishlist(raiderId, entry);
  raiders.value = rosterStore.getAll();
}

function handleRemoveFromWishlist({ raiderId, lootItemId }) {
  rosterStore.removeFromWishlist(raiderId, lootItemId);
  raiders.value = rosterStore.getAll();
}

function handleSetWishlistUpdatedAt({ raiderId, updatedAt }) {
  rosterStore.setWishlistUpdatedAt(raiderId, updatedAt);
  raiders.value = rosterStore.getAll();
}

// ─── Boss-view mode ───────────────────────────────────────────────────────────

/** The boss currently selected for boss-view mode in the roster table. Null = normal mode. */
const activeBoss = ref(null);

function selectBossView(boss) {
  activeBoss.value = activeBoss.value?.id === boss.id ? null : boss;
}

// ─── Roster filter ────────────────────────────────────────────────────────────

const ALL_ROLES = ['Tank', 'Healer', 'DPS'];

/**
 * 'whitelist': show only raiders whose rank/role is in the selected sets.
 * 'blacklist': hide raiders whose rank or role is in the selected sets.
 */
const filterMode = ref('whitelist');

/** Ranks/roles selected in whitelist mode (default: all included). */
const wlRanks = ref(new Set(RAID_RANKS));
const wlRoles = ref(new Set(ALL_ROLES));

/** Ranks/roles selected in blacklist mode (default: none excluded). */
const blRanks = ref(new Set());
const blRoles = ref(new Set());

function roleForRaider(raider) {
  if (!raider.spec) return 'DPS';
  return SPEC_ROLES[raider.spec] ?? 'DPS';
}

function toggleFilterRank(rank) {
  if (filterMode.value === 'whitelist') {
    const s = new Set(wlRanks.value);
    s.has(rank) ? s.delete(rank) : s.add(rank);
    wlRanks.value = s;
  } else {
    const s = new Set(blRanks.value);
    s.has(rank) ? s.delete(rank) : s.add(rank);
    blRanks.value = s;
  }
}

function toggleFilterRole(role) {
  if (filterMode.value === 'whitelist') {
    const s = new Set(wlRoles.value);
    s.has(role) ? s.delete(role) : s.add(role);
    wlRoles.value = s;
  } else {
    const s = new Set(blRoles.value);
    s.has(role) ? s.delete(role) : s.add(role);
    blRoles.value = s;
  }
}

function isRankActive(rank) {
  return filterMode.value === 'whitelist' ? wlRanks.value.has(rank) : blRanks.value.has(rank);
}

function isRoleActive(role) {
  return filterMode.value === 'whitelist' ? wlRoles.value.has(role) : blRoles.value.has(role);
}

const filteredRaiders = computed(() => {
  return raiders.value.filter((r) => {
    const role = roleForRaider(r);
    if (filterMode.value === 'whitelist') {
      return wlRanks.value.has(r.rank) && wlRoles.value.has(role);
    } else {
      return !blRanks.value.has(r.rank) && !blRoles.value.has(role);
    }
  });
});
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
          <button
            class="nav-btn"
            :class="{ active: currentPage === 'wishlist' }"
            @click="currentPage = 'wishlist'"
          >
            Wishlist
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

      <!-- Rank / Role filter bar -->
      <div class="filter-bar">
        <span class="filter-label">Filter:</span>
        <button
          class="filter-mode-btn"
          :class="{ 'filter-mode-btn--active': filterMode === 'whitelist' }"
          @click="filterMode = 'whitelist'"
          title="Show only selected ranks and roles"
        >Show only</button>
        <button
          class="filter-mode-btn"
          :class="{ 'filter-mode-btn--active': filterMode === 'blacklist' }"
          @click="filterMode = 'blacklist'"
          title="Hide selected ranks and roles"
        >Exclude</button>

        <span class="filter-divider">|</span>
        <span class="filter-group-label">Rank:</span>
        <button
          v-for="rank in RAID_RANKS"
          :key="rank"
          class="filter-chip"
          :class="{ 'filter-chip--active': isRankActive(rank) }"
          @click="toggleFilterRank(rank)"
        >{{ rank }}</button>

        <span class="filter-divider">|</span>
        <span class="filter-group-label">Role:</span>
        <button
          v-for="role in ALL_ROLES"
          :key="role"
          class="filter-chip"
          :class="{ 'filter-chip--active': isRoleActive(role), [`filter-chip--role-${role.toLowerCase()}`]: true }"
          @click="toggleFilterRole(role)"
        >{{ role }}</button>
      </div>

      <RaiderTable
        :raiders="filteredRaiders"
        :active-boss="activeBoss"
        @remove-raider="handleRemoveRaider"
        @update-raider-spec="handleUpdateRaiderSpec"
        @update-raider-rank="handleUpdateRaiderRank"
      />
    </main>

    <!-- Bosses page -->
    <main v-else-if="currentPage === 'bosses'" class="app-main">
      <BossesPage
        :bosses="bosses"
        @add-boss="handleAddBoss"
        @remove-boss="handleRemoveBoss"
        @add-loot="handleAddLoot"
        @remove-loot="handleRemoveLoot"
      />
    </main>

    <!-- Wishlist page -->
    <main v-else-if="currentPage === 'wishlist'" class="app-main">
      <WishlistPage
        :raiders="raiders"
        :bosses="bosses"
        @add-to-wishlist="handleAddToWishlist"
        @remove-from-wishlist="handleRemoveFromWishlist"
        @set-wishlist-updated-at="handleSetWishlistUpdatedAt"
        @add-raider="handleAddRaider"
        @add-boss="handleAddBoss"
        @add-loot="handleAddLoot"
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

/* ── Filter bar ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 14px;
}

.filter-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  white-space: nowrap;
  margin-right: 2px;
}

.filter-group-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  white-space: nowrap;
}

.filter-divider {
  color: var(--border);
  font-weight: 300;
  margin: 0 2px;
}

.filter-mode-btn {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.filter-mode-btn:hover {
  color: var(--text-heading);
}

.filter-mode-btn--active {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--surface-2));
}

.filter-chip {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 10px;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.filter-chip:hover {
  color: var(--text-heading);
  border-color: var(--accent);
}

.filter-chip--active {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--surface-2));
}

.filter-chip--role-tank.filter-chip--active {
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.6);
  background: rgba(59, 130, 246, 0.12);
}

.filter-chip--role-healer.filter-chip--active {
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(34, 197, 94, 0.1);
}

.filter-chip--role-dps.filter-chip--active {
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.1);
}
</style>
