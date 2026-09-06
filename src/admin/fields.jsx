import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ImageUp, Trash2, X } from 'lucide-react'
import { SHARED_IMAGE } from '../data/defaults'
import { approxSize, fileToDataUrl } from '../lib/image'
import { getIcon, iconNames } from '../lib/icons'

export function Field({ label, hint, children, wide = false }) {
  return (
    <label className={`a-field ${wide ? 'a-field--wide' : ''}`}>
      <span className="a-field-label">{label}{hint && <em>{hint}</em>}</span>
      {children}
    </label>
  )
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="a-toggle">
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
      <span className="a-toggle-track"><span className="a-toggle-thumb" /></span>
      <span className="a-toggle-copy"><b>{label}</b>{hint && <small>{hint}</small>}</span>
    </label>
  )
}

/** Delete button that asks for a second click instead of a browser dialog. */
export function ConfirmButton({ onConfirm, label = 'Delete', title = 'Delete', className = 'a-icon-btn a-icon-btn--danger' }) {
  const [armed, setArmed] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (armed) {
    return (
      <span className="a-confirm">
        <button
          className="a-confirm-yes"
          onClick={() => { window.clearTimeout(timer.current); setArmed(false); onConfirm() }}
        >
          {label}?
        </button>
        <button className="a-confirm-no" onClick={() => { window.clearTimeout(timer.current); setArmed(false) }} aria-label="Cancel">
          <X size={13} />
        </button>
      </span>
    )
  }

  return (
    <button
      className={className}
      title={title}
      aria-label={title}
      onClick={() => { setArmed(true); timer.current = window.setTimeout(() => setArmed(false), 4000) }}
    >
      <Trash2 size={15} />
    </button>
  )
}

export function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const Current = getIcon(value)
  return (
    <div className="a-icon-picker">
      <button type="button" className="a-icon-trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Current size={17} /> <span>{value || 'Choose'}</span> <ChevronDown size={14} />
      </button>
      {open && (
        <div className="a-icon-grid">
          {iconNames.map((name) => {
            const Icon = getIcon(name)
            return (
              <button
                type="button"
                key={name}
                className={name === value ? 'active' : ''}
                title={name}
                onClick={() => { onChange(name); setOpen(false) }}
              >
                <Icon size={17} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Picks the visible part of the shared photo by clicking it, or replaces it
 * with an uploaded image. Clicking sets the CSS object-position focal point.
 */
export function ImageField({ image, position, onChange, label = 'Image' }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const dataUrl = await fileToDataUrl(file)
      onChange({ image: dataUrl })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const pickFocus = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100)
    onChange({ position: `${x}% ${y}%` })
  }

  return (
    <div className="a-image-field">
      <span className="a-field-label">{label}{image && <em>{approxSize(image)} KB</em>}</span>

      {image ? (
        <div className="a-image-custom">
          <img src={image} alt="" />
          <div className="a-image-actions">
            <button className="a-btn a-btn--ghost" onClick={() => inputRef.current?.click()}>Replace</button>
            <button className="a-btn a-btn--ghost" onClick={() => onChange({ image: '' })}>Use shared photo</button>
          </div>
        </div>
      ) : (
        <>
          <div className="a-crop">
            <button type="button" className="a-crop-source" onClick={pickFocus} title="Click to set the focal point">
              <img src={SHARED_IMAGE} alt="Shared café photo" />
              <span className="a-crop-dot" style={{ left: position?.split(' ')[0] || '50%', top: position?.split(' ')[1] || '50%' }} />
            </button>
            <div className="a-crop-preview">
              <img src={SHARED_IMAGE} alt="" style={{ objectPosition: position || '50% 50%' }} />
              <small>Card preview</small>
            </div>
          </div>
          <div className="a-image-actions">
            <button className="a-btn a-btn--ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
              <ImageUp size={14} /> {busy ? 'Processing…' : 'Upload a photo'}
            </button>
            <code>{position || '50% 50%'}</code>
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {error && <p className="a-error">{error}</p>}
    </div>
  )
}

/**
 * HTML5 drag reordering for a list of ids. Returns props for a row, including a
 * `className` for drag state — pull that out and merge it with the row's own
 * classes rather than spreading it, or it will overwrite them.
 */
export function useDragList(ids, onReorder) {
  const [dragging, setDragging] = useState(null)
  const [over, setOver] = useState(null)

  const rowProps = (id) => ({
    draggable: true,
    onDragStart: (event) => {
      setDragging(id)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', id)
    },
    onDragEnd: () => { setDragging(null); setOver(null) },
    onDragOver: (event) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (id !== over) setOver(id)
    },
    onDragLeave: () => setOver((current) => (current === id ? null : current)),
    onDrop: (event) => {
      event.preventDefault()
      const from = dragging ?? event.dataTransfer.getData('text/plain')
      setDragging(null)
      setOver(null)
      if (!from || from === id) return
      const next = ids.filter((entry) => entry !== from)
      next.splice(ids.indexOf(id), 0, from)
      onReorder(next)
    },
    className: `${dragging === id ? 'is-dragging' : ''} ${over === id && dragging !== id ? 'is-over' : ''}`.trim(),
  })

  return rowProps
}

export function SavedPulse({ savedAt }) {
  const [visible, setVisible] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (!savedAt) return
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 1600)
    return () => window.clearTimeout(timer)
  }, [savedAt])

  return <span className={`a-saved ${visible ? 'a-saved--on' : ''}`}><Check size={13} /> Saved</span>
}
