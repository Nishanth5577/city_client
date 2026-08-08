import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBIMProjects } from '../../redux/slices/bimSlice';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Sparkles, Wand2, Home, LayoutGrid, Compass, Sun, Lightbulb,
  CheckCircle2, AlertTriangle, Info, ArrowRight, RefreshCw, Download, ChevronDown
} from 'lucide-react';
import api from '../../services/api';

const UNIT_TYPES = ['1BHK', '2BHK', '3BHK', '4BHK'];
const STYLES = [
  { id: 'modern', label: 'Modern', desc: 'Open plans, clean lines, contemporary finishes' },
  { id: 'traditional', label: 'Traditional', desc: 'Vastu-compliant, natural materials, classic proportions' },
  { id: 'minimal', label: 'Minimalist', desc: 'Efficient space, concealed storage, less is more' },
];
const FACINGS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];

export default function AIArchitectPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.bim);
  const [selectedProject, setSelectedProject] = useState('');

  // AI Plan Generation form
  const [formData, setFormData] = useState({
    unit_type: '2BHK', total_area_sqft: 1000, plot_width_ft: 40, plot_depth_ft: 25,
    facing: 'North', vastu_compliant: true, style: 'modern',
    include_pooja: false, include_study: false, include_servant: false,
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [vastuResult, setVastuResult] = useState(null);
  const [activeTab, setActiveTab] = useState('generate');

  useEffect(() => { dispatch(fetchBIMProjects()); }, [dispatch]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/api/bim/ai/generate-plan', formData);
      setGeneratedPlan(data);
      toast.success(`Floor plan generated! ${data.element_summary.rooms} rooms, ${data.element_summary.walls} walls`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed. Please try again.');
    }
    setGenerating(false);
  };

  const handleSaveAndOpen = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/api/bim/ai/generate-and-save', {
        ...formData,
        design_name: `AI ${formData.unit_type} — ${formData.total_area_sqft} sqft`,
      });
      toast.success('Project saved! Opening in BIM Studio...');
      setTimeout(() => navigate(`/bim/studio/${data.bim_project._id}`), 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    }
    setSaving(false);
  };

  const fetchSuggestions = async (pid) => {
    try {
      const { data } = await api.get(`/api/bim/ai/suggestions/${pid}`);
      setSuggestions(data);
    } catch (err) { toast.error('Failed to load suggestions'); }
  };

  const fetchVastu = async (pid) => {
    try {
      const { data } = await api.get(`/api/bim/ai/vastu/${pid}`, { params: { facing: formData.facing } });
      setVastuResult(data);
    } catch (err) { toast.error('Failed to load Vastu analysis'); }
  };

  useEffect(() => {
    if (selectedProject && activeTab === 'suggestions') fetchSuggestions(selectedProject);
    if (selectedProject && activeTab === 'vastu') fetchVastu(selectedProject);
  }, [selectedProject, activeTab]);

  const updateForm = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  // ═══ Professional CAD-Style SVG Renderer ═══
  const PlanPreview = useMemo(() => {
    if (!generatedPlan) return null;
    const { plot_dimensions, rooms, doors, windows, furniture, columns, stairs, walls } = generatedPlan;
    const pw = plot_dimensions.width_mm;
    const pd = plot_dimensions.depth_mm;
    const margin = 120; // SVG margin for dimensions/labels
    const sc = 520 / Math.max(pw, pd); // scale mm→SVG
    const svgW = pw * sc + margin * 2 + 200; // extra for legend
    const svgH = pd * sc + margin * 2 + 80; // extra for title block
    const ox = margin, oy = margin; // origin offset

    const roomFills = { living: '#E8F4FD', bedroom: '#FDF2E8', kitchen: '#E8FDF0', bathroom: '#F0E8FD', balcony: '#FDFDE8', passage: '#F8F8F8', study: '#E8EDF8', pooja: '#FDF8E0', utility: '#F0F0F0' };
    const toX = (mm) => ox + mm * sc;
    const toY = (mm) => oy + mm * sc;

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full mx-auto bg-white" style={{ maxHeight: '700px' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrowS" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4" fill="#666" /></marker>
          <marker id="arrowE" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M6,0 L0,2 L6,4" fill="#666" /></marker>
          <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#DDD" strokeWidth="0.5" /></pattern>
        </defs>

        {/* ── Grid lines (structural) ── */}
        {rooms && (() => {
          const xs = [...new Set(rooms.flatMap(r => [r.x, r.x + r.width]))].sort((a, b) => a - b);
          const ys = [...new Set(rooms.flatMap(r => [r.y, r.y + r.depth]))].sort((a, b) => a - b);
          return (<g opacity="0.15">
            {xs.map((x, i) => <line key={`gx${i}`} x1={toX(x)} y1={oy - 30} x2={toX(x)} y2={toY(pd) + 20} stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="8,4" />)}
            {ys.map((y, i) => <line key={`gy${i}`} x1={ox - 30} y1={toY(y)} x2={toX(pw) + 20} y2={toY(y)} stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="8,4" />)}
          </g>);
        })()}

        {/* ── Plot boundary (dashed) ── */}
        <rect x={toX(0)} y={toY(0)} width={pw * sc} height={pd * sc} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="10,5" />

        {/* ── Room fills ── */}
        {rooms?.map((room, i) => (
          <rect key={`rf${i}`} x={toX(room.x)} y={toY(room.y)} width={room.width * sc} height={room.depth * sc}
            fill={roomFills[room.type] || '#F8F8F8'} stroke="none" />
        ))}

        {/* ── Walls (thick lines with proper thickness) ── */}
        {walls?.map((wall, i) => {
          const isExt = wall.wall_type === 'exterior';
          const t = (wall.thickness || 230) * sc;
          const x1 = toX(wall.start_point.x), y1 = toY(wall.start_point.y);
          const x2 = toX(wall.end_point.x), y2 = toY(wall.end_point.y);
          const isHoriz = Math.abs(y1 - y2) < 2;
          const isVert = Math.abs(x1 - x2) < 2;
          if (isHoriz) {
            const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            return <rect key={`w${i}`} x={minX} y={y1 - t / 2} width={maxX - minX} height={Math.max(t, isExt ? 3 : 2)} fill={isExt ? '#1A1A1A' : '#404040'} />;
          }
          if (isVert) {
            const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            return <rect key={`w${i}`} x={x1 - t / 2} y={minY} width={Math.max(t, isExt ? 3 : 2)} height={maxY - minY} fill={isExt ? '#1A1A1A' : '#404040'} />;
          }
          return <line key={`w${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1A1A1A" strokeWidth={isExt ? 3 : 2} />;
        })}

        {/* ── Columns (filled squares) ── */}
        {columns?.map((col, i) => {
          const cs = (col.width || 300) * sc;
          return <rect key={`c${i}`} x={toX(col.position.x) - cs / 2} y={toY(col.position.y) - cs / 2} width={Math.max(cs, 4)} height={Math.max(cs, 4)} fill="#333" stroke="#111" strokeWidth="0.5" />;
        })}

        {/* ── Doors (arc + leaf) ── */}
        {doors?.map((door, i) => {
          const dx = toX(door.position.x), dy = toY(door.position.y);
          const dw = door.width * sc;
          const isVert = door.rotation === 90;
          const isMain = door.door_type === 'main';
          const arcR = dw * 0.9;
          if (isVert) {
            return (<g key={`d${i}`}>
              <line x1={dx} y1={dy} x2={dx} y2={dy + dw} stroke="none" />
              <rect x={dx - 1} y={dy} width={2} height={dw} fill="white" />
              <line x1={dx} y1={dy} x2={dx + arcR * 0.7} y2={dy} stroke={isMain ? '#DC2626' : '#2563EB'} strokeWidth={isMain ? 1.5 : 1} />
              <path d={`M ${dx + arcR * 0.7} ${dy} A ${arcR * 0.7} ${arcR * 0.7} 0 0 1 ${dx} ${dy + dw}`} fill="none" stroke={isMain ? '#DC2626' : '#2563EB'} strokeWidth="0.8" strokeDasharray={isMain ? '' : '3,2'} />
            </g>);
          }
          return (<g key={`d${i}`}>
            <rect x={dx} y={dy - 1} width={dw} height={2} fill="white" />
            <line x1={dx} y1={dy} x2={dx} y2={dy - arcR * 0.7} stroke={isMain ? '#DC2626' : '#2563EB'} strokeWidth={isMain ? 1.5 : 1} />
            <path d={`M ${dx} ${dy - arcR * 0.7} A ${arcR * 0.7} ${arcR * 0.7} 0 0 1 ${dx + dw} ${dy}`} fill="none" stroke={isMain ? '#DC2626' : '#2563EB'} strokeWidth="0.8" strokeDasharray={isMain ? '' : '3,2'} />
          </g>);
        })}

        {/* ── Windows (3 parallel lines) ── */}
        {windows?.map((win, i) => {
          const wx = toX(win.position.x), wy = toY(win.position.y);
          const ww = win.width * sc;
          const isVert = win.rotation === 90;
          const isVent = win.window_type === 'ventilator';
          const gap = isVent ? 1.5 : 2;
          if (isVert) {
            return (<g key={`wn${i}`}>
              <rect x={wx - gap - 1} y={wy - ww / 2} width={gap * 2 + 2} height={ww} fill="white" />
              <line x1={wx - gap} y1={wy - ww / 2} x2={wx - gap} y2={wy + ww / 2} stroke="#0EA5E9" strokeWidth="1" />
              <line x1={wx} y1={wy - ww / 2} x2={wx} y2={wy + ww / 2} stroke="#0EA5E9" strokeWidth="0.5" />
              <line x1={wx + gap} y1={wy - ww / 2} x2={wx + gap} y2={wy + ww / 2} stroke="#0EA5E9" strokeWidth="1" />
            </g>);
          }
          return (<g key={`wn${i}`}>
            <rect x={wx - ww / 2} y={wy - gap - 1} width={ww} height={gap * 2 + 2} fill="white" />
            <line x1={wx - ww / 2} y1={wy - gap} x2={wx + ww / 2} y2={wy - gap} stroke="#0EA5E9" strokeWidth="1" />
            <line x1={wx - ww / 2} y1={wy} x2={wx + ww / 2} y2={wy} stroke="#0EA5E9" strokeWidth="0.5" />
            <line x1={wx - ww / 2} y1={wy + gap} x2={wx + ww / 2} y2={wy + gap} stroke="#0EA5E9" strokeWidth="1" />
          </g>);
        })}

        {/* ── Furniture symbols ── */}
        {furniture?.map((f, i) => {
          const fx = toX(f.position.x), fy = toY(f.position.y);
          const fw = (f.width || 600) * sc, fd = (f.depth || 600) * sc;
          const t = f.type || f.furniture_type;
          if (t === 'bed') return (<g key={`f${i}`}><rect x={fx - fw / 2} y={fy - fd / 2} width={fw} height={fd} fill="none" stroke="#A0A0A0" strokeWidth="0.5" /><rect x={fx - fw / 2 + 2} y={fy - fd / 2 + 2} width={fw / 2 - 3} height={fd * 0.3} fill="none" stroke="#B0B0B0" strokeWidth="0.5" rx="2" /><rect x={fx + 1} y={fy - fd / 2 + 2} width={fw / 2 - 3} height={fd * 0.3} fill="none" stroke="#B0B0B0" strokeWidth="0.5" rx="2" /></g>);
          if (t === 'sofa') return (<g key={`f${i}`}><rect x={fx - fw / 2} y={fy - fd / 2} width={fw} height={fd} fill="none" stroke="#A0A0A0" strokeWidth="0.5" rx="2" /><rect x={fx - fw / 2 + 2} y={fy - fd / 2 + fd * 0.5} width={fw - 4} height={fd * 0.45} fill="none" stroke="#C0C0C0" strokeWidth="0.3" rx="1" /></g>);
          if (t === 'toilet') return (<g key={`f${i}`}><ellipse cx={fx} cy={fy + fd * 0.1} rx={fw * 0.4} ry={fd * 0.35} fill="none" stroke="#A0A0A0" strokeWidth="0.5" /><rect x={fx - fw * 0.3} y={fy - fd * 0.45} width={fw * 0.6} height={fd * 0.3} fill="none" stroke="#A0A0A0" strokeWidth="0.5" /></g>);
          if (t === 'wash_basin') return (<g key={`f${i}`}><ellipse cx={fx} cy={fy} rx={fw * 0.35} ry={fd * 0.3} fill="none" stroke="#A0A0A0" strokeWidth="0.5" /><rect x={fx - fw * 0.4} y={fy - fd * 0.45} width={fw * 0.8} height={fd * 0.9} fill="none" stroke="#B0B0B0" strokeWidth="0.3" rx="2" /></g>);
          if (t === 'kitchen_cabinets') return (<g key={`f${i}`}><rect x={fx - fw / 2} y={fy - fd / 2} width={fw} height={fd} fill="none" stroke="#A0A0A0" strokeWidth="0.5" /><line x1={fx - fw / 2} y1={fy} x2={fx + fw / 2} y2={fy} stroke="#C0C0C0" strokeWidth="0.3" /><circle cx={fx + fw * 0.15} cy={fy - fd * 0.15} r={fd * 0.12} fill="none" stroke="#B0B0B0" strokeWidth="0.3" /></g>);
          if (t === 'wardrobe') return (<g key={`f${i}`}><rect x={fx - fw / 2} y={fy - fd / 2} width={fw} height={fd} fill="none" stroke="#A0A0A0" strokeWidth="0.5" /><line x1={fx} y1={fy - fd / 2} x2={fx} y2={fy + fd / 2} stroke="#C0C0C0" strokeWidth="0.3" /></g>);
          if (t === 'refrigerator') return (<rect key={`f${i}`} x={fx - fw / 2} y={fy - fd / 2} width={fw} height={fd} fill="none" stroke="#A0A0A0" strokeWidth="0.5" rx="1" />);
          // Generic
          return <rect key={`f${i}`} x={fx - fw / 2} y={fy - fd / 2} width={fw} height={fd} fill="none" stroke="#C0C0C0" strokeWidth="0.4" strokeDasharray="2,1" />;
        })}

        {/* ── Staircase ── */}
        {stairs?.map((st, i) => {
          const sx = toX(st.position.x), sy = toY(st.position.y);
          const sw = st.width * sc, sd = st.depth * sc;
          const steps = st.num_risers || 12;
          const stepD = sd / steps;
          return (<g key={`st${i}`}>
            <rect x={sx} y={sy} width={sw} height={sd} fill="none" stroke="#666" strokeWidth="0.8" />
            {Array.from({ length: steps }).map((_, j) => <line key={j} x1={sx} y1={sy + j * stepD} x2={sx + sw} y2={sy + j * stepD} stroke="#999" strokeWidth="0.3" />)}
            <line x1={sx + sw / 2} y1={sy + sd} x2={sx + sw / 2} y2={sy + sd * 0.2} stroke="#666" strokeWidth="0.8" markerEnd="url(#arrowS)" />
            <text x={sx + sw / 2} y={sy + sd / 2} textAnchor="middle" fill="#888" fontSize="5" transform={`rotate(-90 ${sx + sw / 2} ${sy + sd / 2})`}>UP</text>
          </g>);
        })}

        {/* ── Room labels ── */}
        {rooms?.map((room, i) => {
          const cx = toX(room.x + room.width / 2);
          const cy = toY(room.y + room.depth / 2);
          return (<g key={`rl${i}`}>
            <text x={cx} y={cy - 5} textAnchor="middle" fill="#1E293B" fontSize="6.5" fontWeight="600" fontFamily="Inter, sans-serif">{room.name}</text>
            <text x={cx} y={cy + 4} textAnchor="middle" fill="#64748B" fontSize="5" fontFamily="Inter, sans-serif">{room.area_sqft || room.actual_area_sqft} sqft</text>
            <text x={cx} y={cy + 11} textAnchor="middle" fill="#94A3B8" fontSize="4" fontFamily="Inter, sans-serif">{(room.width / 1000).toFixed(1)}m × {(room.depth / 1000).toFixed(1)}m</text>
          </g>);
        })}

        {/* ── Overall dimensions ── */}
        {(() => {
          const dimY = toY(pd) + 25;
          const dimX = toX(0) - 25;
          const eX1 = toX(0), eX2 = toX(pw);
          const eY1 = toY(0), eY2 = toY(pd);
          return (<g fill="#666" fontSize="5" fontFamily="Inter, sans-serif">
            {/* Bottom dimension */}
            <line x1={eX1} y1={dimY - 5} x2={eX1} y2={dimY + 5} stroke="#888" strokeWidth="0.4" />
            <line x1={eX2} y1={dimY - 5} x2={eX2} y2={dimY + 5} stroke="#888" strokeWidth="0.4" />
            <line x1={eX1} y1={dimY} x2={eX2} y2={dimY} stroke="#888" strokeWidth="0.5" markerStart="url(#arrowE)" markerEnd="url(#arrowS)" />
            <text x={(eX1 + eX2) / 2} y={dimY - 3} textAnchor="middle" fill="#555" fontSize="5.5" fontWeight="500">{(pw / 1000).toFixed(1)}m ({generatedPlan.plot_dimensions.width_ft} ft)</text>
            {/* Left dimension */}
            <line x1={dimX - 5} y1={eY1} x2={dimX + 5} y2={eY1} stroke="#888" strokeWidth="0.4" />
            <line x1={dimX - 5} y1={eY2} x2={dimX + 5} y2={eY2} stroke="#888" strokeWidth="0.4" />
            <line x1={dimX} y1={eY1} x2={dimX} y2={eY2} stroke="#888" strokeWidth="0.5" markerStart="url(#arrowE)" markerEnd="url(#arrowS)" />
            <text x={dimX - 3} y={(eY1 + eY2) / 2} textAnchor="middle" fill="#555" fontSize="5.5" fontWeight="500" transform={`rotate(-90 ${dimX - 3} ${(eY1 + eY2) / 2})`}>{(pd / 1000).toFixed(1)}m ({generatedPlan.plot_dimensions.depth_ft} ft)</text>
          </g>);
        })()}

        {/* ── North Arrow (compass rose) ── */}
        {(() => {
          const nax = toX(pw) + 50, nay = oy + 30;
          return (<g transform={`translate(${nax}, ${nay})`}>
            <circle r="16" fill="none" stroke="#CBD5E1" strokeWidth="0.5" />
            <polygon points="0,-14 -4,-2 0,-5 4,-2" fill="#DC2626" stroke="#DC2626" strokeWidth="0.5" />
            <polygon points="0,14 -4,2 0,5 4,2" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5" />
            <text y="-17" textAnchor="middle" fill="#DC2626" fontSize="6" fontWeight="bold" fontFamily="Inter, sans-serif">N</text>
            <text y="22" textAnchor="middle" fill="#94A3B8" fontSize="4.5">S</text>
            <text x="20" y="2" textAnchor="middle" fill="#94A3B8" fontSize="4.5">E</text>
            <text x="-20" y="2" textAnchor="middle" fill="#94A3B8" fontSize="4.5">W</text>
          </g>);
        })()}

        {/* ── Scale Bar ── */}
        {(() => {
          const sbx = toX(0), sby = toY(pd) + 50;
          const meterPx = 1000 * sc;
          return (<g>
            <rect x={sbx} y={sby} width={meterPx} height={3} fill="#333" />
            <rect x={sbx + meterPx} y={sby} width={meterPx} height={3} fill="none" stroke="#333" strokeWidth="0.5" />
            <text x={sbx} y={sby + 10} textAnchor="start" fill="#555" fontSize="4.5" fontFamily="Inter, sans-serif">0</text>
            <text x={sbx + meterPx} y={sby + 10} textAnchor="middle" fill="#555" fontSize="4.5" fontFamily="Inter, sans-serif">1m</text>
            <text x={sbx + meterPx * 2} y={sby + 10} textAnchor="middle" fill="#555" fontSize="4.5" fontFamily="Inter, sans-serif">2m</text>
            <text x={sbx + meterPx * 2 + 15} y={sby + 10} fill="#888" fontSize="4">SCALE</text>
          </g>);
        })()}

        {/* ── Title Block ── */}
        {(() => {
          const tbx = toX(pw) + 30, tby = oy + 70;
          return (<g fontFamily="Inter, sans-serif">
            <rect x={tbx} y={tby} width={140} height={svgH - tby - 20} fill="none" stroke="#CBD5E1" strokeWidth="0.5" />
            <text x={tbx + 70} y={tby + 12} textAnchor="middle" fill="#1E293B" fontSize="7" fontWeight="700">AI ARCHITECT</text>
            <line x1={tbx} y1={tby + 16} x2={tbx + 140} y2={tby + 16} stroke="#CBD5E1" strokeWidth="0.3" />
            <text x={tbx + 5} y={tby + 26} fill="#64748B" fontSize="4.5">Unit: {generatedPlan.unit_type}</text>
            <text x={tbx + 5} y={tby + 34} fill="#64748B" fontSize="4.5">Area: {generatedPlan.total_area_sqft} sqft</text>
            <text x={tbx + 5} y={tby + 42} fill="#64748B" fontSize="4.5">Facing: {generatedPlan.facing}</text>
            <text x={tbx + 5} y={tby + 50} fill="#64748B" fontSize="4.5">Style: {generatedPlan.style}</text>
            <text x={tbx + 5} y={tby + 58} fill="#64748B" fontSize="4.5">Vastu: {generatedPlan.vastu_compliant ? '✓ Yes' : '✗ No'}</text>
            <line x1={tbx} y1={tby + 63} x2={tbx + 140} y2={tby + 63} stroke="#CBD5E1" strokeWidth="0.3" />
            <text x={tbx + 70} y={tby + 73} textAnchor="middle" fill="#1E293B" fontSize="5" fontWeight="600">LEGEND</text>
            <rect x={tbx + 5} y={tby + 78} width={12} height={3} fill="#1A1A1A" /><text x={tbx + 22} y={tby + 82} fill="#64748B" fontSize="4">Ext. Wall (230)</text>
            <rect x={tbx + 5} y={tby + 87} width={12} height={2} fill="#404040" /><text x={tbx + 22} y={tby + 91} fill="#64748B" fontSize="4">Int. Wall (150)</text>
            <line x1={tbx + 5} y1={tby + 97} x2={tbx + 17} y2={tby + 97} stroke="#2563EB" strokeWidth="0.8" /><text x={tbx + 22} y={tby + 100} fill="#64748B" fontSize="4">Door</text>
            <line x1={tbx + 5} y1={tby + 106} x2={tbx + 17} y2={tby + 106} stroke="#0EA5E9" strokeWidth="0.8" /><text x={tbx + 22} y={tby + 109} fill="#64748B" fontSize="4">Window</text>
            <rect x={tbx + 5} y={tby + 113} width={6} height={6} fill="#333" /><text x={tbx + 22} y={tby + 119} fill="#64748B" fontSize="4">Column (300×300)</text>
            <line x1={tbx + 5} y1={tby + 127} x2={tbx + 17} y2={tby + 127} stroke="#DC2626" strokeWidth="1" /><text x={tbx + 22} y={tby + 130} fill="#64748B" fontSize="4">Main Entrance</text>
            <line x1={tbx} y1={tby + 135} x2={tbx + 140} y2={tby + 135} stroke="#CBD5E1" strokeWidth="0.3" />
            <text x={tbx + 70} y={tby + 145} textAnchor="middle" fill="#1E293B" fontSize="5" fontWeight="600">AREA SCHEDULE</text>
            {rooms?.slice(0, 12).map((r, i) => (
              <g key={`as${i}`}>
                <text x={tbx + 5} y={tby + 155 + i * 9} fill="#475569" fontSize="4">{r.name}</text>
                <text x={tbx + 135} y={tby + 155 + i * 9} textAnchor="end" fill="#1E293B" fontSize="4" fontWeight="500">{r.area_sqft || r.actual_area_sqft} sqft</text>
              </g>
            ))}
            <line x1={tbx} y1={tby + 155 + Math.min(rooms?.length || 0, 12) * 9 + 3} x2={tbx + 140} y2={tby + 155 + Math.min(rooms?.length || 0, 12) * 9 + 3} stroke="#CBD5E1" strokeWidth="0.3" />
            <text x={tbx + 5} y={tby + 155 + Math.min(rooms?.length || 0, 12) * 9 + 12} fill="#1E293B" fontSize="4.5" fontWeight="600">Total: {generatedPlan.total_area_sqft} sqft</text>
          </g>);
        })()}
      </svg>
    );
  }, [generatedPlan]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/bim')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">AI Architect</h1>
            <p className="text-sm text-surface-500">Generate · Analyze · Optimize</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
        {[
          { id: 'generate', label: 'Generate Floor Plan', icon: Wand2 },
          { id: 'suggestions', label: 'Design Suggestions', icon: Lightbulb },
          { id: 'vastu', label: 'Vastu Analysis', icon: Compass },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ GENERATE TAB ═══ */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm space-y-5">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-violet-500" /> Configuration
            </h3>

            {/* Unit Type */}
            <div>
              <label className="text-xs font-medium text-surface-500 mb-2 block">Unit Type</label>
              <div className="grid grid-cols-4 gap-2">
                {UNIT_TYPES.map(t => (
                  <button key={t} onClick={() => updateForm('unit_type', t)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${formData.unit_type === t
                      ? 'bg-violet-600 text-white shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Area & Plot */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-surface-500">Total Area (sqft)</label>
                <input type="number" value={formData.total_area_sqft} onChange={e => updateForm('total_area_sqft', +e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500">Plot Width (ft)</label>
                <input type="number" value={formData.plot_width_ft} onChange={e => updateForm('plot_width_ft', +e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500">Plot Depth (ft)</label>
                <input type="number" value={formData.plot_depth_ft} onChange={e => updateForm('plot_depth_ft', +e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm mt-1" />
              </div>
            </div>

            {/* Facing */}
            <div>
              <label className="text-xs font-medium text-surface-500 mb-2 block">Main Facing</label>
              <div className="grid grid-cols-4 gap-2">
                {FACINGS.map(f => (
                  <button key={f} onClick={() => updateForm('facing', f)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${formData.facing === f
                      ? 'bg-amber-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <label className="text-xs font-medium text-surface-500 mb-2 block">Design Style</label>
              <div className="space-y-2">
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => updateForm('style', s.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${formData.style === s.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'}`}>
                    <p className={`text-sm font-medium ${formData.style === s.id ? 'text-violet-700 dark:text-violet-400' : 'text-surface-700 dark:text-surface-300'}`}>{s.label}</p>
                    <p className="text-xs text-surface-500">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'vastu_compliant', label: 'Vastu Compliant' },
                { key: 'include_pooja', label: 'Include Pooja Room' },
                { key: 'include_study', label: 'Include Study' },
                { key: 'include_servant', label: 'Servant Room' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData[opt.key]} onChange={e => updateForm(opt.key, e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-violet-600 focus:ring-violet-500" />
                  <span className="text-sm text-surface-700 dark:text-surface-300">{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={generating || saving}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20">
              {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generating ? 'Generating...' : generatedPlan ? 'Regenerate Floor Plan' : 'Generate Floor Plan'}
            </button>

            {/* Save & Open in Studio */}
            {generatedPlan && (
              <button onClick={handleSaveAndOpen} disabled={saving || generating}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {saving ? 'Saving & Creating Project...' : 'Save & Open in BIM Studio'}
              </button>
            )}
          </div>

          {/* Result */}
          <div className="space-y-4">
            {generatedPlan ? (
              <>
                {/* Plan Preview */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-violet-500" /> Generated Layout
                  </h3>
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
                    {PlanPreview}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4 text-center">
                    {Object.entries(generatedPlan.element_summary).map(([key, val]) => (
                      <div key={key} className="bg-surface-50 dark:bg-surface-800 rounded-lg p-2">
                        <p className="text-lg font-bold text-surface-900 dark:text-white">{val}</p>
                        <p className="text-xs text-surface-500 capitalize">{key}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Room Table */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Room Schedule</h3>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500">
                      <th className="text-left py-1.5">#</th><th className="text-left py-1.5">Room</th><th className="text-right py-1.5">Area (sqft)</th>
                      <th className="text-right py-1.5">W (mm)</th><th className="text-right py-1.5">D (mm)</th><th className="text-right py-1.5">Zone</th>
                    </tr></thead>
                    <tbody>{generatedPlan.rooms.map((r, i) => (
                      <tr key={i} className="border-b border-surface-100 dark:border-surface-800 text-surface-700 dark:text-surface-300">
                        <td className="py-1.5 text-surface-400 font-mono text-xs">{i + 1}</td><td className="py-1.5">{r.name}</td><td className="text-right font-mono">{r.area_sqft || r.actual_area_sqft}</td>
                        <td className="text-right font-mono text-xs">{r.width}</td><td className="text-right font-mono text-xs">{r.depth}</td>
                        <td className="text-right font-mono text-xs">{r.zone || '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>

                {/* Vastu Analysis */}
                {generatedPlan.vastu_analysis && (
                  <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-amber-500" /> Vastu Score: {generatedPlan.vastu_analysis.percentage}%
                    </h3>
                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2.5 mb-3">
                      <div className="bg-gradient-to-r from-amber-500 to-green-500 h-2.5 rounded-full transition-all" style={{ width: `${generatedPlan.vastu_analysis.percentage}%` }} />
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {generatedPlan.vastu_analysis.compliance?.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-surface-600 dark:text-surface-400">{c.message}</span>
                        </div>
                      ))}
                      {generatedPlan.vastu_analysis.violations?.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-red-600 dark:text-red-400">{v.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Design Suggestions */}
                {generatedPlan.suggestions && (
                  <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" /> Design Suggestions
                    </h3>
                    <div className="space-y-2">
                      {generatedPlan.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium flex-shrink-0">{s.category}</span>
                          <span className="text-surface-600 dark:text-surface-400">{s.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-12 text-center shadow-sm">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-violet-300 dark:text-violet-700" />
                <p className="text-lg font-semibold text-surface-700 dark:text-surface-300">Configure & Generate</p>
                <p className="text-sm text-surface-400 mt-1">Set your requirements and click Generate to create an AI floor plan</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SUGGESTIONS TAB ═══ */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Select Project</label>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
                <option value="">Choose project...</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
              </select>
            </div>
          </div>

          {suggestions ? (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">AI Suggestions for {suggestions.project_name}</h3>
              <div className="space-y-3">
                {suggestions.suggestions?.map((s, i) => {
                  const iconMap = { warning: AlertTriangle, tip: Lightbulb, info: Info };
                  const colorMap = { warning: 'amber', tip: 'green', info: 'blue' };
                  const Icon = iconMap[s.type] || Info;
                  const color = colorMap[s.type] || 'blue';
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800/50`}>
                      <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400 flex-shrink-0 mt-0.5`} />
                      <div>
                        <span className={`text-xs font-medium text-${color}-700 dark:text-${color}-400 uppercase`}>{s.category}</span>
                        <p className="text-sm text-surface-700 dark:text-surface-300 mt-0.5">{s.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-12 text-center text-surface-400">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a project to get AI design suggestions</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ VASTU TAB ═══ */}
      {activeTab === 'vastu' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Select Project</label>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
                <option value="">Choose project...</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Facing</label>
              <select value={formData.facing} onChange={e => updateForm('facing', e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
                {FACINGS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {vastuResult?.analysis ? (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-500" /> Vastu Score
              </h3>
              <div className="flex items-center gap-6 mb-4">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={vastuResult.analysis.percentage >= 70 ? '#10B981' : vastuResult.analysis.percentage >= 40 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="8" strokeDasharray={`${vastuResult.analysis.percentage * 2.64} 264`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-surface-900 dark:text-white">{vastuResult.analysis.percentage}%</span>
                  </div>
                </div>
                <div className="text-sm text-surface-600 dark:text-surface-400">
                  <p>{vastuResult.analysis.compliance?.length || 0} compliant placements</p>
                  <p>{vastuResult.analysis.violations?.length || 0} violations</p>
                  <p className="text-xs mt-1">Facing: {vastuResult.facing}</p>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {vastuResult.analysis.compliance?.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-surface-700 dark:text-surface-300">{c.message}</span>
                  </div>
                ))}
                {vastuResult.analysis.violations?.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 dark:text-red-400">{v.message}</span>
                  </div>
                ))}
              </div>
              {vastuResult.analysis.message && (
                <p className="text-sm text-surface-500 mt-3 italic">{vastuResult.analysis.message}</p>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-12 text-center text-surface-400">
              <Compass className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a project to analyze Vastu compliance</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
