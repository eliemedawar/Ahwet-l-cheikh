import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  Plus,
  Redo2,
  RotateCcw,
  Languages,
  Search,
  Settings2,
  Store,
  Type,
  Undo2,
  Upload,
  UtensilsCrossed,
} from 'lucide-react'
import { emptyItem, emptySection } from '../data/defaults'
import { copy } from '../lib/guest'
import { getIcon } from '../lib/icons'
import { store, useMenuData, useStoreStatus } from '../lib/store'
import { AssetField, ConfirmButton, Field, IconPicker, ImageField, SavedPulse, Toggle, useDragList } from './fields'
import { isLongText, wordingGroups } from './wording'
import './admin.css'

const TABS = [
  { id: 'sections', label: 'Sections', Icon: LayoutGrid },
  { id: 'items', label: 'Menu items', Icon: UtensilsCrossed },
  { id: 'content', label: 'Content', Icon: Type },
  { id: 'wording', label: 'Wording', Icon: Languages },
  { id: 'data', label: 'Data', Icon: Settings2 },
]

/* ------------------------------------------------------------------ Sections */

function SectionRow({ section, itemCount, sections, dragProps }) {
  const [open, setOpen] = useState(false)
  const Icon = getIcon(section.icon)
  const others = sections.filter((s) => s.id !== section.id)
  const [moveTo, setMoveTo] = useState(others[0]?.id || '')
  const { className: dragClass, ...drag } = dragProps

  return (
    <div className={`a-row ${open ? 'a-row--open' : ''} ${dragClass}`} {...drag}>
      <div className="a-row-head">
        <span className="a-grip" title="Drag to reorder"><GripVertical size={16} /></span>
        <span className="a-row-icon"><Icon size={17} /></span>
        <button className="a-row-title" onClick={() => setOpen((v) => !v)}>
          <b>{section.name || 'Untitled section'}</b>
          <small>{section.eyebrow || 'No subtitle'} · {itemCount} {itemCount === 1 ? 'item' : 'items'}</small>
        </button>
        <button
          className={`a-icon-btn ${section.visible === false ? 'a-icon-btn--off' : ''}`}
          onClick={() => store.updateSection(section.id, { visible: section.visible === false })}
          title={section.visible === false ? 'Hidden — click to show' : 'Visible — click to hide'}
        >
          {section.visible === false ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <ConfirmButton
          label={itemCount > 0 ? `Delete & move ${itemCount}` : 'Delete'}
          onConfirm={() => store.removeSection(section.id, itemCount > 0 ? moveTo || null : null)}
        />
        <button className="a-icon-btn" onClick={() => setOpen((v) => !v)} aria-label="Edit section">
          <ChevronDown size={16} className={open ? 'a-flip' : ''} />
        </button>
      </div>

      {open && (
        <div className="a-row-body">
          <div className="a-grid">
            <Field label="Name"><input value={section.name} onChange={(e) => store.updateSection(section.id, { name: e.target.value })} /></Field>
            <Field label="Name — العربية" hint="blank uses the English"><input value={section.arabic || ''} dir="rtl" lang="ar" onChange={(e) => store.updateSection(section.id, { arabic: e.target.value })} /></Field>
            <Field label="Subtitle" hint="shown on the card"><input value={section.eyebrow} onChange={(e) => store.updateSection(section.id, { eyebrow: e.target.value })} /></Field>
            <Field label="Subtitle — العربية" hint="blank uses the English"><input value={section.eyebrowArabic || ''} dir="rtl" lang="ar" onChange={(e) => store.updateSection(section.id, { eyebrowArabic: e.target.value })} /></Field>
            <Field label="Icon"><IconPicker value={section.icon} onChange={(icon) => store.updateSection(section.id, { icon })} /></Field>
            {itemCount > 0 && others.length > 0 && (
              <Field label="On delete, move items to">
                <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                  {others.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  <option value="">Delete the items too</option>
                </select>
              </Field>
            )}
          </div>
          <ImageField
            label="Card image"
            image={section.image}
            position={section.position}
            onChange={(patch) => store.updateSection(section.id, patch)}
          />
        </div>
      )}
    </div>
  )
}

function SectionsPanel({ data }) {
  const [draft, setDraft] = useState(emptySection())
  const [adding, setAdding] = useState(false)
  const ids = data.sections.map((s) => s.id)
  const rowProps = useDragList(ids, (next) => store.reorderSections(next))
  const countFor = (id) => data.items.filter((i) => i.sectionId === id).length

  const submit = () => {
    if (!draft.name.trim()) return
    store.addSection(draft)
    setDraft(emptySection())
    setAdding(false)
  }

  return (
    <div className="a-panel">
      <div className="a-panel-head">
        <div>
          <h2>Sections</h2>
          <p>The categories on your menu. Drag to reorder — the storefront follows this order.</p>
        </div>
        <button className="a-btn a-btn--primary" onClick={() => setAdding((v) => !v)}><Plus size={15} /> New section</button>
      </div>

      {adding && (
        <div className="a-new-card">
          <div className="a-grid">
            <Field label="Name"><input autoFocus value={draft.name} placeholder="e.g. Salads" onChange={(e) => setDraft({ ...draft, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submit()} /></Field>
            <Field label="Subtitle"><input value={draft.eyebrow} placeholder="e.g. Fresh & green" onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submit()} /></Field>
            <Field label="Icon"><IconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} /></Field>
          </div>
          <div className="a-new-actions">
            <button className="a-btn a-btn--primary" onClick={submit} disabled={!draft.name.trim()}>Add section</button>
            <button className="a-btn a-btn--ghost" onClick={() => { setAdding(false); setDraft(emptySection()) }}>Cancel</button>
          </div>
        </div>
      )}

      {data.sections.length === 0 ? (
        <div className="a-empty"><LayoutGrid size={26} /><b>No sections yet</b><span>Add one to start building your menu.</span></div>
      ) : (
        <div className="a-list">
          {data.sections.map((section) => (
            <SectionRow
              key={section.id}
              section={section}
              sections={data.sections}
              itemCount={countFor(section.id)}
              dragProps={rowProps(section.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------------------- Items */

function ItemRow({ item, sections, currency, dragProps }) {
  const [open, setOpen] = useState(false)
  const set = (patch) => store.updateItem(item.id, patch)
  const { className: dragClass, ...drag } = dragProps

  return (
    <div className={`a-row ${open ? 'a-row--open' : ''} ${dragClass}`} {...drag}>
      <div className="a-row-head">
        <span className="a-grip" title="Drag to reorder"><GripVertical size={16} /></span>
        <span className="a-row-thumb">
          <img src={item.image || '/assets/lebanese-table.png'} alt="" style={{ objectPosition: item.image ? 'center' : item.position }} />
        </span>
        <button className="a-row-title" onClick={() => setOpen((v) => !v)}>
          <b>{item.title || 'Untitled item'}{item.featured && <span className="a-chip a-chip--star">Featured</span>}{item.available === false && <span className="a-chip a-chip--out">Sold out</span>}</b>
          <small>{currency}{Number(item.price).toFixed(2)}{item.arabic ? ` · ${item.arabic}` : ''}</small>
        </button>
        <button
          className={`a-icon-btn ${item.visible === false ? 'a-icon-btn--off' : ''}`}
          onClick={() => set({ visible: item.visible === false })}
          title={item.visible === false ? 'Hidden — click to show' : 'Visible — click to hide'}
        >
          {item.visible === false ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button className="a-icon-btn" onClick={() => store.duplicateItem(item.id)} title="Duplicate"><Copy size={15} /></button>
        <ConfirmButton onConfirm={() => store.removeItem(item.id)} />
        <button className="a-icon-btn" onClick={() => setOpen((v) => !v)} aria-label="Edit item">
          <ChevronDown size={16} className={open ? 'a-flip' : ''} />
        </button>
      </div>

      {open && (
        <div className="a-row-body">
          <div className="a-grid">
            <Field label="Name"><input value={item.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="Arabic name"><input value={item.arabic} dir="rtl" lang="ar" onChange={(e) => set({ arabic: e.target.value })} /></Field>
            <Field label={`Price (${currency})`}><input type="number" min="0" step="0.25" value={item.price} onChange={(e) => set({ price: Number(e.target.value) || 0 })} /></Field>
            <Field label="Section">
              <select value={item.sectionId} onChange={(e) => set({ sectionId: e.target.value })}>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Badge" hint="corner label"><input value={item.tag} placeholder="e.g. House favorite" onChange={(e) => set({ tag: e.target.value })} /></Field>
            <Field label="Description" wide>
              <textarea rows="2" value={item.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
            <Field label="Description — العربية" hint="blank uses the English" wide>
              <textarea rows="2" value={item.descriptionArabic || ''} dir="rtl" lang="ar" onChange={(e) => set({ descriptionArabic: e.target.value })} />
            </Field>
          </div>

          <div className="a-toggles">
            <Toggle checked={item.available !== false} onChange={(v) => set({ available: v })} label="Available" hint="Off shows a sold-out badge" />
            <Toggle checked={item.featured} onChange={(v) => set({ featured: v })} label="Featured" hint="Shown in the hero" />
            <Toggle checked={item.vegetarian} onChange={(v) => set({ vegetarian: v })} label="Vegetarian" />
            <Toggle checked={item.vegan} onChange={(v) => set({ vegan: v, vegetarian: v || item.vegetarian })} label="Vegan" />
            <Toggle checked={item.glutenFree} onChange={(v) => set({ glutenFree: v })} label="Gluten free" />
            <Toggle checked={item.spicy} onChange={(v) => set({ spicy: v })} label="Spicy" />
          </div>

          <ImageField
            label="Photo"
            image={item.image}
            position={item.position}
            onChange={(patch) => set(patch)}
          />
        </div>
      )}
    </div>
  )
}

function ItemsPanel({ data }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(() => emptyItem(data.sections[0]?.id || ''))
  const currency = data.settings.currency || '$'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.items.filter((item) => {
      const matchesQuery = !q || [item.title, item.arabic, item.tag, item.description].join(' ').toLowerCase().includes(q)
      const matchesFilter = filter === 'all' || item.sectionId === filter
      return matchesQuery && matchesFilter
    })
  }, [data.items, query, filter])

  const ids = filtered.map((i) => i.id)
  const rowProps = useDragList(ids, (next) => store.reorderItems(next))

  const grouped = data.sections
    .map((section) => ({ section, items: filtered.filter((i) => i.sectionId === section.id) }))
    .filter((group) => group.items.length > 0)
  const orphans = filtered.filter((i) => !data.sections.some((s) => s.id === i.sectionId))

  const submit = () => {
    if (!draft.title.trim() || !draft.sectionId) return
    store.addItem(draft)
    setDraft(emptyItem(draft.sectionId))
    setAdding(false)
  }

  if (data.sections.length === 0) {
    return (
      <div className="a-panel">
        <div className="a-empty"><UtensilsCrossed size={26} /><b>Add a section first</b><span>Menu items live inside sections.</span></div>
      </div>
    )
  }

  return (
    <div className="a-panel">
      <div className="a-panel-head">
        <div>
          <h2>Menu items</h2>
          <p>Every dish on your menu. Drag to reorder inside a section.</p>
        </div>
        <button className="a-btn a-btn--primary" onClick={() => setAdding((v) => !v)}><Plus size={15} /> New item</button>
      </div>

      {adding && (
        <div className="a-new-card">
          <div className="a-grid">
            <Field label="Name"><input autoFocus value={draft.title} placeholder="e.g. Fattoush" onChange={(e) => setDraft({ ...draft, title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submit()} /></Field>
            <Field label="Arabic name"><input value={draft.arabic} dir="rtl" lang="ar" onChange={(e) => setDraft({ ...draft, arabic: e.target.value })} /></Field>
            <Field label={`Price (${currency})`}><input type="number" min="0" step="0.25" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })} onKeyDown={(e) => e.key === 'Enter' && submit()} /></Field>
            <Field label="Section">
              <select value={draft.sectionId} onChange={(e) => setDraft({ ...draft, sectionId: e.target.value })}>
                {data.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Description" wide><textarea rows="2" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
          </div>
          <div className="a-new-actions">
            <button className="a-btn a-btn--primary" onClick={submit} disabled={!draft.title.trim()}>Add item</button>
            <button className="a-btn a-btn--ghost" onClick={() => setAdding(false)}>Cancel</button>
            <small>You can add the photo and dietary flags after it’s created.</small>
          </div>
        </div>
      )}

      <div className="a-toolbar">
        <span className="a-search">
          <Search size={15} />
          <input value={query} placeholder="Search items" onChange={(e) => setQuery(e.target.value)} />
        </span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All sections</option>
          {data.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="a-count">{filtered.length} of {data.items.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="a-empty"><Search size={26} /><b>Nothing matches</b><span>Try a different search or filter.</span></div>
      ) : (
        grouped.map(({ section, items }) => (
          <div key={section.id} className="a-group">
            <h3>{section.name} <span>{items.length}</span></h3>
            <div className="a-list">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} sections={data.sections} currency={currency} dragProps={rowProps(item.id)} />
              ))}
            </div>
          </div>
        ))
      )}

      {orphans.length > 0 && (
        <div className="a-group">
          <h3 className="a-group--warn"><AlertTriangle size={14} /> Not in any section <span>{orphans.length}</span></h3>
          <div className="a-list">
            {orphans.map((item) => (
              <ItemRow key={item.id} item={item} sections={data.sections} currency={currency} dragProps={rowProps(item.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------- Content */

function ContentPanel({ data }) {
  const s = data.settings
  const set = (patch) => store.updateSettings(patch)

  const group = (title, description, children) => (
    <div className="a-group">
      <h3>{title} <em>{description}</em></h3>
      <div className="a-card"><div className="a-grid">{children}</div></div>
    </div>
  )

  /** An English field and its Arabic counterpart. Blank Arabic falls back to the English. */
  const pair = (key, label, { hint = '', rows = 0, wide = false } = {}) => {
    const arabicKey = `${key}Arabic`
    const control = (value, onChange, dir) => (rows
      ? <textarea rows={rows} value={value} dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'} onChange={(e) => onChange(e.target.value)} />
      : <input value={value} dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'} onChange={(e) => onChange(e.target.value)} />)
    return (
      <>
        <Field label={label} hint={hint} wide={wide}>{control(s[key] ?? '', (v) => set({ [key]: v }), 'ltr')}</Field>
        <Field label={`${label} — العربية`} hint="blank uses the English" wide={wide}>
          {control(s[arabicKey] ?? '', (v) => set({ [arabicKey]: v }), 'rtl')}
        </Field>
      </>
    )
  }

  return (
    <div className="a-panel">
      <div className="a-panel-head">
        <div>
          <h2>Content</h2>
          <p>The café's own details. For the site's fixed words — headings, badges, buttons — use the Wording tab.</p>
        </div>
      </div>

      {group('Café', 'name, branch, hours', <>
        <Field label="Café name"><input value={s.brandName} onChange={(e) => set({ brandName: e.target.value })} /></Field>
        <Field label="Arabic name" hint="alt text for the logo"><input value={s.arabicName} dir="rtl" lang="ar" onChange={(e) => set({ arabicName: e.target.value })} /></Field>
        {pair('branch', 'Branch / address')}
        {pair('hours', 'Opening hours')}
        <Field label="Currency symbol"><input value={s.currency} maxLength={4} onChange={(e) => set({ currency: e.target.value })} /></Field>
        <Field label="Year beside the city" hint="under the logo"><input value={s.storyYear} onChange={(e) => set({ storyYear: e.target.value })} /></Field>
      </>)}

      {group('Welcome screen', 'the full-screen intro', <>
        {pair('welcomeSince', 'Since line')}
        {pair('welcomeCta', 'Button label')}
      </>)}

      <p className="a-hint a-hint--standalone">
        The welcome headline, paragraph and signature live in the <b>Wording</b> tab, with the rest of the site's fixed text.
      </p>

      {group('Menu page', 'the heading guests read first', <>
        {pair('menuTitle', 'Heading')}
        {pair('menuNote', 'Guest note', { hint: 'allergy or service guidance', rows: 2, wide: true })}
      </>)}

      {group('Our story', 'the about block', <>
        {pair('storyTitle', 'Heading', { hint: 'one line break allowed', rows: 2, wide: true })}
        {pair('storyText', 'Paragraph', { rows: 4, wide: true })}
        <Field label="Arabic signature" hint="the script under the story"><input value={s.footerNote} dir="rtl" lang="ar" onChange={(e) => set({ footerNote: e.target.value })} /></Field>
      </>)}

      <div className="a-group">
        <h3>Images <em>the artwork built into the site</em></h3>
        <div className="a-card a-asset-grid">
          <AssetField
            label="Logo — header & footer"
            image={s.logoSmall}
            fallback="/assets/brand-small.webp"
            contain
            onChange={({ image }) => set({ logoSmall: image })}
          />
          <AssetField
            label="Logo — welcome screen"
            image={s.logoLarge}
            fallback="/assets/brand-large.webp"
            contain
            onChange={({ image }) => set({ logoLarge: image })}
          />
          <AssetField
            label="Welcome background"
            image={s.welcomeImage}
            fallback="/assets/welcome-cafe.webp"
            position={s.welcomeImagePosition}
            focal
            hint="Click the photo to choose which part stays visible on a phone."
            onChange={({ image, position }) => set({
              ...(image !== undefined ? { welcomeImage: image } : {}),
              ...(position !== undefined ? { welcomeImagePosition: position } : {}),
            })}
          />
          <AssetField
            label="Story photo"
            image={s.storyImage}
            fallback="/assets/hospitality.webp"
            position={s.storyImagePosition}
            focal
            onChange={({ image, position }) => set({
              ...(image !== undefined ? { storyImage: image } : {}),
              ...(position !== undefined ? { storyImagePosition: position } : {}),
            })}
          />
        </div>
      </div>

      <div className="a-group">
        <h3>Show or hide <em>turn whole blocks on and off</em></h3>
        <div className="a-card">
          <div className="a-toggles">
            <Toggle checked={s.showWelcome} onChange={(v) => set({ showWelcome: v })} label="Welcome screen" hint="Full-screen intro" />
            <Toggle checked={s.showCategories} onChange={(v) => set({ showCategories: v })} label="Category shortcuts" hint="Buttons above the dishes" />
            <Toggle checked={s.showStory} onChange={(v) => set({ showStory: v })} label="Our story section" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------- Data */

function DataPanel({ data }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const stats = [
    { label: 'Sections', value: data.sections.length },
    { label: 'Items', value: data.items.length },
    { label: 'Custom photos', value: [...data.items, ...data.sections].filter((entry) => entry.image).length },
  ]

  const download = () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `menu-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded.')
    setError('')
  }

  const importFile = async (file) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
        throw new Error('That file does not look like a menu backup.')
      }
      store.replaceAll(parsed)
      setMessage(`Imported ${parsed.items.length} items.`)
      setError('')
    } catch (err) {
      setError(err.message || 'Could not read that file.')
      setMessage('')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="a-panel">
      <div className="a-panel-head">
        <div>
          <h2>Data</h2>
          <p>Your menu is saved in this browser. Export a backup before big changes.</p>
        </div>
      </div>

      <div className="a-stats">
        {stats.map((stat) => <div key={stat.label}><b>{stat.value}</b><small>{stat.label}</small></div>)}
      </div>

      <div className="a-card a-card--pad">
        <h4>Backup & restore</h4>
        <p>An export contains everything: sections, items, wording and uploaded photos.</p>
        <div className="a-row-actions">
          <button className="a-btn a-btn--primary" onClick={download}><Download size={15} /> Export JSON</button>
          <button className="a-btn a-btn--ghost" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import JSON</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importFile(e.target.files?.[0])} />
        </div>
        {message && <p className="a-success">{message}</p>}
        {error && <p className="a-error">{error}</p>}
      </div>

      <div className="a-card a-card--pad a-card--danger">
        <h4>Reset the menu</h4>
        <p>Replaces everything with the original demo menu. Export a backup first — this can still be undone with ⌘Z while you stay on this page.</p>
        <ConfirmButton
          label="Reset everything"
          className="a-btn a-btn--danger"
          onConfirm={() => store.resetToDefaults()}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- Wording */

/**
 * One built-in string, in both languages. The input shows the override; the
 * placeholder shows the wording the site falls back to, so emptying a field is
 * how you undo a change.
 */
function WordingRow({ field, overrides }) {
  const long = isLongText(copy.en[field.key]) || isLongText(copy.ar[field.key])

  const input = (language, dir) => {
    const value = overrides[language]?.[field.key] ?? ''
    const props = {
      value,
      dir,
      lang: language,
      placeholder: copy[language][field.key],
      onChange: (event) => store.updateText(language, field.key, event.target.value),
    }
    return long ? <textarea rows="2" {...props} /> : <input {...props} />
  }

  const changed = Boolean(overrides.en?.[field.key] || overrides.ar?.[field.key])

  return (
    <div className={`a-word ${changed ? 'a-word--changed' : ''}`}>
      <span className="a-word-label">
        {field.label}
        {field.hint && <em>{field.hint}</em>}
      </span>
      <div className="a-word-inputs">
        <label><span>English</span>{input('en', 'ltr')}</label>
        <label><span>العربية</span>{input('ar', 'rtl')}</label>
      </div>
      {changed && (
        <button
          className="a-word-reset"
          title="Restore the built-in wording"
          onClick={() => { store.updateText('en', field.key, ''); store.updateText('ar', field.key, '') }}
        >
          <RotateCcw size={12} /> Reset
        </button>
      )}
    </div>
  )
}

function WordingPanel({ data }) {
  const [query, setQuery] = useState('')
  const overrides = data.settings.text || { en: {}, ar: {} }
  const changedCount = new Set([...Object.keys(overrides.en || {}), ...Object.keys(overrides.ar || {})]).size

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return wordingGroups
    return wordingGroups
      .map((group) => ({
        ...group,
        fields: group.fields.filter((field) =>
          [field.label, field.key, copy.en[field.key], copy.ar[field.key], overrides.en?.[field.key], overrides.ar?.[field.key]]
            .join(' ')
            .toLowerCase()
            .includes(q),
        ),
      }))
      .filter((group) => group.fields.length)
  }, [query, overrides])

  return (
    <div className="a-panel">
      <div className="a-panel-head">
        <div>
          <h2>Wording</h2>
          <p>Every fixed word on the site, in both languages. Leave a field empty to keep the built-in wording.</p>
        </div>
        {changedCount > 0 && (
          <ConfirmButton
            label={`Reset all ${changedCount}`}
            title="Reset every changed word"
            className="a-btn a-btn--ghost"
            onConfirm={() => store.resetText()}
          />
        )}
      </div>

      <div className="a-search">
        <Search size={15} />
        <input value={query} placeholder="Search the wording…" onChange={(event) => setQuery(event.target.value)} />
      </div>

      {groups.map((group) => (
        <div className="a-group" key={group.title}>
          <h3>{group.title} <em>{group.hint}</em></h3>
          <div className="a-card a-words">
            {group.fields.map((field) => <WordingRow key={field.key} field={field} overrides={overrides} />)}
          </div>
        </div>
      ))}

      {!groups.length && <p className="a-hint">Nothing matches “{query}”.</p>}
    </div>
  )
}

/* --------------------------------------------------------------------- Shell */

export default function AdminApp() {
  const data = useMenuData()
  const status = useStoreStatus()
  const [tab, setTab] = useState('sections')
  const [navOpen, setNavOpen] = useState(false)

  const Panel = { sections: SectionsPanel, items: ItemsPanel, content: ContentPanel, wording: WordingPanel, data: DataPanel }[tab]

  const counts = {
    sections: data.sections.length,
    items: data.items.length,
  }

  return (
    <div className="a-shell" onKeyDown={(event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) store.redo()
        else store.undo()
      }
    }}>
      <header className="a-topbar">
        <button className="a-nav-toggle" onClick={() => setNavOpen((v) => !v)} aria-label="Toggle navigation"><LayoutGrid size={18} /></button>
        <div className="a-brand">
          <span className="a-brand-mark"><Store size={17} /></span>
          <span><b>Menu manager</b><small>{data.settings.brandName}</small></span>
        </div>
        <div className="a-topbar-actions">
          <SavedPulse savedAt={status.savedAt} />
          <button className="a-icon-btn" onClick={() => store.undo()} disabled={!status.canUndo} title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
          <button className="a-icon-btn" onClick={() => store.redo()} disabled={!status.canRedo} title="Redo (Ctrl+Shift+Z)"><Redo2 size={16} /></button>
          <a className="a-btn a-btn--ghost a-view-site" href="#/" target="_self"><ExternalLink size={14} /> <span>View site</span></a>
        </div>
      </header>

      {status.error && (
        <div className="a-banner"><AlertTriangle size={15} /> {status.error}</div>
      )}

      <div className="a-body">
        <nav className={`a-side ${navOpen ? 'a-side--open' : ''}`}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => { setTab(id); setNavOpen(false) }}
            >
              <Icon size={17} /> <span>{label}</span>
              {counts[id] !== undefined && <em>{counts[id]}</em>}
            </button>
          ))}
          <div className="a-side-foot">
            <RotateCcw size={13} />
            <span>Changes save automatically and appear on the site right away.</span>
          </div>
        </nav>

        <main className="a-main">
          <Panel data={data} />
        </main>
      </div>
    </div>
  )
}
