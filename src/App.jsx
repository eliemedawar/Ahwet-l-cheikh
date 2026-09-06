import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, ChevronDown, Coffee, Flame, Grid2X2, Info, Leaf, MapPin, Search, UtensilsCrossed, WheatOff, X } from 'lucide-react'
import { defaultData, SHARED_IMAGE } from './data/defaults'
import { selectMenu, useMenuData } from './lib/store'
import { copy, dishText, readVisit, saveVisit, sectionText, settingText } from './lib/guest'

const Guest = createContext(null)
const useGuest = () => useContext(Guest)
const photographIds = new Set(defaultData.items.map(item => item.id))
const photoFor = item => item.image || (photographIds.has(item.id) ? `/assets/dishes/${item.id}.webp` : SHARED_IMAGE)
const motion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'

function Brand({ settings, onClick }) {
  return <a className="house-brand" href="#menu" onClick={onClick} aria-label={`${settings.brandName} — menu`}><img src="/assets/brand-small.webp" width="100" height="62" alt={settings.arabicName} /><span>{settings.brandName}<small>BEIRUT · {settings.storyYear}</small></span></a>
}

function FoodImage({ item, priority = false, className = '' }) {
  const { t } = useGuest()
  const [failed, setFailed] = useState(false)
  const src = photoFor(item)
  useEffect(() => setFailed(false), [src])
  return <div className={`dish-photo ${className} ${failed ? 'dish-photo--missing' : ''}`}>
    {failed ? <span><UtensilsCrossed size={28} strokeWidth={1} /><small>{t.imageMissing}</small></span> : <img src={src} alt={item.title} width="800" height="800" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => setFailed(true)} />}
  </div>
}

function DietBadges({ item }) {
  const { t } = useGuest()
  return <span className="diet-badges">{(item.vegan || item.vegetarian) && <span><Leaf size={13} />{item.vegan ? t.vegan : t.veg}</span>}{item.glutenFree && <span><WheatOff size={13} />{t.gf}</span>}{item.spicy && <span><Flame size={13} />{t.spicy}</span>}</span>
}

function Sheet({ title, children, onClose, className = '', labelId = 'sheet-title' }) {
  const { t } = useGuest()
  const ref = useRef(null)
  const start = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const node = ref.current
    const frame = requestAnimationFrame(() => node?.querySelector('[data-close]')?.focus({ preventScroll: true }))
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const items = [...node.querySelectorAll('button:not([disabled]), a[href], input, [tabindex="0"]')].filter(el => el.getClientRects().length)
      if (!items.length) { event.preventDefault(); return }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus() }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', onKey); requestAnimationFrame(() => previous?.isConnected && previous.focus({ preventScroll: true })) }
  }, [onClose])
  return <div className="sheet-backdrop" onClick={event => event.target === event.currentTarget && onClose()}><section ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelId} className={`house-sheet ${className}`}>
    <div className="sheet-handle" aria-hidden="true" onTouchStart={event => { start.current = event.touches[0].clientY }} onTouchEnd={event => { if (start.current !== null && event.changedTouches[0].clientY - start.current > 60) onClose(); start.current = null }}><span /></div>
    <header className="sheet-heading"><h2 id={labelId}>{title}</h2><button data-close className="round-button" onClick={onClose} aria-label={t.close}><X size={21} /></button></header>{children}
  </section></div>
}

function Welcome({ settings, onEnter, language, setLanguage }) {
  const { t } = useGuest()
  const [leaving, setLeaving] = useState(false)
  const button = useRef(null)
  const timer = useRef(null)
  useEffect(() => { button.current?.focus({ preventScroll: true }); return () => clearTimeout(timer.current) }, [])
  const enter = () => { if (leaving) return; setLeaving(true); timer.current = setTimeout(onEnter, motion() === 'instant' ? 0 : 460) }
  return <section className={`arrival ${leaving ? 'arrival--leaving' : ''}`} aria-labelledby="arrival-title">
    <img className="arrival-background" src="/assets/welcome-cafe.webp" alt="" fetchPriority="high" />
    <div className="arrival-top"><span><MapPin size={14} />{settingText(settings, 'branch', language)}</span><button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} lang={language === 'en' ? 'ar' : 'en'}>{language === 'en' ? 'العربية' : 'English'}</button></div>
    <div className="arrival-mark"><img src="/assets/brand-large.webp" alt={settings.arabicName} width="480" height="340" /><span>{settings.brandName}</span></div>
    <div className="arrival-copy"><span className="overline">{settingText(settings, 'welcomeSince', language)}</span><h1 id="arrival-title">{t.welcome}<br /><em>{t.warmth}</em></h1><p>{t.welcomeText}</p><button ref={button} className="gold-button" onClick={enter} disabled={leaving}>{language === 'en' ? settings.welcomeCta : t.enter}<ArrowUpRight size={20} /></button><small>{t.signature}</small></div>
  </section>
}

function DishCard({ item, featured, onOpen, money }) {
  const { language, t } = useGuest()
  const text = dishText(item, language)
  return <article className={`dish-card ${featured ? 'dish-card--featured' : ''} ${item.available === false ? 'dish-card--unavailable' : ''}`}>
    <button className="dish-open-button" aria-label={`${t.details} ${text.title}`} onClick={() => onOpen(item)}><FoodImage item={item} priority={featured} /><span className="dish-card-copy">
      {featured && <span className="overline featured-label"><span className="tiny-diamond" />{t.favourite}</span>}
      <span className="dish-name">{text.title}</span>{text.secondary && <span className="dish-secondary" lang={language === 'en' ? 'ar' : 'en'}>{text.secondary}</span>}
      {text.description && <span className="dish-description">{text.description}</span>}<DietBadges item={item} /><span className="dish-price" dir="ltr">{money(item.price)}</span>
      {item.available === false && <span className="availability">{t.unavailable}</span>}{featured && <span className="featured-explore">{language === 'en' ? 'Meet your next favourite' : 'اكتشف طبقك المفضّل'}<ArrowUpRight size={17} /></span>}
    </span></button>
  </article>
}

function DishDetails({ item, section, money, onClose }) {
  const { language, t } = useGuest()
  const text = dishText(item, language)
  return <Sheet title={text.title} onClose={onClose} className="dish-sheet"><FoodImage item={item} priority /><div className="dish-sheet-content">
    <span className="overline">{section && sectionText(section, language).name}</span><div className="detail-title"><h3>{text.title}</h3><strong dir="ltr">{money(item.price)}</strong></div>
    {text.secondary && <p className="detail-secondary" lang={language === 'en' ? 'ar' : 'en'}>{text.secondary}</p>}<DietBadges item={item} /><p className="detail-description">{text.description}</p>
    {item.ingredients && <p className="detail-description">{item.ingredients}</p>}{item.portion && <p className="detail-description">{item.portion}</p>}
    <div className="service-note"><UtensilsCrossed size={20} strokeWidth={1.4} /><p>{item.available === false ? t.unavailable : t.service}<small>{item.available === false ? t.availableHelp : t.serviceText}</small></p></div>
    <button className="outline-button" onClick={onClose}>{t.return}<ArrowRight size={17} /></button>
  </div></Sheet>
}

export default function App() {
  const data = useMenuData()
  const { settings } = data
  const { sections, items } = useMemo(() => selectMenu(data), [data])
  const [language, setLanguage] = useState(() => readVisit('language', 'en') === 'ar' ? 'ar' : 'en')
  const t = copy[language]
  const [welcome, setWelcome] = useState(() => settings.showWelcome !== false && !window.location.hash)
  const [overlay, setOverlay] = useState(null)
  const overlayRef = useRef(null)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('all')
  const [storyExpanded, setStoryExpanded] = useState(false)
  const categoryRef = useRef(null)
  const restored = useRef(false)
  const money = useCallback(value => `${settings.currency || '$'}${Number(value || 0).toFixed(2)}`, [settings.currency])
  const filtered = useMemo(() => { const query = search.toLocaleLowerCase().trim(); return query ? items.filter(item => `${item.title} ${item.arabic} ${item.description} ${dishText(item, language).description}`.toLocaleLowerCase().includes(query)) : items }, [items, search, language])
  const featured = items.find(item => item.featured && item.available !== false) || items.find(item => item.available !== false)
  const presentSections = sections.filter(section => filtered.some(item => item.sectionId === section.id))
  const context = useMemo(() => ({ language, t }), [language, t])

  useEffect(() => { saveVisit('language', language); document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; return () => { document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr' } }, [language])
  useEffect(() => {
    const pop = () => { overlayRef.current = null; setOverlay(null) }
    if (history.state?.kcSheet) history.replaceState(null, '')
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  useEffect(() => { document.body.classList.toggle('no-scroll', Boolean(overlay || welcome)); return () => document.body.classList.remove('no-scroll') }, [overlay, welcome])
  useLayoutEffect(() => { if (welcome || restored.current) return; restored.current = true; const scroll = Number(readVisit('scroll', 0)) || 0; if (!window.location.hash) window.scrollTo({ top: scroll, behavior: 'instant' }) }, [welcome])
  useLayoutEffect(() => { if (!welcome) document.getElementById('menu-title')?.focus({ preventScroll: true }) }, [welcome])
  useEffect(() => {
    if (welcome) return
    let frame = 0
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { if (!overlayRef.current) saveVisit('scroll', window.scrollY); const current = [...document.querySelectorAll('.menu-chapter')].filter(chapter => chapter.getBoundingClientRect().top <= 180).at(-1); setActive(current?.dataset.section || 'all') }) }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll) }
  }, [welcome, filtered])
  useEffect(() => {
    const button = categoryRef.current?.querySelector(`[data-category="${CSS.escape(active)}"]`)
    if (!button) return
    const rail = categoryRef.current, box = button.getBoundingClientRect(), parent = rail.getBoundingClientRect()
    if (box.left < parent.left || box.right > parent.right) rail.scrollBy({ left: box.left - parent.left - (parent.width - box.width) / 2, behavior: motion() })
  }, [active, language])

  const openOverlay = useCallback(value => { if (!overlayRef.current) history.pushState({ kcSheet: true }, ''); overlayRef.current = value; setOverlay(value) }, [])
  const closeOverlay = useCallback(() => { if (!overlayRef.current) return; overlayRef.current = null; setOverlay(null); if (history.state?.kcSheet) history.back() }, [])
  const enter = () => { saveVisit('scroll', 0); setWelcome(false) }
  const goTo = id => { closeOverlay(); setSearch(''); requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(id === 'all' ? 'menu' : id === 'story' ? 'story' : `chapter-${id}`)?.scrollIntoView({ block: 'start', behavior: motion() }))) }

  return <Guest.Provider value={context}><div className="dining-app" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    {welcome ? <Welcome settings={settings} onEnter={enter} language={language} setLanguage={setLanguage} /> : <><div inert={overlay ? true : undefined}>
      <a className="skip-link" href="#menu-title">{t.menu}</a>
      <header className="dining-header"><div className="dining-container header-layout"><Brand settings={settings} onClick={event => { event.preventDefault(); goTo('all') }} /><div className="header-controls"><button className="language-button" lang={language === 'en' ? 'ar' : 'en'} onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>{language === 'en' ? 'ع' : 'EN'}<span className="sr-only">{language === 'en' ? 'العربية' : 'English'}</span></button><button className="round-button" onClick={() => openOverlay({ type: 'info' })} aria-label={t.info}><Info size={21} strokeWidth={1.5} /></button></div></div></header>
      <main><section className="menu-section" id="menu" aria-labelledby="menu-title">
        <div className="dining-container menu-introduction"><div className="intro-topline"><span className="overline">{t.dine}</span><span className="intro-location">{settingText(settings, 'branch', language)}</span></div><h1 id="menu-title" tabIndex={-1}>{settingText(settings, 'menuTitle', language)}</h1><p>{t.intro}</p><span className="intro-flourish" aria-hidden="true">✧</span></div>
        <div className="category-bar"><div className="dining-container category-bar-inner"><nav ref={categoryRef} className="category-rail" aria-label={t.categories}><button data-category="all" aria-current={active === 'all' ? 'true' : undefined} onClick={() => goTo('all')}>{t.all}</button>{sections.map(section => <button key={section.id} data-category={section.id} aria-current={active === section.id ? 'true' : undefined} onClick={() => goTo(section.id)}>{sectionText(section, language).name}</button>)}</nav><button className="category-browser" aria-label={t.categories} onClick={() => openOverlay({ type: 'categories' })}><Grid2X2 size={19} strokeWidth={1.5} /></button></div></div>
        <div className="dining-container menu-content">
          {search && <div className="search-summary"><span role="status">{filtered.length} {t.results}: “{search}”</span><button className="round-button" aria-label={t.clear} onClick={() => setSearch('')}><X size={18} /></button></div>}
          {settings.showCategories && !search && <div className="category-overview">{sections.map(section => <button key={section.id} onClick={() => goTo(section.id)}><span>{sectionText(section, language).name}</span><ArrowUpRight size={17} /></button>)}</div>}
          {presentSections.length ? presentSections.map(section => <section className="menu-chapter" id={`chapter-${section.id}`} data-section={section.id} key={section.id} aria-labelledby={`title-${section.id}`}><div className="chapter-title"><span className="chapter-index">{String(sections.indexOf(section) + 1).padStart(2, '0')}</span><h2 id={`title-${section.id}`}>{sectionText(section, language).name}</h2><span className="chapter-line" /><small>{sectionText(section, language).eyebrow}</small></div><div className="dish-grid">{filtered.filter(item => item.sectionId === section.id).map(item => <DishCard key={item.id} item={item} featured={item.id === featured?.id && !search} money={money} onOpen={dish => openOverlay({ type: 'dish', id: dish.id })} />)}</div></section>) : <div className="empty-menu"><Coffee size={32} strokeWidth={1} /><h2>{search ? t.noResults : t.nothing}</h2><p>{search ? t.tryAgain : t.preparing}</p>{search && <button className="outline-button" onClick={() => setSearch('')}>{t.browse}</button>}</div>}
          <button className="allergy-note" onClick={() => openOverlay({ type: 'info' })}><Leaf size={18} strokeWidth={1.4} /><span>{t.allergy}<small>{t.allergyText}</small></span><ArrowUpRight size={18} /></button>
        </div>
      </section>
      {settings.showStory && <section className="house-story" id="story"><div className="dining-container story-layout"><div className="story-photograph"><img src="/assets/hospitality.webp" width="800" height="1000" loading="lazy" alt={language === 'en' ? 'Coffee poured slowly, a moment of Lebanese hospitality' : 'قهوة تُسكب على مهل، لحظة ضيافة لبنانية'} /><span className="story-photo-caption">{settingText(settings, 'welcomeSince', language)}<span>BEIRUT</span></span></div><div className="story-editorial"><span className="overline">{t.discover}</span><h2>{settingText(settings, 'storyTitle', language).split('\n').map((line, index) => <span key={line}>{index > 0 ? <em>{line}</em> : line}</span>)}</h2><p className={storyExpanded ? '' : 'story-excerpt'}>{settingText(settings, 'storyText', language)}</p><button className="text-link" aria-expanded={storyExpanded} onClick={() => setStoryExpanded(!storyExpanded)}>{storyExpanded ? t.less : t.read}<ChevronDown size={16} className={storyExpanded ? 'rotated' : ''} /></button><span className="story-signature" lang="ar">{settings.footerNote}</span></div></div></section>}
      </main>
      <footer className="dining-footer"><div className="dining-container footer-layout"><Brand settings={settings} onClick={event => { event.preventDefault(); goTo('all') }} /><p>{settingText(settings, 'branch', language)}<br />{settingText(settings, 'hours', language)}</p><button className="text-link" onClick={() => goTo('all')}>{t.return}<ArrowUpRight size={17} /></button><small>© {new Date().getFullYear()} {settings.brandName}<span>{t.signature}</span></small></div></footer>
    </div>
    {overlay?.type === 'dish' && (() => { const item = items.find(item => item.id === overlay.id); return item ? <DishDetails item={item} section={sections.find(section => section.id === item.sectionId)} money={money} onClose={closeOverlay} /> : <Sheet title={t.unavailable} onClose={closeOverlay}><p className="sheet-padding">{t.availableHelp}</p></Sheet> })()}
    {overlay?.type === 'categories' && <Sheet title={t.menu} onClose={closeOverlay} className="categories-sheet"><div className="sheet-padding"><form className="menu-search" onSubmit={event => { event.preventDefault(); closeOverlay(); requestAnimationFrame(() => document.getElementById('menu')?.scrollIntoView({ behavior: motion() })) }}><Search size={19} /><input aria-label={t.search} placeholder={t.search} value={search} onChange={event => setSearch(event.target.value)} type="search" enterKeyHint="search" /><button type="submit" className="round-button" aria-label={t.search}><ArrowRight size={19} /></button></form>{search && <button className="search-preview" onClick={closeOverlay}>{filtered.length} {t.results}<ArrowRight size={17} /></button>}<div className="category-directory"><button onClick={() => goTo('all')}><span className="directory-number">✧</span><span>{language === 'en' ? 'The whole menu' : 'القائمة كاملة'}</span><small>{items.length}</small><ArrowUpRight size={18} /></button>{sections.map((section, index) => <button key={section.id} onClick={() => goTo(section.id)}><span className="directory-number">{String(index + 1).padStart(2, '0')}</span><span>{sectionText(section, language).name}<small>{sectionText(section, language).eyebrow}</small></span><small>{items.filter(item => item.sectionId === section.id).length}</small><ArrowUpRight size={18} /></button>)}</div></div></Sheet>}
    {overlay?.type === 'info' && <Sheet title={t.info} onClose={closeOverlay}><div className="sheet-padding visit-information"><Brand settings={settings} onClick={event => { event.preventDefault(); goTo('all') }} /><div><MapPin size={20} /><p><span className="overline">{t.location}</span>{settingText(settings, 'branch', language)}<small>{settingText(settings, 'hours', language)}</small></p></div><div><UtensilsCrossed size={20} /><p>{t.service}<small>{t.serviceText}</small></p></div><div><Leaf size={20} /><p>{t.allergy}<small>{settingText(settings, 'menuNote', language) || t.allergyText}</small></p></div>{settings.showStory && <button className="outline-button" onClick={() => goTo('story')}>{t.story}<ArrowUpRight size={18} /></button>}</div></Sheet>}
    </>}
  </div></Guest.Provider>
}
