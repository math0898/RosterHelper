# RosterHelper

A dark-themed, local Vue 3 application for managing a World of Warcraft raid roster.

## Features

- **Add Raiders** – capture username, class, and specialisation via a form
- **Dynamic Table** – displays all raiders with WoW class colours, item level, and a remove button
- **Local Persistence** – roster data is saved to `localStorage` automatically
- **Extensible Data Model** – each `Raider` also stores item level and a per-boss data array (modifiable in future updates)

## Tech stack

| Tool | Purpose |
|------|---------|
| [Vue 3](https://vuejs.org/) | Reactive UI |
| [Vite](https://vitejs.dev/) | Dev server & bundler |

No additional runtime dependencies beyond Vue itself.

## Getting started

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build → dist/
```

## Project structure

```
src/
├── models/
│   ├── Raider.js       # Raider class (OOP, toJSON/fromJSON)
│   └── wowData.js      # WoW class → spec mapping & class colours
├── store/
│   └── RosterStore.js  # localStorage-backed repository
├── components/
│   ├── AddRaiderForm.vue
│   └── RaiderTable.vue
├── App.vue
├── main.js
└── style.css           # Dark theme CSS variables
```

Project is partially built with assistance from GitHub Copilot.
