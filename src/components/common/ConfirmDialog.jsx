import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Are you sure?', message = '', confirmLabel = 'Confirm', danger = false }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} style={{ background:'var(--overlay-bg)', backdropFilter:'blur(6px)' }}>
      <div className="w-full max-w-sm p-6 rounded-2xl text-center animate-scale-in" onClick={e => e.stopPropagation()}
        style={{ background:'var(--card)', border:'1px solid var(--border)', boxShadow:'var(--dropdown-shadow)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{
          background: danger ? '#FEF2F2' : '#FFFBEB',
          border: `1px solid ${danger ? '#FECACA' : '#FEF3C7'}`,
        }}>
          <AlertTriangle className="w-6 h-6" style={{ color: danger ? '#DC2626' : '#D97706' }} />
        </div>
        <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--t1)', marginBottom:6, letterSpacing:'-0.01em' }}>{title}</h3>
        {message && <p style={{ fontSize:'13px', color:'var(--t4)', marginBottom:20, lineHeight:1.5 }}>{message}</p>}
        <div className="flex gap-2.5 justify-center">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
