import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft, Zap, Droplets, Wind, Sun, RefreshCw,
  Cable, Plug, Lightbulb, Gauge, PipetteIcon, ShowerHead,
  Thermometer, Fan, SunMedium, Battery, IndianRupee, Leaf
} from 'lucide-react';
import { floorElectricalSummary, FIXTURE_WATTAGES } from '../../utils/electricalCalc';
import { floorPlumbingSummary, FIXTURE_UNITS } from '../../utils/plumbingCalc';
import { floorHVACSummary, COOLING_LOAD_FACTORS } from '../../utils/hvacCalc';
import { solarSystemSummary, PANEL_SPECS, PEAK_SUN_HOURS } from '../../utils/solarCalc';
import api from '../../services/api';

const TABS = [
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'amber' },
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'blue' },
  { id: 'hvac', label: 'HVAC', icon: Wind, color: 'cyan' },
  { id: 'solar', label: 'Solar', icon: Sun, color: 'orange' },
];

export default function MEPDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('electrical');
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState({});

  // Solar parameters
  const [solarParams, setSolarParams] = useState({
    roofArea: 100, city: 'chennai', panelType: 'standard_440', buildingType: 'residential',
  });

  useEffect(() => {
    api.get('/api/projects', { params: { limit: 100 } })
      .then(r => setProjects(r.data.projects || []))
      .catch(() => {});
  }, []);

  // ─── Compute MEP analysis from project data ───
  const computeAnalysis = (project) => {
    // Estimate area from budget (₹1800/sqft average construction cost)
    const estimatedAreaSqft = project.budget > 0
      ? Math.round(project.budget / 1800)
      : Math.round((project.contract_value || 500000) / 1800);
    const areaSqm = Math.round(estimatedAreaSqft * 0.0929);
    const buildingType = project.project_type || 'residential';
    const isCommercial = buildingType === 'commercial' || buildingType === 'industrial';

    // ─── ELECTRICAL (IS 732 based) ───
    const loadPerSqft = isCommercial ? 15 : 8; // watts per sqft
    const connectedLoad = Math.round(estimatedAreaSqft * loadPerSqft);
    const diversityFactor = isCommercial ? 0.7 : 0.6;
    const demandLoad = Math.round(connectedLoad * diversityFactor);
    const totalCurrent = Math.round(demandLoad / (230 * 0.85));
    const numCircuits = Math.max(4, Math.ceil(connectedLoad / 3000));

    const circuits = {};
    const circuitTypes = isCommercial
      ? ['Lighting', 'Power Sockets', 'HVAC', 'UPS', 'DG Backup', 'Lifts']
      : ['Lighting', 'Power Sockets', 'Kitchen', 'AC', 'Water Heater', 'General'];
    circuitTypes.forEach((name, i) => {
      const share = i === 0 ? 0.2 : i === 1 ? 0.25 : 1 / circuitTypes.length;
      const watts = Math.round(connectedLoad * share);
      const current = Math.round(watts / (230 * 0.85) * 10) / 10;
      circuits[name] = {
        totalWatts: watts,
        current,
        cableSize: current > 20 ? '4 sq mm' : current > 10 ? '2.5 sq mm' : '1.5 sq mm',
        mcb: current > 20 ? '32A' : current > 10 ? '16A' : '6A',
        elements: Array(Math.ceil(watts / 500)),
      };
    });

    // ─── PLUMBING (IS 2065 based) ───
    const fixturesPerSqm = isCommercial ? 0.03 : 0.05;
    const totalFixtures = Math.max(4, Math.round(areaSqm * fixturesPerSqm));
    const supplyFU = Math.round(totalFixtures * 3.5);
    const drainFU = Math.round(totalFixtures * 4);
    const mainSupply = supplyFU > 100 ? 50 : supplyFU > 50 ? 32 : 25;
    const mainDrain = drainFU > 100 ? 110 : drainFU > 50 ? 75 : 50;
    const tankCapacity = Math.round(totalFixtures * 135);

    // ─── HVAC ───
    const coolingLoadBTU = isCommercial ? 35 : 25; // BTU/hr per sqft
    const totalBTU = estimatedAreaSqft * coolingLoadBTU;
    const totalTonnage = Math.round(totalBTU / 12000 * 10) / 10;
    const acUnits = Math.ceil(totalTonnage / 1.5);
    const totalPower = Math.round(totalTonnage * 1.2 * 10) / 10; // kW

    return {
      electrical: {
        connectedLoad_kW: (connectedLoad / 1000).toFixed(1),
        demandLoad_kW: (demandLoad / 1000).toFixed(1),
        totalCurrent_A: totalCurrent,
        circuits,
        estimatedArea: estimatedAreaSqft,
        buildingType,
      },
      plumbing: {
        totalFixtures,
        fixtureUnits: { supply: supplyFU, drain: drainFU },
        mainSupplyPipe_mm: mainSupply,
        mainDrainPipe_mm: mainDrain,
        tankCapacity_L: tankCapacity,
        hotWaterRequired: !isCommercial,
      },
      hvac: {
        acUnits,
        totalTonnage,
        ducts: Math.ceil(areaSqm / 15),
        totalPower_kW: totalPower,
        totalBTU,
        coolingLoadPerSqft: coolingLoadBTU,
      },
    };
  };

  const fetchAnalysis = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const projRes = await api.get(`/api/projects/${selectedProject}`);
      const project = projRes.data;
      const results = computeAnalysis(project);
      setAnalysis(results);
    } catch (err) {
      console.error(err);
      setAnalysis({});
    }
    setLoading(false);
  };

  useEffect(() => { if (selectedProject) fetchAnalysis(); }, [selectedProject]);

  // Client-side solar calculation
  const solarSummary = solarSystemSummary(solarParams.roofArea, solarParams.city, solarParams.panelType, solarParams.buildingType);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/bim')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
            <Gauge className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">MEP Dashboard</h1>
            <p className="text-sm text-surface-500">Mechanical · Electrical · Plumbing · Solar</p>
          </div>
        </div>
      </div>

      {/* Project selector */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Select Project</label>
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
            <option value="">Choose project...</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
          </select>
        </div>
        <button onClick={fetchAnalysis} disabled={!selectedProject || loading}
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Analyze
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ ELECTRICAL TAB ═══════ */}
      {activeTab === 'electrical' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Connected Load', value: analysis.electrical?.connectedLoad_kW ? `${analysis.electrical.connectedLoad_kW} kW` : '—', icon: Zap, bg: 'amber' },
              { label: 'Demand Load', value: analysis.electrical?.demandLoad_kW ? `${analysis.electrical.demandLoad_kW} kW` : '—', icon: Gauge, bg: 'orange' },
              { label: 'Total Current', value: analysis.electrical?.totalCurrent_A ? `${analysis.electrical.totalCurrent_A} A` : '—', icon: Cable, bg: 'red' },
              { label: 'Circuits', value: analysis.electrical?.circuits ? Object.keys(analysis.electrical.circuits).length : '—', icon: Plug, bg: 'blue' },
            ].map(({ label, value, icon: Icon, bg }) => (
              <div key={label} className={`bg-${bg}-50 dark:bg-${bg}-900/20 rounded-xl p-4 border border-${bg}-200 dark:border-${bg}-800/50`}>
                <Icon className={`w-5 h-5 text-${bg}-600 dark:text-${bg}-400 mb-2`} />
                <p className="text-xs text-surface-500">{label}</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Circuit Breakdown */}
          {analysis.electrical?.circuits && Object.keys(analysis.electrical.circuits).length > 0 && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Circuit Breakdown</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500">
                    <th className="text-left py-2 px-3">Circuit</th>
                    <th className="text-right py-2 px-3">Load (W)</th>
                    <th className="text-right py-2 px-3">Current (A)</th>
                    <th className="text-left py-2 px-3">Cable</th>
                    <th className="text-left py-2 px-3">MCB</th>
                    <th className="text-right py-2 px-3">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.electrical.circuits).map(([name, circuit]) => (
                    <tr key={name} className="border-b border-surface-100 dark:border-surface-800 text-surface-700 dark:text-surface-300">
                      <td className="py-2 px-3 font-medium">{name}</td>
                      <td className="py-2 px-3 text-right font-mono">{circuit.totalWatts}</td>
                      <td className="py-2 px-3 text-right font-mono">{circuit.current?.toFixed(1)}</td>
                      <td className="py-2 px-3">{circuit.cableSize}</td>
                      <td className="py-2 px-3">{circuit.mcb}</td>
                      <td className="py-2 px-3 text-right">{circuit.elements?.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fixture Wattages Reference */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Standard Fixture Wattages</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(FIXTURE_WATTAGES).slice(0, 16).map(([name, watts]) => (
                <div key={name} className="flex justify-between px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800">
                  <span className="text-surface-600 dark:text-surface-400 capitalize">{name.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-medium text-surface-900 dark:text-white">{watts}W</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ PLUMBING TAB ═══════ */}
      {activeTab === 'plumbing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Fixtures', value: analysis.plumbing?.totalFixtures ?? '—', icon: Droplets, bg: 'blue' },
              { label: 'Supply FU', value: analysis.plumbing?.fixtureUnits?.supply ?? '—', icon: Gauge, bg: 'cyan' },
              { label: 'Main Supply', value: analysis.plumbing?.mainSupplyPipe_mm ? `Ø${analysis.plumbing.mainSupplyPipe_mm}mm` : '—', icon: Cable, bg: 'green' },
              { label: 'Main Drain', value: analysis.plumbing?.mainDrainPipe_mm ? `Ø${analysis.plumbing.mainDrainPipe_mm}mm` : '—', icon: Cable, bg: 'emerald' },
            ].map(({ label, value, icon: Icon, bg }) => (
              <div key={label} className={`bg-${bg}-50 dark:bg-${bg}-900/20 rounded-xl p-4 border border-${bg}-200 dark:border-${bg}-800/50`}>
                <Icon className={`w-5 h-5 text-${bg}-600 dark:text-${bg}-400 mb-2`} />
                <p className="text-xs text-surface-500">{label}</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Fixture Units Reference */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Fixture Units — IS 2065</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500">
                  <th className="text-left py-2 px-3">Fixture</th>
                  <th className="text-right py-2 px-3">Supply FU</th>
                  <th className="text-right py-2 px-3">Drain FU</th>
                  <th className="text-left py-2 px-3">Hot Water</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(FIXTURE_UNITS).map(([name, fu]) => (
                  <tr key={name} className="border-b border-surface-100 dark:border-surface-800 text-surface-700 dark:text-surface-300">
                    <td className="py-2 px-3 capitalize">{name.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-3 text-right font-mono">{fu.fu_supply}</td>
                    <td className="py-2 px-3 text-right font-mono">{fu.fu_drain}</td>
                    <td className="py-2 px-3">{fu.hot ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ HVAC TAB ═══════ */}
      {activeTab === 'hvac' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'AC Units', value: analysis.hvac?.acUnits ?? '—', icon: Thermometer, bg: 'cyan' },
              { label: 'Total Tonnage', value: analysis.hvac?.totalTonnage ? `${analysis.hvac.totalTonnage} TR` : '—', icon: Wind, bg: 'blue' },
              { label: 'Ducts', value: analysis.hvac?.ducts ?? '—', icon: Cable, bg: 'indigo' },
              { label: 'Total Power', value: analysis.hvac?.totalPower_kW ? `${analysis.hvac.totalPower_kW} kW` : '—', icon: Zap, bg: 'amber' },
            ].map(({ label, value, icon: Icon, bg }) => (
              <div key={label} className={`bg-${bg}-50 dark:bg-${bg}-900/20 rounded-xl p-4 border border-${bg}-200 dark:border-${bg}-800/50`}>
                <Icon className={`w-5 h-5 text-${bg}-600 dark:text-${bg}-400 mb-2`} />
                <p className="text-xs text-surface-500">{label}</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Cooling Load Reference */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Cooling Load Factors (BTU/hr/sqft)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(COOLING_LOAD_FACTORS).map(([name, val]) => (
                <div key={name} className="flex justify-between px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800">
                  <span className="text-surface-600 dark:text-surface-400 capitalize">{name.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-medium text-surface-900 dark:text-white">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SOLAR TAB ═══════ */}
      {activeTab === 'solar' && (
        <div className="space-y-6">
          {/* Solar Parameters */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Solar System Designer</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-surface-500">Roof Area (m²)</label>
                <input type="number" value={solarParams.roofArea}
                  onChange={e => setSolarParams(p => ({ ...p, roofArea: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500">City</label>
                <select value={solarParams.city} onChange={e => setSolarParams(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm">
                  {Object.keys(PEAK_SUN_HOURS).filter(c => c !== 'default').map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500">Panel Type</label>
                <select value={solarParams.panelType} onChange={e => setSolarParams(p => ({ ...p, panelType: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm">
                  {Object.keys(PANEL_SPECS).map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')} ({PANEL_SPECS[p].wattage}W)</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500">Building Type</label>
                <select value={solarParams.buildingType} onChange={e => setSolarParams(p => ({ ...p, buildingType: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm">
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>
            </div>
          </div>

          {/* Solar Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'System Size', value: `${solarSummary.totalKWp} kWp`, icon: Sun, bg: 'orange' },
              { label: 'Panels', value: solarSummary.panelCount, icon: SunMedium, bg: 'amber' },
              { label: 'Annual Gen.', value: `${solarSummary.generation.annual_kWh.toLocaleString()} kWh`, icon: Zap, bg: 'yellow' },
              { label: 'Payback', value: `${solarSummary.financial.payback_years} yrs`, icon: IndianRupee, bg: 'green' },
            ].map(({ label, value, icon: Icon, bg }) => (
              <div key={label} className={`bg-${bg}-50 dark:bg-${bg}-900/20 rounded-xl p-4 border border-${bg}-200 dark:border-${bg}-800/50`}>
                <Icon className={`w-5 h-5 text-${bg}-600 dark:text-${bg}-400 mb-2`} />
                <p className="text-xs text-surface-500">{label}</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Financial & Environmental */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-500" /> Financial Analysis
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  ['Panel Cost', `₹${solarSummary.financial.cost.panels.toLocaleString()}`],
                  ['Inverter', `₹${solarSummary.financial.cost.inverter.toLocaleString()}`],
                  ['Structure', `₹${solarSummary.financial.cost.structure.toLocaleString()}`],
                  ['Wiring + Install', `₹${(solarSummary.financial.cost.wiring + solarSummary.financial.cost.installation).toLocaleString()}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-surface-100 dark:border-surface-800">
                    <span className="text-surface-600 dark:text-surface-400">{label}</span>
                    <span className="font-mono text-surface-900 dark:text-white">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold text-lg text-surface-900 dark:text-white">
                  <span>Total Cost</span>
                  <span className="text-green-600">₹{solarSummary.financial.cost.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-surface-600 dark:text-surface-400">Monthly Savings</span>
                  <span className="font-mono text-green-600">₹{solarSummary.financial.savings.monthly_inr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-surface-600 dark:text-surface-400">25-Year Savings</span>
                  <span className="font-mono text-green-600 font-bold">₹{solarSummary.financial.savings.total_25yr_inr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-surface-600 dark:text-surface-400">ROI</span>
                  <span className="font-mono text-green-600 font-bold">{solarSummary.financial.savings.roi_percent}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" /> Environmental Impact
              </h3>
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">{solarSummary.financial.co2_offset_kg_year.toLocaleString()} kg</p>
                  <p className="text-sm text-green-600">CO₂ offset per year</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{solarSummary.financial.co2_offset_tons_25yr}</p>
                    <p className="text-xs text-green-600">Tons CO₂ (25yr)</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{solarSummary.financial.trees_equivalent}</p>
                    <p className="text-xs text-green-600">Trees equivalent</p>
                  </div>
                </div>
              </div>

              {/* Inverter recommendation */}
              <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                <h4 className="font-medium text-surface-700 dark:text-surface-300 mb-2">Inverter Specification</h4>
                <div className="text-sm space-y-1">
                  <p>Type: <span className="font-medium">{solarSummary.inverter.type}</span></p>
                  <p>Recommended: <span className="font-mono font-bold">{solarSummary.inverter.selected_kW} kW</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
