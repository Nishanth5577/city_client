// ═══════════════════════════════════════════════════════════════
// BIM Domain Types & Constants — Professional Building Designer
// Central type definitions for the entire BIM system
// ═══════════════════════════════════════════════════════════════

// ─── Building Types ────────────────────────────────────────────
export const BUILDING_TYPES = {
  RESIDENTIAL: 'residential',
  VILLA: 'villa',
  APARTMENT: 'apartment',
  OFFICE: 'office',
  COMMERCIAL: 'commercial',
  HOSPITAL: 'hospital',
  SCHOOL: 'school',
  HOTEL: 'hotel',
  WAREHOUSE: 'warehouse',
  INDUSTRIAL: 'industrial',
  CUSTOM: 'custom',
};

export const BUILDING_TYPE_LABELS = {
  [BUILDING_TYPES.RESIDENTIAL]: 'Residential House',
  [BUILDING_TYPES.VILLA]: 'Villa',
  [BUILDING_TYPES.APARTMENT]: 'Apartment',
  [BUILDING_TYPES.OFFICE]: 'Office Building',
  [BUILDING_TYPES.COMMERCIAL]: 'Commercial Building',
  [BUILDING_TYPES.HOSPITAL]: 'Hospital',
  [BUILDING_TYPES.SCHOOL]: 'School',
  [BUILDING_TYPES.HOTEL]: 'Hotel',
  [BUILDING_TYPES.WAREHOUSE]: 'Warehouse',
  [BUILDING_TYPES.INDUSTRIAL]: 'Industrial Building',
  [BUILDING_TYPES.CUSTOM]: 'Custom',
};

// ─── Room Types ────────────────────────────────────────────────
export const ROOM_TYPES = {
  LIVING_ROOM: 'living_room',
  KITCHEN: 'kitchen',
  DINING_ROOM: 'dining_room',
  MASTER_BEDROOM: 'master_bedroom',
  BEDROOM: 'bedroom',
  BATHROOM: 'bathroom',
  TOILET: 'toilet',
  OFFICE: 'office',
  STUDY: 'study',
  BALCONY: 'balcony',
  GARAGE: 'garage',
  UTILITY: 'utility',
  STORE_ROOM: 'store_room',
  CORRIDOR: 'corridor',
  POOJA_ROOM: 'pooja_room',
  ENTRANCE: 'entrance',
  STAIRWELL: 'stairwell',
  LOBBY: 'lobby',
};

export const ROOM_TYPE_LABELS = {
  [ROOM_TYPES.LIVING_ROOM]: 'Living Room',
  [ROOM_TYPES.KITCHEN]: 'Kitchen',
  [ROOM_TYPES.DINING_ROOM]: 'Dining Room',
  [ROOM_TYPES.MASTER_BEDROOM]: 'Master Bedroom',
  [ROOM_TYPES.BEDROOM]: 'Bedroom',
  [ROOM_TYPES.BATHROOM]: 'Bathroom',
  [ROOM_TYPES.TOILET]: 'Toilet',
  [ROOM_TYPES.OFFICE]: 'Office',
  [ROOM_TYPES.STUDY]: 'Study',
  [ROOM_TYPES.BALCONY]: 'Balcony',
  [ROOM_TYPES.GARAGE]: 'Garage',
  [ROOM_TYPES.UTILITY]: 'Utility',
  [ROOM_TYPES.STORE_ROOM]: 'Store Room',
  [ROOM_TYPES.CORRIDOR]: 'Corridor',
  [ROOM_TYPES.POOJA_ROOM]: 'Pooja Room',
  [ROOM_TYPES.ENTRANCE]: 'Entrance',
  [ROOM_TYPES.STAIRWELL]: 'Stairwell',
  [ROOM_TYPES.LOBBY]: 'Lobby',
};

// Default colors for room types (for 2D plan and 3D room labels)
export const ROOM_COLORS = {
  [ROOM_TYPES.LIVING_ROOM]: '#4FC3F7',
  [ROOM_TYPES.KITCHEN]: '#FFB74D',
  [ROOM_TYPES.DINING_ROOM]: '#AED581',
  [ROOM_TYPES.MASTER_BEDROOM]: '#CE93D8',
  [ROOM_TYPES.BEDROOM]: '#BA68C8',
  [ROOM_TYPES.BATHROOM]: '#4DD0E1',
  [ROOM_TYPES.TOILET]: '#80DEEA',
  [ROOM_TYPES.OFFICE]: '#90CAF9',
  [ROOM_TYPES.STUDY]: '#A5D6A7',
  [ROOM_TYPES.BALCONY]: '#C5E1A5',
  [ROOM_TYPES.GARAGE]: '#BCAAA4',
  [ROOM_TYPES.UTILITY]: '#B0BEC5',
  [ROOM_TYPES.STORE_ROOM]: '#D7CCC8',
  [ROOM_TYPES.CORRIDOR]: '#CFD8DC',
  [ROOM_TYPES.POOJA_ROOM]: '#FFCC80',
  [ROOM_TYPES.ENTRANCE]: '#EF9A9A',
  [ROOM_TYPES.STAIRWELL]: '#B39DDB',
  [ROOM_TYPES.LOBBY]: '#80CBC4',
};

// ─── Room Floor Materials (room type → PBR material key) ───────
export const ROOM_FLOOR_MATERIALS = {
  [ROOM_TYPES.LIVING_ROOM]: 'marble_white',
  [ROOM_TYPES.KITCHEN]: 'tile_ceramic',
  [ROOM_TYPES.DINING_ROOM]: 'marble_white',
  [ROOM_TYPES.MASTER_BEDROOM]: 'wood_oak',
  [ROOM_TYPES.BEDROOM]: 'wood_oak',
  [ROOM_TYPES.BATHROOM]: 'tile_ceramic',
  [ROOM_TYPES.TOILET]: 'tile_ceramic',
  [ROOM_TYPES.OFFICE]: 'wood_oak',
  [ROOM_TYPES.STUDY]: 'wood_oak',
  [ROOM_TYPES.BALCONY]: 'stone',
  [ROOM_TYPES.GARAGE]: 'concrete',
  [ROOM_TYPES.UTILITY]: 'concrete',
  [ROOM_TYPES.STORE_ROOM]: 'concrete',
  [ROOM_TYPES.CORRIDOR]: 'tile_white',
  [ROOM_TYPES.POOJA_ROOM]: 'marble_white',
  [ROOM_TYPES.ENTRANCE]: 'marble_white',
  [ROOM_TYPES.STAIRWELL]: 'concrete',
  [ROOM_TYPES.LOBBY]: 'marble_white',
};

// ─── Wall Types ────────────────────────────────────────────────
export const WALL_TYPES = {
  EXTERIOR: 'exterior',
  INTERIOR: 'interior',
  PARTITION: 'partition',
  CURTAIN: 'curtain',
  RETAINING: 'retaining',
  SHEAR: 'shear',
};

// ─── Door Types ────────────────────────────────────────────────
export const DOOR_TYPES = {
  SINGLE: 'single',
  DOUBLE: 'double',
  SLIDING: 'sliding',
  GLASS: 'glass',
  MAIN_ENTRANCE: 'main_entrance',
  GARAGE: 'garage',
  INTERIOR: 'interior',
  FRENCH: 'french',
  FOLDING: 'folding',
};

// ─── Window Types ──────────────────────────────────────────────
export const WINDOW_TYPES = {
  FIXED: 'fixed',
  SLIDING: 'sliding',
  DOUBLE_HUNG: 'double_hung',
  BAY: 'bay',
  CORNER: 'corner',
  LARGE_GLASS: 'large_glass',
  SKYLIGHT: 'skylight',
  LOUVRE: 'louvre',
};

// ─── Roof Types ────────────────────────────────────────────────
export const ROOF_TYPES = {
  FLAT: 'flat',
  GABLE: 'gable',
  HIP: 'hip',
  SHED: 'shed',
  MANSARD: 'mansard',
};

// ─── Stair Types ───────────────────────────────────────────────
export const STAIR_TYPES = {
  STRAIGHT: 'straight',
  L_SHAPED: 'l_shaped',
  U_SHAPED: 'u_shaped',
  SPIRAL: 'spiral',
};

// ─── IFC Entity Types ──────────────────────────────────────────
export const IFC_TYPES = {
  PROJECT: 'IfcProject',
  SITE: 'IfcSite',
  BUILDING: 'IfcBuilding',
  STOREY: 'IfcBuildingStorey',
  SPACE: 'IfcSpace',
  WALL: 'IfcWallStandardCase',
  DOOR: 'IfcDoor',
  WINDOW: 'IfcWindow',
  SLAB: 'IfcSlab',
  ROOF: 'IfcRoof',
  COLUMN: 'IfcColumn',
  BEAM: 'IfcBeam',
  STAIR: 'IfcStairFlight',
  RAMP: 'IfcRamp',
  FURNITURE: 'IfcFurnishingElement',
  OPENING: 'IfcOpeningElement',
  FOOTING: 'IfcFooting',
  RAILING: 'IfcRailing',
  CURTAIN_WALL: 'IfcCurtainWall',
  COVERING: 'IfcCovering',
};

// ─── BIM Engine Status ─────────────────────────────────────────
export const BIM_ENGINE_STATUS = {
  OFFLINE: 'offline',
  STARTING: 'starting',
  READY: 'ready',
  PROCESSING: 'processing',
  ERROR: 'error',
};

// ─── View Modes ────────────────────────────────────────────────
export const VIEW_MODES = {
  VIEW_3D: '3d',
  PLAN_2D: '2d',
  SPLIT: 'split',
  DOLLHOUSE: 'dollhouse',
  WALKTHROUGH: 'walkthrough',
  RENDER: 'render',
};

// ─── Dollhouse / Cutaway ───────────────────────────────────────
export const ROOF_VISIBILITY = {
  SHOW: 'show',
  HIDE: 'hide',
  TRANSPARENT: 'transparent',
};

export const CUTAWAY_DIRECTIONS = {
  NONE: 'none',
  FRONT: 'front',
  BACK: 'back',
  LEFT: 'left',
  RIGHT: 'right',
};

export const FLOOR_DISPLAY = {
  ALL: 'all',
  SINGLE: 'single',
  EXPLODED: 'exploded',
};

// ─── Render Modes ──────────────────────────────────────────────
export const RENDER_MODES = {
  REALISTIC: 'realistic',
  SHADED: 'shaded',
  WIREFRAME: 'wireframe',
  XRAY: 'xray',
  CONCEPTUAL: 'conceptual',
};

// ─── Camera Presets ────────────────────────────────────────────
export const CAMERA_PRESETS = {
  PERSPECTIVE: 'perspective',
  ORTHOGRAPHIC: 'orthographic',
  TOP: 'top',
  FRONT: 'front',
  BACK: 'back',
  LEFT: 'left',
  RIGHT: 'right',
  ISOMETRIC: 'isometric',
};

// ─── Time of Day ───────────────────────────────────────────────
export const TIME_OF_DAY = {
  MORNING: 'morning',
  DAY: 'day',
  EVENING: 'evening',
  NIGHT: 'night',
  SUNSET: 'sunset',
};

// ─── Construction Status ───────────────────────────────────────
export const CONSTRUCTION_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// ─── Material Presets ──────────────────────────────────────────
export const MATERIAL_PRESETS = {
  CONCRETE: { name: 'Concrete', color: '#9E9E9E', roughness: 0.85, metalness: 0.0 },
  BRICK: { name: 'Brick', color: '#C0392B', roughness: 0.9, metalness: 0.0 },
  WOOD_OAK: { name: 'Oak Wood', color: '#8B6914', roughness: 0.6, metalness: 0.0 },
  WOOD_PINE: { name: 'Pine Wood', color: '#DEB887', roughness: 0.65, metalness: 0.0 },
  MARBLE_WHITE: { name: 'White Marble', color: '#F5F5F5', roughness: 0.15, metalness: 0.05 },
  MARBLE_BLACK: { name: 'Black Marble', color: '#2C2C2C', roughness: 0.1, metalness: 0.1 },
  GRANITE: { name: 'Granite', color: '#808080', roughness: 0.5, metalness: 0.05 },
  STONE: { name: 'Stone', color: '#A9A9A9', roughness: 0.8, metalness: 0.0 },
  GLASS_CLEAR: { name: 'Clear Glass', color: '#E0F7FA', roughness: 0.0, metalness: 0.1, transparent: true, opacity: 0.3 },
  GLASS_TINTED: { name: 'Tinted Glass', color: '#1A237E', roughness: 0.0, metalness: 0.15, transparent: true, opacity: 0.4 },
  STEEL: { name: 'Steel', color: '#B0B0B0', roughness: 0.3, metalness: 0.9 },
  ALUMINIUM: { name: 'Aluminium', color: '#C0C0C0', roughness: 0.35, metalness: 0.85 },
  PAINT_WHITE: { name: 'White Paint', color: '#FAFAFA', roughness: 0.95, metalness: 0.0 },
  PAINT_CREAM: { name: 'Cream Paint', color: '#FFF8E1', roughness: 0.95, metalness: 0.0 },
  TILE_WHITE: { name: 'White Tile', color: '#F5F5F5', roughness: 0.2, metalness: 0.05 },
  TILE_GREY: { name: 'Grey Tile', color: '#BDBDBD', roughness: 0.25, metalness: 0.05 },
  ROOF_TILE: { name: 'Roof Tile', color: '#A0522D', roughness: 0.85, metalness: 0.0 },
  GRASS: { name: 'Grass', color: '#4CAF50', roughness: 0.95, metalness: 0.0 },
  SOIL: { name: 'Soil', color: '#795548', roughness: 0.9, metalness: 0.0 },
  ASPHALT: { name: 'Asphalt', color: '#424242', roughness: 0.85, metalness: 0.0 },
};

// ─── Furniture Categories ──────────────────────────────────────
export const FURNITURE_CATEGORIES = {
  SEATING: 'seating',
  BEDS: 'beds',
  TABLES: 'tables',
  STORAGE: 'storage',
  KITCHEN: 'kitchen',
  BATHROOM: 'bathroom',
  LIGHTING: 'lighting',
  ELECTRONICS: 'electronics',
  DECORATIVE: 'decorative',
  OUTDOOR: 'outdoor',
};

export const FURNITURE_ITEMS = [
  // Seating
  { id: 'sofa_3seat', name: 'Sofa (3-Seat)', category: 'seating', width: 2200, depth: 900, height: 850 },
  { id: 'sofa_2seat', name: 'Sofa (2-Seat)', category: 'seating', width: 1600, depth: 850, height: 850 },
  { id: 'armchair', name: 'Armchair', category: 'seating', width: 850, depth: 850, height: 900 },
  { id: 'dining_chair', name: 'Dining Chair', category: 'seating', width: 450, depth: 500, height: 900 },
  { id: 'office_chair', name: 'Office Chair', category: 'seating', width: 600, depth: 600, height: 1050 },
  // Beds
  { id: 'king_bed', name: 'King Bed', category: 'beds', width: 2000, depth: 2000, height: 600 },
  { id: 'queen_bed', name: 'Queen Bed', category: 'beds', width: 1800, depth: 2000, height: 600 },
  { id: 'single_bed', name: 'Single Bed', category: 'beds', width: 1000, depth: 2000, height: 600 },
  // Tables
  { id: 'dining_table_6', name: 'Dining Table (6-Seat)', category: 'tables', width: 1800, depth: 900, height: 750 },
  { id: 'dining_table_4', name: 'Dining Table (4-Seat)', category: 'tables', width: 1200, depth: 800, height: 750 },
  { id: 'coffee_table', name: 'Coffee Table', category: 'tables', width: 1200, depth: 600, height: 450 },
  { id: 'study_desk', name: 'Study Desk', category: 'tables', width: 1400, depth: 700, height: 750 },
  { id: 'office_desk', name: 'Office Desk', category: 'tables', width: 1600, depth: 800, height: 750 },
  { id: 'side_table', name: 'Side Table', category: 'tables', width: 500, depth: 500, height: 550 },
  // Storage
  { id: 'wardrobe', name: 'Wardrobe', category: 'storage', width: 1800, depth: 600, height: 2200 },
  { id: 'bookshelf', name: 'Bookshelf', category: 'storage', width: 1200, depth: 350, height: 2000 },
  { id: 'tv_unit', name: 'TV Unit', category: 'storage', width: 1800, depth: 450, height: 500 },
  { id: 'shoe_rack', name: 'Shoe Rack', category: 'storage', width: 900, depth: 350, height: 1000 },
  // Kitchen
  { id: 'kitchen_counter', name: 'Kitchen Counter', category: 'kitchen', width: 2400, depth: 600, height: 850 },
  { id: 'kitchen_island', name: 'Kitchen Island', category: 'kitchen', width: 1500, depth: 800, height: 900 },
  { id: 'refrigerator', name: 'Refrigerator', category: 'kitchen', width: 700, depth: 700, height: 1800 },
  { id: 'oven', name: 'Oven', category: 'kitchen', width: 600, depth: 600, height: 850 },
  { id: 'kitchen_sink', name: 'Kitchen Sink', category: 'kitchen', width: 800, depth: 500, height: 200 },
  // Bathroom
  { id: 'toilet', name: 'Toilet', category: 'bathroom', width: 400, depth: 700, height: 750 },
  { id: 'wash_basin', name: 'Wash Basin', category: 'bathroom', width: 600, depth: 450, height: 850 },
  { id: 'bathtub', name: 'Bathtub', category: 'bathroom', width: 1700, depth: 750, height: 600 },
  { id: 'shower', name: 'Shower Enclosure', category: 'bathroom', width: 900, depth: 900, height: 2100 },
  // Electronics
  { id: 'tv_55', name: 'TV (55")', category: 'electronics', width: 1230, depth: 80, height: 720 },
  { id: 'tv_65', name: 'TV (65")', category: 'electronics', width: 1450, depth: 80, height: 840 },
  // Decorative
  { id: 'plant_pot_large', name: 'Plant Pot (Large)', category: 'decorative', width: 400, depth: 400, height: 1200 },
  { id: 'plant_pot_small', name: 'Plant Pot (Small)', category: 'decorative', width: 250, depth: 250, height: 600 },
  { id: 'rug_large', name: 'Rug (Large)', category: 'decorative', width: 2400, depth: 1700, height: 20 },
  // Outdoor
  { id: 'outdoor_table', name: 'Outdoor Table', category: 'outdoor', width: 1200, depth: 1200, height: 750 },
  { id: 'outdoor_chair', name: 'Outdoor Chair', category: 'outdoor', width: 600, depth: 600, height: 850 },
  { id: 'garden_bench', name: 'Garden Bench', category: 'outdoor', width: 1500, depth: 600, height: 850 },
];

// ─── Landscape Items ───────────────────────────────────────────
export const LANDSCAPE_ITEMS = [
  { id: 'tree_large', name: 'Large Tree', category: 'vegetation', radius: 3000, height: 8000 },
  { id: 'tree_medium', name: 'Medium Tree', category: 'vegetation', radius: 2000, height: 5000 },
  { id: 'tree_small', name: 'Small Tree', category: 'vegetation', radius: 1200, height: 3000 },
  { id: 'palm_tree', name: 'Palm Tree', category: 'vegetation', radius: 1500, height: 7000 },
  { id: 'bush_round', name: 'Round Bush', category: 'vegetation', radius: 800, height: 1200 },
  { id: 'hedge', name: 'Hedge', category: 'vegetation', width: 3000, depth: 500, height: 1500 },
  { id: 'flower_bed', name: 'Flower Bed', category: 'garden', width: 2000, depth: 800, height: 300 },
  { id: 'grass_patch', name: 'Grass Patch', category: 'garden', width: 5000, depth: 5000, height: 50 },
  { id: 'swimming_pool', name: 'Swimming Pool', category: 'water', width: 8000, depth: 4000, height: 1500 },
  { id: 'fountain', name: 'Fountain', category: 'water', radius: 1000, height: 1200 },
  { id: 'driveway', name: 'Driveway', category: 'hardscape', width: 6000, depth: 3000, height: 50 },
  { id: 'parking_spot', name: 'Parking Spot', category: 'hardscape', width: 2500, depth: 5000, height: 10 },
  { id: 'boundary_wall', name: 'Boundary Wall', category: 'boundary', height: 1800, thickness: 200 },
  { id: 'fence', name: 'Fence', category: 'boundary', height: 1200, thickness: 80 },
  { id: 'gate_main', name: 'Main Gate', category: 'boundary', width: 3000, height: 2000, thickness: 100 },
];

// ─── Tool Categories (Left Sidebar) ───────────────────────────
export const TOOL_CATEGORIES = [
  {
    id: 'build', name: 'Build', icon: 'Hammer',
    tools: [
      { id: 'wall', name: 'Wall', icon: 'Square', description: 'Draw walls' },
      { id: 'slab', name: 'Floor Slab', icon: 'Layers', description: 'Create floor/ceiling slabs' },
      { id: 'roof', name: 'Roof', icon: 'Home', description: 'Add roof' },
      { id: 'foundation', name: 'Foundation', icon: 'Box', description: 'Create foundation' },
    ],
  },
  {
    id: 'rooms', name: 'Rooms', icon: 'LayoutGrid',
    tools: [
      { id: 'room_auto', name: 'Auto Room', icon: 'Scan', description: 'Detect rooms from walls' },
      { id: 'room_manual', name: 'Room Zone', icon: 'Square', description: 'Define room boundary' },
    ],
  },
  {
    id: 'structure', name: 'Structure', icon: 'Building2',
    tools: [
      { id: 'column', name: 'Column', icon: 'Cylinder', description: 'Add column' },
      { id: 'beam', name: 'Beam', icon: 'Minus', description: 'Add beam' },
      { id: 'stair', name: 'Stair', icon: 'Stairs', description: 'Add staircase' },
      { id: 'ramp', name: 'Ramp', icon: 'Triangle', description: 'Add ramp' },
    ],
  },
  {
    id: 'openings', name: 'Openings', icon: 'DoorOpen',
    tools: [
      { id: 'door', name: 'Door', icon: 'DoorOpen', description: 'Add door to wall' },
      { id: 'window', name: 'Window', icon: 'AppWindow', description: 'Add window to wall' },
      { id: 'opening', name: 'Opening', icon: 'Square', description: 'Create wall opening' },
    ],
  },
  {
    id: 'interior', name: 'Interior', icon: 'Sofa',
    tools: [
      { id: 'furniture', name: 'Furniture', icon: 'Sofa', description: 'Place furniture' },
      { id: 'appliance', name: 'Appliances', icon: 'Tv', description: 'Place appliances' },
    ],
  },
  {
    id: 'mep', name: 'MEP', icon: 'Zap',
    tools: [
      { id: 'elec_socket', name: 'Socket', icon: 'Plug', description: 'Electrical socket' },
      { id: 'elec_switch', name: 'Switch', icon: 'ToggleLeft', description: 'Light switch' },
      { id: 'elec_light', name: 'Light', icon: 'Lightbulb', description: 'Light fixture' },
      { id: 'plumb_pipe', name: 'Pipe', icon: 'Workflow', description: 'Plumbing pipe' },
      { id: 'hvac_ac', name: 'AC Unit', icon: 'Wind', description: 'Air conditioning' },
    ],
  },
  {
    id: 'landscape', name: 'Landscape', icon: 'TreePine',
    tools: [
      { id: 'terrain', name: 'Terrain', icon: 'Mountain', description: 'Shape terrain' },
      { id: 'tree', name: 'Trees', icon: 'TreePine', description: 'Place trees' },
      { id: 'plant', name: 'Plants', icon: 'Flower2', description: 'Place plants/bushes' },
      { id: 'pool', name: 'Pool', icon: 'Droplets', description: 'Swimming pool' },
      { id: 'driveway', name: 'Driveway', icon: 'Route', description: 'Create driveway' },
      { id: 'parking', name: 'Parking', icon: 'ParkingSquare', description: 'Parking area' },
    ],
  },
  {
    id: 'site', name: 'Site', icon: 'Map',
    tools: [
      { id: 'boundary_wall', name: 'Boundary Wall', icon: 'Fence', description: 'Site boundary wall' },
      { id: 'fence', name: 'Fence', icon: 'AlignVerticalSpaceAround', description: 'Fence/railing' },
      { id: 'gate', name: 'Gate', icon: 'DoorOpen', description: 'Main gate' },
    ],
  },
  {
    id: 'materials', name: 'Materials', icon: 'Palette',
    tools: [
      { id: 'material_picker', name: 'Pick Material', icon: 'Pipette', description: 'Pick material from surface' },
      { id: 'material_apply', name: 'Apply Material', icon: 'Paintbrush', description: 'Apply material to surface' },
    ],
  },
  {
    id: 'lighting', name: 'Lighting', icon: 'Sun',
    tools: [
      { id: 'light_point', name: 'Point Light', icon: 'Lightbulb', description: 'Add point light' },
      { id: 'light_spot', name: 'Spot Light', icon: 'Target', description: 'Add spotlight' },
      { id: 'light_area', name: 'Area Light', icon: 'Square', description: 'Add area light' },
    ],
  },
  {
    id: 'measure', name: 'Measure', icon: 'Ruler',
    tools: [
      { id: 'measure_distance', name: 'Distance', icon: 'Ruler', description: 'Measure distance' },
      { id: 'measure_area', name: 'Area', icon: 'SquareDashedBottom', description: 'Measure area' },
      { id: 'measure_angle', name: 'Angle', icon: 'Triangle', description: 'Measure angle' },
    ],
  },
];

// ─── Snap Settings ─────────────────────────────────────────────
export const SNAP_MODES = {
  GRID: 'grid',
  WALL: 'wall',
  CORNER: 'corner',
  MIDPOINT: 'midpoint',
  ENDPOINT: 'endpoint',
  INTERSECTION: 'intersection',
  PERPENDICULAR: 'perpendicular',
  FURNITURE: 'furniture',
};

// ─── Default Building Dimensions (mm) ─────────────────────────
export const DEFAULTS = {
  FLOOR_HEIGHT: 3200,
  WALL_THICKNESS: 200,
  EXTERIOR_WALL_THICKNESS: 230,
  INTERIOR_WALL_THICKNESS: 150,
  SLAB_THICKNESS: 150,
  DOOR_WIDTH: 900,
  DOOR_HEIGHT: 2100,
  MAIN_DOOR_WIDTH: 1200,
  MAIN_DOOR_HEIGHT: 2400,
  WINDOW_WIDTH: 1200,
  WINDOW_HEIGHT: 1200,
  WINDOW_SILL: 900,
  COLUMN_SIZE: 300,
  BEAM_WIDTH: 230,
  BEAM_DEPTH: 450,
  STAIR_WIDTH: 1000,
  STAIR_RISER: 175,
  STAIR_TREAD: 250,
  RAILING_HEIGHT: 1050,
  PARAPET_HEIGHT: 900,
  ROOF_OVERHANG: 600,
  GRID_SIZE: 100,
  MIN_ROOM_WIDTH: 2400,
  MIN_ROOM_DEPTH: 2400,
};

// Millimeters to meters
export const MM_TO_M = 0.001;
export const M_TO_MM = 1000;
