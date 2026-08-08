import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebarCollapse, setSidebarOpen } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';
import {
  LayoutDashboard, FolderKanban, ListChecks, GanttChart, Package, Users, Receipt,
  FileText, BarChart3, CalendarDays, MessageSquare, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Building2, HardHat, X, Truck, IndianRupee, ClipboardCheck,
  Box, Layers, Calculator, PieChart, Zap, Columns3, FolderOpen, ShieldCheck, Eye,
  Sparkles, Globe, Radio, Download, Glasses
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'project_manager', 'engineer', 'supervisor', 'worker'] },
  { path: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin', 'project_manager', 'engineer', 'supervisor'] },
  { path: '/tasks', icon: ListChecks, label: 'Tasks', roles: ['admin', 'project_manager', 'engineer', 'supervisor', 'worker'] },
  { path: '/gantt', icon: GanttChart, label: 'Gantt Chart', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/resources', icon: Package, label: 'Resources', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/workers', icon: Users, label: 'Workers', roles: ['admin', 'project_manager', 'supervisor'] },
  { path: '/expenses', icon: Receipt, label: 'Expenses', roles: ['admin', 'project_manager'] },
  { path: '/finance', icon: IndianRupee, label: 'Finance', roles: ['admin', 'project_manager'] },
  { path: '/suppliers', icon: Truck, label: 'Suppliers', roles: ['admin', 'project_manager'] },
  { path: '/attendance', icon: ClipboardCheck, label: 'Attendance', roles: ['admin', 'project_manager', 'supervisor'] },
  { path: '/documents', icon: FileText, label: 'Documents', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'project_manager'] },
  { type: 'divider', label: 'BIM STUDIO', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim', icon: Box, label: 'Design Studio', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/materials', icon: Layers, label: 'Material Library', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/cost-estimation', icon: Calculator, label: 'Cost Estimation', roles: ['admin', 'project_manager'] },
  { path: '/bim/analytics', icon: PieChart, label: 'BIM Analytics', roles: ['admin', 'project_manager'] },
  { type: 'divider', label: 'ENGINEERING', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/structural', icon: Columns3, label: 'Structural Design', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/mep', icon: Zap, label: 'MEP Dashboard', roles: ['admin', 'project_manager', 'engineer'] },
  { type: 'divider', label: 'COLLABORATION', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/import', icon: FolderOpen, label: 'Import / Export', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/approvals', icon: ShieldCheck, label: 'Design Approvals', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/review', icon: Eye, label: 'Client Review', roles: ['admin', 'project_manager'] },
  { type: 'divider', label: 'AI TOOLS', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/ai-architect', icon: Sparkles, label: 'AI Architect', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/virtual-tour', icon: Globe, label: '360° Virtual Tour', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/vr-ar', icon: Glasses, label: 'VR / AR Viewer', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/collaboration', icon: Radio, label: 'Live Collaboration', roles: ['admin', 'project_manager', 'engineer'] },
  { path: '/bim/exports', icon: Download, label: 'Export Manager', roles: ['admin', 'project_manager', 'engineer'] },
  { type: 'divider', label: 'GENERAL', roles: ['admin', 'project_manager', 'engineer', 'supervisor', 'worker'] },
  { path: '/calendar', icon: CalendarDays, label: 'Calendar', roles: ['admin', 'project_manager', 'engineer', 'supervisor', 'worker'] },
  { path: '/chat', icon: MessageSquare, label: 'Chat', roles: ['admin', 'project_manager', 'engineer', 'supervisor', 'worker'] },
  { path: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'project_manager', 'engineer', 'supervisor', 'worker'] },
  { path: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'project_manager', 'engineer', 'supervisor', 'worker'] },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out
      bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center flex-shrink-0 shadow-glow">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold text-surface-900 dark:text-white leading-tight">CITY CONSTRUCTIONS</h1>
              <p className="text-[10px] text-surface-500">Construction Management ERP</p>
            </div>
          )}
        </div>
        <button onClick={() => dispatch(setSidebarOpen(false))} className="lg:hidden p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredMenu.map((item, idx) => (
          item.type === 'divider' ? (
            !sidebarCollapsed ? (
              <div key={`div-${idx}`} className="pt-4 pb-1 px-3">
                <span className="text-[10px] font-bold text-surface-400 dark:text-surface-600 uppercase tracking-widest">{item.label}</span>
              </div>
            ) : <div key={`div-${idx}`} className="h-px bg-surface-200 dark:bg-surface-800 my-2" />
          ) : (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/bim'}
            onClick={() => window.innerWidth < 1024 && dispatch(setSidebarOpen(false))}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white'
              }`}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110`} />
            {!sidebarCollapsed && <span className="animate-fade-in">{item.label}</span>}
          </NavLink>
          )
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-surface-200 dark:border-surface-800 space-y-2">
        {/* Collapse button (desktop only) */}
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>

        {/* User info & Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
