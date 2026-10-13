import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { register, clearError } from '../../redux/slices/authSlice';
import { Building2, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'worker', phone: '', company_name: '' });
  const [showPass, setShowPass] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    dispatch(clearError());
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) toast.success('Account created!');
    else toast.error(result.payload || 'Registration failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh p-6" style={{ background: '#FAFAF8' }}>
      <div className="w-full max-w-lg animate-slide-up">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)', boxShadow: '0 2px 12px rgba(13,148,136,0.25)' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#1C1917' }}>CITY CONSTRUCTIONS</h1>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#1C1917' }}>Create Account</h2>
          <p style={{ color: '#78756E', marginBottom: 24 }}>Join the construction management platform</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Full Name</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A8A49C' }} />
                  <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field pl-10" required id="register-name" />
                </div>
              </div>
              <div>
                <label className="label-text">Phone</label>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A8A49C' }} />
                  <input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field pl-10" id="register-phone" />
                </div>
              </div>
            </div>

            <div>
              <label className="label-text">Email Address</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A8A49C' }} />
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field pl-10" required id="register-email" />
              </div>
            </div>

            <div>
              <label className="label-text">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="select-field" id="register-role">
                <option value="admin">Admin / Company Owner</option>
                <option value="project_manager">Project Manager</option>
                <option value="engineer">Engineer</option>
                <option value="supervisor">Supervisor</option>
                <option value="worker">Worker</option>
              </select>
            </div>

            {form.role === 'admin' && (
              <div className="animate-slide-down">
                <label className="label-text">Company Name</label>
                <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A8A49C' }} />
                  <input type="text" placeholder="Company name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="input-field pl-10" required id="register-company" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A8A49C' }} />
                  <input type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field pl-10" required minLength={6} id="register-password" />
                </div>
              </div>
              <div>
                <label className="label-text">Confirm Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A8A49C' }} />
                  <input type={showPass ? 'text' : 'password'} placeholder="Confirm" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input-field pl-10" required id="register-confirm" />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPass}
                onChange={(e) => setShowPass(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#0D9488' }}
                id="register-show-password"
              />
              <span className="text-sm transition-colors" style={{ color: '#78756E' }}>
                {showPass ? 'Hide' : 'Show'} passwords
              </span>
            </label>

            {error && <p className="text-sm p-3 rounded-xl" style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA' }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3" id="register-submit">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#78756E' }}>
            Already have an account? <Link to="/login" style={{ color: '#0D9488', fontWeight: 600 }} className="hover:text-teal-700 transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
