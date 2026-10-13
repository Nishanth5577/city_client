import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { generateBOQ, fetchBimProjects } from '../../redux/slices/bimSlice';
import bimService from '../../services/bimService';
import { motion } from 'framer-motion';
import {
  Calculator, DollarSign, FileDown, Loader2, BarChart3, Building2,
  ChevronDown, ChevronRight, TrendingUp, IndianRupee, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CATEGORY_ICONS = {
  material: '🧱', labour: '👷', structural: '🏗️', interior: '🚪',
  finishing: '🎨', electrical: '⚡', plumbing: '🔧', hvac: '❄️',
  solar: '☀️', exterior: '🏢', landscaping: '🌳', equipment: '🔩',
  overhead: '📋', contingency: '⚠️',
};

export default function CostEstimationPage() {
  const dispatch = useDispatch();
  const { projects, costEstimation, costLoading } = useSelector(s => s.bim);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [estimations, setEstimations] = useState([]);
  const [selectedEstimation, setSelectedEstimation] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => { dispatch(fetchBimProjects({})); }, [dispatch]);

  // Fetch existing estimations when project selected
  useEffect(() => {
    if (selectedProjectId) {
      bimService.getCostEstimations(selectedProjectId).then(res => {
        setEstimations(res.data);
        if (res.data.length > 0) setSelectedEstimation(res.data[0]);
      });
    }
  }, [selectedProjectId]);

  const handleGenerateBOQ = async () => {
    if (!selectedProjectId) { toast.error('Select a project first'); return; }
    try {
      const result = await dispatch(generateBOQ({ bim_project_id: selectedProjectId })).unwrap();
      setSelectedEstimation(result);
      setEstimations(prev => [result, ...prev]);
      toast.success('BOQ generated from design!');
    } catch (err) {
      toast.error(err || 'Failed to generate BOQ');
    }
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const est = selectedEstimation || costEstimation;
  const summary = est?.summary || null;
  const boqItems = est?.boq_items || [];

  // Group BOQ items by category
  const grouped = boqItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const summaryCards = summary ? [
    { label: 'Material Cost', value: summary.material_cost, color: 'text-amber-500' },
    { label: 'Labour Cost', value: summary.labour_cost, color: 'text-blue-500' },
    { label: 'Structural Cost', value: summary.structural_cost, color: 'text-red-500' },
    { label: 'Interior Cost', value: summary.interior_cost, color: 'text-purple-500' },
    { label: 'Electrical', value: summary.electrical_cost, color: 'text-yellow-500' },
    { label: 'Plumbing', value: summary.plumbing_cost, color: 'text-cyan-500' },
    { label: 'Exterior', value: summary.exterior_cost, color: 'text-green-500' },
    { label: 'Overhead', value: summary.overhead_cost, color: 'text-surface-500' },
    { label: 'Contingency', value: summary.contingency_cost, color: 'text-orange-500' },
  ].filter(c => c.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">Cost Estimation & BOQ</h1>
            <p className="text-surface-500 text-sm">Auto-generate Bill of Quantities from design</p>
          </div>
        </div>
      </div>

      {/* Project Selector + Generate */}
      <div className="glass-card p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <label className="label-text">Select BIM Project</label>
            <select className="select-field" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
              <option value="">— Select Project —</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.design_name}</option>)}
            </select>
          </div>
          <button onClick={handleGenerateBOQ} disabled={costLoading || !selectedProjectId}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {costLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            Generate BOQ from Design
          </button>
        </div>

        {estimations.length > 1 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="text-xs text-surface-500 mt-1">Versions:</span>
            {estimations.map((e, i) => (
              <button key={e._id} onClick={() => setSelectedEstimation(e)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${selectedEstimation?._id === e._id ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
                v{e.version} — {new Date(e.createdAt).toLocaleDateString()}
              </button>
            ))}
          </div>
        )}
      </div>

      {!est || !summary ? (
        <div className="glass-card p-12 text-center">
          <Calculator className="w-16 h-16 text-surface-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2">No Estimation Yet</h3>
          <p className="text-sm text-surface-500 max-w-md mx-auto">Select a BIM project and click "Generate BOQ from Design" to automatically calculate material quantities and costs from your floor plans.</p>
        </div>
      ) : (
        <>
          {/* Grand Total */}
          <div className="glass-card p-6 bg-gradient-to-r from-emerald-600/5 to-transparent border-l-4 border-emerald-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-surface-500 font-medium">Total Estimated Cost</p>
                <p className="text-3xl font-bold text-emerald-500 flex items-center gap-1 mt-1">
                  <IndianRupee className="w-6 h-6" />{(summary.total_cost / 100000).toFixed(2)}L
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-500 font-medium">Subtotal (before GST)</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white mt-1">₹{(summary.subtotal / 100000).toFixed(2)}L</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 font-medium">GST ({summary.gst_percent}%)</p>
                <p className="text-xl font-bold text-amber-500 mt-1">₹{(summary.gst_amount / 100000).toFixed(2)}L</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 font-medium">Cost per sqft</p>
                <p className="text-xl font-bold text-primary-500 mt-1">₹{est.cost_per_sqft?.toLocaleString()}/sqft</p>
                <p className="text-[11px] text-surface-500">{est.total_area_sqft?.toLocaleString()} sqft total</p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {summaryCards.map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card p-3 text-center">
                <p className="text-[11px] text-surface-500">{card.label}</p>
                <p className={`text-lg font-bold ${card.color} mt-1`}>₹{(card.value / 1000).toFixed(0)}K</p>
              </motion.div>
            ))}
          </div>

          {/* BOQ Table by Category */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary-500" /> Bill of Quantities</h3>
              <span className="text-xs text-surface-500">{boqItems.length} line items</span>
            </div>

            <div className="divide-y divide-surface-100 dark:divide-surface-800/50">
              {Object.entries(grouped).map(([category, items]) => {
                const catTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
                const expanded = expandedCategories[category] !== false;
                return (
                  <div key={category}>
                    {/* Category Header */}
                    <button onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {expanded ? <ChevronDown className="w-4 h-4 text-surface-400" /> : <ChevronRight className="w-4 h-4 text-surface-400" />}
                        <span className="text-lg mr-1">{CATEGORY_ICONS[category] || '📦'}</span>
                        <span className="text-sm font-semibold text-surface-900 dark:text-white capitalize">{category}</span>
                        <span className="text-xs text-surface-500">({items.length} items)</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-500">₹{catTotal.toLocaleString()}</span>
                    </button>

                    {/* Items Table */}
                    {expanded && (
                      <div className="px-5 pb-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-surface-500 border-b border-surface-100 dark:border-surface-800">
                              <th className="text-left py-2 font-medium">Item</th>
                              <th className="text-right py-2 font-medium w-16">Unit</th>
                              <th className="text-right py-2 font-medium w-20">Qty</th>
                              <th className="text-right py-2 font-medium w-20">Rate (₹)</th>
                              <th className="text-right py-2 font-medium w-24">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-50 dark:divide-surface-800/30">
                            {items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/20">
                                <td className="py-2 text-surface-800 dark:text-surface-300">
                                  {item.item_name}
                                  {item.description && <span className="text-surface-500 ml-1">({item.description})</span>}
                                </td>
                                <td className="text-right text-surface-500">{item.unit}</td>
                                <td className="text-right text-surface-800 dark:text-surface-300">{item.quantity?.toLocaleString()}</td>
                                <td className="text-right text-surface-800 dark:text-surface-300">{item.rate?.toLocaleString()}</td>
                                <td className="text-right font-medium text-surface-900 dark:text-white">₹{item.amount?.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
