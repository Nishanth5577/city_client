// ═══════════════════════════════════════════════════════════════
// BonsaiPanel — Bonsai (BlenderBIM / IfcOpenShell) Integration
// Sidebar panel for IFC export, import, validate, and status
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  checkBonsaiStatus, exportProjectToIFC, importIFCToProject,
  fetchIFCExports, validateProjectIFC, toggleBonsaiPanel,
} from '../../../redux/slices/bimSlice';
import {
  Activity, FileOutput, FileInput, ShieldCheck, Download,
  Trash2, Clock, CheckCircle2, XCircle, AlertTriangle,
  Loader2, X, ChevronDown, ChevronRight, Database,
  File, ExternalLink, RefreshCw, Wifi, WifiOff, Info,
  TreePine, Layers,
} from 'lucide-react';

export default function BonsaiPanel() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('export');
  const [exportConfig, setExportConfig] = useState({
    include_furniture: true,
    include_mep: true,
    include_structural: true,
    include_rooms: true,
    ifc_version: 'IFC4',
  });
  const [expandedExport, setExpandedExport] = useState(null);

  const {
    activeProject, bonsaiConnected, bonsaiStatus, bonsaiLoading,
    ifcExporting, ifcExportProgress, ifcExports, ifcExportsLoading,
    ifcImporting, ifcImportResult, ifcValidation, ifcValidating,
    showBonsaiPanel,
  } = useSelector(s => s.bim);

  // Check Bonsai status on mount
  useEffect(() => {
    dispatch(checkBonsaiStatus());
  }, [dispatch]);

  // Load export history when panel opens
  useEffect(() => {
    if (showBonsaiPanel && activeProject?._id) {
      dispatch(fetchIFCExports(activeProject._id));
    }
  }, [dispatch, showBonsaiPanel, activeProject?._id]);

  const handleExport = useCallback(() => {
    if (!activeProject?._id) return;
    dispatch(exportProjectToIFC({ projectId: activeProject._id, config: exportConfig }));
  }, [dispatch, activeProject?._id, exportConfig]);

  const handleImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bim_project_id', activeProject?._id || '');
    dispatch(importIFCToProject(formData));
    e.target.value = '';
  }, [dispatch, activeProject?._id]);

  const handleValidate = useCallback((exportId) => {
    dispatch(validateProjectIFC(exportId));
  }, [dispatch]);

  const handleDownload = useCallback(async (filename) => {
    try {
      const { data } = await import('../../../services/bimService').then(m => m.default.downloadIFC(filename));
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, []);

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (!showBonsaiPanel) return null;

  const tabs = [
    { id: 'export', label: 'Export', icon: FileOutput },
    { id: 'import', label: 'Import', icon: FileInput },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'status', label: 'Status', icon: Activity },
  ];

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-surface-900 border-l border-surface-700/50 z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800/50 bg-surface-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TreePine className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Bonsai / IFC</h3>
            <div className="flex items-center gap-1.5">
              {bonsaiConnected ? (
                <><Wifi className="w-2.5 h-2.5 text-emerald-400" /><span className="text-[9px] text-emerald-400">Connected</span></>
              ) : (
                <><WifiOff className="w-2.5 h-2.5 text-red-400" /><span className="text-[9px] text-red-400">Offline</span></>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => dispatch(toggleBonsaiPanel())} className="p-1.5 hover:bg-surface-800 rounded-lg transition-colors">
          <X className="w-4 h-4 text-surface-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-800/50 px-2 pt-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-t-lg transition-all ${
              activeTab === tab.id
                ? 'bg-surface-800 text-white border-b-2 border-emerald-500'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ═══════ EXPORT TAB ═══════ */}
        {activeTab === 'export' && (
          <>
            <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700/30">
              <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                <FileOutput className="w-3.5 h-3.5 text-emerald-400" />
                Export to IFC
              </h4>
              <p className="text-[10px] text-surface-400 mb-3">
                Export the current design as an IFC4 file compatible with Bonsai (BlenderBIM), Revit, ArchiCAD, and all IFC-compliant software.
              </p>

              {/* Config Options */}
              <div className="space-y-2 mb-4">
                <label className="text-[10px] text-surface-500 font-semibold uppercase tracking-wider">Include</label>
                {[
                  { key: 'include_furniture', label: 'Furniture & Interior' },
                  { key: 'include_mep', label: 'MEP (Electrical, Plumbing, HVAC)' },
                  { key: 'include_structural', label: 'Structural Elements' },
                  { key: 'include_rooms', label: 'Rooms / Spaces' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 text-[11px] text-surface-300 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={exportConfig[opt.key]}
                      onChange={(e) => setExportConfig(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded border-surface-600 bg-surface-800 text-emerald-500 focus:ring-emerald-500/30"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-[10px] text-surface-500 font-semibold uppercase tracking-wider block mb-1">IFC Version</label>
                <select
                  value={exportConfig.ifc_version}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, ifc_version: e.target.value }))}
                  className="w-full bg-surface-800/80 border border-surface-700/50 rounded-lg px-3 py-1.5 text-[11px] text-surface-200 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                >
                  <option value="IFC4">IFC4 (Recommended)</option>
                  <option value="IFC2x3">IFC2x3 (Legacy)</option>
                </select>
              </div>

              <button
                onClick={handleExport}
                disabled={ifcExporting || !bonsaiConnected || !activeProject?._id}
                className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
              >
                {ifcExporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{ifcExportProgress || 'Exporting...'}</>
                ) : (
                  <><FileOutput className="w-4 h-4" />Export to IFC</>
                )}
              </button>

              {!bonsaiConnected && (
                <div className="mt-2 flex items-start gap-2 text-[10px] text-amber-400 bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Bonsai service is offline. Start it with: <code className="bg-surface-800 px-1 rounded">cd server/bonsai_service && python main.py</code></span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══════ IMPORT TAB ═══════ */}
        {activeTab === 'import' && (
          <>
            <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700/30">
              <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                <FileInput className="w-3.5 h-3.5 text-blue-400" />
                Import IFC File
              </h4>
              <p className="text-[10px] text-surface-400 mb-3">
                Import an IFC file from Bonsai, Revit, or any IFC-compliant tool. Elements will be converted to editable Design Studio elements.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".ifc"
                onChange={handleImport}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={ifcImporting || !bonsaiConnected}
                className="w-full py-3 rounded-lg border-2 border-dashed border-surface-600 hover:border-blue-500/50 text-xs text-surface-400 hover:text-blue-400 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
              >
                {ifcImporting ? (
                  <><Loader2 className="w-5 h-5 animate-spin text-blue-400" /><span>Importing & converting...</span></>
                ) : (
                  <><FileInput className="w-5 h-5" /><span>Click to select .ifc file</span></>
                )}
              </button>
            </div>

            {/* Import Results */}
            {ifcImportResult && (
              <div className="bg-surface-800/50 rounded-xl p-4 border border-emerald-500/20">
                <h4 className="text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Import Complete
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-surface-300">
                    <span>Total Elements</span>
                    <span className="text-white font-medium">{ifcImportResult.total_elements || 0}</span>
                  </div>
                  {ifcImportResult.buildings?.map((b, i) => (
                    <div key={i} className="pl-2 border-l border-surface-700">
                      <span className="text-surface-400">{b.name}</span>
                      <span className="text-surface-500 ml-2">({b.floors?.length || 0} floors)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════ HISTORY TAB ═══════ */}
        {activeTab === 'history' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-surface-400" />
                IFC Export History
              </h4>
              <button
                onClick={() => activeProject?._id && dispatch(fetchIFCExports(activeProject._id))}
                className="p-1.5 hover:bg-surface-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-surface-400 ${ifcExportsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {ifcExportsLoading && !ifcExports.length ? (
              <div className="text-center py-8 text-surface-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading exports...
              </div>
            ) : ifcExports.length === 0 ? (
              <div className="text-center py-8 text-surface-500 text-xs">
                <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No IFC exports yet
              </div>
            ) : (
              <div className="space-y-2">
                {ifcExports.map(exp => (
                  <div key={exp._id} className="bg-surface-800/50 rounded-xl border border-surface-700/30 overflow-hidden">
                    <button
                      onClick={() => setExpandedExport(expandedExport === exp._id ? null : exp._id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          exp.status === 'completed' ? 'bg-emerald-500' :
                          exp.status === 'processing' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                        }`} />
                        <div>
                          <span className="text-[11px] text-white font-medium block">{exp.file_name}</span>
                          <span className="text-[9px] text-surface-500">{formatDate(exp.createdAt)} • {formatSize(exp.file_size)}</span>
                        </div>
                      </div>
                      {expandedExport === exp._id ? <ChevronDown className="w-3.5 h-3.5 text-surface-400" /> : <ChevronRight className="w-3.5 h-3.5 text-surface-400" />}
                    </button>

                    {expandedExport === exp._id && (
                      <div className="px-3 pb-3 space-y-2 border-t border-surface-700/30 pt-2">
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div><span className="text-surface-500">IFC Version:</span> <span className="text-surface-200">{exp.ifc_version}</span></div>
                          <div><span className="text-surface-500">Entities:</span> <span className="text-surface-200">{exp.entity_count || '—'}</span></div>
                          <div><span className="text-surface-500">Type:</span> <span className="text-surface-200">{exp.export_type}</span></div>
                          <div><span className="text-surface-500">Status:</span> <span className={exp.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}>{exp.status}</span></div>
                        </div>

                        {/* Validation */}
                        {exp.validation_results?.is_valid !== null && (
                          <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded-lg ${
                            exp.validation_results.is_valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {exp.validation_results.is_valid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {exp.validation_results.is_valid ? 'Valid IFC' : `${exp.validation_results.errors?.length || 0} errors`}
                            {(exp.validation_results.warnings?.length || 0) > 0 && (
                              <span className="text-amber-400 ml-1">• {exp.validation_results.warnings.length} warnings</span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-1.5">
                          {exp.status === 'completed' && (
                            <>
                              <button
                                onClick={() => handleDownload(exp.file_name)}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-1"
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>
                              <button
                                onClick={() => handleValidate(exp._id)}
                                disabled={ifcValidating}
                                className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                {ifcValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />} Validate
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════ STATUS TAB ═══════ */}
        {activeTab === 'status' && (
          <>
            <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700/30">
              <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Bonsai Service Status
              </h4>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  bonsaiConnected ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}>
                  {bonsaiConnected ? <Wifi className="w-5 h-5 text-emerald-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
                </div>
                <div>
                  <span className={`text-sm font-semibold ${bonsaiConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {bonsaiConnected ? 'Connected' : 'Offline'}
                  </span>
                  <p className="text-[10px] text-surface-400">
                    {bonsaiConnected ? 'IfcOpenShell service is running' : 'Python service is not running'}
                  </p>
                </div>
              </div>

              {bonsaiStatus?.service && (
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-surface-700/30">
                    <span className="text-surface-400">Service</span>
                    <span className="text-surface-200">{bonsaiStatus.service?.service || 'Bonsai IFC Service'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-700/30">
                    <span className="text-surface-400">IfcOpenShell</span>
                    <span className="text-surface-200">{bonsaiStatus.service?.ifcopenshell_version || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-700/30">
                    <span className="text-surface-400">Schema Support</span>
                    <span className="text-surface-200">{bonsaiStatus.service?.schema_support?.join(', ') || 'IFC4'}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => dispatch(checkBonsaiStatus())}
                disabled={bonsaiLoading}
                className="w-full mt-4 py-2 rounded-lg text-[11px] font-medium bg-surface-800 hover:bg-surface-700 text-surface-300 transition-colors flex items-center justify-center gap-2"
              >
                {bonsaiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Refresh Status
              </button>
            </div>

            {!bonsaiConnected && (
              <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700/30">
                <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  How to Start
                </h4>
                <div className="text-[10px] text-surface-400 space-y-2">
                  <p>1. Install Python dependencies:</p>
                  <code className="block bg-surface-800 rounded-lg px-3 py-2 text-emerald-400 font-mono">
                    cd server/bonsai_service<br />
                    pip install -r requirements.txt
                  </code>
                  <p>2. Start the service:</p>
                  <code className="block bg-surface-800 rounded-lg px-3 py-2 text-emerald-400 font-mono">
                    python main.py
                  </code>
                  <p className="text-surface-500 mt-2">The service runs on port 8100 and provides IFC processing powered by IfcOpenShell.</p>
                </div>
              </div>
            )}

            {/* Architecture Info */}
            <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700/30">
              <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                Supported IFC Entities
              </h4>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {['IfcWall', 'IfcDoor', 'IfcWindow', 'IfcColumn', 'IfcBeam', 'IfcStairFlight', 'IfcSpace', 'IfcFurnishingElement', 'IfcSlab', 'IfcRoof'].map(etype => (
                  <div key={etype} className="flex items-center gap-1.5 text-surface-300 py-0.5">
                    <Layers className="w-2.5 h-2.5 text-surface-500" />
                    {etype}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
