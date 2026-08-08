import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBIMProjects } from '../../redux/slices/bimSlice';
import {
  ArrowLeft, ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle,
  Send, Eye, FileText, MessageSquare, User, Pen, History, RotateCcw
} from 'lucide-react';
import api from '../../services/api';

const STATUS_MAP = {
  draft: { color: 'gray', icon: FileText, label: 'Draft' },
  submitted: { color: 'blue', icon: Send, label: 'Submitted' },
  under_review: { color: 'amber', icon: Eye, label: 'Under Review' },
  approved: { color: 'green', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'red', icon: XCircle, label: 'Rejected' },
  revision_requested: { color: 'orange', icon: RotateCcw, label: 'Revision Requested' },
};

export default function DesignApprovalsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.bim);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTab, setActiveTab] = useState('approvals');
  const [approvals, setApprovals] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Submit / Review form
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitData, setSubmitData] = useState({ version: 1, comments: '' });
  const [showReview, setShowReview] = useState(null);
  const [reviewData, setReviewData] = useState({ status: 'approved', comments: '', revision_notes: '' });

  // Comment form
  const [newComment, setNewComment] = useState('');

  useEffect(() => { dispatch(fetchBIMProjects()); }, [dispatch]);

  const fetchData = async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const [appRes, revRes, comRes] = await Promise.all([
        api.get('/api/bim/collab/approvals', { params: { bim_project_id: pid } }),
        api.get('/api/bim/collab/revisions', { params: { bim_project_id: pid } }),
        api.get('/api/bim/collab/comments', { params: { bim_project_id: pid } }),
      ]);
      setApprovals(appRes.data || []);
      setRevisions(revRes.data || []);
      setComments(comRes.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { if (selectedProject) fetchData(selectedProject); }, [selectedProject]);

  const handleSubmitApproval = async () => {
    try {
      await api.post('/api/bim/collab/approvals', {
        bim_project_id: selectedProject,
        ...submitData,
      });
      setShowSubmit(false);
      setSubmitData({ version: 1, comments: '' });
      fetchData(selectedProject);
    } catch (err) { console.error(err); }
  };

  const handleReview = async (id) => {
    try {
      await api.put(`/api/bim/collab/approvals/${id}`, reviewData);
      setShowReview(null);
      setReviewData({ status: 'approved', comments: '', revision_notes: '' });
      fetchData(selectedProject);
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post('/api/bim/collab/comments', {
        bim_project_id: selectedProject,
        content: newComment,
      });
      setNewComment('');
      fetchData(selectedProject);
    } catch (err) { console.error(err); }
  };

  const handleSaveRevision = async (desc) => {
    try {
      const nextVer = revisions.length > 0 ? revisions[0].version + 1 : 1;
      await api.post('/api/bim/collab/revisions', {
        bim_project_id: selectedProject,
        version: nextVer,
        change_type: 'update',
        change_description: desc || `Revision v${nextVer}`,
      });
      fetchData(selectedProject);
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
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Design Approvals</h1>
            <p className="text-sm text-surface-500">Review · Approve · Revision History</p>
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
        <button onClick={() => setShowSubmit(true)} disabled={!selectedProject}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 transition-colors">
          <Send className="w-4 h-4" /> Submit for Approval
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: approvals.length, color: 'gray' },
          { label: 'Pending', value: approvals.filter(a => a.status === 'submitted' || a.status === 'under_review').length, color: 'amber' },
          { label: 'Approved', value: approvals.filter(a => a.status === 'approved').length, color: 'green' },
          { label: 'Rejected', value: approvals.filter(a => a.status === 'rejected').length, color: 'red' },
          { label: 'Revisions', value: revisions.length, color: 'blue' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-xl p-4 border border-${color}-200 dark:border-${color}-800/50`}>
            <p className="text-xs text-surface-500">{label}</p>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
        {[
          { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
          { id: 'revisions', label: 'Revision History', icon: History },
          { id: 'comments', label: 'Design Comments', icon: MessageSquare },
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

      {/* ═══ APPROVALS TAB ═══ */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-12 text-center text-surface-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No approvals submitted yet</p>
            </div>
          ) : (
            approvals.map(approval => {
              const st = STATUS_MAP[approval.status] || STATUS_MAP.draft;
              const StIcon = st.icon;
              return (
                <div key={approval._id} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-${st.color}-100 dark:bg-${st.color}-900/30`}>
                        <StIcon className={`w-5 h-5 text-${st.color}-600 dark:text-${st.color}-400`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-surface-900 dark:text-white">Version {approval.version}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${st.color}-100 dark:bg-${st.color}-900/30 text-${st.color}-700 dark:text-${st.color}-400`}>
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-surface-500 mt-1">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {approval.submitted_by?.name || 'Unknown'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(approval.submission_date || approval.createdAt).toLocaleDateString()}</span>
                          {approval.reviewer_id && <span className="flex items-center gap-1"><Pen className="w-3 h-3" /> {approval.reviewer_id?.name}</span>}
                        </div>
                        {approval.comments && <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">{approval.comments}</p>}
                        {approval.revision_notes && (
                          <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400">
                            <strong>Revision Notes:</strong> {approval.revision_notes}
                          </div>
                        )}
                      </div>
                    </div>
                    {(approval.status === 'submitted' || approval.status === 'under_review') && (
                      <button onClick={() => { setShowReview(approval._id); setReviewData({ status: 'approved', comments: '', revision_notes: '' }); }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    )}
                  </div>

                  {/* Review form */}
                  {showReview === approval._id && (
                    <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-surface-500">Decision</label>
                        <select value={reviewData.status} onChange={e => setReviewData(r => ({ ...r, status: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm">
                          <option value="approved">✅ Approve</option>
                          <option value="rejected">❌ Reject</option>
                          <option value="revision_requested">🔄 Request Revision</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-surface-500">Comments</label>
                        <textarea value={reviewData.comments} onChange={e => setReviewData(r => ({ ...r, comments: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm" rows={2} />
                      </div>
                      {reviewData.status === 'revision_requested' && (
                        <div>
                          <label className="text-xs font-medium text-surface-500">Revision Notes</label>
                          <textarea value={reviewData.revision_notes} onChange={e => setReviewData(r => ({ ...r, revision_notes: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm" rows={2} />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleReview(approval._id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Submit Review
                        </button>
                        <button onClick={() => setShowReview(null)}
                          className="px-4 py-2 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg text-sm font-medium transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ REVISIONS TAB ═══ */}
      {activeTab === 'revisions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => handleSaveRevision(prompt('Revision description:'))} disabled={!selectedProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors">
              <History className="w-4 h-4" /> Save Revision Snapshot
            </button>
          </div>

          {revisions.length === 0 ? (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-12 text-center text-surface-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No revisions recorded yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-200 dark:bg-surface-700" />

              {revisions.map((rev, i) => {
                const changeColors = { create: 'green', update: 'blue', delete: 'red', import: 'purple', export: 'cyan', approve: 'emerald', reject: 'orange' };
                const color = changeColors[rev.change_type] || 'gray';
                return (
                  <div key={rev._id} className="relative pl-14 pb-6">
                    <div className={`absolute left-4 w-5 h-5 rounded-full bg-${color}-500 border-2 border-white dark:border-surface-900 z-10`} />
                    <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-surface-900 dark:text-white">v{rev.version}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-400 capitalize`}>
                            {rev.change_type}
                          </span>
                        </div>
                        <span className="text-xs text-surface-500">{new Date(rev.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-surface-600 dark:text-surface-400">{rev.change_description || 'No description'}</p>
                      <p className="text-xs text-surface-400 mt-1">By: {rev.user_id?.name || 'System'}</p>
                      {rev.elements_changed?.length > 0 && (
                        <p className="text-xs text-surface-500 mt-1">{rev.elements_changed.length} elements changed</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ COMMENTS TAB ═══ */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {/* New comment */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
            <div className="flex gap-3">
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Add a design comment..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm resize-none"
                rows={2} />
              <button onClick={handleAddComment} disabled={!newComment.trim() || !selectedProject}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 self-end transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-12 text-center text-surface-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No comments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => {
                const priorityColors = { low: 'gray', medium: 'blue', high: 'amber', critical: 'red' };
                const pColor = priorityColors[comment.priority] || 'gray';
                return (
                  <div key={comment._id} className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(comment.user_id?.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-surface-900 dark:text-white text-sm">{comment.user_id?.name || 'Unknown'}</span>
                          <span className="text-xs text-surface-400">{new Date(comment.createdAt).toLocaleString()}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded bg-${pColor}-100 dark:bg-${pColor}-900/30 text-${pColor}-700 dark:text-${pColor}-400 capitalize`}>
                            {comment.priority}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${comment.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                            {comment.status}
                          </span>
                        </div>
                        <p className="text-sm text-surface-700 dark:text-surface-300 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submit Approval Modal */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Submit for Approval</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-surface-500">Version Number</label>
                <input type="number" value={submitData.version} min={1}
                  onChange={e => setSubmitData(d => ({ ...d, version: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500">Comments</label>
                <textarea value={submitData.comments} onChange={e => setSubmitData(d => ({ ...d, comments: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm" rows={3}
                  placeholder="Describe the changes in this version..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmitApproval} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors">Submit</button>
              <button onClick={() => setShowSubmit(false)} className="flex-1 px-4 py-2.5 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl font-medium transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
