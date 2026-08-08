import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBIMProjects } from '../../redux/slices/bimSlice';
import {
  ArrowLeft, Video, Play, Pause, SkipForward, SkipBack, Plus, Trash2,
  Share2, Copy, Check, Eye, EyeOff, MapPin, Info, Navigation, Maximize2,
  Globe, Settings, Save, RotateCcw
} from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, ContactShadows, Html, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import api from '../../services/api';

const S = 0.001; // mm to meters

// First-person camera controller
function WalkthroughCamera({ waypoints, currentWP, isPlaying, onComplete }) {
  const { camera } = useThree();
  const progress = useRef(0);
  const targetPos = useRef(new THREE.Vector3(5, 1.6, 5));
  const targetLook = useRef(new THREE.Vector3(10, 1.6, 5));

  useEffect(() => {
    if (waypoints?.length > 0 && currentWP < waypoints.length) {
      const wp = waypoints[currentWP];
      targetPos.current.set(wp.position?.x || 5, wp.position?.y || 1.6, wp.position?.z || 5);
      targetLook.current.set(wp.look_at?.x || 10, wp.look_at?.y || 1.6, wp.look_at?.z || 5);
      progress.current = 0;
    }
  }, [currentWP, waypoints]);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    progress.current += delta * 0.5;
    camera.position.lerp(targetPos.current, Math.min(progress.current, 1));
    const lookTarget = new THREE.Vector3().copy(camera.position).lerp(targetLook.current, 0.1);
    camera.lookAt(lookTarget);

    if (progress.current >= 1 && onComplete) {
      onComplete();
    }
  });

  return null;
}

// Hotspot 3D marker
function Hotspot3D({ hotspot, onClick }) {
  return (
    <group position={[hotspot.position?.x || 0, hotspot.position?.y || 1.5, hotspot.position?.z || 0]}>
      <mesh onClick={onClick}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>
      <Html center distanceFactor={10}>
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
          {hotspot.label || 'Info'}
        </div>
      </Html>
    </group>
  );
}

// Building shell for tour
function TourBuilding({ elements }) {
  if (!elements) return null;
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4A7C4F" roughness={1} />
      </mesh>
      {/* Floor */}
      <mesh position={[7, -0.075, 5]}>
        <boxGeometry args={[14, 0.15, 10]} />
        <meshStandardMaterial color="#E8DCC8" roughness={0.8} />
      </mesh>
      {/* Walls */}
      {elements.walls?.map((wall, i) => {
        const dx = (wall.end_point?.x || 0) - (wall.start_point?.x || 0);
        const dy = (wall.end_point?.y || 0) - (wall.start_point?.y || 0);
        const length = Math.sqrt(dx * dx + dy * dy) * S;
        const height = (wall.height || 3000) * S;
        const thickness = (wall.thickness || 230) * S;
        const angle = Math.atan2(dy, dx);
        const cx = ((wall.start_point?.x || 0) + (wall.end_point?.x || 0)) / 2 * S;
        const cy = ((wall.start_point?.y || 0) + (wall.end_point?.y || 0)) / 2 * S;
        return (
          <mesh key={i} position={[cx, height / 2, cy]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[length, height, thickness]} />
            <meshStandardMaterial color="#F5F0E8" roughness={0.9} />
          </mesh>
        );
      })}
      {/* Ceiling */}
      <mesh position={[7, 3, 5]}>
        <boxGeometry args={[14, 0.12, 10]} />
        <meshStandardMaterial color="#FAFAFA" roughness={0.95} />
      </mesh>
    </group>
  );
}

export default function VirtualTourPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects, elements } = useSelector(s => s.bim);
  const [selectedProject, setSelectedProject] = useState('');
  const [tours, setTours] = useState([]);
  const [activeTour, setActiveTour] = useState(null);
  const [currentWP, setCurrentWP] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [viewMode, setViewMode] = useState('orbit'); // orbit | walkthrough
  const [loading, setLoading] = useState(false);

  // New tour form
  const [newTour, setNewTour] = useState({ name: '', description: '' });
  const [newWP, setNewWP] = useState({ name: '', position: { x: 5, y: 1.6, z: 5 }, look_at: { x: 10, y: 1.6, z: 5 }, duration: 3 });

  useEffect(() => { dispatch(fetchBIMProjects()); }, [dispatch]);

  const fetchTours = async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/bim/virtual-tour/${pid}`);
      setTours(data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { if (selectedProject) fetchTours(selectedProject); }, [selectedProject]);

  const handleCreateTour = async () => {
    if (!newTour.name.trim()) return;
    try {
      const { data } = await api.post('/api/bim/virtual-tour', {
        ...newTour,
        bim_project_id: selectedProject,
      });
      setTours(t => [data, ...t]);
      setNewTour({ name: '', description: '' });
    } catch (err) { console.error(err); }
  };

  const handleDeleteTour = async (id) => {
    if (!confirm('Delete this tour?')) return;
    try {
      await api.delete(`/api/bim/virtual-tour/${id}`);
      setTours(t => t.filter(x => x._id !== id));
      if (activeTour?._id === id) setActiveTour(null);
    } catch (err) { console.error(err); }
  };

  const handleAddWaypoint = async () => {
    if (!activeTour) return;
    try {
      const { data } = await api.post(`/api/bim/virtual-tour/${activeTour._id}/waypoints`, newWP);
      setActiveTour(data);
      setNewWP({ name: '', position: { x: 5, y: 1.6, z: 5 }, look_at: { x: 10, y: 1.6, z: 5 }, duration: 3 });
    } catch (err) { console.error(err); }
  };

  const handleRemoveWaypoint = async (idx) => {
    if (!activeTour) return;
    try {
      const { data } = await api.delete(`/api/bim/virtual-tour/${activeTour._id}/waypoints/${idx}`);
      setActiveTour(data);
    } catch (err) { console.error(err); }
  };

  const handlePublish = async () => {
    if (!activeTour) return;
    try {
      const { data } = await api.put(`/api/bim/virtual-tour/${activeTour._id}/publish`);
      setActiveTour(data);
      if (data.status === 'published') {
        setShareLink(`${window.location.origin}/bim/tour/${data.share_token}`);
      }
    } catch (err) { console.error(err); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWPComplete = useCallback(() => {
    if (!activeTour) return;
    const nextWP = currentWP + 1;
    if (nextWP < (activeTour.waypoints?.length || 0)) {
      setCurrentWP(nextWP);
    } else if (activeTour.settings?.loop) {
      setCurrentWP(0);
    } else {
      setIsPlaying(false);
    }
  }, [activeTour, currentWP]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/bim')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">360° Virtual Tour</h1>
            <p className="text-sm text-surface-500">Walk Through · Present · Share</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode(v => v === 'orbit' ? 'walkthrough' : 'orbit')}
            className="px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-xl text-sm font-medium hover:bg-surface-200 transition-colors flex items-center gap-2">
            {viewMode === 'orbit' ? <Navigation className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {viewMode === 'orbit' ? 'Walkthrough' : 'Orbit'}
          </button>
        </div>
      </div>

      {/* Project Selector */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tour list & editor */}
        <div className="space-y-4">
          {/* Create Tour */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Create Tour</h3>
            <input value={newTour.name} onChange={e => setNewTour(t => ({ ...t, name: e.target.value }))}
              placeholder="Tour name" className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm mb-2" />
            <textarea value={newTour.description} onChange={e => setNewTour(t => ({ ...t, description: e.target.value }))}
              placeholder="Description" rows={2} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm mb-2 resize-none" />
            <button onClick={handleCreateTour} disabled={!selectedProject || !newTour.name.trim()}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>

          {/* Tour List */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
            <div className="p-3 border-b border-surface-200 dark:border-surface-700">
              <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Tours ({tours.length})</h3>
            </div>
            {tours.length === 0 ? (
              <div className="p-6 text-center text-surface-400 text-sm">No tours yet</div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {tours.map(tour => (
                  <div key={tour._id} className={`p-3 cursor-pointer transition-colors ${activeTour?._id === tour._id ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'}`}
                    onClick={() => { setActiveTour(tour); setCurrentWP(0); setIsPlaying(false); }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-surface-900 dark:text-white">{tour.name}</p>
                        <p className="text-xs text-surface-500">{tour.waypoints?.length || 0} waypoints · {tour.status}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTour(tour._id); }}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waypoint Editor */}
          {activeTour && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Waypoints</h3>
                <button onClick={handlePublish}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${activeTour.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'}`}>
                  {activeTour.status === 'published' ? 'Published ✓' : 'Publish'}
                </button>
              </div>

              {/* Waypoint list */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {activeTour.waypoints?.map((wp, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg text-xs ${currentWP === i ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-surface-50 dark:bg-surface-800'}`}>
                    <button onClick={() => { setCurrentWP(i); setIsPlaying(false); }} className="flex items-center gap-2 flex-1">
                      <MapPin className="w-3 h-3 text-cyan-500" />
                      <span className="text-surface-700 dark:text-surface-300 truncate">{wp.name || `Point ${i + 1}`}</span>
                    </button>
                    <button onClick={() => handleRemoveWaypoint(i)} className="p-0.5 rounded text-red-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add waypoint */}
              <div className="border-t border-surface-200 dark:border-surface-700 pt-3 space-y-2">
                <input value={newWP.name} onChange={e => setNewWP(w => ({ ...w, name: e.target.value }))}
                  placeholder="Waypoint name" className="w-full px-2 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs" />
                <div className="grid grid-cols-3 gap-1">
                  {['x', 'y', 'z'].map(axis => (
                    <input key={axis} type="number" step="0.5" value={newWP.position[axis]}
                      onChange={e => setNewWP(w => ({ ...w, position: { ...w.position, [axis]: +e.target.value } }))}
                      className="px-2 py-1 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs"
                      placeholder={axis.toUpperCase()} />
                  ))}
                </div>
                <button onClick={handleAddWaypoint} className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" /> Add Waypoint
                </button>
              </div>

              {/* Share link */}
              {activeTour.status === 'published' && activeTour.share_token && (
                <div className="border-t border-surface-200 dark:border-surface-700 pt-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-surface-400" />
                    <input readOnly value={`${window.location.origin}/bim/tour/${activeTour.share_token}`}
                      className="flex-1 px-2 py-1 rounded bg-surface-50 dark:bg-surface-800 text-xs font-mono text-surface-500" />
                    <button onClick={handleCopy} className="px-2 py-1 rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 text-xs">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: 3D Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm" style={{ height: '600px' }}>
            <Canvas shadows dpr={[1, 2]}>
              {viewMode === 'orbit' ? (
                <>
                  <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={50} />
                  <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.1} />
                </>
              ) : (
                <>
                  <PerspectiveCamera makeDefault position={[5, 1.6, 5]} fov={75} />
                  <WalkthroughCamera
                    waypoints={activeTour?.waypoints}
                    currentWP={currentWP}
                    isPlaying={isPlaying}
                    onComplete={handleWPComplete}
                  />
                </>
              )}

              <ambientLight intensity={0.5} />
              <directionalLight position={[20, 30, 15]} intensity={1} castShadow />
              <hemisphereLight skyColor="#87CEEB" groundColor="#4A7C4F" intensity={0.3} />

              <Suspense fallback={null}>
                <TourBuilding elements={elements} />
                {/* Hotspots */}
                {activeTour?.hotspots?.map((hs, i) => (
                  <Hotspot3D key={i} hotspot={hs} onClick={() => setSelectedHotspot(hs)} />
                ))}
                {/* Waypoint markers */}
                {viewMode === 'orbit' && activeTour?.waypoints?.map((wp, i) => (
                  <group key={i} position={[wp.position?.x || 0, wp.position?.y || 0, wp.position?.z || 0]}>
                    <mesh>
                      <coneGeometry args={[0.2, 0.5, 6]} />
                      <meshStandardMaterial color={i === currentWP ? '#06B6D4' : '#94A3B8'} />
                    </mesh>
                    <Html center distanceFactor={15}>
                      <div className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${i === currentWP ? 'bg-cyan-600 text-white' : 'bg-black/50 text-white'}`}>
                        {wp.name || `WP ${i + 1}`}
                      </div>
                    </Html>
                  </group>
                ))}
                <ContactShadows position={[0, -0.01, 0]} opacity={0.3} scale={50} blur={2} />
              </Suspense>

              <Sky sunPosition={[100, 50, 100]} turbidity={8} rayleigh={2} />
              <fog attach="fog" args={['#87CEEB', 50, 200]} />
            </Canvas>
          </div>

          {/* Playback controls */}
          {activeTour && activeTour.waypoints?.length > 0 && (
            <div className="mt-3 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-3 flex items-center justify-center gap-4 shadow-sm">
              <button onClick={() => setCurrentWP(Math.max(0, currentWP - 1))}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={() => { setIsPlaying(!isPlaying); setViewMode('walkthrough'); }}
                className="p-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full transition-colors shadow-lg">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={() => setCurrentWP(Math.min((activeTour.waypoints?.length || 1) - 1, currentWP + 1))}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
              <div className="ml-4 text-sm text-surface-500">
                Waypoint {currentWP + 1} / {activeTour.waypoints?.length || 0}
              </div>
              <div className="flex-1" />
              <button onClick={() => { setCurrentWP(0); setIsPlaying(false); setViewMode('orbit'); }}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hotspot info modal */}
      {selectedHotspot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedHotspot(null)}>
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-violet-500" />
              <h3 className="font-semibold text-surface-900 dark:text-white">{selectedHotspot.label || 'Hotspot'}</h3>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400">{selectedHotspot.description || 'No description'}</p>
            <button onClick={() => setSelectedHotspot(null)} className="mt-4 w-full py-2 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg text-sm font-medium transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
