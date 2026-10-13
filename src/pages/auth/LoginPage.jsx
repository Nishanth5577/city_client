import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { login, clearError } from '../../redux/slices/authSlice';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault(); dispatch(clearError());
    const r = await dispatch(login(form));
    if (login.fulfilled.match(r)) toast.success('Welcome back'); else toast.error(r.payload || 'Login failed');
  };

  return (
    <div className="min-h-[100dvh] flex" style={{ background: 'var(--canvas)' }}>
      {/* Left — Branding panel (warm teal gradient) */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0F766E 0%, #0D9488 40%, #14B8A6 100%)' }}>
        {/* Mesh gradient accents */}
        <div className="absolute top-0 left-0 w-[500px] h-[400px] rounded-full blur-[160px]" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full blur-[140px]" style={{ background: 'rgba(124,58,237,0.10)' }} />

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Top edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />

        <div className="relative z-10 flex flex-col justify-between py-12 px-12 xl:px-16 h-full w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Building2 className="w-[18px] h-[18px] text-white" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>City Constructions</span>
          </div>

          <div>
            <h1 style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.045em', color: '#fff', marginBottom: 16 }}>
              Manage your<br />projects with<br /><span style={{ color: 'rgba(255,255,255,0.7)' }}>confidence.</span>
            </h1>
            <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', maxWidth: 380 }}>
              A unified platform for construction project management — from blueprint to handover.
            </p>
          </div>

          <div className="flex gap-10">
            {[['10+','Projects completed'],['₹20Cr+','Value tracked'],['20yr+','Experience']].map(([v,l]) => (
              <div key={l}>
                <p className="font-mono" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
                  {v}
                </p>
                <p style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: '0.01em' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form (adapts to dark mode) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[380px] animate-fade-in-up">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)' }}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontSize:'14px', fontWeight:700, color:'var(--t1)', letterSpacing: '-0.01em' }}>City Constructions</span>
          </div>

          <h2 style={{ fontSize:'24px', fontWeight:700, color:'var(--t1)', letterSpacing:'-0.03em', marginBottom:4 }}>Welcome back</h2>
          <p style={{ fontSize:'14px', color:'var(--t4)', marginBottom:32 }}>Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:18 }}>
              <label className="label-text">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color:'var(--t5)' }} />
                <input type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} className="input-field" style={{ paddingLeft:36 }} required id="login-email" />
              </div>
            </div>
            <div style={{ marginBottom:18 }}>
              <label className="label-text">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color:'var(--t5)' }} />
                <input type={showPass?'text':'password'} placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password:e.target.value})} className="input-field" style={{ paddingLeft:36, paddingRight:36 }} required id="login-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity" style={{ color:'var(--t5)' }}>
                  {showPass ? <EyeOff className="w-[14px] h-[14px]" /> : <Eye className="w-[14px] h-[14px]" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between" style={{ marginBottom:20 }}>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded" style={{ accentColor:'var(--accent)' }} />
                <span style={{ fontSize:'12px', color:'var(--t4)' }}>Remember me</span>
              </label>
              <Link to="/forgot-password" style={{ fontSize:'12px', fontWeight:600, color:'var(--accent)' }} className="hover:text-teal-700 transition-colors">Forgot password?</Link>
            </div>
            {error && <p style={{ fontSize:'12px', color:'#F87171', padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:18 }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full" style={{ justifyContent:'center', padding:'11px 20px' }} id="login-submit">
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><span>Sign in</span><ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </form>

          <p className="text-center" style={{ fontSize:'13px', color:'var(--t4)', marginTop:28 }}>
            Don't have an account? <Link to="/register" style={{ fontWeight:600, color:'var(--accent)' }} className="hover:text-teal-700 transition-colors">Create one</Link>
          </p>

          <div style={{ marginTop:28, padding:'16px 18px', borderRadius:12, background:'var(--accent-wash)', border:'1px solid var(--border)' }}>
            <p className="font-mono" style={{ fontSize:'10px', fontWeight:600, color:'var(--accent)', marginBottom:10, letterSpacing:'0.06em', textTransform:'uppercase' }}>Quick Login</p>
            <div className="grid grid-cols-2 gap-2">
              {[['Admin','admin@cityconstructions.in'],['Manager','manager@cityconstructions.in'],['Engineer','engineer@cityconstructions.in'],['Supervisor','supervisor@cityconstructions.in'],['Worker','worker@cityconstructions.in']]
                .map(([role, email]) => (
                  <button key={role} onClick={() => setForm({ email, password: role.toLowerCase()+'123' })}
                    className="text-left cursor-pointer transition-all duration-200 px-2 py-1 rounded-md hover:bg-teal-100/50"
                    style={{ fontSize:'11px', fontWeight:500, color:'var(--accent-dark)' }}>
                    {role}
                  </button>
              ))}
            </div>
            <p className="font-mono" style={{ fontSize:'10px', color:'var(--t4)', marginTop:8 }}>Password: role + 123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
