// ═══════════════════════════════════════════════════════════════
// GLTF Exporter — Client-side 3D model export
// Exports entire Three.js scene to GLTF/GLB format
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';

// Dynamic import for GLTFExporter since it's a three.js addon
let GLTFExporterClass = null;

async function getExporter() {
  if (!GLTFExporterClass) {
    const module = await import('three/addons/exporters/GLTFExporter.js');
    GLTFExporterClass = module.GLTFExporter;
  }
  return new GLTFExporterClass();
}

/**
 * Export a Three.js scene to GLTF/GLB format and trigger download
 * @param {THREE.Scene} scene - The Three.js scene to export
 * @param {string} filename - Output filename (without extension)
 * @param {object} options - Export options
 */
export async function exportSceneToGLTF(scene, filename = 'bim-model', options = {}) {
  const {
    binary = true, // GLB (binary) by default
    onlyVisible = true,
    includeCustomExtensions = false,
    maxTextureSize = 2048,
  } = options;

  try {
    const exporter = await getExporter();
    
    // Clone scene to avoid modifying original
    const exportScene = scene.clone(true);
    
    // Remove non-exportable items (sky, fog, helpers)
    const toRemove = [];
    exportScene.traverse((child) => {
      if (child.isHelper || child.isGizmo) toRemove.push(child);
      if (child.name === 'sky' || child.name === 'fog') toRemove.push(child);
      if (onlyVisible && !child.visible) toRemove.push(child);
    });
    toRemove.forEach(obj => {
      if (obj.parent) obj.parent.remove(obj);
    });

    return new Promise((resolve, reject) => {
      exporter.parse(
        exportScene,
        (result) => {
          let blob;
          if (binary) {
            blob = new Blob([result], { type: 'application/octet-stream' });
            downloadBlob(blob, `${filename}.glb`);
          } else {
            const json = JSON.stringify(result, null, 2);
            blob = new Blob([json], { type: 'application/json' });
            downloadBlob(blob, `${filename}.gltf`);
          }
          resolve({ success: true, size: blob.size });
        },
        (error) => {
          console.error('GLTF export failed:', error);
          reject(error);
        },
        {
          binary,
          includeCustomExtensions,
          maxTextureSize,
        }
      );
    });
  } catch (error) {
    console.error('Export setup failed:', error);
    throw error;
  }
}

/**
 * Export scene to OBJ format (simpler, widely compatible)
 */
export async function exportSceneToOBJ(scene, filename = 'bim-model') {
  try {
    const module = await import('three/addons/exporters/OBJExporter.js');
    const exporter = new module.OBJExporter();
    const result = exporter.parse(scene);
    const blob = new Blob([result], { type: 'text/plain' });
    downloadBlob(blob, `${filename}.obj`);
    return { success: true, size: blob.size };
  } catch (error) {
    console.error('OBJ export failed:', error);
    throw error;
  }
}

/**
 * Generate a 2D floor plan as PDF
 */
export async function exportFloorPlanPDF(elements, projectName = 'Floor Plan') {
  try {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    
    const S = 0.05; // Scale: mm to PDF mm
    const offsetX = 50;
    const offsetY = 50;

    // Title
    doc.setFontSize(16);
    doc.text(projectName, 20, 20);
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 28);
    doc.text('Scale: 1:100', 20, 34);

    // Draw walls
    doc.setLineWidth(0.5);
    doc.setDrawColor(60, 60, 60);
    (elements.walls || []).forEach(wall => {
      if (!wall?.start_point || !wall?.end_point) return;
      const x1 = wall.start_point.x * S + offsetX;
      const y1 = wall.start_point.y * S + offsetY;
      const x2 = wall.end_point.x * S + offsetX;
      const y2 = wall.end_point.y * S + offsetY;
      doc.line(x1, y1, x2, y2);

      // Wall thickness representation
      const angle = Math.atan2(wall.end_point.y - wall.start_point.y, wall.end_point.x - wall.start_point.x);
      const t = (wall.thickness || 230) * S / 2;
      const nx = Math.cos(angle + Math.PI / 2) * t;
      const ny = Math.sin(angle + Math.PI / 2) * t;
      doc.setLineWidth(0.15);
      doc.setDrawColor(120, 120, 120);
      doc.line(x1 + nx, y1 + ny, x2 + nx, y2 + ny);
      doc.line(x1 - nx, y1 - ny, x2 - nx, y2 - ny);
      doc.setLineWidth(0.5);
      doc.setDrawColor(60, 60, 60);
    });

    // Draw doors
    doc.setDrawColor(139, 69, 19);
    (elements.doors || []).forEach(door => {
      if (!door?.position) return;
      const x = door.position.x * S + offsetX;
      const y = door.position.y * S + offsetY;
      const w = (door.width || 900) * S;
      doc.setLineWidth(0.3);
      doc.line(x, y, x + w, y);
      // Door swing arc
      doc.setDrawColor(139, 69, 19, 0.3);
      const startAngle = 0;
      const endAngle = Math.PI / 2;
      // Simple arc approximation with line segments
      for (let a = startAngle; a < endAngle; a += 0.1) {
        const ax = x + w * Math.cos(a);
        const ay = y - w * Math.sin(a);
        const bx = x + w * Math.cos(a + 0.1);
        const by = y - w * Math.sin(a + 0.1);
        doc.line(ax, ay, bx, by);
      }
      doc.setDrawColor(139, 69, 19);
    });

    // Draw windows
    doc.setDrawColor(135, 206, 235);
    doc.setLineWidth(0.4);
    (elements.windows || []).forEach(win => {
      if (!win?.position) return;
      const x = win.position.x * S + offsetX;
      const y = win.position.y * S + offsetY;
      const w = (win.width || 1200) * S;
      doc.line(x, y - 0.5, x + w, y - 0.5);
      doc.line(x, y + 0.5, x + w, y + 0.5);
    });

    // Room labels
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    (elements.rooms || []).forEach(room => {
      if (!room.boundary || room.boundary.length < 3) return;
      const cx = room.boundary.reduce((s, p) => s + p.x, 0) / room.boundary.length * S + offsetX;
      const cy = room.boundary.reduce((s, p) => s + p.y, 0) / room.boundary.length * S + offsetY;
      doc.text(room.name || 'Room', cx, cy, { align: 'center' });
    });

    // Dimensions
    doc.setFontSize(5);
    doc.setTextColor(200, 0, 0);
    (elements.walls || []).forEach(wall => {
      if (!wall?.start_point || !wall?.end_point) return;
      const dx = wall.end_point.x - wall.start_point.x;
      const dy = wall.end_point.y - wall.start_point.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const mx = ((wall.start_point.x + wall.end_point.x) / 2) * S + offsetX;
      const my = ((wall.start_point.y + wall.end_point.y) / 2) * S + offsetY;
      doc.text(`${Math.round(len)}`, mx, my - 2);
    });

    doc.save(`${projectName.replace(/\s+/g, '_')}_floor_plan.pdf`);
    return { success: true };
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

// ─── IFC Export (via Bonsai Service) ───────────────────────────
/**
 * Export the current project to IFC format via the Bonsai backend
 * @param {string} projectId - The BIM project ID
 * @param {object} config - Export configuration
 * @returns {Promise<object>} Export result with download URL
 */
export async function exportToIFC(projectId, config = {}) {
  try {
    const bimService = (await import('../../services/bimService')).default;
    const { data } = await bimService.exportToIFC(projectId, config);
    
    if (data.success && data.download_url) {
      // Auto-download the file
      const downloadRes = await bimService.downloadIFC(data.export?.file_name);
      const blob = new Blob([downloadRes.data], { type: 'application/x-step' });
      downloadBlob(blob, data.export?.file_name || 'export.ifc');
    }
    
    return data;
  } catch (error) {
    console.error('IFC export failed:', error);
    throw error;
  }
}

/**
 * Import an IFC file and convert it to Design Studio elements
 * @param {File} file - The IFC file to import
 * @returns {Promise<object>} Parsed elements in Studio format
 */
export async function importFromIFC(file) {
  try {
    const bimService = (await import('../../services/bimService')).default;
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await bimService.importIFC(formData);
    
    if (data.success) {
      // Map IFC elements to Studio format
      const { mapIFCToStudioElements } = await import('./ifcElementMapper');
      return mapIFCToStudioElements(data);
    }
    
    return data;
  } catch (error) {
    console.error('IFC import failed:', error);
    throw error;
  }
}

// ─── Helpers ───────────────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default {
  exportSceneToGLTF,
  exportSceneToOBJ,
  exportFloorPlanPDF,
  exportToIFC,
  importFromIFC,
};
