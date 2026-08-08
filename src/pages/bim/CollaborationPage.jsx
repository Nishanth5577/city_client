import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBIMProjects } from '../../redux/slices/bimSlice';
import {
  ArrowLeft, Radio, Users, MousePointer2, Lock, Unlock, Activity, History,
  Circle, Wifi, WifiOff, Eye, Layers, MessageSquare, Clock, UserCircle, Send,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { io as socketIO } from 'socket.io-client';

export default function CollaborationPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.bim);
  const { user, token } = useSelector(s => s.auth);
  const [selectedProject, setSelectedProject] = useState('');
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [cursorPositions, setCursorPositions] = useState({});
  const [lockedElements, setLockedElements] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const socketRef = useRef(null);
  const myColor = useRef(`hsl(${Math.random() * 360}, 70%, 50%)`);

  useEffect(() => { dispatch(fetchBIMProjects()); }, [dispatch]);

  // Fetch existing collaborators & comments
  const fetchData = async (pid) => {
    if (!pid) return;
    try {
      const [collabRes, comRes] = await Promise.all([
        api.get('/api/bim/collab/active', { params: { bim_project_id: pid } }),
        api.get('/api/bim/collab/comments', { params: { bim_project_id: pid } }),
      ]);
      setCollaborators(collabRes.data || []);
      setComments(comRes.data || []);
    } catch (err) { console.error(err); }
  };

  // Connect to socket
  const connectSocket = useCallback((pid) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = socketIO(window.location.origin.replace(':5173', ':5000'), {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('bim:join_session', {
        bim_project_id: pid,
        name: user?.name || 'Unknown',
        color: myColor.current,
        active_floor_id: null,
      });
      addActivity('system', 'You joined the session');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      addActivity('system', 'Disconnected from session');
    });

    // Remote user joined
    socket.on('bim:user_joined', (data) => {
      setCollaborators(prev => {
        const exists = prev.find(c => c.user_id === data.user_id);
        if (exists) return prev;
        return [...prev, { ...data, is_online: true }];
      });
      addActivity('join', `${data.name} joined the session`, data.color);
    });

    // Remote user left
    socket.on('bim:user_left', (data) => {
      setCollaborators(prev => prev.filter(c => c.user_id !== data.user_id && c.user_id?._id !== data.user_id));
      setCursorPositions(prev => { const next = { ...prev }; delete next[data.user_id]; return next; });
      addActivity('leave', `A user left the session`);
    });

    // Live cursor
    socket.on('bim:cursor_moved', (data) => {
      setCursorPositions(prev => ({
        ...prev,
        [data.user_id]: { x: data.x, y: data.y, name: data.name, color: data.color },
      }));
    });

    // Element locked
    socket.on('bim:element_locked', (data) => {
      setLockedElements(prev => ({
        ...prev,
        [data.element_id]: { user_id: data.user_id, name: data.name, color: data.color, type: data.element_type },
      }));
      addActivity('lock', `${data.name} selected ${data.element_type}`, data.color);
    });

    // Element unlocked
    socket.on('bim:element_unlocked', (data) => {
      setLockedElements(prev => { const next = { ...prev }; delete next[data.element_id]; return next; });
    });

    // Design change
    socket.on('bim:design_changed', (data) => {
      addActivity('change', `${data.name} ${data.change_type}d a ${data.element_type}`, undefined);
    });

    // Layer toggle
    socket.on('bim:layer_toggled', (data) => {
      addActivity('layer', `${data.name} ${data.visible ? 'showed' : 'hid'} ${data.layer} layer`);
    });

    // Floor switch
    socket.on('bim:floor_switched', (data) => {
      addActivity('floor', `${data.name} switched to ${data.floor_name}`);
    });

    // Comment added
    socket.on('bim:comment_added', (data) => {
      setComments(prev => [data, ...prev]);
    });

    socketRef.current = socket;
  }, [token, user]);

  const addActivity = (type, message, color) => {
    setActivityLog(prev => [{ type, message, color, time: new Date() }, ...prev].slice(0, 100));
  };

  // Disconnect on cleanup
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('bim:leave_session');
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Connect when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchData(selectedProject);
      connectSocket(selectedProject);
    }
  }, [selectedProject, connectSocket]);

  // Add comment via API
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedProject) return;
    try {
      await api.post('/api/bim/collab/comments', {
        bim_project_id: selectedProject,
        content: newComment,
      });
      setNewComment('');
      const { data } = await api.get('/api/bim/collab/comments', { params: { bim_project_id: selectedProject } });
      setComments(data || []);
    } catch (err) { console.error(err); }
  };

  const activityIcon = (type) => {
    const map = {
      join: { icon: UserCircle, color: 'text-green-500' },
      leave: { icon: WifiOff, color: 'text-red-500' },
      lock: { icon: Lock, color: 'text-amber-500' },
      change: { icon: Activity, color: 'text-blue-500' },
      layer: { icon: Layers, color: 'text-purple-500' },
      floor: { icon: ChevronRight, color: 'text-cyan-500' },
      system: { icon: Radio, color: 'text-surface-400' },
    };
    const entry = map[type] || map.system;
    const Icon = entry.icon;
    return <Icon className={`w-3.5 h-3.5 ${entry.color}`} />;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/bim')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-teal-500">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Real-Time Collaboration</h1>
            <p className="text-sm text-surface-500">Live Editing · Cursors · Presence</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${connected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
          {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {connected ? 'Connected' : 'Disconnected'}
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
        <button onClick={() => navigate('/bim')} disabled={!selectedProject}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 transition-colors">
          <MousePointer2 className="w-4 h-4" /> Open Design Studio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Online Users */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" /> Online ({collaborators.length})
            </h3>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {/* Self */}
            <div className="p-3 flex items-center gap-3 bg-green-50/50 dark:bg-green-900/10">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: myColor.current }}>
                {(user?.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{user?.name} <span className="text-xs text-green-500">(You)</span></p>
                <p className="text-xs text-surface-500">Active</p>
              </div>
              <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500" />
            </div>

            {/* Remote users */}
            {collaborators.filter(c => (c.user_id?._id || c.user_id) !== user?._id).map((collab, i) => (
              <div key={i} className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: collab.color || '#94A3B8' }}>
                  {((collab.user_id?.name || collab.name || '?')[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{collab.user_id?.name || collab.name}</p>
                  <p className="text-xs text-surface-500">{collab.user_id?.email || 'Online'}</p>
                </div>
                <Circle className={`w-2.5 h-2.5 ${collab.is_online ? 'fill-green-500 text-green-500' : 'fill-surface-300 text-surface-300'}`} />
              </div>
            ))}

            {collaborators.length === 0 && !connected && (
              <div className="p-6 text-center text-surface-400 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Select a project to join session</p>
              </div>
            )}
          </div>

          {/* Live Cursor Positions */}
          {Object.keys(cursorPositions).length > 0 && (
            <div className="p-3 border-t border-surface-200 dark:border-surface-700">
              <h4 className="text-xs font-medium text-surface-500 mb-2">Cursor Positions</h4>
              <div className="space-y-1.5">
                {Object.entries(cursorPositions).map(([uid, pos]) => (
                  <div key={uid} className="flex items-center gap-2 text-xs">
                    <MousePointer2 className="w-3 h-3" style={{ color: pos.color }} />
                    <span className="text-surface-600 dark:text-surface-400">{pos.name}</span>
                    <span className="text-surface-400 font-mono ml-auto">({Math.round(pos.x)}, {Math.round(pos.y)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Elements */}
          {Object.keys(lockedElements).length > 0 && (
            <div className="p-3 border-t border-surface-200 dark:border-surface-700">
              <h4 className="text-xs font-medium text-surface-500 mb-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked Elements</h4>
              <div className="space-y-1.5">
                {Object.entries(lockedElements).map(([eid, lock]) => (
                  <div key={eid} className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1">
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span className="text-surface-600 dark:text-surface-400 capitalize">{lock.type}</span>
                    <span className="ml-auto" style={{ color: lock.color }}>{lock.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Activity Timeline
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {activityLog.length === 0 ? (
              <div className="p-6 text-center text-surface-400 text-sm">
                <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {activityLog.map((entry, i) => (
                  <div key={i} className="p-3 flex items-start gap-2.5">
                    <div className="mt-0.5">{activityIcon(entry.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-surface-700 dark:text-surface-300">{entry.message}</p>
                      <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {entry.time.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Chat / Comments */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" /> Design Chat ({comments.length})
            </h3>
          </div>
          <div className="flex-1 max-h-80 overflow-y-auto p-3 space-y-2">
            {comments.length === 0 ? (
              <div className="p-6 text-center text-surface-400 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No messages yet</p>
              </div>
            ) : (
              comments.slice(0, 50).map(comment => (
                <div key={comment._id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {(comment.user_id?.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 bg-surface-50 dark:bg-surface-800 rounded-lg p-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-surface-900 dark:text-white">{comment.user_id?.name || 'Unknown'}</span>
                      <span className="text-[10px] text-surface-400">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-surface-600 dark:text-surface-400 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-surface-200 dark:border-surface-700">
            <div className="flex gap-2">
              <input value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm" />
              <button onClick={handleAddComment} disabled={!newComment.trim() || !selectedProject}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Preview with Live Cursors */}
      {connected && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-500" /> Live Canvas Preview
            </h3>
          </div>
          <div className="relative bg-surface-50 dark:bg-surface-800 h-64">
            {/* Live cursor indicators */}
            {Object.entries(cursorPositions).map(([uid, pos]) => (
              <div key={uid} className="absolute transition-all duration-100 pointer-events-none z-10"
                style={{ left: `${(pos.x / 15000) * 100}%`, top: `${(pos.y / 10000) * 100}%` }}>
                <MousePointer2 className="w-4 h-4" style={{ color: pos.color }} />
                <span className="text-[9px] font-medium px-1 py-0.5 rounded ml-1 whitespace-nowrap" style={{ background: pos.color, color: '#fff' }}>
                  {pos.name}
                </span>
              </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center text-surface-400 text-sm">
              <div className="text-center">
                <MousePointer2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>Live cursors appear here when collaborators edit the design</p>
                <p className="text-xs mt-1">Open Design Studio to see full canvas with real-time sync</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
