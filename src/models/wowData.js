/**
 * Static mapping of World of Warcraft classes to their available specs.
 * Kept as a plain module so it can be imported by both the form component
 * and any future data-validation layer.
 */
export const WOW_CLASSES = {
  'Death Knight': ['Blood', 'Frost', 'Unholy'],
  'Demon Hunter': ['Havoc', 'Vengeance', 'Devour'],
  Druid: ['Balance', 'Feral', 'Guardian', 'Restoration'],
  Evoker: ['Augmentation', 'Devastation', 'Preservation'],
  Hunter: ['Beast Mastery', 'Marksmanship', 'Survival'],
  Mage: ['Arcane', 'Fire', 'Frost'],
  Monk: ['Brewmaster', 'Mistweaver', 'Windwalker'],
  Paladin: ['Holy', 'Protection', 'Retribution'],
  Priest: ['Discipline', 'Holy', 'Shadow'],
  Rogue: ['Assassination', 'Outlaw', 'Subtlety'],
  Shaman: ['Elemental', 'Enhancement', 'Restoration'],
  Warlock: ['Affliction', 'Demonology', 'Destruction'],
  Warrior: ['Arms', 'Fury', 'Protection'],
};

/** WoW class colour lookup (approximate hex values used in-game). */
export const CLASS_COLORS = {
  'Death Knight': '#C41E3A',
  'Demon Hunter': '#A330C9',
  Druid: '#FF7C0A',
  Evoker: '#33937F',
  Hunter: '#AAD372',
  Mage: '#3FC7EB',
  Monk: '#00FF98',
  Paladin: '#F48CBA',
  Priest: '#FFFFFF',
  Rogue: '#FFF468',
  Shaman: '#0070DD',
  Warlock: '#8788EE',
  Warrior: '#C69B3A',
};

/**
 * Ordered list of raid ranks, from highest to lowest.
 * Used for both the form selector and the rank badge in the table.
 */
export const RAID_RANKS = ['Guild Master', 'Officer', 'Member', 'Bench', 'Trial'];

/**
 * Accent colour for each rank badge.
 * Intentionally subtle — these are meant as small visual indicators.
 */
export const RANK_COLORS = {
  'Guild Master': '#FFD700',
  Officer:        '#C0C0C0',
  Member:         '#4a90e2',
  Bench:          '#FF8C00',
  Trial:          '#6b7280',
};

