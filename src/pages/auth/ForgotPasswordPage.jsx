import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { HardHat, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent!');
    } catch {
      toast.error('Failed to send reset email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh bg-surface-50 dark:bg-surface-950 p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-glow"><HardHat className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">CITY CONSTRUCTIONS</h1>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center animate-scale-in">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Check Your Email</h2>
              <p className="text-surface-500 mb-6">We've sent a password reset link to <strong>{email}</strong></p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Forgot Password</h2>
              <p className="text-surface-500 mb-6">Enter your email to receive a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-text">Email Address</label>
                  <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" required id="forgot-email" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3" id="forgot-submit">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-surface-500">
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center gap-1"><ArrowLeft className="w-4 h-4" />Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
