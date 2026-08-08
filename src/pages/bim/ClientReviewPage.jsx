import { useState, useEffect, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBIMProjects } from '../../redux/slices/bimSlice';
import {
  ArrowLeft, Users, Eye, Share2, Copy, ExternalLink, Check, Download,
  MessageSquare, Building2, Layers, Map, Maximize2, Send, CheckCircle2
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, ContactShadows } from '@react-three/drei';
import api from '../../services/api';

function MiniBuilding3D({ projectData }) {
  if (!projectData) return null;
  // Render simplified building from export data
  const floors = projectData.floors || [];
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#4A7C4F" roughness={1} />
      </mesh>
      {/* Floor slabs */}
      {floors.map((floor, i) => (
        <mesh key={i} position={[5, i * 3, 5]}>
          <boxGeometry args={[10, 0.15, 8]} />
          <meshStandardMaterial color="#D3D3D3" roughness={0.9} />
        </mesh>
      ))}
      {/* Walls placeholder */}
      {floors.map((floor, i) => (
        <group key={`w-${i}`}>
          <mesh position={[0, i * 3 + 1.5, 5]}><boxGeometry args={[0.23, 3, 8]} /><meshStandardMaterial color="#C4B5A0" /></mesh>
          <mesh position={[10, i * 3 + 1.5, 5]}><boxGeometry args={[0.23, 3, 8]} /><meshStandardMaterial color="#C4B5A0" /></mesh>
          <mesh position={[5, i * 3 + 1.5, 1]}><boxGeometry args={[10, 3, 0.23]} /><meshStandardMaterial color="#C4B5A0" /></mesh>
          <mesh position={[5, i * 3 + 1.5, 9]}><boxGeometry args={[10, 3, 0.23]} /><meshStandardMaterial color="#C4B5A0" /></mesh>
        </group>
      ))}
    </group>
  );
}

export default function ClientReviewPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.bim);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [projectSummary, setProjectSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview | 3d | comments
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [clientFeedback, setClientFeedback] = useState({ rating: 0, notes: '' });

  useEffect(() => { dispatch(fetchBIMProjects()); }, [dispatch]);

  const fetchProjectData = async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const [fullRes, sumRes, comRes] = await Promise.all([
        api.get(`/api/bim/exports/${pid}`, { params: { format: 'summary' } }),
        api.get(`/api/bim/exports/${pid}`),
        api.get('/api/bim/collab/comments', { params: { bim_project_id: pid } }),
      ]);
      setProjectSummary(fullRes.data);
      setProjectData(sumRes.data);
      setComments(comRes.data || []);
      setShareLink(`${window.location.origin}/api/bim/review/${pid}`);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { if (selectedProject) fetchProjectData(selectedProject); }, [selectedProject]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post('/api/bim/collab/comments', {
        bim_project_id: selectedProject,
        content: newComment,
        priority: 'medium',
      });
      setNewComment('');
      const comRes = await api.get('/api/bim/collab/comments', { params: { bim_project_id: selectedProject } });
      setComments(comRes.data || []);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/bim')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Client Review Portal</h1>
            <p className="text-sm text-surface-500">Share · Present · Collect Feedback</p>
          </div>
        </div>
      </div>

      {/* Project selector */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Select BIM Project</label>
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
            <option value="">Choose project...</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.project_name}</option>)}
          </select>
        </div>
      </div>

      {/* Share Link */}
      {selectedProject && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Client Review Link</span>
            <div className="flex-1 flex items-center gap-2">
              <input type="text" readOnly value={shareLink}
                className="flex-1 px-3 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-mono text-surface-600 dark:text-surface-400" />
              <button onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${copied ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'}`}>
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {projectSummary && (
        <>
          {/* View Mode Tabs */}
          <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
            {[
              { id: 'overview', label: 'Project Overview', icon: Map },
              { id: '3d', label: '3D Preview', icon: Building2 },
              { id: 'comments', label: `Feedback (${comments.length})`, icon: MessageSquare },
            ].map(tab => (
              <button key={tab.id} onClick={() => setViewMode(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${viewMode === tab.id
                    ? 'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white'
                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* ═══ OVERVIEW ═══ */}
          {viewMode === 'overview' && (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">{projectSummary.project_name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-surface-500">ERP Project</span><p className="font-medium text-surface-900 dark:text-white">{projectSummary.erp_project || '—'}</p></div>
                  <div><span className="text-surface-500">Client</span><p className="font-medium text-surface-900 dark:text-white">{projectSummary.client || '—'}</p></div>
                  <div><span className="text-surface-500">Status</span><p className="font-medium text-surface-900 dark:text-white capitalize">{projectSummary.status}</p></div>
                  <div><span className="text-surface-500">Designer</span><p className="font-medium text-surface-900 dark:text-white">{projectSummary.created_by || '—'}</p></div>
                </div>
                {projectSummary.site_data && (
                  <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-surface-500">Plot Area</span><p className="font-mono font-medium">{projectSummary.site_data.plot_area || '—'} sqm</p></div>
                    <div><span className="text-surface-500">Built-up Area</span><p className="font-mono font-medium">{projectSummary.site_data.built_up_area || '—'} sqm</p></div>
                    <div><span className="text-surface-500">FSI</span><p className="font-mono font-medium">{projectSummary.site_data.fsi || '—'}</p></div>
                    <div><span className="text-surface-500">Buildings</span><p className="font-mono font-medium">{projectSummary.buildings || 0}</p></div>
                  </div>
                )}
              </div>

              {/* Floor Summary Table */}
              {projectSummary.floors?.length > 0 && (
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" /> Floor Summary
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500">
                        <th className="text-left py-2 px-3">Building</th>
                        <th className="text-left py-2 px-3">Floor</th>
                        <th className="text-right py-2 px-3">Area (sqm)</th>
                        <th className="text-right py-2 px-3">Rooms</th>
                        <th className="text-right py-2 px-3">Walls</th>
                        <th className="text-right py-2 px-3">Columns</th>
                        <th className="text-right py-2 px-3">Doors</th>
                        <th className="text-right py-2 px-3">Windows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectSummary.floors.map((floor, i) => (
                        <tr key={i} className="border-b border-surface-100 dark:border-surface-800 text-surface-700 dark:text-surface-300">
                          <td className="py-2 px-3">{floor.building_name}</td>
                          <td className="py-2 px-3">{floor.floor_name}</td>
                          <td className="py-2 px-3 text-right font-mono">{floor.total_area || '—'}</td>
                          <td className="py-2 px-3 text-right font-mono">{floor.rooms}</td>
                          <td className="py-2 px-3 text-right font-mono">{floor.walls}</td>
                          <td className="py-2 px-3 text-right font-mono">{floor.columns}</td>
                          <td className="py-2 px-3 text-right font-mono">{floor.doors}</td>
                          <td className="py-2 px-3 text-right font-mono">{floor.windows}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Client Rating */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Client Feedback</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-surface-500">Rating:</span>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setClientFeedback(f => ({ ...f, rating: star }))}
                      className={`text-2xl transition-colors ${star <= clientFeedback.rating ? 'text-amber-400' : 'text-surface-300 dark:text-surface-600'}`}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea value={clientFeedback.notes} onChange={e => setClientFeedback(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes or requests..."
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm resize-none" rows={3} />
                <button className="mt-3 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
                  <Send className="w-4 h-4" /> Submit Feedback
                </button>
              </div>
            </div>
          )}

          {/* ═══ 3D PREVIEW ═══ */}
          {viewMode === '3d' && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm" style={{ height: '500px' }}>
              <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[20, 15, 20]} fov={50} />
                <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.1} />
                <ambientLight intensity={0.4} />
                <directionalLight position={[20, 30, 15]} intensity={1.2} castShadow />
                <hemisphereLight skyColor="#87CEEB" groundColor="#4A7C4F" intensity={0.3} />
                <Suspense fallback={null}>
                  <MiniBuilding3D projectData={projectSummary} />
                  <ContactShadows position={[0, -0.01, 0]} opacity={0.3} scale={50} blur={2} />
                </Suspense>
                <Sky sunPosition={[100, 50, 100]} turbidity={8} rayleigh={2} />
                <fog attach="fog" args={['#87CEEB', 50, 200]} />
              </Canvas>
            </div>
          )}

          {/* ═══ COMMENTS ═══ */}
          {viewMode === 'comments' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
                <div className="flex gap-3">
                  <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                    placeholder="Add feedback or question for the design team..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm resize-none" rows={2} />
                  <button onClick={handleAddComment} disabled={!newComment.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 self-end transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {comments.map(comment => (
                <div key={comment._id} className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(comment.user_id?.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-900 dark:text-white text-sm">{comment.user_id?.name || 'Client'}</span>
                        <span className="text-xs text-surface-400">{new Date(comment.createdAt).toLocaleString()}</span>
                        {comment.status === 'resolved' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-surface-700 dark:text-surface-300 mt-1">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
