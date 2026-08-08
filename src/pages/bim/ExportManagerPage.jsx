import { useState, useEffect, useRef, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBIMProjects } from '../../redux/slices/bimSlice';
import {
  ArrowLeft, Download, FileText, Image, Box, FileCode, Loader2, Check,
  Building2, Layers, File
} from 'lucide-react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import api from '../../services/api';

const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF Report', icon: FileText, color: 'red', desc: 'Project summary with floor plans, room schedule, material BOQ' },
  { id: 'png', label: 'PNG Snapshot', icon: Image, color: 'green', desc: 'High-resolution screenshot of 2D floor plan or 3D view' },
  { id: 'json', label: 'JSON Data', icon: FileCode, color: 'blue', desc: 'Full project data export with all elements and metadata' },
  { id: 'obj', label: 'OBJ Model', icon: Box, color: 'amber', desc: '3D model in Wavefront OBJ format for external rendering' },
  { id: 'gltf', label: 'GLTF Model', icon: Box, color: 'purple', desc: '3D model in glTF format for web viewers and AR apps' },
  { id: 'ifc', label: 'IFC Export', icon: Building2, color: 'teal', desc: 'Industry Foundation Classes export for BIM interoperability' },
];

// 3D scene for snapshot
function SnapshotScene({ projectData, onCapture }) {
  const { gl, scene, camera } = useThree();
  const floors = projectData?.floors || [];

  useEffect(() => {
    if (onCapture) {
      onCapture(() => {
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      });
    }
  }, [gl, scene, camera, onCapture]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#4A7C4F" roughness={1} />
      </mesh>
      {floors.map((floor, i) => (
        <group key={i}>
          <mesh position={[5, i * 3, 5]}>
            <boxGeometry args={[10, 0.15, 8]} />
            <meshStandardMaterial color="#D3D3D3" roughness={0.9} />
          </mesh>
          <mesh position={[0, i * 3 + 1.5, 5]}><boxGeometry args={[0.23, 3, 8]} /><meshStandardMaterial color="#C4B5A0" /></mesh>
          <mesh position={[10, i * 3 + 1.5, 5]}><boxGeometry args={[0.23, 3, 8]} /><meshStandardMaterial color="#C4B5A0" /></mesh>
          <mesh position={[5, i * 3 + 1.5, 1]}><boxGeometry args={[10, 3, 0.23]} /><meshStandardMaterial color="#C4B5A0" /></mesh>
          <mesh position={[5, i * 3 + 1.5, 9]}><boxGeometry args={[10, 3, 0.23]} /><meshStandardMaterial color="#C4B5A0" /></mesh>
        </group>
      ))}
    </group>
  );
}

function generateIFCContent(project) {
  const now = new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
  let ifc = `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');\n`;
  ifc += `FILE_NAME('${project.project_name || 'Export'}.ifc','${now}',('${project.created_by || 'User'}'),('City Constructions ERP'),'BIM Studio','BIM Studio','');\n`;
  ifc += `FILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n`;

  let id = 1;
  ifc += `#${id++}=IFCPROJECT('${generateGUID()}',#${id},'${project.project_name || 'Project'}');\n`;
  ifc += `#${id++}=IFCOWNERHISTORY(#${id+1},#${id+2});\n`;
  ifc += `#${id++}=IFCPERSONANDORGANIZATION(#${id+1},#${id+2});\n`;
  ifc += `#${id++}=IFCPERSON($,$,'${project.created_by || 'User'}');\n`;
  ifc += `#${id++}=IFCORGANIZATION($,'City Constructions');\n`;
  ifc += `#${id++}=IFCAPPLICATION(#${id-1},'1.0','BIM Studio','BIMSTUDIO');\n`;

  // Site
  ifc += `#${id++}=IFCSITE('${generateGUID()}',#2,'Site',$,$,$,$,$,.ELEMENT.);\n`;

  // Buildings
  const floors = project.floors || [];
  if (floors.length > 0) {
    const bldId = id++;
    ifc += `#${bldId}=IFCBUILDING('${generateGUID()}',#2,'${project.project_name || 'Building'}',$,$,$,$,$,.ELEMENT.,$,$,$);\n`;

    floors.forEach((floor, fi) => {
      const storyId = id++;
      ifc += `#${storyId}=IFCBUILDINGSTOREY('${generateGUID()}',#2,'${floor.floor_name || `Floor ${fi}`}',$,$,$,$,$,.ELEMENT.,${fi * 3000}.0);\n`;

      // Walls
      for (let w = 0; w < (floor.walls || 0); w++) {
        ifc += `#${id++}=IFCWALL('${generateGUID()}',#2,'Wall-${fi}-${w}',$,$,$,$,$,.NOTDEFINED.);\n`;
      }
      // Doors
      for (let d = 0; d < (floor.doors || 0); d++) {
        ifc += `#${id++}=IFCDOOR('${generateGUID()}',#2,'Door-${fi}-${d}',$,$,$,$,$,2100.0,900.0);\n`;
      }
      // Windows
      for (let w = 0; w < (floor.windows || 0); w++) {
        ifc += `#${id++}=IFCWINDOW('${generateGUID()}',#2,'Window-${fi}-${w}',$,$,$,$,$,1200.0,1200.0);\n`;
      }
      // Columns
      for (let c = 0; c < (floor.columns || 0); c++) {
        ifc += `#${id++}=IFCCOLUMN('${generateGUID()}',#2,'Column-${fi}-${c}',$,$,$,$,$,.NOTDEFINED.);\n`;
      }
    });
  }

  ifc += `ENDSEC;\nEND-ISO-10303-21;\n`;
  return ifc;
}

function generateGUID() {
  return 'xxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)).toUpperCase();
}

function generateOBJ(project) {
  let obj = `# OBJ Export — ${project.project_name || 'BIM Studio'}\n# Generated by City Constructions ERP\n\n`;
  let vertexOffset = 0;
  const floors = project.floors || [];

  floors.forEach((floor, fi) => {
    const y = fi * 3;
    // Floor slab
    obj += `o Floor_${fi}\n`;
    obj += `v 0 ${y} 0\nv 10 ${y} 0\nv 10 ${y} 8\nv 0 ${y} 8\n`;
    obj += `f ${vertexOffset+1} ${vertexOffset+2} ${vertexOffset+3} ${vertexOffset+4}\n`;
    vertexOffset += 4;

    // 4 walls
    const wallHeight = 3;
    const wallPairs = [[0,0,10,0],[10,0,10,8],[10,8,0,8],[0,8,0,0]];
    wallPairs.forEach(([x1,z1,x2,z2], wi) => {
      obj += `o Wall_${fi}_${wi}\n`;
      obj += `v ${x1} ${y} ${z1}\nv ${x2} ${y} ${z2}\nv ${x2} ${y+wallHeight} ${z2}\nv ${x1} ${y+wallHeight} ${z1}\n`;
      obj += `f ${vertexOffset+1} ${vertexOffset+2} ${vertexOffset+3} ${vertexOffset+4}\n`;
      vertexOffset += 4;
    });
  });

  return obj;
}

function generateGLTF(project) {
  const floors = project.floors || [];
  const nodes = [];
  const meshes = [];
  const accessors = [];
  const bufferViews = [];

  floors.forEach((floor, fi) => {
    nodes.push({ name: `Floor_${fi}`, translation: [5, fi * 3, 5], mesh: fi });
    meshes.push({
      primitives: [{ attributes: {}, mode: 4 }],
      name: `Floor_${fi}_Mesh`
    });
  });

  return JSON.stringify({
    asset: { version: '2.0', generator: 'City Constructions ERP BIM Studio' },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
  }, null, 2);
}

export default function ExportManagerPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.bim);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [exporting, setExporting] = useState({});
  const [exportHistory, setExportHistory] = useState([]);
  const captureRef = useRef(null);

  useEffect(() => { dispatch(fetchBIMProjects()); }, [dispatch]);

  const fetchProjectData = async (pid) => {
    if (!pid) return;
    try {
      const { data } = await api.get(`/api/bim/exports/${pid}`, { params: { format: 'summary' } });
      setProjectData(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (selectedProject) fetchProjectData(selectedProject); }, [selectedProject]);

  const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    if (!selectedProject || !projectData) return;
    setExporting(e => ({ ...e, [format]: true }));
    const name = (projectData.project_name || 'export').replace(/\s+/g, '_');

    try {
      switch (format) {
        case 'json': {
          const { data } = await api.get(`/api/bim/exports/${selectedProject}`);
          downloadBlob(JSON.stringify(data, null, 2), `${name}.json`, 'application/json');
          break;
        }
        case 'pdf': {
          // Generate HTML-based PDF report
          const report = generatePDFReport(projectData);
          const win = window.open('', '_blank');
          win.document.write(report);
          win.document.close();
          win.print();
          break;
        }
        case 'png': {
          if (captureRef.current) {
            const dataUrl = captureRef.current();
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `${name}_3d.png`;
            a.click();
          }
          break;
        }
        case 'obj': {
          const obj = generateOBJ(projectData);
          downloadBlob(obj, `${name}.obj`, 'text/plain');
          break;
        }
        case 'gltf': {
          const gltf = generateGLTF(projectData);
          downloadBlob(gltf, `${name}.gltf`, 'application/json');
          break;
        }
        case 'ifc': {
          const ifc = generateIFCContent(projectData);
          downloadBlob(ifc, `${name}.ifc`, 'text/plain');
          break;
        }
      }

      setExportHistory(h => [{ format, name: `${name}.${format}`, time: new Date() }, ...h]);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }

    setExporting(e => ({ ...e, [format]: false }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/bim')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Export Manager</h1>
            <p className="text-sm text-surface-500">PDF · PNG · OBJ · GLTF · IFC · JSON</p>
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

      {/* Project summary */}
      {projectData && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">{projectData.project_name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div><span className="text-surface-500">Buildings</span><p className="font-mono font-bold text-surface-900 dark:text-white">{projectData.buildings || 0}</p></div>
            <div><span className="text-surface-500">Floors</span><p className="font-mono font-bold text-surface-900 dark:text-white">{projectData.floors?.length || 0}</p></div>
            <div><span className="text-surface-500">Status</span><p className="font-medium capitalize text-surface-900 dark:text-white">{projectData.status}</p></div>
            <div><span className="text-surface-500">Designer</span><p className="font-medium text-surface-900 dark:text-white">{projectData.created_by || '—'}</p></div>
            <div><span className="text-surface-500">Client</span><p className="font-medium text-surface-900 dark:text-white">{projectData.client || '—'}</p></div>
          </div>
        </div>
      )}

      {/* Export Format Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_FORMATS.map(format => (
          <div key={format.id} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl bg-${format.color}-100 dark:bg-${format.color}-900/30`}>
                <format.icon className={`w-6 h-6 text-${format.color}-600 dark:text-${format.color}-400`} />
              </div>
              {exporting[format.id] && <Loader2 className="w-5 h-5 text-surface-400 animate-spin" />}
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-white">{format.label}</h3>
            <p className="text-xs text-surface-500 mt-1 mb-4">{format.desc}</p>
            <button onClick={() => handleExport(format.id)} disabled={!selectedProject || !projectData || exporting[format.id]}
              className={`w-full py-2.5 bg-${format.color}-600 hover:bg-${format.color}-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm`}>
              {exporting[format.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting[format.id] ? 'Exporting...' : `Export ${format.label.split(' ')[0]}`}
            </button>
          </div>
        ))}
      </div>

      {/* 3D Preview for PNG capture */}
      {projectData && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm" style={{ height: '350px' }}>
          <div className="p-3 border-b border-surface-200 dark:border-surface-700">
            <span className="text-xs font-medium text-surface-500">3D Preview — PNG snapshots captured from this view</span>
          </div>
          <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
            <PerspectiveCamera makeDefault position={[18, 12, 18]} fov={50} />
            <OrbitControls enableDamping />
            <ambientLight intensity={0.5} />
            <directionalLight position={[20, 30, 15]} intensity={1} castShadow />
            <Suspense fallback={null}>
              <SnapshotScene projectData={projectData} onCapture={(fn) => { captureRef.current = fn; }} />
              <ContactShadows position={[0, -0.01, 0]} opacity={0.3} scale={50} blur={2} />
            </Suspense>
            <Sky sunPosition={[100, 50, 100]} turbidity={8} />
          </Canvas>
        </div>
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" /> Export History
          </h3>
          <div className="space-y-2">
            {exportHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-surface-900 dark:text-white">{entry.name}</span>
                <span className="text-xs text-surface-400 uppercase bg-surface-200 dark:bg-surface-700 px-1.5 py-0.5 rounded">{entry.format}</span>
                <span className="text-xs text-surface-400 ml-auto">{entry.time.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function generatePDFReport(project) {
  const floors = project.floors || [];
  let totalRooms = 0, totalWalls = 0, totalDoors = 0, totalWindows = 0, totalCols = 0;
  floors.forEach(f => { totalRooms += f.rooms || 0; totalWalls += f.walls || 0; totalDoors += f.doors || 0; totalWindows += f.windows || 0; totalCols += f.columns || 0; });

  return `<!DOCTYPE html>
<html><head><title>${project.project_name} — BIM Report</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; color: #1a1a2e; }
  h1 { border-bottom: 3px solid #3B82F6; padding-bottom: 10px; }
  h2 { color: #3B82F6; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; }
  .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 15px 0; }
  .meta div { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .meta span { font-size: 12px; color: #64748b; }
  .meta p { font-size: 18px; font-weight: 700; margin: 4px 0 0; }
  .footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>🏗️ ${project.project_name}</h1>
<div class="meta">
  <div><span>ERP Project</span><p>${project.erp_project || '—'}</p></div>
  <div><span>Client</span><p>${project.client || '—'}</p></div>
  <div><span>Status</span><p style="text-transform:capitalize">${project.status}</p></div>
  <div><span>Designer</span><p>${project.created_by || '—'}</p></div>
  <div><span>Buildings</span><p>${project.buildings || 0}</p></div>
  <div><span>Total Floors</span><p>${floors.length}</p></div>
</div>
${project.site_data ? `<h2>Site Data</h2>
<div class="meta">
  <div><span>Plot Area</span><p>${project.site_data.plot_area || '—'} sqm</p></div>
  <div><span>Built-up Area</span><p>${project.site_data.built_up_area || '—'} sqm</p></div>
  <div><span>FSI</span><p>${project.site_data.fsi || '—'}</p></div>
</div>` : ''}
<h2>Element Summary</h2>
<div class="meta">
  <div><span>Rooms</span><p>${totalRooms}</p></div>
  <div><span>Walls</span><p>${totalWalls}</p></div>
  <div><span>Doors</span><p>${totalDoors}</p></div>
  <div><span>Windows</span><p>${totalWindows}</p></div>
  <div><span>Columns</span><p>${totalCols}</p></div>
</div>
<h2>Floor Schedule</h2>
<table><thead><tr><th>Building</th><th>Floor</th><th>Area (sqm)</th><th>Rooms</th><th>Walls</th><th>Columns</th><th>Doors</th><th>Windows</th></tr></thead>
<tbody>${floors.map(f => `<tr><td>${f.building_name}</td><td>${f.floor_name}</td><td>${f.total_area || '—'}</td><td>${f.rooms}</td><td>${f.walls}</td><td>${f.columns}</td><td>${f.doors}</td><td>${f.windows}</td></tr>`).join('')}</tbody></table>
<div class="footer">Generated by City Constructions ERP — BIM Design Studio<br>${new Date().toLocaleString()}</div>
</body></html>`;
}
