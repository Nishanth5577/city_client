import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatRelative, getProgressColor } from '../../utils/helpers';
import {
  Building2, FolderKanban, CheckCircle2, AlertTriangle, IndianRupee, Users,
  TrendingUp, BarChart3, ArrowUpRight, Clock, Wallet, ShieldAlert, Package,
  Wrench, ArrowDownRight, Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function OwnerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: d } = await api.get('/api/dashboard/owner');
        setData(d);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-2/3 mb-3" /><div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-1/2" /></div>
          ))}
        </div>
      </div>
    );
  }

  const overview = data?.projectOverview || {};
  const finance = data?.finance || {};
  const resources = data?.resources || {};
  const risk = data?.riskPrediction || {};

  // Project Status Cards
  const projectCards = [
    { label: 'Total Projects', value: overview.total || 0, icon: FolderKanban, color: 'blue', desc: 'All projects' },
    { label: 'Active', value: overview.active || 0, icon: Building2, color: 'emerald', desc: 'In progress' },
    { label: 'Completed', value: overview.completed || 0, icon: CheckCircle2, color: 'violet', desc: 'Delivered' },
    { label: 'Delayed', value: overview.delayed || 0, icon: AlertTriangle, color: 'red', desc: 'Behind schedule' },
  ];

  // Finance Cards
  const financeCards = [
    { label: 'Contract Value', value: formatCurrency(finance.totalContractValue), icon: IndianRupee, color: 'emerald' },
    { label: 'Total Income', value: formatCurrency(finance.totalIncome), icon: ArrowUpRight, color: 'blue' },
    { label: 'Total Expenses', value: formatCurrency(finance.totalExpenses), icon: ArrowDownRight, color: 'amber' },
    { label: 'Net Profit', value: formatCurrency(finance.profitEstimation), icon: TrendingUp, color: finance.profitEstimation >= 0 ? 'emerald' : 'red' },
  ];

  const expenseData = (data?.expenseByCategory || []).map(e => ({ name: e._id, value: e.total }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary-600" />
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-surface-500 mt-1">City Constructions — Command Center</p>
        </div>
      </div>

      {/* ═══ Section 1: Project Overview ═══ */}
      <div>
        <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">📊 Project Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {projectCards.map((stat, i) => (
            <div key={stat.label} className="glass-card-hover p-5 cursor-pointer" style={{ animationDelay: `${i * 80}ms` }} onClick={() => navigate('/projects')}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-surface-300" />
              </div>
              <p className="text-sm text-surface-500">{stat.label}</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stat.value}</p>
              <p className="text-[10px] text-surface-400 mt-0.5">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Section 2: Financial Dashboard ═══ */}
      <div>
        <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">💰 Financial Dashboard</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {financeCards.map((stat) => (
            <div key={stat.label} className="glass-card p-5 cursor-pointer" onClick={() => navigate('/finance')}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20 flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
                </div>
                <span className="text-xs text-surface-500">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Budget + Payment Pending bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Budget Utilization</span>
              <span className="text-xs text-surface-500">{finance.totalBudget > 0 ? Math.round((finance.totalExpenses / finance.totalBudget) * 100) : 0}%</span>
            </div>
            <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${finance.totalExpenses > finance.totalBudget * 0.9 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`} style={{ width: `${Math.min(100, finance.totalBudget > 0 ? (finance.totalExpenses / finance.totalBudget) * 100 : 0)}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-surface-500">
              <span>Spent: {formatCurrency(finance.totalExpenses)}</span>
              <span>Budget: {formatCurrency(finance.totalBudget)}</span>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Payment Pending</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(finance.paymentPending)}</p>
              <p className="text-[10px] text-surface-400">From all active projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 3: Resource Analytics ═══ */}
      <div>
        <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">🏗️ Resource Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Workers */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Workforce</p>
                <p className="text-xs text-surface-400">{resources.workers?.total || 0} total workers</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-lg font-bold text-emerald-600">{resources.workers?.assigned || 0}</p>
                <p className="text-[10px] text-surface-500">Assigned</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-lg font-bold text-blue-600">{resources.workers?.available || 0}</p>
                <p className="text-[10px] text-surface-500">Available</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-lg font-bold text-primary-600">{resources.workers?.utilization || 0}%</p>
                <p className="text-[10px] text-surface-500">Utilization</p>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center"><Package className="w-5 h-5 text-amber-600" /></div>
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Materials</p>
                <p className="text-xs text-surface-400">Stock value: {formatCurrency(resources.materials?.totalValue || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-lg font-bold text-surface-900 dark:text-white">{resources.materials?.totalStock?.toLocaleString() || 0}</p>
                <p className="text-[10px] text-surface-500">In Stock</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className={`text-lg font-bold ${(resources.materials?.lowStockCount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{resources.materials?.lowStockCount || 0}</p>
                <p className="text-[10px] text-surface-500">Low Stock Alerts</p>
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center"><Wrench className="w-5 h-5 text-violet-600" /></div>
              <div>
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Equipment</p>
                <p className="text-xs text-surface-400">Fleet overview</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {(data?.resources?.equipment || []).map(eq => (
                <div key={eq._id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                  <span className="text-xs text-surface-600 dark:text-surface-400 capitalize">{eq._id?.replace('_', ' ')}</span>
                  <span className="text-xs font-bold text-surface-900 dark:text-white">{eq.count}</span>
                </div>
              ))}
              {(!data?.resources?.equipment || data.resources.equipment.length === 0) && (
                <p className="text-xs text-surface-400 text-center py-2">No equipment data</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 4: Project Health + Risk + Expense Chart ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Health */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="section-title mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Project Health</h3>
          <div className="space-y-3">
            {(data?.projectHealth || []).map((project) => {
              const health = project.health_score || 0;
              const healthColor = health >= 70 ? 'emerald' : health >= 40 ? 'amber' : 'red';
              return (
                <div key={project._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project._id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 dark:text-white truncate text-sm">{project.project_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-surface-500">{formatCurrency(project.contract_value || project.budget)}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-${healthColor}-100 text-${healthColor}-700 dark:bg-${healthColor}-900/20 dark:text-${healthColor}-400`}>
                        Health: {health}%
                      </span>
                    </div>
                  </div>
                  <div className="w-28">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-surface-500">{project.progress_percentage}%</span>
                    </div>
                    <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percentage)} transition-all duration-500`} style={{ width: `${project.progress_percentage}%` }} />
                    </div>
                  </div>
                  <span className={`badge ${project.project_status === 'active' ? 'badge-success' : project.project_status === 'delayed' ? 'badge-danger' : project.project_status === 'completed' ? 'badge-info' : 'badge-warning'} text-[10px]`}>
                    {project.project_status}
                  </span>
                </div>
              );
            })}
            {(!data?.projectHealth || data.projectHealth.length === 0) && (
              <p className="text-center text-surface-400 py-8">No projects yet</p>
            )}
          </div>
        </div>

        {/* Right Column: Risk + Expenses */}
        <div className="space-y-6">
          {/* Risk Prediction */}
          <div className="glass-card p-5">
            <h3 className="section-title mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Risk Prediction</h3>
            <div className="space-y-3">
              {[
                { label: 'Low Risk', value: risk.low || 0, color: 'emerald', desc: 'On track' },
                { label: 'Medium Risk', value: risk.medium || 0, color: 'amber', desc: 'Needs attention' },
                { label: 'High Risk', value: risk.high || 0, color: 'red', desc: 'Critical' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <div className={`w-3 h-3 rounded-full bg-${r.color}-500`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{r.label}</p>
                    <p className="text-[10px] text-surface-400">{r.desc}</p>
                  </div>
                  <span className={`text-xl font-bold text-${r.color}-600`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="glass-card p-5">
            <h3 className="section-title mb-4">Expense Breakdown</h3>
            {expenseData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={expenseData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {expenseData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5 mt-3">
                  {expenseData.slice(0, 6).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-[10px]">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-surface-600 dark:text-surface-400 truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-surface-400 py-12 text-xs">No expense data</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Section 5: Recent Activity ═══ */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {(data?.recentActivity || []).slice(0, 8).map((activity) => (
            <div key={activity._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-700 dark:text-surface-300">
                  <span className="font-medium">{activity.user_name || activity.user_id?.name || 'System'}</span> {activity.action}
                </p>
                <p className="text-xs text-surface-400">{activity.module} • {formatRelative(activity.createdAt)}</p>
              </div>
            </div>
          ))}
          {(!data?.recentActivity || data.recentActivity.length === 0) && (
            <p className="text-center text-surface-400 py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
