import { useSelector, useDispatch } from 'react-redux';
import { updateElementLocal, updateBimElement } from '../../../redux/slices/bimSlice';
import { useState } from 'react';
import { Info, Box, Ruler, DollarSign, Shield, Thermometer, Zap, Calendar, Wrench } from 'lucide-react';

export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const { selectedElementIds, selectedElementType, elements } = useSelector(s => s.bim);
  const [activeTab, setActiveTab] = useState('geometry');

  // Get selected element
  const selectedElement = (() => {
    if (selectedElementIds.length !== 1 || !selectedElementType) return null;
    const key = selectedElementType === 'furniture' ? 'furniture' : `${selectedElementType}s`;
    return elements[key]?.find(e => (e._id || e.canvas_id) === selectedElementIds[0]);
  })();

  const handleUpdate = (field, value) => {
    if (!selectedElement || !selectedElementType) return;
    const id = selectedElement._id || selectedElement.canvas_id;
    const update = {};

    // Handle nested fields like "bim.cost"
    if (field.includes('.')) {
      const parts = field.split('.');
      update[parts[0]] = { ...selectedElement[parts[0]], [parts[1]]: value };
    } else {
      update[field] = value;
    }

    dispatch(updateElementLocal({ element_type: selectedElementType, element: { ...selectedElement, ...update } }));
    if (selectedElement._id) {
      dispatch(updateBimElement({ type: selectedElementType, id: selectedElement._id, data: update }));
    }
  };

  const tabs = [
    { id: 'geometry', icon: Ruler, label: 'Geometry' },
    { id: 'bim', icon: Info, label: 'BIM Data' },
    { id: 'material', icon: Box, label: 'Material' },
  ];

  if (!selectedElement) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-surface-600 p-6">
        <Info className="w-10 h-10 mb-3 opacity-50" />
        <p className="text-xs text-center">Select an element to view and edit its properties</p>
        {selectedElementIds.length > 1 && (
          <p className="text-xs mt-2 text-primary-400">{selectedElementIds.length} elements selected</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Element Type Badge */}
      <div className="px-3 py-2 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-primary-600/20 text-primary-400 text-[10px] font-bold uppercase">
            {selectedElementType}
          </span>
          <span className="text-xs text-surface-300 truncate">
            {selectedElement.name || selectedElement.canvas_id?.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Properties Content */}
      <div className="p-3 space-y-3">
        {activeTab === 'geometry' && (
          <>
            {/* Position */}
            {selectedElement.position && (
              <PropGroup title="Position">
                <PropField label="X" value={selectedElement.position.x} onChange={v => handleUpdate('position', { ...selectedElement.position, x: Number(v) })} type="number" />
                <PropField label="Y" value={selectedElement.position.y} onChange={v => handleUpdate('position', { ...selectedElement.position, y: Number(v) })} type="number" />
              </PropGroup>
            )}
            {selectedElement.start_point && (
              <PropGroup title="Start / End">
                <PropField label="Start X" value={selectedElement.start_point.x} type="number" onChange={v => handleUpdate('start_point', { ...selectedElement.start_point, x: Number(v) })} />
                <PropField label="Start Y" value={selectedElement.start_point.y} type="number" onChange={v => handleUpdate('start_point', { ...selectedElement.start_point, y: Number(v) })} />
                <PropField label="End X" value={selectedElement.end_point.x} type="number" onChange={v => handleUpdate('end_point', { ...selectedElement.end_point, x: Number(v) })} />
                <PropField label="End Y" value={selectedElement.end_point.y} type="number" onChange={v => handleUpdate('end_point', { ...selectedElement.end_point, y: Number(v) })} />
              </PropGroup>
            )}

            {/* Dimensions */}
            <PropGroup title="Dimensions">
              {selectedElement.width !== undefined && <PropField label="Width (mm)" value={selectedElement.width} onChange={v => handleUpdate('width', Number(v))} type="number" />}
              {selectedElement.height !== undefined && <PropField label="Height (mm)" value={selectedElement.height} onChange={v => handleUpdate('height', Number(v))} type="number" />}
              {selectedElement.thickness !== undefined && <PropField label="Thickness (mm)" value={selectedElement.thickness} onChange={v => handleUpdate('thickness', Number(v))} type="number" />}
              {selectedElement.depth !== undefined && <PropField label="Depth (mm)" value={selectedElement.depth} onChange={v => handleUpdate('depth', Number(v))} type="number" />}
              {selectedElement.rotation !== undefined && <PropField label="Rotation (°)" value={selectedElement.rotation} onChange={v => handleUpdate('rotation', Number(v))} type="number" />}
            </PropGroup>

            {/* Type-specific */}
            {selectedElementType === 'wall' && (
              <PropGroup title="Wall Properties">
                <PropField label="Type" value={selectedElement.wall_type || 'interior'} onChange={v => handleUpdate('wall_type', v)} type="select"
                  options={[{v:'exterior',l:'Exterior'},{v:'interior',l:'Interior'},{v:'partition',l:'Partition'},{v:'shear',l:'Shear Wall'},{v:'compound',l:'Compound'}]} />
                <PropField label="Structural" value={selectedElement.is_structural ? 'Yes' : 'No'} onChange={v => handleUpdate('is_structural', v === 'Yes')} type="select" options={[{v:'Yes',l:'Yes'},{v:'No',l:'No'}]} />
              </PropGroup>
            )}

            {selectedElementType === 'door' && (
              <PropGroup title="Door Properties">
                <PropField label="Type" value={selectedElement.door_type} onChange={v => handleUpdate('door_type', v)} type="select"
                  options={[{v:'single',l:'Single'},{v:'double',l:'Double'},{v:'sliding',l:'Sliding'},{v:'revolving',l:'Revolving'}]} />
                <PropField label="Swing" value={selectedElement.swing_direction} onChange={v => handleUpdate('swing_direction', v)} type="select"
                  options={[{v:'left',l:'Left'},{v:'right',l:'Right'},{v:'both',l:'Both'}]} />
              </PropGroup>
            )}
          </>
        )}

        {activeTab === 'bim' && (
          <>
            <PropGroup title="Identification">
              <PropField label="Manufacturer" value={selectedElement.bim?.manufacturer || ''} onChange={v => handleUpdate('bim.manufacturer', v)} />
              <PropField label="Supplier" value={selectedElement.bim?.supplier || ''} onChange={v => handleUpdate('bim.supplier', v)} />
            </PropGroup>
            <PropGroup title="Cost & Schedule">
              <PropField label="Cost (₹)" value={selectedElement.bim?.cost || 0} onChange={v => handleUpdate('bim.cost', Number(v))} type="number" icon={DollarSign} />
              <PropField label="Weight (kg)" value={selectedElement.bim?.weight || 0} onChange={v => handleUpdate('bim.weight', Number(v))} type="number" />
              <PropField label="Warranty (yrs)" value={selectedElement.bim?.warranty_years || 0} onChange={v => handleUpdate('bim.warranty_years', Number(v))} type="number" />
              <PropField label="Expected Life (yrs)" value={selectedElement.bim?.expected_life_years || 0} onChange={v => handleUpdate('bim.expected_life_years', Number(v))} type="number" />
            </PropGroup>
            <PropGroup title="Ratings">
              <PropField label="Fire Rating" value={selectedElement.bim?.fire_rating || 'none'} onChange={v => handleUpdate('bim.fire_rating', v)} type="select"
                options={[{v:'none',l:'None'},{v:'30min',l:'30 min'},{v:'60min',l:'60 min'},{v:'90min',l:'90 min'},{v:'120min',l:'120 min'},{v:'180min',l:'180 min'}]} icon={Shield} />
              <PropField label="Thermal Rating" value={selectedElement.bim?.thermal_rating || 0} onChange={v => handleUpdate('bim.thermal_rating', Number(v))} type="number" icon={Thermometer} />
              <PropField label="Energy Rating" value={selectedElement.bim?.energy_rating || ''} onChange={v => handleUpdate('bim.energy_rating', v)} type="select"
                options={[{v:'',l:'—'},{v:'A+++',l:'A+++'},{v:'A++',l:'A++'},{v:'A+',l:'A+'},{v:'A',l:'A'},{v:'B',l:'B'},{v:'C',l:'C'}]} icon={Zap} />
            </PropGroup>
          </>
        )}

        {activeTab === 'material' && (
          <>
            <PropGroup title="Material">
              <PropField label="Material" value={selectedElement.material || ''} onChange={v => handleUpdate('material', v)} />
              <PropField label="Color" value={selectedElement.color || '#808080'} onChange={v => handleUpdate('color', v)} type="color" />
            </PropGroup>
            {selectedElement.frame_material && (
              <PropGroup title="Frame">
                <PropField label="Frame Material" value={selectedElement.frame_material} onChange={v => handleUpdate('frame_material', v)} />
                <PropField label="Frame Color" value={selectedElement.frame_color || '#C0C0C0'} onChange={v => handleUpdate('frame_color', v)} type="color" />
              </PropGroup>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PropGroup({ title, children }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">{title}</h4>
      <div className="space-y-1.5 bg-surface-800/30 rounded-lg p-2">{children}</div>
    </div>
  );
}

function PropField({ label, value, onChange, type = 'text', options, icon: Icon }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-3 h-3 text-surface-600 flex-shrink-0" />}
      <label className="text-[11px] text-surface-500 w-20 flex-shrink-0">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-surface-800 border border-surface-700 rounded px-2 py-1 text-[11px] text-surface-200 focus:ring-1 focus:ring-primary-500 outline-none">
          {options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : type === 'color' ? (
        <div className="flex-1 flex items-center gap-2">
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent" />
          <span className="text-[11px] text-surface-400 font-mono">{value}</span>
        </div>
      ) : (
        <input
          type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-surface-800 border border-surface-700 rounded px-2 py-1 text-[11px] text-surface-200 focus:ring-1 focus:ring-primary-500 outline-none"
        />
      )}
    </div>
  );
}
