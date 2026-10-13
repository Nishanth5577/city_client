export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const s = { sm: 16, md: 24, lg: 36 };
  const d = s[size] || s.md;
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div style={{ width: d, height: d, position: 'relative' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid var(--border)' }} />
        <div className="animate-spin" style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#0D9488' }} />
      </div>
      {fullScreen && <p style={{ fontSize:'12px', color:'var(--t5)', letterSpacing:'0.01em' }} className="animate-pulse">Loading...</p>}
    </div>
  );
  if (fullScreen) return <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background:'var(--overlay-bg)', backdropFilter:'blur(8px)' }}>{spinner}</div>;
  return <div className="flex items-center justify-center py-12">{spinner}</div>;
}
