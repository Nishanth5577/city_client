import { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { BarChart3, Box, CheckCircle2, XCircle, FileEdit, DollarSign, Building2, Loader2, Layers, Package } from 'lucide-react';

export default function BIMAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/bim/analytics')
      .then(res => setAnalytics(res.data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0D9488' }} />
      </div>
    );
  }

  const { overview = {}, materialDistribution = [], projectTypeDistribution = [], recentProjects = [], recentEstimations = [] } = analytics;

  const overviewCards = [
    { label: 'Total Projects', value: overview.totalProjects || 0, icon: Box, color: '#0D9488', bg: '#F0FDFA' },
    { label: 'Active', value: overview.activeProjects || 0, icon: FileEdit, color: '#D97706', bg: '#FFFBEB' },
    { label: 'Completed', value: overview.completedProjects || 0, icon: CheckCircle2, color: '#059669', bg: '#ECFDF5' },
    { label: 'Draft', value: overview.draftProjects || 0, icon: XCircle, color: '#78756E', bg: '#F5F5F0' },
  ];

  const totalCost = overview.totalEstimatedCost || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F0FDFA', border: '1px solid #CCFBF1' }}>
          <BarChart3 className="w-5 h-5" style={{ color: '#0D9488' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--t1)' }}>BIM Analytics</h1>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>Design statistics & insights</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8E5E0' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: '#78756E' }}>{card.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#1C1917' }}>{card.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon className="w-6 h-6" style={{ color: card.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Distribution */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8E5E0' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#1C1917' }}>
            <Package className="w-4 h-4" style={{ color: '#0D9488' }} /> Materials by Category
          </h3>
          {materialDistribution.length > 0 ? (
            <div className="space-y-2">
              {materialDistribution.map((m, i) => {
                const max = Math.max(...materialDistribution.map(x => x.count), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs w-28 capitalize" style={{ color: '#78756E' }}>{m.category || 'Other'}</span>
                    <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: '#F0EDE8' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(m.count / max) * 100}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                        className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #0D9488, #14B8A6)' }} />
                    </div>
                    <span className="text-xs font-mono w-8 text-right" style={{ color: '#57534E' }}>{m.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs" style={{ color: '#A8A49C' }}>No materials data available</p>
          )}
        </div>

        {/* Cost Summary */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8E5E0' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#1C1917' }}>
            <DollarSign className="w-4 h-4" style={{ color: '#059669' }} /> Cost Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#ECFDF5' }}>
              <span className="text-sm" style={{ color: '#57534E' }}>Total Estimated Cost</span>
              <span className="text-xl font-bold" style={{ color: '#059669' }}>₹{(totalCost / 100000).toFixed(1)}L</span>
            </div>
            <div className="flex items-center justify-between px-3">
              <span className="text-xs" style={{ color: '#78756E' }}>Total Materials</span>
              <span className="text-sm font-medium" style={{ color: '#1C1917' }}>{overview.totalMaterials || 0}</span>
            </div>
            <div className="flex items-center justify-between px-3">
              <span className="text-xs" style={{ color: '#78756E' }}>Estimations Count</span>
              <span className="text-sm font-medium" style={{ color: '#1C1917' }}>{recentEstimations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Status Distribution */}
      {projectTypeDistribution.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8E5E0' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1C1917' }}>Project Status Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {projectTypeDistribution.map((p, i) => (
              <div key={i} className="text-center p-3 rounded-xl" style={{ background: '#FAFAF8', border: '1px solid #F0EDE8' }}>
                <p className="text-2xl font-bold" style={{ color: STATUS_COLORS[p.type] || '#0D9488' }}>{p.count}</p>
                <p className="text-xs capitalize mt-1" style={{ color: '#78756E' }}>{p.type.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects */}
      {recentProjects?.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E8E5E0' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1C1917' }}>Recent Designs</h3>
          <div className="space-y-2">
            {recentProjects.map(project => (
              <div key={project._id} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Box className="w-5 h-5" style={{ color: '#0D9488' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1C1917' }}>{project.design_name}</p>
                    <p className="text-xs" style={{ color: '#A8A49C' }}>{project.description || 'No description'}</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md capitalize"
                  style={{
                    background: STATUS_BG[project.status] || '#F5F5F0',
                    color: STATUS_COLORS[project.status] || '#78756E',
                  }}>
                  {(project.status || 'draft').replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  draft: '#78756E',
  active: '#0D9488',
  in_progress: '#2563EB',
  review: '#D97706',
  completed: '#059669',
  approved: '#059669',
};
const STATUS_BG = {
  draft: '#F5F5F0',
  active: '#F0FDFA',
  in_progress: '#EFF6FF',
  review: '#FFFBEB',
  completed: '#ECFDF5',
  approved: '#ECFDF5',
};
