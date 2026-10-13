// ═══════════════════════════════════════════════════════════════
// Enhanced Properties Panel — Full element editing
// Type-specific property groups for all BIM elements
// Window, Door, Stair, Roof, Room type editors
// ═══════════════════════════════════════════════════════════════
import { useSelector, useDispatch } from 'react-redux';
import { updateElementLocal, updateBimElement, setRoofSettings } from '../../../redux/slices/bimSlice';
import { useState, useMemo, useCallback } from 'react';
import {
  Info, Box, Ruler, DollarSign, Shield, Thermometer, Zap,
  Move, RotateCcw, Maximize2, Paintbrush, Home, Layers,
  Minus, DoorOpen, AppWindow, Footprints, Triangle, Armchair,
} from 'lucide-react';

// ─── Wall Types ────────────────────────────────────────────────
const WALL_TYPES = [
  { v: 'exterior', l: 'Exterior' },
  { v: 'interior', l: 'Interior' },
  { v: 'partition', l: 'Partition' },
  { v: 'structural', l: 'Structural' },
  { v: 'shear', l: 'Shear Wall' },
  { v: 'retaining', l: 'Retaining' },
  { v: 'compound', l: 'Compound' },
  { v: 'parapet', l: 'Parapet' },
  { v: 'curtain', l: 'Curtain Wall' },
];

const DOOR_TYPES = [
  { v: 'single', l: 'Single' }, { v: 'double', l: 'Double' },
  { v: 'sliding', l: 'Sliding' }, { v: 'pocket', l: 'Pocket' },
  { v: 'folding', l: 'Folding' }, { v: 'french', l: 'French' },
  { v: 'glass', l: 'Glass' }, { v: 'main', l: 'Main Entry' },
  { v: 'bathroom', l: 'Bathroom' }, { v: 'fire', l: 'Fire Door' },
  { v: 'garage', l: 'Garage' },
];

const WINDOW_TYPES = [
  { v: 'casement', l: 'Casement' }, { v: 'sliding', l: 'Sliding' },
  { v: 'fixed', l: 'Fixed' }, { v: 'bay', l: 'Bay' },
  { v: 'picture', l: 'Picture' }, { v: 'awning', l: 'Awning' },
  { v: 'louvered', l: 'Louvered' }, { v: 'floor_to_ceiling', l: 'Floor to Ceiling' },
  { v: 'skylight', l: 'Skylight' },
];

const STAIR_TYPES = [
  { v: 'straight', l: 'Straight' }, { v: 'l_shaped', l: 'L-Shaped' },
  { v: 'u_shaped', l: 'U-Shaped' }, { v: 'spiral', l: 'Spiral' },
  { v: 'dog_legged', l: 'Dog-Legged' },
];

const RAILING_TYPES = [
  { v: 'glass', l: 'Glass' }, { v: 'metal', l: 'Metal' }, { v: 'wood', l: 'Wood' },
];

const STAIR_MATERIALS = [
  { v: 'concrete', l: 'Concrete' }, { v: 'marble', l: 'Marble' },
  { v: 'wood', l: 'Wood' }, { v: 'granite', l: 'Granite' },
];

const ROOF_TYPES = [
  { v: 'flat', l: 'Flat' }, { v: 'terrace', l: 'Terrace' },
  { v: 'gable', l: 'Gable' }, { v: 'hip', l: 'Hip' },
  { v: 'shed', l: 'Shed' }, { v: 'mansard', l: 'Mansard' },
];

const ROOF_MATERIALS = [
  { v: 'concrete', l: 'Concrete' }, { v: 'tile', l: 'Clay Tile' },
  { v: 'metal', l: 'Metal Sheet' }, { v: 'slate', l: 'Slate' },
];

const ROOM_TYPES = [
  { v: 'living', l: 'Living Room' }, { v: 'dining', l: 'Dining' },
  { v: 'kitchen', l: 'Kitchen' }, { v: 'master_bedroom', l: 'Master Bedroom' },
  { v: 'bedroom', l: 'Bedroom' }, { v: 'bathroom', l: 'Bathroom' },
  { v: 'toilet', l: 'Toilet' }, { v: 'balcony', l: 'Balcony' },
  { v: 'terrace', l: 'Terrace' }, { v: 'passage', l: 'Passage' },
  { v: 'staircase', l: 'Staircase' }, { v: 'utility', l: 'Utility' },
  { v: 'pooja', l: 'Pooja Room' }, { v: 'study', l: 'Study' },
  { v: 'parking', l: 'Parking' }, { v: 'entrance', l: 'Entrance' },
  { v: 'foyer', l: 'Foyer' },
];

const FLOOR_FINISHES = [
  { v: 'vitrified_tile', l: 'Vitrified Tile' }, { v: 'ceramic_tile', l: 'Ceramic Tile' },
  { v: 'marble', l: 'Marble' }, { v: 'granite', l: 'Granite' },
  { v: 'wood_laminate', l: 'Wood Laminate' }, { v: 'hardwood', l: 'Hardwood' },
  { v: 'concrete', l: 'Concrete' }, { v: 'epoxy', l: 'Epoxy' },
];

// ═══════════════════════════════════════════════════════════════
// MAIN PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════
export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const { selectedElementIds, selectedElementType, elements, roofSettings } = useSelector(s => s.bim);
  const [activeTab, setActiveTab] = useState('geometry');

  // Get selected element
  const selectedElement = useMemo(() => {
    if (selectedElementIds.length !== 1 || !selectedElementType) return null;
    const key = selectedElementType === 'furniture' ? 'furniture' : `${selectedElementType}s`;
    return elements[key]?.find(e => (e._id || e.canvas_id) === selectedElementIds[0]);
  }, [selectedElementIds, selectedElementType, elements]);

  const handleUpdate = useCallback((field, value) => {
    if (!selectedElement || !selectedElementType) return;
    const id = selectedElement._id || selectedElement.canvas_id;
    const update = {};

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
  }, [dispatch, selectedElement, selectedElementType]);

  const tabs = [
    { id: 'geometry', icon: Ruler, label: 'Geometry' },
    { id: 'type', icon: Box, label: 'Type' },
    { id: 'material', icon: Paintbrush, label: 'Material' },
    { id: 'bim', icon: Info, label: 'BIM' },
  ];

  // ─── No Selection ────────────────────────────────────────────
  if (!selectedElement) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Roof Settings (always visible when no selection) */}
        <div className="p-3 border-b border-surface-800/50">
          <PropGroup title="Roof Settings">
            <PropField label="Type" value={roofSettings?.type || 'flat'} onChange={v => dispatch(setRoofSettings({ type: v }))} type="select" options={ROOF_TYPES} />
            {roofSettings?.type !== 'flat' && roofSettings?.type !== 'terrace' && (
              <>
                <PropField label="Ridge (mm)" value={roofSettings?.ridgeHeight || 1200} onChange={v => dispatch(setRoofSettings({ ridgeHeight: Number(v) }))} type="number" />
                <PropField label="Overhang (mm)" value={roofSettings?.overhang || 300} onChange={v => dispatch(setRoofSettings({ overhang: Number(v) }))} type="number" />
              </>
            )}
            <PropField label="Thickness (mm)" value={roofSettings?.thickness || 150} onChange={v => dispatch(setRoofSettings({ thickness: Number(v) }))} type="number" />
            <PropField label="Material" value={roofSettings?.material || 'concrete'} onChange={v => dispatch(setRoofSettings({ material: v }))} type="select" options={ROOF_MATERIALS} />
            <PropField label="Parapet" value={roofSettings?.hasParapet ? 'Yes' : 'No'} onChange={v => dispatch(setRoofSettings({ hasParapet: v === 'Yes' }))} type="select" options={[{v:'Yes',l:'Yes'},{v:'No',l:'No'}]} />
            {roofSettings?.hasParapet && (
              <PropField label="Parapet H (mm)" value={roofSettings?.parapetHeight || 900} onChange={v => dispatch(setRoofSettings({ parapetHeight: Number(v) }))} type="number" />
            )}
          </PropGroup>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-surface-600 p-6">
          <Info className="w-10 h-10 mb-3 opacity-50" />
          <p className="text-xs text-center">Select an element to view and edit its properties</p>
          {selectedElementIds.length > 1 && (
            <p className="text-xs mt-2 text-primary-400">{selectedElementIds.length} elements selected</p>
          )}
        </div>
      </div>
    );
  }

  // ─── Computed Info ───────────────────────────────────────────
  const wallLength = selectedElement.start_point && selectedElement.end_point
    ? Math.round(Math.sqrt(
        (selectedElement.end_point.x - selectedElement.start_point.x) ** 2 +
        (selectedElement.end_point.y - selectedElement.start_point.y) ** 2
      ))
    : null;

  const wallArea = wallLength && selectedElement.height
    ? (wallLength * selectedElement.height / 1e6).toFixed(2)
    : null;

  const getTypeIcon = () => {
    switch (selectedElementType) {
      case 'wall': return Minus;
      case 'door': return DoorOpen;
      case 'window': return AppWindow;
      case 'stair': return Footprints;
      case 'column': return Box;
      case 'furniture': return Armchair;
      case 'room': return Home;
      case 'slab': return Layers;
      case 'roof': return Triangle;
      case 'foundation': return Box;
      case 'railing': return Ruler;
      case 'ceiling': return Layers;
      default: return Box;
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Element Header */}
      <div className="px-3 py-2 border-b border-surface-800 bg-surface-850/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center">
            <TypeIcon className="w-3.5 h-3.5 text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase text-primary-400 tracking-wider">{selectedElementType}</span>
            <div className="text-[11px] text-surface-300 truncate">
              {selectedElement.name || selectedElement.canvas_id?.slice(0, 12)}
            </div>
          </div>
        </div>
        {/* Quick stats */}
        {wallLength && (
          <div className="flex items-center gap-3 mt-1.5 text-[9px] text-surface-500">
            <span>Length: <span className="text-surface-300">{wallLength} mm</span></span>
            {wallArea && <span>Area: <span className="text-surface-300">{wallArea} m²</span></span>}
          </div>
        )}
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

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* ═══ GEOMETRY TAB ═══ */}
        {activeTab === 'geometry' && (
          <>
            {selectedElement.position && (
              <PropGroup title="Position">
                <PropField label="X" value={selectedElement.position.x} onChange={v => handleUpdate('position', { ...selectedElement.position, x: Number(v) })} type="number" unit="mm" />
                <PropField label="Y" value={selectedElement.position.y} onChange={v => handleUpdate('position', { ...selectedElement.position, y: Number(v) })} type="number" unit="mm" />
              </PropGroup>
            )}
            {selectedElement.start_point && (
              <PropGroup title="Start / End Points">
                <div className="grid grid-cols-2 gap-1.5">
                  <PropField label="S.X" value={selectedElement.start_point.x} type="number" onChange={v => handleUpdate('start_point', { ...selectedElement.start_point, x: Number(v) })} unit="mm" />
                  <PropField label="S.Y" value={selectedElement.start_point.y} type="number" onChange={v => handleUpdate('start_point', { ...selectedElement.start_point, y: Number(v) })} unit="mm" />
                  <PropField label="E.X" value={selectedElement.end_point.x} type="number" onChange={v => handleUpdate('end_point', { ...selectedElement.end_point, x: Number(v) })} unit="mm" />
                  <PropField label="E.Y" value={selectedElement.end_point.y} type="number" onChange={v => handleUpdate('end_point', { ...selectedElement.end_point, y: Number(v) })} unit="mm" />
                </div>
              </PropGroup>
            )}

            <PropGroup title="Dimensions">
              {selectedElement.width !== undefined && <PropField label="Width" value={selectedElement.width} onChange={v => handleUpdate('width', Number(v))} type="number" unit="mm" />}
              {selectedElement.height !== undefined && <PropField label="Height" value={selectedElement.height} onChange={v => handleUpdate('height', Number(v))} type="number" unit="mm" />}
              {selectedElement.thickness !== undefined && <PropField label="Thickness" value={selectedElement.thickness} onChange={v => handleUpdate('thickness', Number(v))} type="number" unit="mm" />}
              {selectedElement.depth !== undefined && <PropField label="Depth" value={selectedElement.depth} onChange={v => handleUpdate('depth', Number(v))} type="number" unit="mm" />}
              {selectedElement.rotation !== undefined && <PropField label="Rotation" value={selectedElement.rotation} onChange={v => handleUpdate('rotation', Number(v))} type="number" unit="°" />}
              {selectedElement.sill_height !== undefined && <PropField label="Sill Height" value={selectedElement.sill_height} onChange={v => handleUpdate('sill_height', Number(v))} type="number" unit="mm" />}
              {selectedElement.diameter !== undefined && <PropField label="Diameter" value={selectedElement.diameter} onChange={v => handleUpdate('diameter', Number(v))} type="number" unit="mm" />}
            </PropGroup>
          </>
        )}

        {/* ═══ TYPE TAB ═══ */}
        {activeTab === 'type' && (
          <>
            {/* Wall */}
            {selectedElementType === 'wall' && (
              <PropGroup title="Wall Properties">
                <PropField label="Wall Type" value={selectedElement.wall_type || 'exterior'} onChange={v => handleUpdate('wall_type', v)} type="select" options={WALL_TYPES} />
                <PropField label="Structural" value={selectedElement.is_structural ? 'Yes' : 'No'} onChange={v => handleUpdate('is_structural', v === 'Yes')} type="select" options={[{v:'Yes',l:'Yes'},{v:'No',l:'No'}]} />
                <PropField label="Paint Color" value={selectedElement.paint_color || '#FFFFFF'} onChange={v => handleUpdate('paint_color', v)} type="color" />
              </PropGroup>
            )}

            {/* Door */}
            {selectedElementType === 'door' && (
              <PropGroup title="Door Properties">
                <PropField label="Door Type" value={selectedElement.door_type || selectedElement.type || 'single'} onChange={v => handleUpdate('door_type', v)} type="select" options={DOOR_TYPES} />
                <PropField label="Opening" value={selectedElement.openingDirection || 'left'} onChange={v => handleUpdate('openingDirection', v)} type="select"
                  options={[{v:'left',l:'Left Swing'},{v:'right',l:'Right Swing'},{v:'both',l:'Double Swing'},{v:'slide',l:'Slide'}]} />
                <PropField label="Has Glass" value={selectedElement.hasGlass ? 'Yes' : 'No'} onChange={v => handleUpdate('hasGlass', v === 'Yes')} type="select" options={[{v:'Yes',l:'Yes'},{v:'No',l:'No'}]} />
                <PropField label="Handle" value={selectedElement.handleType || 'lever'} onChange={v => handleUpdate('handleType', v)} type="select"
                  options={[{v:'lever',l:'Lever'},{v:'knob',l:'Knob'},{v:'pull',l:'Pull Bar'},{v:'push',l:'Push Plate'}]} />
              </PropGroup>
            )}

            {/* Window */}
            {selectedElementType === 'window' && (
              <PropGroup title="Window Properties">
                <PropField label="Window Type" value={selectedElement.window_type || selectedElement.type || 'casement'} onChange={v => handleUpdate('window_type', v)} type="select" options={WINDOW_TYPES} />
                <PropField label="Frame Color" value={selectedElement.frame_color || '#E0E0E0'} onChange={v => handleUpdate('frame_color', v)} type="color" />
                <PropField label="Glass Type" value={selectedElement.glassType || 'clear'} onChange={v => handleUpdate('glassType', v)} type="select"
                  options={[{v:'clear',l:'Clear'},{v:'tinted',l:'Tinted'},{v:'frosted',l:'Frosted'},{v:'reflective',l:'Reflective'},{v:'low_e',l:'Low-E'}]} />
                <PropField label="Mullion H" value={selectedElement.mullionCount?.horizontal || 1} onChange={v => handleUpdate('mullionCount', { ...selectedElement.mullionCount, horizontal: Number(v) })} type="number" />
                <PropField label="Mullion V" value={selectedElement.mullionCount?.vertical || 1} onChange={v => handleUpdate('mullionCount', { ...selectedElement.mullionCount, vertical: Number(v) })} type="number" />
              </PropGroup>
            )}

            {/* Stair */}
            {selectedElementType === 'stair' && (
              <PropGroup title="Stair Properties">
                <PropField label="Stair Type" value={selectedElement.stair_type || 'straight'} onChange={v => handleUpdate('stair_type', v)} type="select" options={STAIR_TYPES} />
                <PropField label="Num Risers" value={selectedElement.num_risers || 18} onChange={v => handleUpdate('num_risers', Number(v))} type="number" />
                <PropField label="Riser H" value={selectedElement.riser_height || 167} onChange={v => handleUpdate('riser_height', Number(v))} type="number" unit="mm" />
                <PropField label="Tread D" value={selectedElement.tread_depth || 270} onChange={v => handleUpdate('tread_depth', Number(v))} type="number" unit="mm" />
                <PropField label="Landing D" value={selectedElement.landing_depth || 1200} onChange={v => handleUpdate('landing_depth', Number(v))} type="number" unit="mm" />
                <PropField label="Railing" value={selectedElement.railing_type || 'glass'} onChange={v => handleUpdate('railing_type', v)} type="select" options={RAILING_TYPES} />
                <PropField label="Material" value={selectedElement.material || 'concrete'} onChange={v => handleUpdate('material', v)} type="select" options={STAIR_MATERIALS} />
                {/* Compliance info */}
                <div className="mt-2 p-2 bg-surface-800/50 rounded-lg">
                  <div className="text-[9px] font-semibold text-surface-500 mb-1">IRC Compliance</div>
                  <div className="text-[9px] text-surface-400">
                    2R+T = {2 * (selectedElement.riser_height || 167) + (selectedElement.tread_depth || 270)} mm
                    <span className={`ml-1 ${
                      (2 * (selectedElement.riser_height || 167) + (selectedElement.tread_depth || 270)) >= 600 &&
                      (2 * (selectedElement.riser_height || 167) + (selectedElement.tread_depth || 270)) <= 650
                        ? 'text-green-400' : 'text-amber-400'
                    }`}>
                      ({(2 * (selectedElement.riser_height || 167) + (selectedElement.tread_depth || 270)) >= 600 &&
                        (2 * (selectedElement.riser_height || 167) + (selectedElement.tread_depth || 270)) <= 650
                          ? '✓ OK' : '⚠ Should be 600-650'})
                    </span>
                  </div>
                </div>
              </PropGroup>
            )}

            {/* Column */}
            {selectedElementType === 'column' && (
              <PropGroup title="Column Properties">
                <PropField label="Shape" value={selectedElement.shape || 'rectangular'} onChange={v => handleUpdate('shape', v)} type="select"
                  options={[{v:'rectangular',l:'Rectangular'},{v:'circular',l:'Circular'},{v:'l_shaped',l:'L-Shaped'},{v:'t_shaped',l:'T-Shaped'}]} />
                {selectedElement.shape === 'circular' && (
                  <PropField label="Diameter" value={selectedElement.diameter || 300} onChange={v => handleUpdate('diameter', Number(v))} type="number" unit="mm" />
                )}
                <PropField label="Material" value={selectedElement.material || 'concrete'} onChange={v => handleUpdate('material', v)} type="select"
                  options={[{v:'concrete',l:'RCC'},{v:'steel',l:'Steel'},{v:'composite',l:'Composite'}]} />
              </PropGroup>
            )}

            {/* Room */}
            {selectedElementType === 'room' && (
              <PropGroup title="Room Properties">
                <PropField label="Name" value={selectedElement.name || ''} onChange={v => handleUpdate('name', v)} />
                <PropField label="Room Type" value={selectedElement.room_type || 'living'} onChange={v => handleUpdate('room_type', v)} type="select" options={ROOM_TYPES} />
                <PropField label="Floor Finish" value={selectedElement.floorFinish || 'vitrified_tile'} onChange={v => handleUpdate('floorFinish', v)} type="select" options={FLOOR_FINISHES} />
                <PropField label="False Ceiling" value={selectedElement.hasFalseCeiling ? 'Yes' : 'No'} onChange={v => handleUpdate('hasFalseCeiling', v === 'Yes')} type="select" options={[{v:'Yes',l:'Yes'},{v:'No',l:'No'}]} />
                {selectedElement.hasFalseCeiling && (
                  <PropField label="FC Drop" value={selectedElement.falseCeilingDrop || 200} onChange={v => handleUpdate('falseCeilingDrop', Number(v))} type="number" unit="mm" />
                )}
              </PropGroup>
            )}

            {/* Furniture */}
            {selectedElementType === 'furniture' && (
              <PropGroup title="Furniture Properties">
                <PropField label="Type" value={selectedElement.type || ''} onChange={v => handleUpdate('type', v)} />
                <PropField label="Name" value={selectedElement.name || ''} onChange={v => handleUpdate('name', v)} />
                <PropField label="Category" value={selectedElement.category || selectedElement.subcategory || ''} onChange={v => handleUpdate('category', v)} />
              </PropGroup>
            )}

            {/* Slab */}
            {selectedElementType === 'slab' && (
              <PropGroup title="Slab Properties">
                <PropField label="Slab Type" value={selectedElement.slab_type || 'solid'} onChange={v => handleUpdate('slab_type', v)} type="select"
                  options={[{v:'solid',l:'Solid'},{v:'ribbed',l:'Ribbed'},{v:'waffle',l:'Waffle'},{v:'hollow_core',l:'Hollow Core'},{v:'post_tensioned',l:'Post-Tensioned'},{v:'flat',l:'Flat Slab'}]} />
                <PropField label="Thickness" value={selectedElement.thickness || 150} onChange={v => handleUpdate('thickness', Number(v))} type="number" unit="mm" />
                <PropField label="Material" value={selectedElement.material || 'rcc'} onChange={v => handleUpdate('material', v)} type="select"
                  options={[{v:'rcc',l:'RCC'},{v:'pcc',l:'PCC'},{v:'prestressed',l:'Prestressed'}]} />
                <PropField label="Waterproofing" value={selectedElement.waterproofing ? 'Yes' : 'No'} onChange={v => handleUpdate('waterproofing', v === 'Yes')} type="select" options={[{v:'Yes',l:'Yes'},{v:'No',l:'No'}]} />
              </PropGroup>
            )}

            {/* Roof */}
            {selectedElementType === 'roof' && (
              <PropGroup title="Roof Properties">
                <PropField label="Roof Type" value={selectedElement.roof_type || 'flat'} onChange={v => handleUpdate('roof_type', v)} type="select" options={ROOF_TYPES} />
                <PropField label="Thickness" value={selectedElement.thickness || 150} onChange={v => handleUpdate('thickness', Number(v))} type="number" unit="mm" />
                {selectedElement.roof_type !== 'flat' && selectedElement.roof_type !== 'terrace' && (
                  <PropField label="Slope" value={selectedElement.slope || 30} onChange={v => handleUpdate('slope', Number(v))} type="number" unit="°" />
                )}
                <PropField label="Material" value={selectedElement.material || 'concrete'} onChange={v => handleUpdate('material', v)} type="select" options={ROOF_MATERIALS} />
                <PropField label="Has Parapet" value={selectedElement.has_parapet ? 'Yes' : 'No'} onChange={v => handleUpdate('has_parapet', v === 'Yes')} type="select" options={[{v:'Yes',l:'Yes'},{v:'No',l:'No'}]} />
              </PropGroup>
            )}

            {/* Foundation */}
            {selectedElementType === 'foundation' && (
              <PropGroup title="Foundation Properties">
                <PropField label="Type" value={selectedElement.foundation_type || 'isolated'} onChange={v => handleUpdate('foundation_type', v)} type="select"
                  options={[{v:'isolated',l:'Isolated Footing'},{v:'combined',l:'Combined Footing'},{v:'strip',l:'Strip Footing'},{v:'raft',l:'Raft/Mat'},{v:'pile',l:'Pile Foundation'},{v:'well',l:'Well Foundation'}]} />
                <PropField label="Thickness" value={selectedElement.thickness || 600} onChange={v => handleUpdate('thickness', Number(v))} type="number" unit="mm" />
                <PropField label="Material" value={selectedElement.material || 'rcc'} onChange={v => handleUpdate('material', v)} type="select"
                  options={[{v:'rcc',l:'RCC'},{v:'pcc',l:'PCC'},{v:'masonry',l:'Masonry'}]} />
                <PropField label="Depth" value={selectedElement.depth || 1500} onChange={v => handleUpdate('depth', Number(v))} type="number" unit="mm" />
              </PropGroup>
            )}

            {/* Railing */}
            {selectedElementType === 'railing' && (
              <PropGroup title="Railing Properties">
                <PropField label="Type" value={selectedElement.railing_type || 'metal'} onChange={v => handleUpdate('railing_type', v)} type="select" options={RAILING_TYPES} />
                <PropField label="Height" value={selectedElement.height || 1000} onChange={v => handleUpdate('height', Number(v))} type="number" unit="mm" />
                <PropField label="Material" value={selectedElement.material || 'steel'} onChange={v => handleUpdate('material', v)} type="select"
                  options={[{v:'steel',l:'Steel'},{v:'stainless_steel',l:'SS'},{v:'aluminium',l:'Aluminium'},{v:'wood',l:'Wood'},{v:'glass',l:'Glass'}]} />
              </PropGroup>
            )}

            {/* Ceiling */}
            {selectedElementType === 'ceiling' && (
              <PropGroup title="Ceiling Properties">
                <PropField label="Type" value={selectedElement.ceiling_type || 'gypsum'} onChange={v => handleUpdate('ceiling_type', v)} type="select"
                  options={[{v:'gypsum',l:'Gypsum Board'},{v:'pop',l:'POP'},{v:'metal',l:'Metal Grid'},{v:'wooden',l:'Wooden'},{v:'exposed',l:'Exposed Concrete'}]} />
                <PropField label="Thickness" value={selectedElement.thickness || 12} onChange={v => handleUpdate('thickness', Number(v))} type="number" unit="mm" />
                <PropField label="Drop Height" value={selectedElement.drop_height || 200} onChange={v => handleUpdate('drop_height', Number(v))} type="number" unit="mm" />
              </PropGroup>
            )}
          </>
        )}

        {/* ═══ MATERIAL TAB ═══ */}
        {activeTab === 'material' && (
          <>
            <PropGroup title="Material">
              <PropField label="Material" value={selectedElement.material || ''} onChange={v => handleUpdate('material', v)} />
              <PropField label="Color" value={selectedElement.color || '#808080'} onChange={v => handleUpdate('color', v)} type="color" />
            </PropGroup>
            {selectedElement.frame_color !== undefined && (
              <PropGroup title="Frame">
                <PropField label="Frame Color" value={selectedElement.frame_color || '#C0C0C0'} onChange={v => handleUpdate('frame_color', v)} type="color" />
              </PropGroup>
            )}
            {selectedElement.paint_color !== undefined && (
              <PropGroup title="Finish">
                <PropField label="Paint Color" value={selectedElement.paint_color || '#FFFFFF'} onChange={v => handleUpdate('paint_color', v)} type="color" />
              </PropGroup>
            )}
          </>
        )}

        {/* ═══ BIM TAB ═══ */}
        {activeTab === 'bim' && (
          <>
            <PropGroup title="Identification">
              <PropField label="Name" value={selectedElement.name || ''} onChange={v => handleUpdate('name', v)} />
              <PropField label="Manufacturer" value={selectedElement.bim?.manufacturer || ''} onChange={v => handleUpdate('bim.manufacturer', v)} />
              <PropField label="Supplier" value={selectedElement.bim?.supplier || ''} onChange={v => handleUpdate('bim.supplier', v)} />
            </PropGroup>
            <PropGroup title="Cost & Schedule">
              <PropField label="Cost (₹)" value={selectedElement.bim?.cost || 0} onChange={v => handleUpdate('bim.cost', Number(v))} type="number" icon={DollarSign} />
              <PropField label="Weight (kg)" value={selectedElement.bim?.weight || 0} onChange={v => handleUpdate('bim.weight', Number(v))} type="number" />
              <PropField label="Warranty" value={selectedElement.bim?.warranty_years || 0} onChange={v => handleUpdate('bim.warranty_years', Number(v))} type="number" unit="yrs" />
              <PropField label="Life Span" value={selectedElement.bim?.expected_life_years || 0} onChange={v => handleUpdate('bim.expected_life_years', Number(v))} type="number" unit="yrs" />
            </PropGroup>
            <PropGroup title="Ratings">
              <PropField label="Fire Rating" value={selectedElement.bim?.fire_rating || 'none'} onChange={v => handleUpdate('bim.fire_rating', v)} type="select"
                options={[{v:'none',l:'None'},{v:'30min',l:'30 min'},{v:'60min',l:'60 min'},{v:'90min',l:'90 min'},{v:'120min',l:'120 min'},{v:'180min',l:'180 min'}]} icon={Shield} />
              <PropField label="Energy" value={selectedElement.bim?.energy_rating || ''} onChange={v => handleUpdate('bim.energy_rating', v)} type="select"
                options={[{v:'',l:'—'},{v:'A+++',l:'A+++'},{v:'A++',l:'A++'},{v:'A+',l:'A+'},{v:'A',l:'A'},{v:'B',l:'B'},{v:'C',l:'C'}]} icon={Zap} />
            </PropGroup>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════
function PropGroup({ title, children }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">{title}</h4>
      <div className="space-y-1.5 bg-surface-800/30 rounded-lg p-2">{children}</div>
    </div>
  );
}

function PropField({ label, value, onChange, type = 'text', options, icon: Icon, unit }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-3 h-3 text-surface-600 flex-shrink-0" />}
      <label className="text-[10px] text-surface-500 w-20 flex-shrink-0">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-surface-800 border border-surface-700 rounded px-2 py-1 text-[10px] text-surface-200 focus:ring-1 focus:ring-primary-500 outline-none">
          {options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : type === 'color' ? (
        <div className="flex-1 flex items-center gap-2">
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent" />
          <span className="text-[10px] text-surface-400 font-mono">{value}</span>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-1">
          <input
            type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
            className="flex-1 bg-surface-800 border border-surface-700 rounded px-2 py-1 text-[10px] text-surface-200 focus:ring-1 focus:ring-primary-500 outline-none min-w-0"
          />
          {unit && <span className="text-[8px] text-surface-500 flex-shrink-0">{unit}</span>}
        </div>
      )}
    </div>
  );
}
