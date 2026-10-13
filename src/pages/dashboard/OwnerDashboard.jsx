import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import {
  FolderKanban, Building2, CheckCircle2, Clock, AlertTriangle,
  Users, Package, Receipt, Wallet, TrendingUp, ArrowRight
} from 'lucide-react';

// Dashboard Components
import DashboardHero from '../../components/dashboard/DashboardHero';
import StatsCard from '../../components/dashboard/StatsCard';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines';
import RecentProjects from '../../components/dashboard/RecentProjects';
import ProjectOverviewChart from '../../components/dashboard/ProjectOverviewChart';
import FinancialOverview from '../../components/dashboard/FinancialOverview';
import RecentActivity from '../../components/dashboard/RecentActivity';
import QuickActions from '../../components/dashboard/QuickActions';

import ProjectProgressTable from '../../components/dashboard/ProjectProgressTable';
import BudgetUtilization from '../../components/dashboard/BudgetUtilization';

export default function OwnerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get('/api/dashboard/owner');
      setData(d);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Unable to load dashboard data');
    }
    setLoading(false);
  };



  useEffect(() => {
    fetchDashboard();
  }, []);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div className="skeleton rounded-2xl" style={{ height: '200px' }} />

        {/* KPI skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: '130px' }} />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton rounded-2xl" style={{ height: '300px' }} />
          <div className="skeleton rounded-2xl" style={{ height: '300px' }} />
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="p-8 text-center max-w-md rounded-2xl"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#DC2626' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--t1)' }}>Unable to load data</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--t3)' }}>{error}</p>
          <button onClick={fetchDashboard} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overview = data?.projectOverview || {};
  const finance = data?.finance || {};
  const resources = data?.resources || {};
  const allProjects = data?.projectHealth || [];

  // Calculate values
  const totalProjects = overview.total || 0;
  const activeProjects = overview.active || 0;
  const completedProjects = overview.completed || 0;
  const pendingProjects = (overview.planning || 0) + (overview.on_hold || 0);
  const totalWorkers = resources.workers?.total || 0;
  const materialValue = resources.materials?.totalValue || 0;
  const totalExpenses = finance.totalExpenses || 0;
  const budgetUtilPercent = finance.totalBudget > 0 ? Math.round((totalExpenses / finance.totalBudget) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ═══ ROW 1: Hero + Deadlines ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <DashboardHero />
        </div>
        <div className="lg:col-span-1">
          <UpcomingDeadlines />
        </div>
      </div>

      {/* ═══ ROW 2: Project KPI Cards ═══ */}
      <div>
        <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--t4)', letterSpacing: '0.02em' }}>
          Project overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard
            label="Total Projects"
            value={totalProjects}
            icon={FolderKanban}
            color="#0D9488"
            trend={null}
            trendLabel="all time"
            delay={0}
          />
          <StatsCard
            label="Active Projects"
            value={activeProjects}
            icon={Building2}
            color="#059669"
            trend={null}
            trendLabel="in progress"
            delay={80}
          />
          <StatsCard
            label="Completed"
            value={completedProjects}
            icon={CheckCircle2}
            color="#14B8A6"
            trend={null}
            trendLabel="delivered"
            delay={160}
          />
          <StatsCard
            label="Pending"
            value={pendingProjects}
            icon={Clock}
            color="#7C3AED"
            trend={null}
            trendLabel="planning / on hold"
            delay={240}
          />
        </div>
      </div>

      {/* ═══ ROW 3: Resource & Finance KPI Cards ═══ */}
      <div>
        <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--t4)', letterSpacing: '0.02em' }}>
          Resources & finance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard
            label="Total Workers"
            value={totalWorkers}
            icon={Users}
            color="#0891B2"
            trend={null}
            trendLabel={`${resources.workers?.assigned || 0} assigned`}
            delay={0}
          />
          <StatsCard
            label="Material Value"
            value={formatCurrency(materialValue)}
            icon={Package}
            color="#D97706"
            trend={null}
            trendLabel={`${resources.materials?.lowStockCount || 0} low stock`}
            delay={80}
          />
          <StatsCard
            label="Total Expenses"
            value={formatCurrency(totalExpenses)}
            icon={Receipt}
            color="#DC2626"
            trend={null}
            trendLabel="approved expenses"
            delay={160}
          />
          <StatsCard
            label="Budget Utilization"
            value={`${budgetUtilPercent}%`}
            icon={Wallet}
            color={budgetUtilPercent > 90 ? '#DC2626' : budgetUtilPercent > 70 ? '#D97706' : '#059669'}
            trend={null}
            trendLabel={formatCurrency(finance.remainingBudget || 0) + ' remaining'}
            delay={240}
          />
        </div>
      </div>

      {/* ═══ ROW 4: Charts ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProjectOverviewChart projects={allProjects} />
            <FinancialOverview finance={finance} />
          </div>

          {/* Activities + Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentActivity activities={data?.recentActivity || []} />
            <QuickActions />
          </div>
        </div>

        {/* Right: Recent Projects + 3D Preview */}
        <div className="lg:col-span-1 space-y-6">
          <RecentProjects projects={allProjects} />

        </div>
      </div>

      {/* ═══ ROW 5: Project Progress Table + Budget ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ProjectProgressTable projects={allProjects} />
        </div>
        <div className="lg:col-span-1">
          <BudgetUtilization finance={finance} />
        </div>
      </div>
    </div>
  );
}
