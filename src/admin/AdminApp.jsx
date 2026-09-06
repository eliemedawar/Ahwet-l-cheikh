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
  Search,
  Settings2,
  Store,
  Type,
  Undo2,
  Upload,
  UtensilsCrossed,
} from 'lucide-react'
import { emptyItem, emptySection } from '../data/defaults'
import { getIcon } from '../lib/icons'
import { store, useMenuData, useStoreStatus } from '../lib/store'
import { ConfirmButton, Field, IconPicker, ImageField, SavedPulse, Toggle, useDragList } from './fields'
import './admin.css'

const TABS = [
  { id: 'sections', label: 'Sections', Icon: LayoutGrid },
  { id: 'items', label: 'Menu items', Icon: UtensilsCrossed },
  { id: 'content', label: 'Content', Icon: Type },
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
            <Field label="Subtitle" hint="shown on the card"><input value={section.eyebrow} onChange={(e) => store.updateSection(section.id, { eyebrow: e.target.value })} /></Field>
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

  return (
    <div className="a-panel">
      <div className="a-panel-head">
        <div>
          <h2>Content</h2>
          <p>Every piece of text and every toggle on the storefront.</p>
        </div>
      </div>

      {group('Café', 'name, branch, hours', <>
        <Field label="Café name"><input value={s.brandName} onChange={(e) => set({ brandName: e.target.value })} /></Field>
        <Field label="Arabic name"><input value={s.arabicName} dir="rtl" lang="ar" onChange={(e) => set({ arabicName: e.target.value })} /></Field>
        <Field label="Branch / address"><input value={s.branch} onChange={(e) => set({ branch: e.target.value })} /></Field>
        <Field label="Opening hours"><input value={s.hours} onChange={(e) => set({ hours: e.target.value })} /></Field>
        <Field label="Footer tagline" wide><textarea rows="2" value={s.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Field>
      </>)}

      {group('Menu details', 'currency display', <>
        <Field label="Currency symbol"><input value={s.currency} maxLength={4} onChange={(e) => set({ currency: e.target.value })} /></Field>
      </>)}

      {group('Welcome screen', 'the full-screen intro', <>
        <Field label="Tagline"><input value={s.welcomeTagline} onChange={(e) => set({ welcomeTagline: e.target.value })} /></Field>
        <Field label="Since line"><input value={s.welcomeSince} onChange={(e) => set({ welcomeSince: e.target.value })} /></Field>
        <Field label="Button label"><input value={s.welcomeCta} onChange={(e) => set({ welcomeCta: e.target.value })} /></Field>
      </>)}

      {group('Hero text', 'the first thing guests read', <>
        <Field label="Eyebrow" wide><input value={s.heroEyebrow} onChange={(e) => set({ heroEyebrow: e.target.value })} /></Field>
        <Field label="Headline line 1"><input value={s.heroTitle} onChange={(e) => set({ heroTitle: e.target.value })} /></Field>
        <Field label="Headline line 2" hint="shown in gold"><input value={s.heroTitleAccent} onChange={(e) => set({ heroTitleAccent: e.target.value })} /></Field>
        <Field label="Intro paragraph" wide><textarea rows="2" value={s.heroText} onChange={(e) => set({ heroText: e.target.value })} /></Field>
      </>)}

      {group('Hero buttons', 'the two calls to action', <>
        <Field label="Main button"><input value={s.heroPrimaryCta} onChange={(e) => set({ heroPrimaryCta: e.target.value })} /></Field>
        <Field label="Second button" hint="opens the featured dish"><input value={s.heroSecondaryCta} onChange={(e) => set({ heroSecondaryCta: e.target.value })} /></Field>
        <Field label="Second button icon"><IconPicker value={s.heroSecondaryIcon} onChange={(heroSecondaryIcon) => set({ heroSecondaryIcon })} /></Field>
      </>)}

      {group('Hero badge', 'the two circles and the line beside them', <>
        <Field label="Left circle" hint="a year — keep it short"><input value={s.heroAvatarYear} maxLength={6} onChange={(e) => set({ heroAvatarYear: e.target.value })} /></Field>
        <Field label="Right circle" hint="Arabic — keep it short"><input value={s.heroAvatarArabic} maxLength={8} dir="rtl" lang="ar" onChange={(e) => set({ heroAvatarArabic: e.target.value })} /></Field>
        <Field label="Badge title"><input value={s.heroProofTitle} onChange={(e) => set({ heroProofTitle: e.target.value })} /></Field>
        <Field label="Badge subtitle"><input value={s.heroProofText} onChange={(e) => set({ heroProofText: e.target.value })} /></Field>
      </>)}

      <div className="a-group">
        <h3>Hero photo <em>the big image beside the headline</em></h3>
        <div className="a-card">
          <ImageField
            label={s.heroImage ? 'Custom hero photo' : 'Shared photo crop'}
            image={s.heroImage}
            position={s.heroImagePosition}
            onChange={(patch) => set({
              ...(patch.image !== undefined ? { heroImage: patch.image } : {}),
              ...(patch.position !== undefined ? { heroImagePosition: patch.position } : {}),
            })}
          />
          {!s.heroImage && <p className="a-hint">Click the photo to choose which part shows, or upload your own image instead.</p>}
        </div>
      </div>

      {group('Floating dish card', 'the card over the hero photo', <>
        <Field label="Label"><input value={s.floatingCardLabel} onChange={(e) => set({ floatingCardLabel: e.target.value })} /></Field>
        <Field label="Icon"><IconPicker value={s.floatingCardIcon} onChange={(floatingCardIcon) => set({ floatingCardIcon })} /></Field>
        <Field label="Rating value"><input value={s.ratingValue} onChange={(e) => set({ ratingValue: e.target.value })} /></Field>
        <Field label="Rating label"><input value={s.ratingLabel} onChange={(e) => set({ ratingLabel: e.target.value })} /></Field>
      </>)}

      {group('Round seal', 'the circle at the corner of the photo', <>
        <Field label="Title"><input value={s.sealTitle} onChange={(e) => set({ sealTitle: e.target.value })} /></Field>
        <Field label="Subtitle"><input value={s.sealSubtitle} onChange={(e) => set({ sealSubtitle: e.target.value })} /></Field>
        <Field label="Icon"><IconPicker value={s.sealIcon} onChange={(sealIcon) => set({ sealIcon })} /></Field>
      </>)}

      {group('Section headings', 'category and menu blocks', <>
        <Field label="Categories eyebrow"><input value={s.categoryEyebrow} onChange={(e) => set({ categoryEyebrow: e.target.value })} /></Field>
        <Field label="Categories heading"><input value={s.categoryTitle} onChange={(e) => set({ categoryTitle: e.target.value })} /></Field>
        <Field label="Categories intro" wide><textarea rows="2" value={s.categoryText} onChange={(e) => set({ categoryText: e.target.value })} /></Field>
        <Field label="Menu eyebrow"><input value={s.menuEyebrow} onChange={(e) => set({ menuEyebrow: e.target.value })} /></Field>
        <Field label="Menu heading"><input value={s.menuTitle} onChange={(e) => set({ menuTitle: e.target.value })} /></Field>
        <Field label="Guest note" hint="allergy or service guidance" wide><textarea rows="2" value={s.menuNote || ''} onChange={(e) => set({ menuNote: e.target.value })} /></Field>
      </>)}

      {group('Our story', 'the about block', <>
        <Field label="Eyebrow"><input value={s.storyEyebrow} onChange={(e) => set({ storyEyebrow: e.target.value })} /></Field>
        <Field label="Year"><input value={s.storyYear} onChange={(e) => set({ storyYear: e.target.value })} /></Field>
        <Field label="Heading" hint="one line break allowed" wide><textarea rows="2" value={s.storyTitle} onChange={(e) => set({ storyTitle: e.target.value })} /></Field>
        <Field label="Paragraph" wide><textarea rows="4" value={s.storyText} onChange={(e) => set({ storyText: e.target.value })} /></Field>
      </>)}

      <div className="a-group">
        <h3>Story highlights <em>the three points beside the story</em></h3>
        <div className="a-list">
          {data.storyValues.map((value) => (
            <div className="a-row a-row--flat" key={value.id}>
              <div className="a-row-head">
                <IconPicker value={value.icon} onChange={(icon) => store.updateStoryValue(value.id, { icon })} />
                <input className="a-inline-input" value={value.title} onChange={(e) => store.updateStoryValue(value.id, { title: e.target.value })} />
                <input className="a-inline-input a-inline-input--muted" value={value.text} onChange={(e) => store.updateStoryValue(value.id, { text: e.target.value })} />
                <ConfirmButton onConfirm={() => store.removeStoryValue(value.id)} />
              </div>
            </div>
          ))}
        </div>
        <button className="a-btn a-btn--ghost" onClick={() => store.addStoryValue({ icon: 'Leaf', title: 'New highlight', text: 'Say something good' })}>
          <Plus size={14} /> Add highlight
        </button>
      </div>

      {group('Footer', '', <>
        <Field label="Arabic footer note"><input value={s.footerNote} dir="rtl" lang="ar" onChange={(e) => set({ footerNote: e.target.value })} /></Field>
        <Field label="Bottom line"><input value={s.footerLine} onChange={(e) => set({ footerLine: e.target.value })} /></Field>
      </>)}

      <div className="a-group">
        <h3>Show or hide <em>turn whole blocks on and off</em></h3>
        <div className="a-card">
          <div className="a-toggles">
            <Toggle checked={s.showWelcome} onChange={(v) => set({ showWelcome: v })} label="Welcome screen" hint="Full-screen intro" />
            <Toggle checked={s.showCategories} onChange={(v) => set({ showCategories: v })} label="Category cards" />
            <Toggle checked={s.showHeroButtons !== false} onChange={(v) => set({ showHeroButtons: v })} label="Hero buttons" />
            <Toggle checked={s.showHeroProof !== false} onChange={(v) => set({ showHeroProof: v })} label="Hero badge" hint="Circles + tagline" />
            <Toggle checked={s.showFloatingCard !== false} onChange={(v) => set({ showFloatingCard: v })} label="Floating dish card" />
            <Toggle checked={s.showRating} onChange={(v) => set({ showRating: v })} label="Rating badge" />
            <Toggle checked={s.showSeal !== false} onChange={(v) => set({ showSeal: v })} label="Round seal" hint="Fresh / Daily" />
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

/* --------------------------------------------------------------------- Shell */

export default function AdminApp() {
  const data = useMenuData()
  const status = useStoreStatus()
  const [tab, setTab] = useState('sections')
  const [navOpen, setNavOpen] = useState(false)

  const Panel = { sections: SectionsPanel, items: ItemsPanel, content: ContentPanel, data: DataPanel }[tab]

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
