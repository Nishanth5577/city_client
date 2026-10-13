import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { User, Lock, Palette, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });

  const updateProfile = async (e) => {
    e.preventDefault();
    try { await api.put('/api/auth/profile', profile); toast.success('Profile updated!'); } catch (err) { toast.error(err.response?.data?.message || 'Failed to update profile'); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) return toast.error('Passwords do not match');
    try { await api.put('/api/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.newPassword }); toast.success('Password changed!'); setPasswords({ current: '', newPassword: '', confirm: '' }); } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Settings</h1><p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Manage your account</p></div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: tab === t.id ? 'rgba(37,99,235,0.08)' : 'transparent',
              color: tab === t.id ? '#D97706' : 'var(--t3)',
              border: `1px solid ${tab === t.id ? 'rgba(212, 136, 42, 0.2)' : 'transparent'}`,
            }}
            onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.background = 'var(--glass)'; }}
            onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.background = 'transparent'; }}
          >
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="cinematic-card p-6 max-w-lg">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--t1)' }}>Profile Information</h3>
          <form onSubmit={updateProfile} className="space-y-4">
            <div><label className="label-text">Full Name</label><input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input-field" /></div>
            <div><label className="label-text">Email</label><input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="input-field" /></div>
            <div><label className="label-text">Phone</label><input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-field" /></div>
            <div><label className="label-text">Role</label><input type="text" value={user?.role?.replace('_', ' ')} className="input-field capitalize" disabled style={{ opacity: 0.6 }} /></div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="cinematic-card p-6 max-w-lg">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--t1)' }}>Change Password</h3>
          <form onSubmit={changePassword} className="space-y-4">
            <div><label className="label-text">Current Password</label><input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="input-field" required /></div>
            <div><label className="label-text">New Password</label><input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="input-field" required minLength={6} /></div>
            <div><label className="label-text">Confirm Password</label><input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="input-field" required /></div>
            <button type="submit" className="btn-primary">Change Password</button>
          </form>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="cinematic-card p-6 max-w-lg">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--t1)' }}>Theme</h3>
          <div className="flex gap-4">
            <button onClick={() => theme !== 'light' && toggleTheme()}
              className="flex-1 p-4 rounded-xl transition-all"
              style={{
                border: `2px solid ${theme === 'light' ? 'var(--accent)' : 'var(--border)'}`,
                background: theme === 'light' ? 'rgba(37,99,235,0.06)' : 'var(--glass-hover)',
              }}
            >
              <Sun className="w-6 h-6 mx-auto mb-2" style={{ color: '#D97706' }} /><p className="text-sm font-medium text-center" style={{ color: 'var(--t1)' }}>Light</p>
            </button>
            <button onClick={() => theme !== 'dark' && toggleTheme()}
              className="flex-1 p-4 rounded-xl transition-all"
              style={{
                border: `2px solid ${theme === 'dark' ? 'var(--accent)' : 'var(--border)'}`,
                background: theme === 'dark' ? 'rgba(37,99,235,0.06)' : 'var(--glass-hover)',
              }}
            >
              <Moon className="w-6 h-6 mx-auto mb-2" style={{ color: '#0D9488' }} /><p className="text-sm font-medium text-center" style={{ color: 'var(--t1)' }}>Dark</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
