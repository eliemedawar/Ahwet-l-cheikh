import { useSyncExternalStore } from 'react'
import { DATA_VERSION, defaultData } from '../data/defaults'

const STORAGE_KEY = 'kc-menu-data'
const MAX_HISTORY = 40

const clone = (value) => JSON.parse(JSON.stringify(value))

export const slugify = (text, fallback = 'item') => {
  const base = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || fallback
}

export const uniqueId = (text, taken, fallback = 'item') => {
  const base = slugify(text, fallback)
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

/** Fills in any keys added after a user's data was first saved. */
function migrate(saved) {
  if (!saved || typeof saved !== 'object') return clone(defaultData)
  const savedVersion = Number(saved.version) || 0
  const settings = { ...defaultData.settings, ...(saved.settings || {}) }

  // Version 2 makes the storefront a restrained, dine-in-first experience.
  // Apply only the curated presentation fields; preserve operational details
  // such as the branch, opening hours, currency, menu items, and pricing.
  if (savedVersion < 2) {
    ;[
      'tagline',
      'welcomeTagline',
      'welcomeCta',
      'heroEyebrow',
      'heroText',
      'heroPrimaryCta',
      'heroSecondaryCta',
      'categoryEyebrow',
      'categoryTitle',
      'categoryText',
      'menuEyebrow',
      'menuTitle',
      'menuNote',
      'footerLine',
      'showRating',
      'showFloatingCard',
      'showSeal',
      'showHeroProof',
      'showWelcome',
      'showCategories',
    ].forEach((key) => { settings[key] = defaultData.settings[key] })
  }

  // Restore the entrance disabled by the previous presentation update.
  // Later, intentional changes to the welcome toggle remain respected.
  if (savedVersion < 3) settings.showWelcome = true

  return {
    version: DATA_VERSION,
    settings,
    sections: Array.isArray(saved.sections) ? saved.sections : clone(defaultData.sections),
    items: Array.isArray(saved.items) ? saved.items : clone(defaultData.items),
    extras: Array.isArray(saved.extras) ? saved.extras : clone(defaultData.extras),
    storyValues: Array.isArray(saved.storyValues) ? saved.storyValues : clone(defaultData.storyValues),
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? migrate(JSON.parse(raw)) : clone(defaultData)
  } catch {
    return clone(defaultData)
  }
}

let state = load()
let past = []
let future = []
let lastError = ''
let savedAt = 0
let status = { canUndo: false, canRedo: false, error: '', savedAt: 0 }
const listeners = new Set()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    lastError = ''
    savedAt = Date.now()
  } catch (error) {
    lastError = error?.name === 'QuotaExceededError'
      ? 'Storage full — your images are too large. Remove or re-upload a few, or export a backup and reset.'
      : 'Could not save changes to this browser.'
  }
}

/** Rebuilt only when a value actually changes, so useSyncExternalStore stays stable. */
function refreshStatus() {
  const next = { canUndo: past.length > 0, canRedo: future.length > 0, error: lastError, savedAt }
  const changed = Object.keys(next).some((key) => next[key] !== status[key])
  if (changed) status = next
}

function emit() {
  refreshStatus()
  listeners.forEach((listener) => listener())
}

/** Applies a change, recording the previous state for undo. */
function commit(updater, { history = true } = {}) {
  const next = updater(clone(state))
  if (!next) return
  if (history) {
    past = [...past.slice(-(MAX_HISTORY - 1)), state]
    future = []
  }
  state = next
  persist()
  emit()
}

export const store = {
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return state
  },
  getStatus() {
    return status
  },

  undo() {
    if (past.length === 0) return
    future = [state, ...future]
    state = past[past.length - 1]
    past = past.slice(0, -1)
    persist()
    emit()
  },
  redo() {
    if (future.length === 0) return
    past = [...past, state]
    state = future[0]
    future = future.slice(1)
    persist()
    emit()
  },

  updateSettings(patch) {
    commit((draft) => ({ ...draft, settings: { ...draft.settings, ...patch } }))
  },

  // ---- Sections ----
  addSection(section) {
    commit((draft) => {
      const id = uniqueId(section.id || section.name, draft.sections.map((s) => s.id), 'section')
      draft.sections.push({ ...section, id })
      return draft
    })
  },
  updateSection(id, patch) {
    commit((draft) => {
      draft.sections = draft.sections.map((s) => (s.id === id ? { ...s, ...patch } : s))
      return draft
    })
  },
  /** moveItemsTo: a section id to reassign this section's items to, or null to delete them. */
  removeSection(id, moveItemsTo = null) {
    commit((draft) => {
      draft.sections = draft.sections.filter((s) => s.id !== id)
      draft.items = moveItemsTo
        ? draft.items.map((i) => (i.sectionId === id ? { ...i, sectionId: moveItemsTo } : i))
        : draft.items.filter((i) => i.sectionId !== id)
      return draft
    })
  },
  moveSection(id, direction) {
    commit((draft) => {
      const index = draft.sections.findIndex((s) => s.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= draft.sections.length) return null
      const next = [...draft.sections]
      ;[next[index], next[target]] = [next[target], next[index]]
      draft.sections = next
      return draft
    })
  },
  reorderSections(orderedIds) {
    commit((draft) => {
      draft.sections = orderedIds
        .map((id) => draft.sections.find((s) => s.id === id))
        .filter(Boolean)
      return draft
    })
  },

  // ---- Items ----
  addItem(newItem) {
    commit((draft) => {
      const id = uniqueId(newItem.id || newItem.title, draft.items.map((i) => i.id), 'dish')
      draft.items.push({ ...newItem, id, price: Number(newItem.price) || 0 })
      return draft
    })
  },
  updateItem(id, patch) {
    commit((draft) => {
      draft.items = draft.items.map((i) => (i.id === id ? { ...i, ...patch } : i))
      return draft
    })
  },
  removeItem(id) {
    commit((draft) => {
      draft.items = draft.items.filter((i) => i.id !== id)
      return draft
    })
  },
  duplicateItem(id) {
    commit((draft) => {
      const index = draft.items.findIndex((i) => i.id === id)
      if (index < 0) return null
      const source = draft.items[index]
      const copy = {
        ...source,
        id: uniqueId(`${source.title}-copy`, draft.items.map((i) => i.id), 'dish'),
        title: `${source.title} (copy)`,
      }
      draft.items.splice(index + 1, 0, copy)
      return draft
    })
  },
  moveItem(id, direction) {
    commit((draft) => {
      const item = draft.items.find((i) => i.id === id)
      if (!item) return null
      const siblings = draft.items.filter((i) => i.sectionId === item.sectionId)
      const index = siblings.findIndex((i) => i.id === id)
      const target = index + direction
      if (target < 0 || target >= siblings.length) return null
      const swapWith = siblings[target]
      const a = draft.items.findIndex((i) => i.id === id)
      const b = draft.items.findIndex((i) => i.id === swapWith.id)
      const next = [...draft.items]
      ;[next[a], next[b]] = [next[b], next[a]]
      draft.items = next
      return draft
    })
  },
  reorderItems(orderedIds) {
    commit((draft) => {
      const byId = new Map(draft.items.map((i) => [i.id, i]))
      const moved = orderedIds.map((id) => byId.get(id)).filter(Boolean)
      const untouched = draft.items.filter((i) => !orderedIds.includes(i.id))
      draft.items = [...moved, ...untouched]
      return draft
    })
  },

  // ---- Extras ----
  addExtra(extra) {
    commit((draft) => {
      const id = uniqueId(extra.label, draft.extras.map((e) => e.id), 'extra')
      draft.extras.push({ ...extra, id, price: Number(extra.price) || 0 })
      return draft
    })
  },
  updateExtra(id, patch) {
    commit((draft) => {
      draft.extras = draft.extras.map((e) => (e.id === id ? { ...e, ...patch } : e))
      return draft
    })
  },
  removeExtra(id) {
    commit((draft) => {
      draft.extras = draft.extras.filter((e) => e.id !== id)
      return draft
    })
  },
  moveExtra(id, direction) {
    commit((draft) => {
      const index = draft.extras.findIndex((e) => e.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= draft.extras.length) return null
      const next = [...draft.extras]
      ;[next[index], next[target]] = [next[target], next[index]]
      draft.extras = next
      return draft
    })
  },

  // ---- Story values ----
  addStoryValue(value) {
    commit((draft) => {
      const id = uniqueId(value.title, draft.storyValues.map((v) => v.id), 'value')
      draft.storyValues.push({ ...value, id })
      return draft
    })
  },
  updateStoryValue(id, patch) {
    commit((draft) => {
      draft.storyValues = draft.storyValues.map((v) => (v.id === id ? { ...v, ...patch } : v))
      return draft
    })
  },
  removeStoryValue(id) {
    commit((draft) => {
      draft.storyValues = draft.storyValues.filter((v) => v.id !== id)
      return draft
    })
  },

  // ---- Whole-document operations ----
  replaceAll(data) {
    commit(() => migrate(data))
  },
  resetToDefaults() {
    commit(() => clone(defaultData))
  },
  exportJson() {
    return JSON.stringify(state, null, 2)
  },
}

// A storefront tab left open should pick up edits made in the admin tab.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      state = migrate(JSON.parse(event.newValue))
      past = []
      future = []
      emit()
    } catch {
      /* ignore a malformed write from another tab */
    }
  })
}

export function useMenuData() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}

export function useStoreStatus() {
  return useSyncExternalStore(store.subscribe, store.getStatus, store.getStatus)
}

/** Sections and their visible items, ready for the storefront. */
export function selectMenu(data) {
  const sections = data.sections.filter((s) => s.visible !== false)
  const items = data.items.filter((i) => i.visible !== false && sections.some((s) => s.id === i.sectionId))
  const ordered = sections.flatMap((s) => items.filter((i) => i.sectionId === s.id))
  return { sections, items: ordered, extras: data.extras.filter((e) => e.visible !== false) }
}
