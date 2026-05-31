import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomSheet({ open, onClose, title, children, height = 'auto' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, backdropFilter: 'blur(2px)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
              background: 'var(--bg-surface)',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>

            {/* Title */}
            {title && (
              <div style={{ padding: '0 20px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
              </div>
            )}

            {/* Content — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
