import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAnalytics } from '../../redux/slices/bimSlice';
import { motion } from 'framer-motion';
import { BarChart3, Box, CheckCircle2, XCircle, FileEdit, DollarSign, Maximize2, Zap, Building2, Loader2 } from 'lucide-react';

export default function BIMAnalyticsPage() {
  const dispatch = useDispatch();
  const { analytics, analyticsLoading } = useSelector(s => s.bim);

  useEffect(() => { dispatch(fetchAnalytics()); }, [dispatch]);

  if (analyticsLoading || !analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const { overview, elements, costs, recentProjects } = analytics;

  const overviewCards = [
    { label: 'Total Designs', value: overview.totalDesigns, icon: Box, gradient: 'from-blue-600 to-indigo-600' },
    { label: 'In Progress', value: overview.inProgress, icon: FileEdit, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Approved', value: overview.approvedDesigns, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Rejected', value: overview.rejectedDesigns, icon: XCircle, gradient: 'from-red-500 to-pink-500' },
  ];

  const elementCards = [
    { label: 'Buildings', value: elements.buildings, color: 'text-blue-400' },
    { label: 'Floors', value: elements.floors, color: 'text-purple-400' },
    { label: 'Walls', value: elements.walls, color: 'text-amber-400' },
    { label: 'Columns', value: elements.columns, color: 'text-red-400' },
    { label: 'Doors', value: elements.doors, color: 'text-green-400' },
    { label: 'Windows', value: elements.windows, color: 'text-cyan-400' },
  ];

  const costCategories = costs.costByCategory ? Object.entries(costs.costByCategory) : [];
  const maxCost = Math.max(...costCategories.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="page-title">BIM Analytics</h1>
          <p className="text-surface-500 text-sm">Design statistics & insights</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-surface-500 font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-surface-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Element Count */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-500" /> Element Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            {elementCards.map((el, i) => (
              <div key={i} className="text-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                <p className={`text-2xl font-bold ${el.color}`}>{el.value}</p>
                <p className="text-xs text-surface-500 mt-1">{el.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Summary */}
        <div className="glass-card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Cost Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-600/10 to-transparent rounded-xl">
              <span className="text-sm text-surface-600 dark:text-surface-400">Total Estimated Cost</span>
              <span className="text-xl font-bold text-emerald-500">₹{(costs.totalEstimatedCost / 100000).toFixed(1)}L</span>
            </div>
            <div className="flex items-center justify-between px-3">
              <span className="text-xs text-surface-500">Total Area</span>
              <span className="text-sm font-medium text-surface-300">{costs.totalArea?.toLocaleString()} sqft</span>
            </div>
            <div className="flex items-center justify-between px-3">
              <span className="text-xs text-surface-500">Avg Cost/sqft</span>
              <span className="text-sm font-medium text-surface-300">₹{costs.avgCostPerSqft?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Chart */}
      {costCategories.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="section-title mb-4">Cost Breakdown by Category</h3>
          <div className="space-y-2">
            {costCategories.map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-surface-500 w-28 capitalize">{key.replace('_cost', '').replace('_', ' ')}</span>
                <div className="flex-1 h-5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(value / maxCost) * 100}%` }} transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full" />
                </div>
                <span className="text-xs font-mono text-surface-400 w-20 text-right">₹{(value / 100000).toFixed(1)}L</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects */}
      {recentProjects?.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="section-title mb-4">Recent Designs</h3>
          <div className="space-y-2">
            {recentProjects.map(project => (
              <div key={project._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Box className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{project.design_name}</p>
                    <p className="text-xs text-surface-500">{project.project_id?.project_name || 'Standalone'}</p>
                  </div>
                </div>
                <span className={`badge text-[10px] ${STATUS_BADGES[project.status]?.color || 'bg-surface-600/20 text-surface-400'}`}>
                  {STATUS_BADGES[project.status]?.label || project.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_BADGES = {
  draft: { label: 'Draft', color: 'bg-surface-600/20 text-surface-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-600/20 text-blue-400' },
  review: { label: 'Under Review', color: 'bg-amber-600/20 text-amber-400' },
  approved: { label: 'Approved', color: 'bg-emerald-600/20 text-emerald-400' },
};
