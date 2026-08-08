import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBIMProjects } from '../../redux/slices/bimSlice';
import {
  ArrowLeft, Glasses, Smartphone, Maximize2, Move, Navigation, RotateCcw,
  Grid3x3, Eye, EyeOff, Sun, Sunset, Moon, Building2, Minus, Plus
} from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, ContactShadows, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import api from '../../services/api';

const S = 0.001; // mm to meters

// First-person controller with WASD keyboard
function FPSController({ speed = 5, enabled }) {
  const { camera } = useThree();
  const keys = useRef({});
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const direction = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e) => { keys.current[e.code] = true; };
    const onKeyUp = (e) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const k = keys.current;
    direction.current.set(0, 0, 0);

    if (k['KeyW'] || k['ArrowUp']) direction.current.z -= 1;
    if (k['KeyS'] || k['ArrowDown']) direction.current.z += 1;
    if (k['KeyA'] || k['ArrowLeft']) direction.current.x -= 1;
    if (k['KeyD'] || k['ArrowRight']) direction.current.x += 1;
    if (k['Space']) camera.position.y += speed * delta;
    if (k['ShiftLeft']) camera.position.y -= speed * delta;

    if (direction.current.length() > 0) {
      direction.current.normalize().multiplyScalar(speed * delta);
      direction.current.applyQuaternion(camera.quaternion);
      direction.current.y = 0; // lock to horizontal
      camera.position.add(direction.current);
    }
  });

  return null;
}

// XR Button component
function XRButton() {
  const { gl } = useThree();
  const [xrSupported, setXRSupported] = useState(false);
  const [xrSession, setXRSession] = useState(null);

  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(setXRSupported).catch(() => {});
    }
  }, []);

  const toggleXR = async () => {
    if (xrSession) {
      await xrSession.end();
      setXRSession(null);
      return;
    }
    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });
      gl.xr.enabled = true;
      await gl.xr.setSession(session);
      setXRSession(session);
      session.addEventListener('end', () => { setXRSession(null); gl.xr.enabled = false; });
    } catch (err) {
      console.error('WebXR error:', err);
      alert('WebXR is not available on this device/browser');
    }
  };

  if (!xrSupported) return null;
  return (
    <Html position={[0, 0, 0]} center>
      <button onClick={toggleXR} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium">
        {xrSession ? 'Exit VR' : 'Enter VR'}
      </button>
    </Html>
  );
}

// Building shell
function ImmersiveBuilding({ projectData, showGrid, lightMode }) {
  if (!projectData) return null;
  const floors = projectData.floors || [];

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={lightMode === 'night' ? '#1a2332' : '#4A7C4F'} roughness={1} />
      </mesh>

      {/* Grid helper */}
      {showGrid && <gridHelper args={[100, 100, '#555555', '#333333']} position={[0, 0.01, 0]} />}

      {/* Floor slabs */}
      {floors.map((floor, i) => (
        <group key={i}>
          {/* Slab */}
          <mesh position={[7, i * 3, 5]} receiveShadow castShadow>
            <boxGeometry args={[14, 0.2, 10]} />
            <meshStandardMaterial color="#E8DCC8" roughness={0.8} />
          </mesh>

          {/* 4 walls */}
          <mesh position={[0, i * 3 + 1.5, 5]} castShadow>
            <boxGeometry args={[0.23, 3, 10]} />
            <meshStandardMaterial color="#F5F0E8" roughness={0.9} />
          </mesh>
          <mesh position={[14, i * 3 + 1.5, 5]} castShadow>
            <boxGeometry args={[0.23, 3, 10]} />
            <meshStandardMaterial color="#F5F0E8" roughness={0.9} />
          </mesh>
          <mesh position={[7, i * 3 + 1.5, 0]} castShadow>
            <boxGeometry args={[14, 3, 0.23]} />
            <meshStandardMaterial color="#F0EBE0" roughness={0.9} />
          </mesh>
          <mesh position={[7, i * 3 + 1.5, 10]} castShadow>
            <boxGeometry args={[14, 3, 0.23]} />
            <meshStandardMaterial color="#F0EBE0" roughness={0.9} />
          </mesh>

          {/* Ceiling */}
          <mesh position={[7, (i + 1) * 3, 5]}>
            <boxGeometry args={[14, 0.12, 10]} />
            <meshStandardMaterial color="#FAFAFA" roughness={0.95} />
          </mesh>

          {/* Floor label */}
          <Html position={[-1, i * 3 + 1.5, 5]} center>
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {floor.floor_name || `Floor ${i}`}
            </div>
          </Html>
        </group>
      ))}

      {/* Furniture placeholders */}
      {floors.length > 0 && (
        <group>
          {/* Sofa */}
          <mesh position={[3, 0.4, 3]} castShadow>
            <boxGeometry args={[2, 0.6, 0.8]} />
            <meshStandardMaterial color="#6B4E3D" roughness={0.8} />
          </mesh>
          {/* Table */}
          <mesh position={[5, 0.35, 3]} castShadow>
            <boxGeometry args={[1.2, 0.05, 0.8]} />
            <meshStandardMaterial color="#8B7355" roughness={0.7} />
          </mesh>
          {/* 4 table legs */}
          {[[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]].map(([dx, dz], li) => (
            <mesh key={li} position={[5 + dx, 0.15, 3 + dz]}>
              <cylinderGeometry args={[0.03, 0.03, 0.3]} />
              <meshStandardMaterial color="#8B7355" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export default function VRARViewerPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.bim);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [viewMode, setViewMode] = useState('orbit'); // orbit | fps | vr
  const [showGrid, setShowGrid] = useState(true);
  const [lightMode, setLightMode] = useState('day'); // day | sunset | night
  const [showLabels, setShowLabels] = useState(true);
  const [fov, setFov] = useState(60);

  useEffect(() => { dispatch(fetchBIMProjects()); }, [dispatch]);

  const fetchProject = async (pid) => {
    if (!pid) return;
    try {
      const { data } = await api.get(`/api/bim/exports/${pid}`, { params: { format: 'summary' } });
      setProjectData(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (selectedProject) fetchProject(selectedProject); }, [selectedProject]);

  const sunPositions = {
    day: [100, 80, 50],
    sunset: [100, 10, 50],
    night: [100, -10, 50],
  };

  const ambientIntensities = { day: 0.5, sunset: 0.3, night: 0.15 };
  const directionalIntensities = { day: 1.2, sunset: 0.6, night: 0.1 };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/bim')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500">
            <Glasses className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">VR / AR Viewer</h1>
            <p className="text-sm text-surface-500">Immersive · WebXR · First Person</p>
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
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode */}
          <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
            {[
              { id: 'orbit', label: 'Orbit', icon: RotateCcw },
              { id: 'fps', label: 'First Person', icon: Navigation },
              { id: 'vr', label: 'VR Mode', icon: Glasses },
            ].map(mode => (
              <button key={mode.id} onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${viewMode === mode.id ? 'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500'}`}>
                <mode.icon className="w-3.5 h-3.5" /> {mode.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-surface-200 dark:bg-surface-700" />

          {/* Lighting */}
          <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
            {[
              { id: 'day', icon: Sun, label: 'Day' },
              { id: 'sunset', icon: Sunset, label: 'Sunset' },
              { id: 'night', icon: Moon, label: 'Night' },
            ].map(l => (
              <button key={l.id} onClick={() => setLightMode(l.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
                  ${lightMode === l.id ? 'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500'}`}>
                <l.icon className="w-3.5 h-3.5" /> {l.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-surface-200 dark:bg-surface-700" />

          {/* Toggles */}
          <button onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showGrid ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-surface-100 dark:bg-surface-800 text-surface-500'}`}>
            <Grid3x3 className="w-3.5 h-3.5" /> Grid
          </button>
          <button onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showLabels ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-surface-100 dark:bg-surface-800 text-surface-500'}`}>
            {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} Labels
          </button>

          <div className="w-px h-6 bg-surface-200 dark:bg-surface-700" />

          {/* FOV */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500">FOV</span>
            <button onClick={() => setFov(f => Math.max(30, f - 10))} className="p-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-500"><Minus className="w-3 h-3" /></button>
            <span className="text-xs font-mono text-surface-700 dark:text-surface-300 w-6 text-center">{fov}</span>
            <button onClick={() => setFov(f => Math.min(120, f + 10))} className="p-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-500"><Plus className="w-3 h-3" /></button>
          </div>
        </div>
      </div>

      {/* FPS instructions */}
      {viewMode === 'fps' && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl p-3 text-sm text-violet-700 dark:text-violet-400">
          <strong>First Person Controls:</strong> W/A/S/D or Arrow Keys to move • Space to go up • Shift to go down • Mouse to look around (click canvas first)
        </div>
      )}

      {/* 3D Viewer */}
      <div className="bg-black rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-lg" style={{ height: '600px' }}>
        <Canvas shadows dpr={[1, 2]} gl={{ xr: { enabled: viewMode === 'vr' } }}>
          <PerspectiveCamera
            makeDefault
            position={viewMode === 'fps' ? [7, 1.6, 5] : [22, 15, 22]}
            fov={fov}
          />

          {viewMode === 'orbit' && <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.1} />}
          {viewMode === 'fps' && <FPSController speed={5} enabled={true} />}

          <ambientLight intensity={ambientIntensities[lightMode]} />
          <directionalLight
            position={sunPositions[lightMode]}
            intensity={directionalIntensities[lightMode]}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <hemisphereLight
            skyColor={lightMode === 'night' ? '#0a1628' : '#87CEEB'}
            groundColor={lightMode === 'night' ? '#0a1628' : '#4A7C4F'}
            intensity={lightMode === 'night' ? 0.1 : 0.3}
          />

          {/* Point lights for night mode */}
          {lightMode === 'night' && (
            <>
              <pointLight position={[3, 2.5, 3]} intensity={1} color="#FFAA44" distance={8} decay={2} />
              <pointLight position={[10, 2.5, 7]} intensity={0.8} color="#FFD700" distance={6} decay={2} />
            </>
          )}

          <Suspense fallback={null}>
            <ImmersiveBuilding projectData={projectData} showGrid={showGrid} lightMode={lightMode} />
            <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={60} blur={2} />
            {viewMode === 'vr' && <XRButton />}
          </Suspense>

          {lightMode !== 'night' && (
            <Sky
              sunPosition={sunPositions[lightMode]}
              turbidity={lightMode === 'sunset' ? 15 : 8}
              rayleigh={lightMode === 'sunset' ? 4 : 2}
              mieCoefficient={lightMode === 'sunset' ? 0.1 : 0.005}
              mieDirectionalG={lightMode === 'sunset' ? 0.95 : 0.8}
            />
          )}
          <fog attach="fog" args={[lightMode === 'night' ? '#0a1628' : '#87CEEB', 40, 200]} />
        </Canvas>
      </div>

      {/* AR Section */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-900/30">
            <Smartphone className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Augmented Reality (AR)</h3>
            <p className="text-xs text-surface-500">Place the building model in your real environment</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
            <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">📱 Mobile AR</h4>
            <p className="text-xs text-surface-500">Open this page on a mobile device with WebXR support (Chrome on Android) to place the model on a real surface.</p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
            <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">🔄 Interact</h4>
            <p className="text-xs text-surface-500">Rotate, resize, and measure the building in your actual environment using touch gestures.</p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
            <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">📐 Measure</h4>
            <p className="text-xs text-surface-500">Use AR measurement tools to compare the digital model with real-world dimensions.</p>
          </div>
        </div>
        <button className="mt-4 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          onClick={async () => {
            if (navigator.xr) {
              const supported = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
              if (supported) {
                alert('AR is supported! Open the Design Studio in AR mode on your mobile device.');
              } else {
                alert('AR is not supported on this device. Try on a mobile device with Chrome and ARCore.');
              }
            } else {
              alert('WebXR is not available in this browser.');
            }
          }}>
          <Smartphone className="w-4 h-4" /> Check AR Support
        </button>
      </div>
    </div>
  );
}
