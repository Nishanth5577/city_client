import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebarCollapse, setSidebarOpen } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';
import {
  LayoutDashboard, FolderKanban, Users, Receipt, FileText, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight, X,
  IndianRupee, ClipboardCheck, Box, Layers, Package,
  ListTodo, Truck, Bell, CalendarDays, MessageSquare,
  GanttChart, PieChart, Landmark, Cpu,
  BrainCircuit, Building2, Camera
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin','project_manager','engineer','supervisor','worker'] },
  { type:'divider', label:'Projects', roles:['admin','project_manager','engineer','supervisor'] },
  { path:'/projects', icon:FolderKanban, label:'Projects', roles:['admin','project_manager','engineer','supervisor'] },
  { path:'/tasks', icon:ListTodo, label:'Tasks', roles:['admin','project_manager','engineer','supervisor'] },
  { path:'/gantt', icon:GanttChart, label:'Gantt Chart', roles:['admin','project_manager','engineer','supervisor'] },
  { path:'/site-progress', icon:Camera, label:'Site Progress', roles:['admin','project_manager','engineer','supervisor','worker'] },
  { type:'divider', label:'BIM Studio', roles:['admin','project_manager','engineer'] },
  { path:'/bim', icon:Box, label:'Design Studio', roles:['admin','project_manager','engineer'] },
  { path:'/bim/materials', icon:Layers, label:'Material Library', roles:['admin','project_manager','engineer'] },

  { path:'/bim/analytics', icon:PieChart, label:'BIM Analytics', roles:['admin','project_manager','engineer'] },
  { type:'divider', label:'Engineering', roles:['admin','project_manager','engineer'] },
  { path:'/bim/structural', icon:Landmark, label:'Structural Design', roles:['admin','project_manager','engineer'] },
  { path:'/bim/mep', icon:Cpu, label:'MEP Dashboard', roles:['admin','project_manager','engineer'] },
  { type:'divider', label:'AI Tools', roles:['admin','project_manager','engineer'] },
  { path:'/bim/ai-architect', icon:BrainCircuit, label:'AI Architect', roles:['admin','project_manager','engineer'] },
  { type:'divider', label:'Operations', roles:['admin','project_manager','engineer','supervisor','worker'] },
  { path:'/workers', icon:Users, label:'Workers', roles:['admin','project_manager','supervisor'] },
  { path:'/attendance', icon:ClipboardCheck, label:'Attendance', roles:['admin','project_manager','supervisor'] },
  { path:'/resources', icon:Package, label:'Materials', roles:['admin','project_manager','engineer'] },
  { path:'/suppliers', icon:Truck, label:'Suppliers', roles:['admin','project_manager'] },
  { path:'/expenses', icon:Receipt, label:'Expenses', roles:['admin','project_manager'] },
  { path:'/finance', icon:IndianRupee, label:'Finance', roles:['admin','project_manager'] },
  { type:'divider', label:'Docs', roles:['admin','project_manager','engineer'] },
  { path:'/documents', icon:FileText, label:'Documents', roles:['admin','project_manager','engineer'] },
  { path:'/reports', icon:BarChart3, label:'Reports', roles:['admin','project_manager'] },
  { type:'divider', label:'System', roles:['admin','project_manager','engineer','supervisor','worker'] },
  { path:'/chat', icon:MessageSquare, label:'Chat', roles:['admin','project_manager','engineer','supervisor','worker'] },
  { path:'/notifications', icon:Bell, label:'Notifications', roles:['admin','project_manager','engineer','supervisor','worker'] },
  { path:'/calendar', icon:CalendarDays, label:'Calendar', roles:['admin','project_manager','engineer','supervisor'] },
  { path:'/settings', icon:Settings, label:'Settings', roles:['admin','project_manager','engineer','supervisor','worker'] },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen, sidebarCollapsed } = useSelector(s => s.ui);
  const { user } = useSelector(s => s.auth);
  const filtered = menuItems.filter(i => i.roles.includes(user?.role || ''));
  const navRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const n = navRef.current; if (!n) return;
    const check = () => setCanScroll(n.scrollHeight - n.scrollTop - n.clientHeight > 20);
    check(); n.addEventListener('scroll', check);
    return () => n.removeEventListener('scroll', check);
  }, [filtered]);

  return (
    <aside className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      ${sidebarCollapsed ? 'w-[68px]' : 'w-[252px]'}`}
      style={{
        background: 'var(--sidebar-bg)',
        color: 'var(--sidebar-text)',
        borderRight: '1px solid var(--sidebar-border)',
      }}>

      <div className="flex items-center justify-between px-4 h-[56px]" style={{ borderBottom: '1px solid var(--sidebar-divider)' }}>
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}>
            <Building2 className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in min-w-0">
              <p className="truncate" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sidebar-logo-text)', letterSpacing: '-0.01em' }}>City Constructions</p>
              <p style={{ fontSize: '10px', fontWeight: 500, color: 'var(--sidebar-logo-sub)', letterSpacing: '0.02em' }}>ERP Platform</p>
            </div>
          )}
        </div>
        <button onClick={() => dispatch(setSidebarOpen(false))} className="lg:hidden p-1 rounded-md transition-colors" style={{ color: 'var(--sidebar-collapse-color)' }}><X className="w-4 h-4" /></button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <nav ref={navRef} className="h-full overflow-y-auto py-2.5 px-2 sidebar-nav">
          {filtered.map((item, i) => (
            item.type === 'divider' ? (
              !sidebarCollapsed ? (
                <div key={`d-${i}`} className="pt-5 pb-1.5 px-2.5">
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--sidebar-label)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</span>
                </div>
              ) : <div key={`d-${i}`} className="my-2 mx-2.5" style={{ height: '1px', background: 'var(--sidebar-divider)' }} />
            ) : (
              <NavLink key={item.path} to={item.path} end={item.path === '/bim'}
                onClick={() => window.innerWidth < 1024 && dispatch(setSidebarOpen(false))}
                className={({ isActive }) => `group relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg transition-all duration-200
                  ${sidebarCollapsed ? 'justify-center' : ''}`}
                style={({ isActive }) => ({
                  background: isActive ? 'var(--active-indicator-bg)' : undefined,
                  color: isActive ? 'var(--active-indicator-color)' : 'var(--sidebar-text)',
                })}>
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full" style={{ background: '#0D9488', boxShadow: '0 0 8px rgba(13,148,136,0.3)' }} />}
                    <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                    {!sidebarCollapsed && (
                      <span className="truncate transition-colors" style={{ fontSize: '13px', fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--t2)' : undefined }}>{item.label}</span>
                    )}
                  </>
                )}
              </NavLink>
            )
          ))}
        </nav>
        {canScroll && <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none" style={{ background: `linear-gradient(transparent, var(--sidebar-gradient-end))` }} />}
      </div>

      <div className="px-2 py-2 space-y-0.5" style={{ borderTop: '1px solid var(--sidebar-divider)' }}>
        <button onClick={() => dispatch(toggleSidebarCollapse())}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-2.5 py-[7px] rounded-lg transition-all duration-200"
          style={{ fontSize: '13px', color: 'var(--sidebar-collapse-color)' }}>
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
        <button onClick={() => { dispatch(logout()); navigate('/login'); }}
          className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg hover:bg-red-500/8 transition-all duration-200"
          style={{ fontSize: '13px', color: '#DC2626' }}>
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
