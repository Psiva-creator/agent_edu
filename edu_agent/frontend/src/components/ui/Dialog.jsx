import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './Dialog.css'

export default function Dialog({ open, onClose, title, children, className }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="dialog-overlay" onClick={onClose}>
          <motion.div
            ref={dialogRef}
            className={`dialog ${className || ''}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {title && (
              <div className="dialog__header">
                <h2 className="dialog__title">{title}</h2>
                <button className="dialog__close" onClick={onClose} aria-label="Close dialog">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="dialog__body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
