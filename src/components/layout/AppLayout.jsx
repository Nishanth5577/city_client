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
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  // Real-time notification listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    // Join user-specific room for targeted notifications
    socket.emit('join_user_room', user._id);

    const handleNotification = (notification) => {
      dispatch(addNotification(notification));
      toast(notification.message, {
        icon: '🔔',
        duration: 4000,
        style: { borderRadius: '12px', background: '#1e293b', color: '#f1f5f9', fontSize: '14px' },
      });
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [user, dispatch]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <TopNav />
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}

