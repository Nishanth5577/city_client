import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', description = '', action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background:'#F0FDFA', border:'1px solid #CCFBF1' }}>
        <Icon className="w-6 h-6" style={{ color:'#0D9488' }} strokeWidth={1.5} />
      </div>
      <p style={{ fontSize:'15px', fontWeight:600, color:'var(--t1)', marginBottom:6, letterSpacing:'-0.01em' }}>{title}</p>
      {description && <p style={{ fontSize:'13px', color:'var(--t4)', textAlign:'center', maxWidth:300, lineHeight:1.5 }}>{description}</p>}
      {action && <button onClick={action} className="btn-primary mt-5">{actionLabel || 'Get started'}</button>}
    </div>
  );
}
