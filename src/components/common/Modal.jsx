import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} style={{ background:'var(--overlay-bg)', backdropFilter:'blur(6px)' }}>
      <div className={`w-full ${maxWidth} rounded-2xl animate-scale-in`} onClick={e => e.stopPropagation()}
        style={{ background:'var(--card)', border:'1px solid var(--border)', boxShadow:'var(--dropdown-shadow)' }}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize:'15px', fontWeight:600, color:'var(--t1)', letterSpacing:'-0.01em' }}>{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg transition-colors" style={{ color:'var(--t5)' }}><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
