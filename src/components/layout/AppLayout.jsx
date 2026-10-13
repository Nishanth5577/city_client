import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import MobileNav from './MobileNav';
import { setSidebarOpen } from '../../redux/slices/uiSlice';
import { addNotification } from '../../redux/slices/notificationSlice';
import ErrorBoundary from '../common/ErrorBoundary';
import { getSocket } from '../../services/socketService';
import toast from 'react-hot-toast';

export default function AppLayout() {
  const dispatch = useDispatch();
  const { sidebarOpen, sidebarCollapsed } = useSelector(s => s.ui);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;
    socket.emit('join_user_room', user._id);
    const handleNotification = (n) => { dispatch(addNotification(n)); toast(n.message, { icon: '🔔', duration: 4000 }); };
    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [user, dispatch]);

  return (
    <div className="noise-overlay" style={{ minHeight: '100dvh', background: 'var(--canvas)' }}>
      {sidebarOpen && <div className="fixed inset-0 z-30 lg:hidden" onClick={() => dispatch(setSidebarOpen(false))} style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)' }} />}
      <Sidebar />
      <div className={`relative z-10 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[252px]'}`}>
        <TopNav />
        <main className="p-4 lg:p-6 min-h-[calc(100dvh-56px)] pb-20 lg:pb-6">
          <div className="max-w-[1440px] mx-auto animate-fade-in">
            <ErrorBoundary><Outlet /></ErrorBoundary>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
