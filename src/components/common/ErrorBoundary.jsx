import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="p-6 text-center max-w-md rounded-2xl" style={{ background:'var(--card)', border:'1px solid var(--border)', boxShadow:'var(--card-shadow)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background:'#FEF2F2', border:'1px solid #FECACA' }}>
              <AlertTriangle className="w-6 h-6" style={{ color:'#DC2626' }} />
            </div>
            <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--t1)', marginBottom:6, letterSpacing:'-0.01em' }}>Something went wrong</h3>
            <p style={{ fontSize:'13px', color:'var(--t4)', marginBottom:20, lineHeight:1.5 }}>{this.state.error?.message || 'Unexpected error'}</p>
            <button onClick={() => window.location.reload()} className="btn-primary"><RefreshCw className="w-3.5 h-3.5" /> Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
