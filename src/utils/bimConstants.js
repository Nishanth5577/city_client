// ═══════════════════════════════════════════════════════════════
// BIM Design Studio — Client Constants (Professional Edition)
// ═══════════════════════════════════════════════════════════════

// ─── Drawing & Interaction Tools ───────────────────────────────
export const TOOLS = {
  SELECT: 'select',
  WALL: 'wall',
  COLUMN: 'column',
  BEAM: 'beam',
  DOOR: 'door',
  WINDOW: 'window',
  STAIR: 'stair',
  ROOM: 'room',
  FURNITURE: 'furniture',
  MEASURE: 'measure',
  TEXT: 'text',
  PAN: 'pan',
  ZOOM: 'zoom',
  ERASER: 'eraser',
  SLAB: 'slab',
  CEILING: 'ceiling',
  ROOF: 'roof',
  RAMP: 'ramp',
  FOUNDATION: 'foundation',
  RAILING: 'railing',
  CURTAIN_WALL: 'curtain_wall',
  FENCE: 'fence',
  BOUNDARY: 'boundary',
  ROAD: 'road',
  PARKING: 'parking',
  TERRAIN: 'terrain',
  LANDSCAPE: 'landscape',
  ELEC_SWITCH: 'elec_switch',
  ELEC_SOCKET: 'elec_socket',
  ELEC_LIGHT: 'elec_light',
  ELEC_DB: 'elec_db',
  ELEC_WIRE: 'elec_wire',
  PLUMB_TOILET: 'plumb_toilet',
  PLUMB_SINK: 'plumb_sink',
  PLUMB_SHOWER: 'plumb_shower',
  PLUMB_PIPE: 'plumb_pipe',
  HVAC_AC: 'hvac_ac',
  HVAC_DUCT: 'hvac_duct',
  HVAC_VENT: 'hvac_vent',
  HVAC_EXHAUST: 'hvac_exhaust',
  SOLAR_PANEL: 'solar_panel',
  LIFT: 'lift',
  ESCALATOR: 'escalator',
  WATER_TANK: 'water_tank',
  GENERATOR: 'generator',
  FIRE_EXTINGUISHER: 'fire_extinguisher',
  SPRINKLER: 'sprinkler',
  EMERGENCY_EXIT: 'emergency_exit',
};

// ─── View Modes ─────────────────────────────────────────────────
export const VIEW_MODES = {
  PLAN_2D: '2d',
  VIEW_3D: '3d',
  SPLIT: 'split',
};

export const RENDER_MODES = {
  REALISTIC: 'realistic',
  SHADED: 'shaded',
  WIREFRAME: 'wireframe',
  XRAY: 'xray',
  HIDDEN_LINE: 'hidden_line',
};

export const TRANSFORM_MODES = {
  TRANSLATE: 'translate',
  ROTATE: 'rotate',
  SCALE: 'scale',
};

export const CAMERA_PRESETS = {
  PERSPECTIVE: { name: 'Perspective', position: [15, 12, 15], target: [0, 0, 0] },
  TOP: { name: 'Top', position: [0, 30, 0], target: [0, 0, 0] },
  FRONT: { name: 'Front', position: [0, 5, 30], target: [0, 5, 0] },
  BACK: { name: 'Back', position: [0, 5, -30], target: [0, 5, 0] },
  LEFT: { name: 'Left', position: [-30, 5, 0], target: [0, 5, 0] },
  RIGHT: { name: 'Right', position: [30, 5, 0], target: [0, 5, 0] },
  ISOMETRIC: { name: 'Isometric', position: [20, 20, 20], target: [0, 0, 0] },
};

// ─── Element Types ──────────────────────────────────────────────
export const ELEMENT_TYPES = {
  WALL: 'wall', COLUMN: 'column', BEAM: 'beam', DOOR: 'door',
  WINDOW: 'window', STAIR: 'stair', FURNITURE: 'furniture', ROOM: 'room',
  SLAB: 'slab', CEILING: 'ceiling', ROOF: 'roof', RAMP: 'ramp',
  FOUNDATION: 'foundation', RAILING: 'railing',
};

// ─── Layers ─────────────────────────────────────────────────────
export const LAYERS = [
  { id: 'grid', name: 'Grid', color: '#6B7280', visible: true, locked: true },
  { id: 'architectural', name: 'Architectural', color: '#3B82F6', visible: true, locked: false },
  { id: 'structural', name: 'Structural', color: '#EF4444', visible: true, locked: false },
  { id: 'electrical', name: 'Electrical', color: '#F59E0B', visible: false, locked: false },
  { id: 'plumbing', name: 'Plumbing', color: '#06B6D4', visible: false, locked: false },
  { id: 'hvac', name: 'HVAC', color: '#10B981', visible: false, locked: false },
  { id: 'solar', name: 'Solar', color: '#FF9800', visible: false, locked: false },
  { id: 'furniture', name: 'Furniture', color: '#8B5CF6', visible: true, locked: false },
  { id: 'landscape', name: 'Landscape', color: '#22C55E', visible: true, locked: false },
  { id: 'fire_safety', name: 'Fire Safety', color: '#DC2626', visible: false, locked: false },
  { id: 'equipment', name: 'Equipment', color: '#7C3AED', visible: false, locked: false },
  { id: 'dimensions', name: 'Dimensions', color: '#6B7280', visible: true, locked: true },
  { id: 'annotations', name: 'Annotations', color: '#EC4899', visible: true, locked: false },
];

// ─── Wall Presets ───────────────────────────────────────────────
export const WALL_PRESETS = [
  { name: 'Exterior Wall (230mm)', thickness: 230, type: 'exterior', color: '#8B7355' },
  { name: 'Interior Wall (115mm)', thickness: 115, type: 'interior', color: '#A89070' },
  { name: 'Partition Wall (100mm)', thickness: 100, type: 'partition', color: '#B8A88A' },
  { name: 'Compound Wall (230mm)', thickness: 230, type: 'compound', color: '#7B6545' },
  { name: 'Shear Wall (200mm)', thickness: 200, type: 'shear', color: '#808080' },
  { name: 'Retaining Wall (300mm)', thickness: 300, type: 'retaining', color: '#6B6B6B' },
  { name: 'Curtain Wall (150mm)', thickness: 150, type: 'curtain', color: '#87CEEB' },
  { name: 'Parapet Wall (115mm)', thickness: 115, type: 'parapet', color: '#9B8B7B' },
];

export const COLUMN_PRESETS = [
  { name: '230×230mm', width: 230, depth: 230, shape: 'rectangular' },
  { name: '300×300mm', width: 300, depth: 300, shape: 'rectangular' },
  { name: '300×450mm', width: 300, depth: 450, shape: 'rectangular' },
  { name: '450×450mm', width: 450, depth: 450, shape: 'rectangular' },
  { name: '600×600mm', width: 600, depth: 600, shape: 'rectangular' },
  { name: 'Circular 300mm', diameter: 300, shape: 'circular' },
  { name: 'Circular 450mm', diameter: 450, shape: 'circular' },
  { name: 'Circular 600mm', diameter: 600, shape: 'circular' },
  { name: 'L-Shaped 300×450', width: 300, depth: 450, shape: 'l_shaped' },
  { name: 'T-Shaped 300×600', width: 300, depth: 600, shape: 't_shaped' },
];

export const DOOR_PRESETS = [
  { name: 'Single Door (900×2100)', width: 900, height: 2100, type: 'single' },
  { name: 'Double Door (1500×2100)', width: 1500, height: 2100, type: 'double' },
  { name: 'Sliding Door (1800×2100)', width: 1800, height: 2100, type: 'sliding' },
  { name: 'Main Door (1200×2400)', width: 1200, height: 2400, type: 'single' },
  { name: 'Bathroom Door (750×2100)', width: 750, height: 2100, type: 'single' },
  { name: 'French Door (1800×2400)', width: 1800, height: 2400, type: 'french' },
  { name: 'Pocket Door (900×2100)', width: 900, height: 2100, type: 'pocket' },
  { name: 'Revolving Door (2400×2400)', width: 2400, height: 2400, type: 'revolving' },
  { name: 'Fire Door (1000×2100)', width: 1000, height: 2100, type: 'fire' },
  { name: 'Garage Door (3000×2400)', width: 3000, height: 2400, type: 'garage' },
  { name: 'Folding Door (2400×2100)', width: 2400, height: 2100, type: 'folding' },
];

export const WINDOW_PRESETS = [
  { name: 'Standard (1200×1200)', width: 1200, height: 1200, type: 'casement' },
  { name: 'Large (1800×1200)', width: 1800, height: 1200, type: 'casement' },
  { name: 'Sliding (1500×1200)', width: 1500, height: 1200, type: 'sliding' },
  { name: 'Fixed (600×600)', width: 600, height: 600, type: 'fixed' },
  { name: 'Bay Window (2400×1200)', width: 2400, height: 1200, type: 'bay' },
  { name: 'Ventilator (600×450)', width: 600, height: 450, type: 'louvered' },
  { name: 'Skylight (900×900)', width: 900, height: 900, type: 'skylight' },
  { name: 'Awning (1200×600)', width: 1200, height: 600, type: 'awning' },
  { name: 'Picture Window (2400×1500)', width: 2400, height: 1500, type: 'fixed' },
  { name: 'Dormer Window (1200×1200)', width: 1200, height: 1200, type: 'dormer' },
];

export const STAIR_PRESETS = [
  { name: 'Straight Stair', stair_type: 'straight', width: 1200, total_height: 3000, num_risers: 18, riser_height: 167, tread_depth: 270 },
  { name: 'L-Shaped Stair', stair_type: 'l_shaped', width: 1200, total_height: 3000, num_risers: 18, riser_height: 167, tread_depth: 270 },
  { name: 'U-Shaped Stair', stair_type: 'u_shaped', width: 2400, total_height: 3000, num_risers: 20, riser_height: 150, tread_depth: 280 },
  { name: 'Spiral Stair', stair_type: 'spiral', width: 1800, total_height: 3000, num_risers: 16, riser_height: 188, tread_depth: 250 },
];

// ─── Furniture Catalog ──────────────────────────────────────────
export const FURNITURE_CATALOG = [
  { name: 'Single Bed', type: 'bed', category: 'bedroom', width: 1000, depth: 2000, height: 450, color: '#D2B48C' },
  { name: 'Double Bed', type: 'bed', category: 'bedroom', width: 1600, depth: 2000, height: 450, color: '#D2B48C' },
  { name: 'King Bed', type: 'bed', category: 'bedroom', width: 1800, depth: 2100, height: 450, color: '#8B4513' },
  { name: 'Wardrobe', type: 'wardrobe', category: 'bedroom', width: 1800, depth: 600, height: 2100, color: '#8B4513' },
  { name: 'Bedside Table', type: 'table', category: 'bedroom', width: 450, depth: 400, height: 550, color: '#D2B48C' },
  { name: 'Dresser', type: 'dresser', category: 'bedroom', width: 1200, depth: 450, height: 800, color: '#8B4513' },
  { name: 'Sofa 3-Seater', type: 'sofa', category: 'living', width: 2100, depth: 900, height: 850, color: '#696969' },
  { name: 'Sofa 2-Seater', type: 'sofa', category: 'living', width: 1500, depth: 850, height: 850, color: '#696969' },
  { name: 'L-Shaped Sofa', type: 'sofa', category: 'living', width: 2700, depth: 2100, height: 850, color: '#5A5A5A' },
  { name: 'Coffee Table', type: 'table', category: 'living', width: 1200, depth: 600, height: 400, color: '#8B4513' },
  { name: 'TV Unit', type: 'tv_unit', category: 'living', width: 1500, depth: 450, height: 500, color: '#404040' },
  { name: 'Bookshelf', type: 'bookshelf', category: 'living', width: 900, depth: 300, height: 1800, color: '#D2B48C' },
  { name: 'Center Table', type: 'table', category: 'living', width: 900, depth: 500, height: 350, color: '#D2B48C' },
  { name: 'Recliner', type: 'chair', category: 'living', width: 850, depth: 900, height: 1000, color: '#5A5A5A' },
  { name: 'Dining Table 4-Seater', type: 'dining_table', category: 'dining', width: 1200, depth: 800, height: 750, color: '#8B4513' },
  { name: 'Dining Table 6-Seater', type: 'dining_table', category: 'dining', width: 1800, depth: 900, height: 750, color: '#8B4513' },
  { name: 'Dining Table 8-Seater', type: 'dining_table', category: 'dining', width: 2400, depth: 1000, height: 750, color: '#8B4513' },
  { name: 'Dining Chair', type: 'chair', category: 'dining', width: 450, depth: 450, height: 850, color: '#A0522D' },
  { name: 'Bar Stool', type: 'chair', category: 'dining', width: 400, depth: 400, height: 750, color: '#404040' },
  { name: 'Kitchen Counter', type: 'kitchen_counter', category: 'kitchen', width: 2400, depth: 600, height: 850, color: '#808080' },
  { name: 'Kitchen Island', type: 'kitchen_island', category: 'kitchen', width: 1800, depth: 900, height: 900, color: '#6B6B6B' },
  { name: 'Kitchen Cabinet (Upper)', type: 'kitchen_cabinet', category: 'kitchen', width: 900, depth: 350, height: 700, color: '#8B4513' },
  { name: 'Kitchen Cabinet (Lower)', type: 'kitchen_cabinet', category: 'kitchen', width: 900, depth: 600, height: 850, color: '#8B4513' },
  { name: 'Refrigerator', type: 'appliance', category: 'kitchen', width: 700, depth: 700, height: 1800, color: '#C0C0C0' },
  { name: 'Cooking Range', type: 'appliance', category: 'kitchen', width: 600, depth: 600, height: 900, color: '#404040' },
  { name: 'Dishwasher', type: 'appliance', category: 'kitchen', width: 600, depth: 600, height: 850, color: '#C0C0C0' },
  { name: 'Toilet Seat', type: 'toilet_seat', category: 'bathroom', width: 400, depth: 700, height: 400, color: '#F5F5F5' },
  { name: 'Wash Basin', type: 'wash_basin', category: 'bathroom', width: 600, depth: 450, height: 850, color: '#F5F5F5' },
  { name: 'Shower Enclosure', type: 'shower', category: 'bathroom', width: 900, depth: 900, height: 2100, color: '#C0C0C0' },
  { name: 'Bathtub', type: 'bathtub', category: 'bathroom', width: 1700, depth: 700, height: 600, color: '#F5F5F5' },
  { name: 'Vanity Counter', type: 'vanity', category: 'bathroom', width: 1200, depth: 500, height: 850, color: '#D2B48C' },
  { name: 'Mirror', type: 'mirror', category: 'bathroom', width: 600, depth: 50, height: 800, color: '#E8E8E8' },
  { name: 'Study Table', type: 'desk', category: 'office', width: 1200, depth: 600, height: 750, color: '#D2B48C' },
  { name: 'Executive Desk', type: 'desk', category: 'office', width: 1800, depth: 900, height: 750, color: '#5A3825' },
  { name: 'Office Chair', type: 'chair', category: 'office', width: 550, depth: 550, height: 1100, color: '#303030' },
  { name: 'Filing Cabinet', type: 'cabinet', category: 'office', width: 450, depth: 600, height: 1200, color: '#808080' },
  { name: 'Conference Table', type: 'table', category: 'office', width: 3000, depth: 1200, height: 750, color: '#5A3825' },
  { name: 'Whiteboard', type: 'board', category: 'office', width: 1800, depth: 50, height: 1200, color: '#F5F5F5' },
];

export const LANDSCAPE_CATALOG = [
  { name: 'Neem Tree', type: 'tree', width: 3000, depth: 3000, height: 8000, color: '#228B22' },
  { name: 'Coconut Palm', type: 'tree', width: 2000, depth: 2000, height: 12000, color: '#2E8B57' },
  { name: 'Banyan Tree', type: 'tree', width: 5000, depth: 5000, height: 10000, color: '#006400' },
  { name: 'Mango Tree', type: 'tree', width: 4000, depth: 4000, height: 6000, color: '#32CD32' },
  { name: 'Ashoka Tree', type: 'tree', width: 1500, depth: 1500, height: 6000, color: '#228B22' },
  { name: 'Bamboo Cluster', type: 'plant', width: 1500, depth: 1500, height: 5000, color: '#7CFC00' },
  { name: 'Hedge (1m)', type: 'hedge', width: 2000, depth: 600, height: 1000, color: '#228B22' },
  { name: 'Flower Bed', type: 'planter', width: 2000, depth: 1000, height: 300, color: '#FF69B4' },
  { name: 'Lawn Section', type: 'lawn', width: 5000, depth: 5000, height: 50, color: '#7CFC00' },
  { name: 'Garden Path', type: 'path', width: 1200, depth: 5000, height: 50, color: '#D2B48C' },
  { name: 'Fountain', type: 'water_feature', width: 2000, depth: 2000, height: 1500, color: '#87CEEB' },
  { name: 'Gazebo', type: 'structure', width: 3000, depth: 3000, height: 3000, color: '#8B4513' },
  { name: 'Pergola', type: 'structure', width: 4000, depth: 3000, height: 2800, color: '#D2B48C' },
  { name: 'Bench', type: 'seating', width: 1500, depth: 500, height: 450, color: '#8B4513' },
  { name: 'Boundary Wall (1.5m)', type: 'wall', width: 5000, depth: 230, height: 1500, color: '#808080' },
  { name: 'Metal Fence', type: 'fence', width: 3000, depth: 50, height: 1200, color: '#303030' },
  { name: 'Swimming Pool', type: 'pool', width: 8000, depth: 4000, height: 1500, color: '#4169E1' },
  { name: 'Car Parking Slot', type: 'parking', width: 2500, depth: 5000, height: 0, color: '#D3D3D3' },
  { name: 'Two-Wheeler Parking', type: 'parking', width: 1000, depth: 2000, height: 0, color: '#D3D3D3' },
  { name: 'Road (6m)', type: 'road', width: 6000, depth: 10000, height: 0, color: '#404040' },
];

export const EQUIPMENT_CATALOG = [
  { name: 'Passenger Lift', type: 'lift', width: 2000, depth: 2000, height: 2400, color: '#C0C0C0' },
  { name: 'Goods Lift', type: 'lift', width: 2500, depth: 3000, height: 2400, color: '#808080' },
  { name: 'Escalator', type: 'escalator', width: 1200, depth: 6000, height: 3000, color: '#A0A0A0' },
  { name: 'Solar Panel (1kW)', type: 'solar', width: 2000, depth: 1000, height: 50, color: '#1a237e' },
  { name: 'Solar Panel Array (5kW)', type: 'solar', width: 6000, depth: 3000, height: 50, color: '#1a237e' },
  { name: 'Overhead Water Tank (1000L)', type: 'water_tank', width: 1200, depth: 1200, height: 1000, color: '#404040' },
  { name: 'Underground Tank (5000L)', type: 'water_tank', width: 2000, depth: 2000, height: 1500, color: '#606060' },
  { name: 'DG Set (125 kVA)', type: 'generator', width: 2500, depth: 1200, height: 1500, color: '#2F4F4F' },
  { name: 'Transformer (500 kVA)', type: 'transformer', width: 2000, depth: 1500, height: 2000, color: '#696969' },
  { name: 'STP Plant', type: 'stp', width: 4000, depth: 3000, height: 2000, color: '#556B2F' },
  { name: 'Rain Water Harvesting', type: 'rwh', width: 3000, depth: 3000, height: 1500, color: '#4682B4' },
  { name: 'EV Charging Station', type: 'ev_charger', width: 800, depth: 400, height: 1200, color: '#00BCD4' },
];

export const FIRE_SAFETY_CATALOG = [
  { name: 'Fire Extinguisher', type: 'extinguisher', width: 200, depth: 200, height: 600, color: '#FF0000' },
  { name: 'Fire Hose Reel', type: 'hose_reel', width: 600, depth: 300, height: 600, color: '#FF0000' },
  { name: 'Sprinkler Head', type: 'sprinkler', width: 100, depth: 100, height: 50, color: '#B22222' },
  { name: 'Fire Alarm Pull Station', type: 'fire_alarm', width: 150, depth: 80, height: 200, color: '#FF0000' },
  { name: 'Smoke Detector', type: 'smoke_detector', width: 120, depth: 120, height: 50, color: '#FFFFFF' },
  { name: 'Emergency Exit Sign', type: 'exit_sign', width: 400, depth: 50, height: 200, color: '#00FF00' },
  { name: 'Fire Door (1000×2100)', type: 'fire_door', width: 1000, depth: 100, height: 2100, color: '#B22222' },
  { name: 'Fire Hydrant', type: 'hydrant', width: 400, depth: 300, height: 800, color: '#FF0000' },
  { name: 'Wet Riser', type: 'wet_riser', width: 300, depth: 300, height: 3000, color: '#B22222' },
];

export const SMART_DEVICES_CATALOG = [
  { name: 'Smart Switch', type: 'smart_switch', width: 80, depth: 40, height: 80, color: '#FFFFFF' },
  { name: 'Smart Lock', type: 'smart_lock', width: 70, depth: 60, height: 200, color: '#303030' },
  { name: 'Motion Sensor', type: 'sensor', width: 80, depth: 50, height: 80, color: '#FFFFFF' },
  { name: 'Smart Thermostat', type: 'thermostat', width: 100, depth: 30, height: 100, color: '#FFFFFF' },
  { name: 'Security Camera', type: 'camera', width: 150, depth: 100, height: 100, color: '#303030' },
  { name: 'Video Doorbell', type: 'doorbell', width: 60, depth: 30, height: 130, color: '#303030' },
  { name: 'Smart Speaker', type: 'speaker', width: 100, depth: 100, height: 150, color: '#404040' },
  { name: 'Intercom Panel', type: 'intercom', width: 200, depth: 30, height: 250, color: '#FFFFFF' },
];

// ─── Component Categories (for Component Library) ───────────────
export const COMPONENT_CATEGORIES = [
  {
    id: 'architecture', name: 'Architecture', icon: 'Building2', children: [
      { id: 'walls', name: 'Walls', tool: TOOLS.WALL, presets: 'WALL_PRESETS' },
      { id: 'doors', name: 'Doors', tool: TOOLS.DOOR, presets: 'DOOR_PRESETS' },
      { id: 'windows', name: 'Windows', tool: TOOLS.WINDOW, presets: 'WINDOW_PRESETS' },
      { id: 'stairs', name: 'Stairs', tool: TOOLS.STAIR, presets: 'STAIR_PRESETS' },
      { id: 'railings', name: 'Railings', tool: TOOLS.RAILING },
      { id: 'curtain_walls', name: 'Curtain Walls', tool: TOOLS.CURTAIN_WALL },
    ],
  },
  {
    id: 'structural', name: 'Structural', icon: 'Blocks', children: [
      { id: 'columns', name: 'Columns', tool: TOOLS.COLUMN, presets: 'COLUMN_PRESETS' },
      { id: 'beams', name: 'Beams', tool: TOOLS.BEAM },
      { id: 'slabs', name: 'Slabs', tool: TOOLS.SLAB },
      { id: 'foundations', name: 'Foundation', tool: TOOLS.FOUNDATION },
      { id: 'roofs', name: 'Roof', tool: TOOLS.ROOF },
      { id: 'ceilings', name: 'Ceilings', tool: TOOLS.CEILING },
    ],
  },
  {
    id: 'mep_electrical', name: 'Electrical', icon: 'Zap', children: [
      { id: 'switches', name: 'Switches', tool: TOOLS.ELEC_SWITCH },
      { id: 'sockets', name: 'Sockets', tool: TOOLS.ELEC_SOCKET },
      { id: 'lights', name: 'Lights', tool: TOOLS.ELEC_LIGHT },
      { id: 'db', name: 'Distribution Board', tool: TOOLS.ELEC_DB },
      { id: 'wiring', name: 'Wiring', tool: TOOLS.ELEC_WIRE },
    ],
  },
  {
    id: 'mep_plumbing', name: 'Plumbing', icon: 'Droplets', children: [
      { id: 'toilets', name: 'Toilets', tool: TOOLS.PLUMB_TOILET },
      { id: 'sinks', name: 'Sinks', tool: TOOLS.PLUMB_SINK },
      { id: 'showers', name: 'Showers', tool: TOOLS.PLUMB_SHOWER },
      { id: 'pipes', name: 'Pipes', tool: TOOLS.PLUMB_PIPE },
    ],
  },
  {
    id: 'mep_hvac', name: 'HVAC', icon: 'Wind', children: [
      { id: 'ac_units', name: 'AC Units', tool: TOOLS.HVAC_AC },
      { id: 'ducts', name: 'Ducts', tool: TOOLS.HVAC_DUCT },
      { id: 'vents', name: 'Vents', tool: TOOLS.HVAC_VENT },
      { id: 'exhaust', name: 'Exhaust Fans', tool: TOOLS.HVAC_EXHAUST },
    ],
  },
  {
    id: 'furniture', name: 'Interior & Furniture', icon: 'Armchair', children: [
      { id: 'bedroom', name: 'Bedroom', catalog: 'bedroom' },
      { id: 'living', name: 'Living Room', catalog: 'living' },
      { id: 'dining', name: 'Dining', catalog: 'dining' },
      { id: 'kitchen', name: 'Kitchen', catalog: 'kitchen' },
      { id: 'bathroom', name: 'Bathroom', catalog: 'bathroom' },
      { id: 'office', name: 'Office', catalog: 'office' },
    ],
  },
  {
    id: 'landscape', name: 'Landscape & Site', icon: 'TreePine', children: [
      { id: 'trees', name: 'Trees & Plants' },
      { id: 'hardscape', name: 'Hardscape' },
      { id: 'water', name: 'Water Features' },
      { id: 'fencing', name: 'Fencing & Boundary' },
      { id: 'parking_road', name: 'Parking & Roads' },
    ],
  },
  {
    id: 'equipment', name: 'Equipment', icon: 'Settings', children: [
      { id: 'lifts', name: 'Lifts & Escalators' },
      { id: 'solar', name: 'Solar Systems', tool: TOOLS.SOLAR_PANEL },
      { id: 'tanks', name: 'Water Tanks' },
      { id: 'power', name: 'Power & Generator' },
      { id: 'utilities', name: 'Utilities' },
    ],
  },
  {
    id: 'fire_safety', name: 'Fire Safety', icon: 'Flame', children: [
      { id: 'extinguishers', name: 'Extinguishers' },
      { id: 'alarms', name: 'Alarms & Detectors' },
      { id: 'sprinklers', name: 'Sprinklers' },
      { id: 'exits', name: 'Emergency Exits' },
    ],
  },
  {
    id: 'smart_devices', name: 'Smart Devices', icon: 'Wifi', children: [
      { id: 'smart_controls', name: 'Smart Controls' },
      { id: 'security', name: 'Security' },
      { id: 'sensors', name: 'Sensors' },
    ],
  },
];

// ─── Material Library ───────────────────────────────────────────
export const MATERIAL_LIBRARY = [
  { id: 'concrete_m20', name: 'Concrete M20', category: 'concrete', color: '#B0B0B0', density: 2400, cost: 5500, unit: 'cum', strength: 20, thermal: 1.7, roughness: 0.9, metalness: 0.0 },
  { id: 'concrete_m25', name: 'Concrete M25', category: 'concrete', color: '#A8A8A8', density: 2400, cost: 6000, unit: 'cum', strength: 25, thermal: 1.7, roughness: 0.9, metalness: 0.0 },
  { id: 'concrete_m30', name: 'Concrete M30', category: 'concrete', color: '#A0A0A0', density: 2400, cost: 6500, unit: 'cum', strength: 30, thermal: 1.7, roughness: 0.9, metalness: 0.0 },
  { id: 'steel_fe500', name: 'Steel Fe500', category: 'steel', color: '#696969', density: 7850, cost: 65000, unit: 'ton', strength: 500, thermal: 50, roughness: 0.4, metalness: 0.8 },
  { id: 'steel_structural', name: 'Structural Steel', category: 'steel', color: '#505050', density: 7850, cost: 72000, unit: 'ton', strength: 410, thermal: 50, roughness: 0.3, metalness: 0.9 },
  { id: 'brick_class1', name: 'Red Clay Brick', category: 'brick', color: '#B22222', density: 1920, cost: 8, unit: 'nos', strength: 10, thermal: 0.81, roughness: 0.8, metalness: 0.0 },
  { id: 'brick_fly_ash', name: 'Fly Ash Brick', category: 'brick', color: '#808080', density: 1700, cost: 6, unit: 'nos', strength: 7.5, thermal: 0.65, roughness: 0.7, metalness: 0.0 },
  { id: 'brick_aac', name: 'AAC Block', category: 'brick', color: '#D3D3D3', density: 600, cost: 45, unit: 'nos', strength: 4, thermal: 0.16, roughness: 0.6, metalness: 0.0 },
  { id: 'glass_clear', name: 'Clear Glass (6mm)', category: 'glass', color: '#87CEEB', density: 2500, cost: 180, unit: 'sqm', strength: 0, thermal: 5.8, roughness: 0.0, metalness: 0.1, opacity: 0.3 },
  { id: 'glass_tinted', name: 'Tinted Glass (6mm)', category: 'glass', color: '#4682B4', density: 2500, cost: 280, unit: 'sqm', strength: 0, thermal: 5.5, roughness: 0.0, metalness: 0.1, opacity: 0.5 },
  { id: 'glass_tempered', name: 'Tempered Glass (10mm)', category: 'glass', color: '#B0E0E6', density: 2500, cost: 550, unit: 'sqm', strength: 0, thermal: 5.8, roughness: 0.0, metalness: 0.1, opacity: 0.2 },
  { id: 'wood_teak', name: 'Teak Wood', category: 'wood', color: '#8B4513', density: 650, cost: 4500, unit: 'cft', strength: 0, thermal: 0.14, roughness: 0.5, metalness: 0.0 },
  { id: 'wood_sal', name: 'Sal Wood', category: 'wood', color: '#A0522D', density: 870, cost: 3000, unit: 'cft', strength: 0, thermal: 0.13, roughness: 0.5, metalness: 0.0 },
  { id: 'wood_plywood', name: 'Plywood (18mm)', category: 'wood', color: '#D2B48C', density: 550, cost: 80, unit: 'sqft', strength: 0, thermal: 0.13, roughness: 0.4, metalness: 0.0 },
  { id: 'granite_black', name: 'Black Granite', category: 'granite', color: '#1C1C1C', density: 2750, cost: 200, unit: 'sqft', strength: 0, thermal: 2.8, roughness: 0.2, metalness: 0.3 },
  { id: 'granite_white', name: 'White Granite', category: 'granite', color: '#F0F0F0', density: 2650, cost: 180, unit: 'sqft', strength: 0, thermal: 2.8, roughness: 0.2, metalness: 0.3 },
  { id: 'marble_white', name: 'Italian White Marble', category: 'marble', color: '#FAFAFA', density: 2710, cost: 350, unit: 'sqft', strength: 0, thermal: 2.5, roughness: 0.1, metalness: 0.2 },
  { id: 'marble_makrana', name: 'Makrana Marble', category: 'marble', color: '#F5F5DC', density: 2710, cost: 250, unit: 'sqft', strength: 0, thermal: 2.5, roughness: 0.1, metalness: 0.2 },
  { id: 'tile_vitrified', name: 'Vitrified Tile (600×600)', category: 'tile', color: '#E0D5C0', density: 2400, cost: 55, unit: 'sqft', strength: 0, thermal: 1.3, roughness: 0.1, metalness: 0.1 },
  { id: 'tile_ceramic', name: 'Ceramic Tile (300×300)', category: 'tile', color: '#D2B48C', density: 2000, cost: 35, unit: 'sqft', strength: 0, thermal: 1.0, roughness: 0.3, metalness: 0.0 },
  { id: 'tile_bathroom', name: 'Bathroom Tile (300×450)', category: 'tile', color: '#F0F0F0', density: 2000, cost: 40, unit: 'sqft', strength: 0, thermal: 1.0, roughness: 0.2, metalness: 0.1 },
  { id: 'aluminium_section', name: 'Aluminium Section', category: 'aluminium', color: '#C0C0C0', density: 2700, cost: 350, unit: 'kg', strength: 240, thermal: 205, roughness: 0.3, metalness: 0.7 },
  { id: 'pvc_pipe', name: 'PVC Pipe', category: 'pvc', color: '#808080', density: 1400, cost: 120, unit: 'meter', strength: 0, thermal: 0.16, roughness: 0.3, metalness: 0.1 },
  { id: 'paint_interior', name: 'Interior Emulsion', category: 'paint', color: '#FFFFFF', density: 1300, cost: 45, unit: 'sqft', strength: 0, thermal: 0, roughness: 0.4, metalness: 0.0 },
  { id: 'paint_exterior', name: 'Exterior Weather Coat', category: 'paint', color: '#F5F5DC', density: 1400, cost: 55, unit: 'sqft', strength: 0, thermal: 0, roughness: 0.5, metalness: 0.0 },
  { id: 'plaster_cement', name: 'Cement Plaster (12mm)', category: 'plaster', color: '#C8C8C8', density: 2000, cost: 25, unit: 'sqft', strength: 0, thermal: 0.72, roughness: 0.7, metalness: 0.0 },
  { id: 'gypsum_board', name: 'Gypsum Board (12mm)', category: 'gypsum', color: '#F0F0F0', density: 800, cost: 40, unit: 'sqft', strength: 0, thermal: 0.16, roughness: 0.5, metalness: 0.0 },
  { id: 'acp_sheet', name: 'ACP Sheet (4mm)', category: 'acp', color: '#808080', density: 1500, cost: 120, unit: 'sqft', strength: 0, thermal: 0.2, roughness: 0.2, metalness: 0.6 },
  { id: 'waterproofing', name: 'Waterproofing Membrane', category: 'waterproofing', color: '#303030', density: 1200, cost: 80, unit: 'sqft', strength: 0, thermal: 0.17, roughness: 0.6, metalness: 0.0 },
];

// ─── Keyboard Shortcuts ─────────────────────────────────────────
export const KEYBOARD_SHORTCUTS = {
  'Ctrl+Z': 'Undo', 'Ctrl+Y': 'Redo', 'Ctrl+S': 'Save',
  'Ctrl+C': 'Copy', 'Ctrl+V': 'Paste', 'Ctrl+D': 'Duplicate',
  'Delete': 'Delete Selected', 'Escape': 'Deselect / Cancel',
  'W': 'Wall Tool', 'C': 'Column Tool', 'D': 'Door Tool',
  'N': 'Window Tool', 'S': 'Stair Tool', 'F': 'Furniture Tool',
  'M': 'Measure Tool', 'V': 'Select Tool',
  'T': 'Move (Translate)', 'R': 'Rotate', 'E': 'Scale',
  'Space': 'Pan', 'G': 'Toggle Grid', 'L': 'Toggle Layers',
  '+': 'Zoom In', '-': 'Zoom Out',
  '2': '2D View', '3': '3D View',
  '1': 'Front View', '4': 'Left View', '5': 'Top View', '7': 'Isometric View',
};

// ─── Scale & Display ────────────────────────────────────────────
export const SCALE_FACTOR = 0.1;
export const GRID_SIZES = [50, 100, 250, 500, 1000];

// ─── Colors ─────────────────────────────────────────────────────
export const COLORS = {
  wall: '#8B7355', wall_selected: '#FF6B35',
  column: '#A0A0A0', column_selected: '#FF6B35',
  beam: '#909090', door: '#8B4513', door_arc: '#8B451380',
  window: '#87CEEB', window_frame: '#C0C0C0', stair: '#B0B0B0',
  room_fill: '#F0F8FF20', room_border: '#4A90D9',
  grid_major: '#374151', grid_minor: '#1F2937',
  dimension: '#EF4444', guideline: '#3B82F6',
  selection: '#3B82F650', cursor_remote: '#FF6B6B',
  slab: '#C8C8C8', roof: '#8B6914', foundation: '#696969', railing: '#A0A0A0',
};

export const MATERIAL_COLORS = {
  concrete: '#B0B0B0', steel: '#696969', brick: '#B22222',
  granite: '#1C1C1C', marble: '#FAFAFA', tile: '#E0D5C0',
  wood: '#8B4513', glass: '#87CEEB', paint: '#FFFFFF',
  pvc: '#808080', aluminium: '#C0C0C0', plaster: '#C8C8C8',
  gypsum: '#F0F0F0', acp: '#808080',
};

// ─── Ribbon Tab Definitions ─────────────────────────────────────
export const RIBBON_TABS = [
  {
    id: 'home', name: 'Home', groups: [
      { name: 'Select', tools: [
        { tool: TOOLS.SELECT, label: 'Select', icon: 'MousePointer2', shortcut: 'V' },
      ]},
      { name: 'Modify', tools: [
        { action: 'undo', label: 'Undo', icon: 'Undo2', shortcut: 'Ctrl+Z' },
        { action: 'redo', label: 'Redo', icon: 'Redo2', shortcut: 'Ctrl+Y' },
        { action: 'delete', label: 'Delete', icon: 'Trash2', shortcut: 'Del' },
        { action: 'copy', label: 'Copy', icon: 'Copy', shortcut: 'Ctrl+C' },
        { action: 'paste', label: 'Paste', icon: 'ClipboardPaste', shortcut: 'Ctrl+V' },
      ]},
      { name: 'Build', tools: [
        { tool: TOOLS.WALL, label: 'Wall', icon: 'Minus', shortcut: 'W' },
        { tool: TOOLS.COLUMN, label: 'Column', icon: 'Square', shortcut: 'C' },
        { tool: TOOLS.BEAM, label: 'Beam', icon: 'Minus' },
        { tool: TOOLS.DOOR, label: 'Door', icon: 'DoorOpen', shortcut: 'D' },
        { tool: TOOLS.WINDOW, label: 'Window', icon: 'AppWindow', shortcut: 'N' },
        { tool: TOOLS.STAIR, label: 'Stair', icon: 'Footprints', shortcut: 'S' },
        { tool: TOOLS.SLAB, label: 'Slab', icon: 'RectangleHorizontal' },
        { tool: TOOLS.ROOF, label: 'Roof', icon: 'Home' },
      ]},
      { name: 'Tools', tools: [
        { tool: TOOLS.MEASURE, label: 'Measure', icon: 'Ruler', shortcut: 'M' },
        { tool: TOOLS.TEXT, label: 'Text', icon: 'Type' },
        { tool: TOOLS.ROOM, label: 'Room', icon: 'LayoutDashboard' },
      ]},
    ],
  },
  {
    id: 'insert', name: 'Insert', groups: [
      { name: 'Components', tools: [
        { tool: TOOLS.FURNITURE, label: 'Furniture', icon: 'Armchair', shortcut: 'F' },
        { tool: TOOLS.LANDSCAPE, label: 'Landscape', icon: 'TreePine' },
      ]},
      { name: 'MEP', tools: [
        { tool: TOOLS.ELEC_LIGHT, label: 'Electrical', icon: 'Zap' },
        { tool: TOOLS.PLUMB_PIPE, label: 'Plumbing', icon: 'Droplets' },
        { tool: TOOLS.HVAC_AC, label: 'HVAC', icon: 'Wind' },
        { tool: TOOLS.SOLAR_PANEL, label: 'Solar', icon: 'Sun' },
      ]},
      { name: 'Equipment', tools: [
        { tool: TOOLS.LIFT, label: 'Lift', icon: 'ArrowUpDown' },
        { tool: TOOLS.WATER_TANK, label: 'Tank', icon: 'Container' },
        { tool: TOOLS.GENERATOR, label: 'Generator', icon: 'Cpu' },
      ]},
    ],
  },
  {
    id: 'view', name: 'View', groups: [
      { name: 'Camera', tools: [
        { action: 'view_top', label: 'Top', icon: 'ArrowUp' },
        { action: 'view_front', label: 'Front', icon: 'Square' },
        { action: 'view_left', label: 'Left', icon: 'PanelLeft' },
        { action: 'view_right', label: 'Right', icon: 'PanelRight' },
        { action: 'view_iso', label: 'Isometric', icon: 'Box' },
      ]},
      { name: 'Display', tools: [
        { action: 'render_realistic', label: 'Realistic', icon: 'Sparkles' },
        { action: 'render_wireframe', label: 'Wireframe', icon: 'Grid3X3' },
        { action: 'render_xray', label: 'X-Ray', icon: 'Scan' },
      ]},
      { name: 'Visibility', tools: [
        { action: 'toggle_grid', label: 'Grid', icon: 'Grid3X3' },
        { action: 'toggle_layers', label: 'Layers', icon: 'Layers' },
        { action: 'toggle_section', label: 'Section', icon: 'Scissors' },
      ]},
    ],
  },
  {
    id: 'analyze', name: 'Analyze', groups: [
      { name: 'Quantity', tools: [
        { action: 'quantity_takeoff', label: 'BOQ', icon: 'ClipboardList' },
        { action: 'cost_estimate', label: 'Cost', icon: 'IndianRupee' },
        { action: 'area_calc', label: 'Area', icon: 'Maximize2' },
      ]},
      { name: 'Validate', tools: [
        { action: 'collision_check', label: 'Clash', icon: 'AlertTriangle' },
        { action: 'vastu_check', label: 'Vastu', icon: 'Compass' },
        { action: 'nbc_check', label: 'NBC', icon: 'ShieldCheck' },
      ]},
    ],
  },
  {
    id: 'collaborate', name: 'Collaborate', groups: [
      { name: 'Share', tools: [
        { action: 'invite', label: 'Invite', icon: 'UserPlus' },
        { action: 'comments', label: 'Comments', icon: 'MessageSquare' },
        { action: 'versions', label: 'Versions', icon: 'GitBranch' },
      ]},
      { name: 'Export', tools: [
        { action: 'export_pdf', label: 'PDF', icon: 'FileText' },
        { action: 'export_gltf', label: 'GLTF', icon: 'Download' },
        { action: 'export_json', label: 'JSON', icon: 'Braces' },
        { action: 'save', label: 'Save', icon: 'Save', shortcut: 'Ctrl+S' },
      ]},
    ],
  },
];
