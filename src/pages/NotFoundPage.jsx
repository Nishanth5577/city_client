import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4" style={{ background:'var(--canvas)' }}>
      <div className="text-center max-w-sm animate-fade-in-up">
        <p className="font-mono" style={{ fontSize:'80px', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1 }}>
          <span style={{ background:'linear-gradient(135deg, #0D9488, #14B8A6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>404</span>
        </p>
        <h1 style={{ fontSize:'18px', fontWeight:600, color:'var(--t1)', marginTop:12, marginBottom:6, letterSpacing:'-0.01em' }}>Page not found</h1>
        <p style={{ fontSize:'14px', color:'var(--t4)', marginBottom:28, lineHeight:1.5 }}>This page doesn't exist or has been moved.</p>
        <div className="flex gap-2.5 justify-center">
          <Link to="/" className="btn-primary"><Home className="w-3.5 h-3.5" /> Dashboard</Link>
          <button onClick={() => window.history.back()} className="btn-secondary"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
        </div>
      </div>
    </div>
  );
}
