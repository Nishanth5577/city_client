import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { login, clearError } from '../../redux/slices/authSlice';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back!');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex gradient-mesh bg-surface-50 dark:bg-surface-950">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-surface-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent-500 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-400 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-8 shadow-glow">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            CITY<br />
            <span className="text-accent-400">CONSTRUCTIONS</span>
          </h1>
          <p className="text-lg text-primary-200 max-w-md leading-relaxed">
            Enterprise Resource Planning for construction management. Manage projects, workforce, materials, finances, and daily operations — all in one powerful platform.
          </p>
          <div className="mt-12 flex gap-8">
            {[{ num: '500+', label: 'Projects Managed' }, { num: '10K+', label: 'Tasks Completed' }, { num: '99.9%', label: 'Uptime' }].map(stat => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.num}</p>
                <p className="text-sm text-primary-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-glow">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white">CITY CONSTRUCTIONS</h1>
          </div>

          <h2 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Welcome back</h2>
          <p className="text-surface-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="email" placeholder="Enter your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field pl-10" required id="login-email" />
              </div>
            </div>

            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field pl-10 pr-10" required id="login-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-surface-600 dark:text-surface-400">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Forgot password?</Link>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3" id="login-submit">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-surface-500">
            Don't have an account? <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">Create Account</Link>
          </p>

          {/* Quick Login */}
          <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-2">Quick Login</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-primary-600 dark:text-primary-300">
              {[
                ['Admin', 'admin@cityconstructions.in'],
                ['Manager', 'manager@cityconstructions.in'],
                ['Engineer', 'engineer@cityconstructions.in'],
                ['Supervisor', 'supervisor@cityconstructions.in'],
                ['Worker', 'worker@cityconstructions.in'],
              ].map(([role, email]) => (
                <button key={role} onClick={() => setForm({ email, password: role.toLowerCase() + '123' })}
                  className="text-left hover:underline cursor-pointer">
                  <span className="font-medium">{role}:</span> {email.split('@')[0]}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-primary-500 mt-1">Password: role + 123 (e.g., admin123)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
