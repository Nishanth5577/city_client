import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBIMProjects } from '../../redux/slices/bimSlice';
import {
  Building2, ArrowLeft, RefreshCw, Download, AlertTriangle,
  Columns3, Layers, Baseline, Gauge, ShieldCheck, Box
} from 'lucide-react';
import {
  totalFloorLoad, seismicBaseShear, windPressure, footingArea, columnAxialLoad,
  beamSizing, columnSizing, SEISMIC_ZONES, CONCRETE_GRADES, STEEL_GRADES,
  LIVE_LOADS, UNIT_WEIGHTS
} from '../../utils/structuralCalc';
import api from '../../services/api';

export default function StructuralDesignPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.bim);
  const [selectedProject, setSelectedProject] = useState('');
  const [structural, setStructural] = useState(null);
  const [loading, setLoading] = useState(false);
  const [columnSchedule, setColumnSchedule] = useState([]);
  const [beamSchedule, setBeamSchedule] = useState([]);

  // Form state for parameters
  const [params, setParams] = useState({
    buildingType: 'residential',
    concreteGrade: 'M25',
    steelGrade: 'Fe500',
    seismicZone: 'III',
    windSpeed: 39,
    soilBearingCapacity: 200,
    slabThickness: 150,
    numFloors: 2,
    floorHeight: 3000,
  });

  useEffect(() => { dispatch(fetchBIMProjects()); }, [dispatch]);

  const generateDesign = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      // Find first building in project
      const projRes = await api.get(`/api/bim/projects/${selectedProject}`);
      const buildingId = projRes.data?.buildings?.[0]?._id || projRes.data?.buildings?.[0];
      if (buildingId) {
        const res = await api.post('/api/bim/structural/generate', { bim_project_id: selectedProject, building_id: buildingId });
        setStructural(res.data);
      }
      // Fetch schedules
      try {
        const colRes = await api.get(`/api/bim/structural/schedule/${selectedProject}/columns`);
        setColumnSchedule(colRes.data || []);
      } catch (e) { setColumnSchedule([]); }
      try {
        const beamRes = await api.get(`/api/bim/structural/schedule/${selectedProject}/beams`);
        setBeamSchedule(beamRes.data || []);
      } catch (e) { setBeamSchedule([]); }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchExisting = async (projectId) => {
    try {
      const res = await api.get(`/api/bim/structural/${projectId}`);
      if (res.data?.length > 0) {
        setStructural(res.data[0]);
        if (res.data[0].load_summary) {
          setParams(p => ({
            ...p,
            concreteGrade: res.data[0].concrete_grade || 'M25',
            steelGrade: res.data[0].steel_grade || 'Fe500',
          }));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (selectedProject) fetchExisting(selectedProject);
  }, [selectedProject]);

  // Client-side calculations
  const floorLoad = totalFloorLoad(params.slabThickness, params.buildingType);
  const totalWeight = floorLoad.total * 100 * params.numFloors;
  const seismic = seismicBaseShear(totalWeight, params.seismicZone);
  const wind = windPressure(params.windSpeed, (params.numFloors * params.floorHeight) / 1000);

  // Sample column calculation (for 3×3m tributary area)
  const tributaryArea = 9;
  const colLoad = columnAxialLoad(tributaryArea, params.numFloors, floorLoad.total);
  const colSize = columnSizing(colLoad, params.concreteGrade, params.steelGrade);
  const footing = footingArea(colLoad, params.soilBearingCapacity);
  const sampleBeam = beamSizing(4000); // 4m span

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/bim')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Structural Design</h1>
            <p className="text-sm text-surface-500">IS 456:2000 | IS 875 | IS 1893</p>
          </div>
        </div>
      </div>

      {/* Project selector + Generate */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Select BIM Project</label>
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
            <option value="">Choose project...</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
          </select>
        </div>
        <button onClick={generateDesign} disabled={!selectedProject || loading}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Generate Design
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters Panel */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-orange-500" /> Parameters
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Building Type', key: 'buildingType', options: Object.keys(LIVE_LOADS) },
              { label: 'Concrete Grade', key: 'concreteGrade', options: Object.keys(CONCRETE_GRADES) },
              { label: 'Steel Grade', key: 'steelGrade', options: Object.keys(STEEL_GRADES) },
              { label: 'Seismic Zone', key: 'seismicZone', options: Object.keys(SEISMIC_ZONES) },
            ].map(({ label, key, options }) => (
              <div key={key}>
                <label className="text-xs font-medium text-surface-500">{label}</label>
                <select value={params[key]} onChange={(e) => setParams(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm text-surface-900 dark:text-white">
                  {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            ))}
            {[
              { label: 'No. of Floors', key: 'numFloors', min: 1, max: 30 },
              { label: 'Floor Height (mm)', key: 'floorHeight', min: 2700, max: 5000, step: 100 },
              { label: 'Slab Thickness (mm)', key: 'slabThickness', min: 100, max: 300, step: 25 },
              { label: 'Wind Speed (m/s)', key: 'windSpeed', min: 33, max: 55 },
              { label: 'SBC (kN/m²)', key: 'soilBearingCapacity', min: 50, max: 500, step: 25 },
            ].map(({ label, key, ...rest }) => (
              <div key={key}>
                <label className="text-xs font-medium text-surface-500">{label}</label>
                <input type="number" value={params[key]}
                  onChange={(e) => setParams(p => ({ ...p, [key]: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm text-surface-900 dark:text-white"
                  {...rest} />
              </div>
            ))}
          </div>
        </div>

        {/* Load Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Load Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Dead Load', value: `${floorLoad.dead.toFixed(2)} kN/m²`, color: 'blue', icon: Layers },
              { label: 'Live Load', value: `${floorLoad.live.toFixed(1)} kN/m²`, color: 'green', icon: Box },
              { label: 'Seismic (V)', value: `${seismic.baseShear.toFixed(1)} kN`, color: 'red', icon: AlertTriangle },
              { label: 'Wind Pressure', value: `${wind.pd_kNm2.toFixed(2)} kN/m²`, color: 'cyan', icon: ShieldCheck },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-xl p-4 border border-${color}-200 dark:border-${color}-800/50`}>
                <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400 mb-2`} />
                <p className="text-xs text-surface-500 dark:text-surface-400">{label}</p>
                <p className="text-lg font-bold text-surface-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Load Breakdown Table */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
              <Baseline className="w-5 h-5 text-orange-500" /> Floor Load Breakdown
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">Component</th>
                  <th className="text-right py-2 px-3 text-surface-500 font-medium">kN/m²</th>
                  <th className="text-left py-2 px-3 text-surface-500 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="text-surface-700 dark:text-surface-300">
                {[
                  ['Slab Self-Weight', ((params.slabThickness / 1000) * 25).toFixed(2), 'IS 875 Pt1'],
                  ['Floor Finish', '1.50', 'Assumed'],
                  ['Ceiling Plaster', '0.50', 'IS 875 Pt1'],
                  ['Partition Load', '1.50', 'IS 875 Pt2'],
                  ['Live Load', floorLoad.live.toFixed(1), 'IS 875 Pt2'],
                ].map(([name, val, ref]) => (
                  <tr key={name} className="border-b border-surface-100 dark:border-surface-800">
                    <td className="py-2 px-3">{name}</td>
                    <td className="py-2 px-3 text-right font-mono">{val}</td>
                    <td className="py-2 px-3 text-xs text-surface-400">{ref}</td>
                  </tr>
                ))}
                <tr className="font-bold text-surface-900 dark:text-white bg-surface-50 dark:bg-surface-800/50">
                  <td className="py-2 px-3">Total</td>
                  <td className="py-2 px-3 text-right font-mono">{floorLoad.total.toFixed(2)}</td>
                  <td className="py-2 px-3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Seismic Analysis */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Seismic Analysis — IS 1893:2016</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-surface-500">Zone</span><p className="font-semibold">{params.seismicZone} — {SEISMIC_ZONES[params.seismicZone]?.desc}</p></div>
              <div><span className="text-surface-500">Zone Factor (Z)</span><p className="font-semibold">{SEISMIC_ZONES[params.seismicZone]?.factor}</p></div>
              <div><span className="text-surface-500">Ah</span><p className="font-semibold">{seismic.Ah.toFixed(4)}</p></div>
              <div><span className="text-surface-500">Base Shear (V)</span><p className="font-semibold text-red-600">{seismic.baseShear.toFixed(1)} kN</p></div>
            </div>
          </div>

          {/* Preliminary Sizing */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
              <Columns3 className="w-5 h-5 text-orange-500" /> Preliminary Member Sizing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Column (3×3m tributary)</h4>
                <p>Axial Load: <span className="font-mono font-bold">{colLoad.toFixed(1)} kN</span></p>
                <p>Required Size: <span className="font-mono font-bold">{colSize.side_mm} × {colSize.side_mm} mm</span></p>
                <p>Grade: {params.concreteGrade} / {params.steelGrade}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Beam (4m span)</h4>
                <p>Depth: <span className="font-mono font-bold">{sampleBeam.depth_mm} mm</span></p>
                <p>Width: <span className="font-mono font-bold">{sampleBeam.width_mm} mm</span></p>
                <p>Type: Simply Supported</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2">Footing (Isolated)</h4>
                <p>Required Area: <span className="font-mono font-bold">{footing.area_sqm} m²</span></p>
                <p>Size: <span className="font-mono font-bold">{footing.side_mm} × {footing.side_mm} mm</span></p>
                <p>SBC: {params.soilBearingCapacity} kN/m²</p>
              </div>
            </div>
          </div>

          {/* Column Schedule */}
          {columnSchedule.length > 0 && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Column Schedule</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500">
                      <th className="text-left py-2 px-3">Floor</th>
                      <th className="text-left py-2 px-3">Shape</th>
                      <th className="text-right py-2 px-3">Width</th>
                      <th className="text-right py-2 px-3">Depth</th>
                      <th className="text-left py-2 px-3">Material</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columnSchedule.map((col, i) => (
                      <tr key={i} className="border-b border-surface-100 dark:border-surface-800 text-surface-700 dark:text-surface-300">
                        <td className="py-2 px-3">{col.floor || `Level ${col.level}`}</td>
                        <td className="py-2 px-3 capitalize">{col.shape || 'rectangular'}</td>
                        <td className="py-2 px-3 text-right font-mono">{col.width} mm</td>
                        <td className="py-2 px-3 text-right font-mono">{col.depth || col.width} mm</td>
                        <td className="py-2 px-3">{col.material || 'RCC'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Beam Schedule */}
          {beamSchedule.length > 0 && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Beam Schedule</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500">
                      <th className="text-left py-2 px-3">Floor</th>
                      <th className="text-right py-2 px-3">Width</th>
                      <th className="text-right py-2 px-3">Depth</th>
                      <th className="text-right py-2 px-3">Span</th>
                      <th className="text-left py-2 px-3">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beamSchedule.map((beam, i) => (
                      <tr key={i} className="border-b border-surface-100 dark:border-surface-800 text-surface-700 dark:text-surface-300">
                        <td className="py-2 px-3">{beam.floor || `Level ${beam.level}`}</td>
                        <td className="py-2 px-3 text-right font-mono">{beam.width} mm</td>
                        <td className="py-2 px-3 text-right font-mono">{beam.depth} mm</td>
                        <td className="py-2 px-3 text-right font-mono">{beam.span} mm</td>
                        <td className="py-2 px-3 capitalize">{beam.beam_type || 'simply_supported'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
