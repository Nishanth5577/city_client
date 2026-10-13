// ═══════════════════════════════════════════════════════════════
// BIM Data Model — Structured hierarchical building model
// Project → Site → Building → Level → Elements
// Every element: unique ID, type, category, geometry params,
// position, rotation, dimensions, material, metadata,
// visibility, locked, parent, relationships
// ═══════════════════════════════════════════════════════════════
import { v4 as uuidv4 } from 'uuid';

// ─── Unit System ───────────────────────────────────────────────
export const UNIT_SYSTEMS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial',
};

export const DISPLAY_UNITS = {
  MM: 'mm',
  CM: 'cm',
  M: 'm',
  FT: 'ft',
  IN: 'in',
};

// Internal unit is always millimeters
export function convertFromMM(value, unit) {
  switch (unit) {
    case DISPLAY_UNITS.MM: return value;
    case DISPLAY_UNITS.CM: return value / 10;
    case DISPLAY_UNITS.M: return value / 1000;
    case DISPLAY_UNITS.FT: return value / 304.8;
    case DISPLAY_UNITS.IN: return value / 25.4;
    default: return value;
  }
}

export function convertToMM(value, unit) {
  switch (unit) {
    case DISPLAY_UNITS.MM: return value;
    case DISPLAY_UNITS.CM: return value * 10;
    case DISPLAY_UNITS.M: return value * 1000;
    case DISPLAY_UNITS.FT: return value * 304.8;
    case DISPLAY_UNITS.IN: return value * 25.4;
    default: return value;
  }
}

export function formatDimension(valueMM, unit, decimals = 0) {
  const v = convertFromMM(valueMM, unit);
  switch (unit) {
    case DISPLAY_UNITS.MM: return `${Math.round(v)} mm`;
    case DISPLAY_UNITS.CM: return `${v.toFixed(1)} cm`;
    case DISPLAY_UNITS.M: return `${v.toFixed(decimals || 2)} m`;
    case DISPLAY_UNITS.FT: {
      const feet = Math.floor(v);
      const inches = Math.round((v - feet) * 12);
      return inches > 0 ? `${feet}' ${inches}"` : `${feet}'`;
    }
    case DISPLAY_UNITS.IN: return `${v.toFixed(1)}"`;
    default: return `${Math.round(valueMM)} mm`;
  }
}

// ─── Element Categories ────────────────────────────────────────
export const BIM_CATEGORIES = {
  WALL: 'wall',
  DOOR: 'door',
  WINDOW: 'window',
  COLUMN: 'column',
  BEAM: 'beam',
  SLAB: 'slab',
  FLOOR: 'floor',
  CEILING: 'ceiling',
  STAIR: 'stair',
  ROOF: 'roof',
  ROOM: 'room',
  FURNITURE: 'furniture',
  FIXTURE: 'fixture',
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing',
  HVAC: 'hvac',
  LANDSCAPE: 'landscape',
  SITE: 'site',
  ANNOTATION: 'annotation',
};

// ─── Wall Types ────────────────────────────────────────────────
export const WALL_TYPES = {
  EXTERIOR: 'exterior',
  INTERIOR: 'interior',
  PARTITION: 'partition',
  STRUCTURAL: 'structural',
  SHEAR: 'shear',
  RETAINING: 'retaining',
  COMPOUND: 'compound',
  PARAPET: 'parapet',
  CURTAIN: 'curtain',
};

// ─── Door Types ────────────────────────────────────────────────
export const DOOR_TYPES = {
  SINGLE: 'single',
  DOUBLE: 'double',
  SLIDING: 'sliding',
  POCKET: 'pocket',
  FOLDING: 'folding',
  FRENCH: 'french',
  GLASS: 'glass',
  MAIN: 'main',
  BATHROOM: 'bathroom',
  BALCONY: 'balcony',
  FIRE: 'fire',
  GARAGE: 'garage',
};

// ─── Window Types ──────────────────────────────────────────────
export const WINDOW_TYPES = {
  CASEMENT: 'casement',
  SLIDING: 'sliding',
  FIXED: 'fixed',
  BAY: 'bay',
  PICTURE: 'picture',
  AWNING: 'awning',
  LOUVERED: 'louvered',
  FLOOR_TO_CEILING: 'floor_to_ceiling',
  CORNER: 'corner',
  SKYLIGHT: 'skylight',
  DORMER: 'dormer',
};

// ─── Stair Types ───────────────────────────────────────────────
export const STAIR_TYPES = {
  STRAIGHT: 'straight',
  L_SHAPED: 'l_shaped',
  U_SHAPED: 'u_shaped',
  SPIRAL: 'spiral',
  DOG_LEGGED: 'dog_legged',
};

// ─── Roof Types ────────────────────────────────────────────────
export const ROOF_TYPES = {
  FLAT: 'flat',
  TERRACE: 'terrace',
  GABLE: 'gable',
  HIP: 'hip',
  SHED: 'shed',
  MANSARD: 'mansard',
};

// ─── Room Types ────────────────────────────────────────────────
export const ROOM_TYPES = {
  LIVING: 'living',
  DINING: 'dining',
  KITCHEN: 'kitchen',
  MASTER_BEDROOM: 'master_bedroom',
  BEDROOM: 'bedroom',
  BATHROOM: 'bathroom',
  TOILET: 'toilet',
  BALCONY: 'balcony',
  TERRACE: 'terrace',
  PASSAGE: 'passage',
  STAIRCASE: 'staircase',
  UTILITY: 'utility',
  STORAGE: 'storage',
  POOJA: 'pooja',
  STUDY: 'study',
  PARKING: 'parking',
  ENTRANCE: 'entrance',
  FOYER: 'foyer',
  SERVANT: 'servant',
};

// ─── Presentation Modes ────────────────────────────────────────
export const PRESENTATION_MODES = {
  DESIGN: 'design',
  REALISTIC: 'realistic',
  PRESENTATION: 'presentation',
  RENDER: 'render',
  WALKTHROUGH: 'walkthrough',
};

// ─── Camera Modes ──────────────────────────────────────────────
export const CAMERA_MODES = {
  ORBIT: 'orbit',
  FIRST_PERSON: 'first_person',
  WALK: 'walk',
  FLY: 'fly',
  TOP: 'top',
  FRONT: 'front',
  BACK: 'back',
  LEFT: 'left',
  RIGHT: 'right',
  ISOMETRIC: 'isometric',
};

// ═══════════════════════════════════════════════════════════════
// BASE BIM ELEMENT
// ═══════════════════════════════════════════════════════════════
export class BIMElement {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this._id = data._id || null; // MongoDB ID
    this.canvas_id = data.canvas_id || this.id;
    this.type = data.type || 'generic';
    this.category = data.category || BIM_CATEGORIES.FURNITURE;
    this.name = data.name || '';
    this.levelId = data.levelId || null;
    this.buildingId = data.buildingId || null;

    // Transform
    this.position = { x: data.position?.x || 0, y: data.position?.y || 0, z: data.position?.z || 0 };
    this.rotation = data.rotation || 0; // degrees
    this.scale = { x: data.scale?.x || 1, y: data.scale?.y || 1, z: data.scale?.z || 1 };

    // Dimensions (mm)
    this.width = data.width || 0;
    this.height = data.height || 0;
    this.depth = data.depth || 0;

    // Material
    this.material = data.material || 'default';
    this.color = data.color || '#808080';
    this.materialProps = data.materialProps || {};

    // State
    this.visible = data.visible !== undefined ? data.visible : true;
    this.locked = data.locked || false;
    this.selected = false;
    this.layer = data.layer || 'architectural';

    // Relationships
    this.parentId = data.parentId || null;
    this.childIds = data.childIds || [];

    // Metadata
    this.metadata = data.metadata || {};
    this.bimData = data.bimData || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  clone() {
    const data = this.toJSON();
    data.id = uuidv4();
    data.canvas_id = data.id;
    data._id = null;
    return new this.constructor(data);
  }

  toJSON() {
    return {
      id: this.id,
      _id: this._id,
      canvas_id: this.canvas_id,
      type: this.type,
      category: this.category,
      name: this.name,
      levelId: this.levelId,
      buildingId: this.buildingId,
      position: { ...this.position },
      rotation: this.rotation,
      scale: { ...this.scale },
      width: this.width,
      height: this.height,
      depth: this.depth,
      material: this.material,
      color: this.color,
      materialProps: { ...this.materialProps },
      visible: this.visible,
      locked: this.locked,
      layer: this.layer,
      parentId: this.parentId,
      childIds: [...this.childIds],
      metadata: { ...this.metadata },
      bimData: { ...this.bimData },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  update(changes) {
    Object.entries(changes).forEach(([key, value]) => {
      if (key === 'position' || key === 'scale' || key === 'materialProps' || key === 'metadata' || key === 'bimData') {
        this[key] = { ...this[key], ...value };
      } else {
        this[key] = value;
      }
    });
    this.updatedAt = new Date().toISOString();
  }
}

// ═══════════════════════════════════════════════════════════════
// WALL
// ═══════════════════════════════════════════════════════════════
export class BIMWall extends BIMElement {
  constructor(data = {}) {
    super({ ...data, category: BIM_CATEGORIES.WALL });
    this.start_point = data.start_point || { x: 0, y: 0 };
    this.end_point = data.end_point || { x: 1000, y: 0 };
    this.thickness = data.thickness || 230;
    this.height = data.height || 3000;
    this.wall_type = data.wall_type || WALL_TYPES.EXTERIOR;
    this.is_structural = data.is_structural || false;
    this.openings = (data.openings || []).map(o => ({ ...o }));
    this.paint_color = data.paint_color || null;
    this.connectedWallIds = data.connectedWallIds || [];
    this.baseElevation = data.baseElevation || 0;
  }

  get length() {
    const dx = this.end_point.x - this.start_point.x;
    const dy = this.end_point.y - this.start_point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  get angle() {
    const dx = this.end_point.x - this.start_point.x;
    const dy = this.end_point.y - this.start_point.y;
    return Math.atan2(dy, dx);
  }

  get midpoint() {
    return {
      x: (this.start_point.x + this.end_point.x) / 2,
      y: (this.start_point.y + this.end_point.y) / 2,
    };
  }

  get area() {
    return this.length * this.height;
  }

  addOpening(opening) {
    this.openings.push(opening);
    this.updatedAt = new Date().toISOString();
  }

  removeOpening(elementId) {
    this.openings = this.openings.filter(o => o.element_id !== elementId);
    this.updatedAt = new Date().toISOString();
  }

  pointOnWall(px, py, tolerance) {
    const t = tolerance || this.thickness * 0.7;
    const { start_point: s, end_point: e } = this;
    const dx = e.x - s.x, dy = e.y - s.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return null;
    const param = ((px - s.x) * dx + (py - s.y) * dy) / (len * len);
    if (param < -0.05 || param > 1.05) return null;
    const projX = s.x + param * dx;
    const projY = s.y + param * dy;
    const dist = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    if (dist > t) return null;
    return { param, distance: dist, projX, projY };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      start_point: { ...this.start_point },
      end_point: { ...this.end_point },
      thickness: this.thickness,
      wall_type: this.wall_type,
      is_structural: this.is_structural,
      openings: this.openings.map(o => ({ ...o })),
      paint_color: this.paint_color,
      connectedWallIds: [...this.connectedWallIds],
      baseElevation: this.baseElevation,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// DOOR
// ═══════════════════════════════════════════════════════════════
export class BIMDoor extends BIMElement {
  constructor(data = {}) {
    super({ ...data, category: BIM_CATEGORIES.DOOR });
    this.width = data.width || 900;
    this.height = data.height || 2100;
    this.door_type = data.door_type || DOOR_TYPES.SINGLE;
    this.wallId = data.wallId || null;
    this.wallParam = data.wallParam || 0.5; // position along wall (0-1)
    this.openingDirection = data.openingDirection || 'left'; // left, right, both
    this.hasGlass = data.hasGlass || false;
    this.frameWidth = data.frameWidth || 50;
    this.frameDepth = data.frameDepth || 100;
    this.handleType = data.handleType || 'lever';
    this.sillHeight = 0; // Doors start from floor
  }

  toJSON() {
    return {
      ...super.toJSON(),
      door_type: this.door_type,
      wallId: this.wallId,
      wallParam: this.wallParam,
      openingDirection: this.openingDirection,
      hasGlass: this.hasGlass,
      frameWidth: this.frameWidth,
      frameDepth: this.frameDepth,
      handleType: this.handleType,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// WINDOW
// ═══════════════════════════════════════════════════════════════
export class BIMWindow extends BIMElement {
  constructor(data = {}) {
    super({ ...data, category: BIM_CATEGORIES.WINDOW });
    this.width = data.width || 1200;
    this.height = data.height || 1200;
    this.sill_height = data.sill_height || 900;
    this.window_type = data.window_type || WINDOW_TYPES.CASEMENT;
    this.wallId = data.wallId || null;
    this.wallParam = data.wallParam || 0.5;
    this.mullionCount = data.mullionCount || { horizontal: 1, vertical: 1 };
    this.frameWidth = data.frameWidth || 40;
    this.glassType = data.glassType || 'clear';
    this.frame_color = data.frame_color || '#E0E0E0';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      sill_height: this.sill_height,
      window_type: this.window_type,
      wallId: this.wallId,
      wallParam: this.wallParam,
      mullionCount: { ...this.mullionCount },
      frameWidth: this.frameWidth,
      glassType: this.glassType,
      frame_color: this.frame_color,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// COLUMN
// ═══════════════════════════════════════════════════════════════
export class BIMColumn extends BIMElement {
  constructor(data = {}) {
    super({ ...data, category: BIM_CATEGORIES.COLUMN });
    this.width = data.width || 300;
    this.depth = data.depth || 300;
    this.height = data.height || 3000;
    this.shape = data.shape || 'rectangular'; // rectangular, circular, l_shaped, t_shaped
    this.diameter = data.diameter || 300;
    this.material = data.material || 'concrete';
    this.reinforcement = data.reinforcement || {};
  }

  toJSON() {
    return {
      ...super.toJSON(),
      shape: this.shape,
      diameter: this.diameter,
      reinforcement: { ...this.reinforcement },
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// BEAM
// ═══════════════════════════════════════════════════════════════
export class BIMBeam extends BIMElement {
  constructor(data = {}) {
    super({ ...data, category: BIM_CATEGORIES.BEAM });
    this.start_point = data.start_point || { x: 0, y: 0 };
    this.end_point = data.end_point || { x: 3000, y: 0 };
    this.width = data.width || 230;
    this.depth = data.depth || 400;
    this.height = data.height || 3000; // at what height (wall height)
    this.material = data.material || 'concrete';
  }

  get span() {
    const dx = this.end_point.x - this.start_point.x;
    const dy = this.end_point.y - this.start_point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      start_point: { ...this.start_point },
      end_point: { ...this.end_point },
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// STAIR
// ═══════════════════════════════════════════════════════════════
export class BIMStair extends BIMElement {
  constructor(data = {}) {
    super({ ...data, category: BIM_CATEGORIES.STAIR });
    this.stair_type = data.stair_type || STAIR_TYPES.STRAIGHT;
    this.width = data.width || 1200;
    this.total_height = data.total_height || 3000;
    this.num_risers = data.num_risers || 18;
    this.riser_height = data.riser_height || 167;
    this.tread_depth = data.tread_depth || 270;
    this.railing_height = data.railing_height || 900;
    this.railing_type = data.railing_type || 'glass'; // glass, metal, wood
    this.landing_depth = data.landing_depth || 1200;
    this.material = data.material || 'concrete';
  }

  get totalRun() {
    return this.num_risers * this.tread_depth;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      stair_type: this.stair_type,
      total_height: this.total_height,
      num_risers: this.num_risers,
      riser_height: this.riser_height,
      tread_depth: this.tread_depth,
      railing_height: this.railing_height,
      railing_type: this.railing_type,
      landing_depth: this.landing_depth,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// ROOF
// ═══════════════════════════════════════════════════════════════
export class BIMRoof extends BIMElement {
  constructor(data = {}) {
    super({ ...data, category: BIM_CATEGORIES.ROOF });
    this.roof_type = data.roof_type || ROOF_TYPES.FLAT;
    this.slope = data.slope || 0; // degrees
    this.overhang = data.overhang || 300; // mm
    this.thickness = data.thickness || 150; // mm
    this.ridgeHeight = data.ridgeHeight || 0;
    this.parapetHeight = data.parapetHeight || 900;
    this.hasParapet = data.hasParapet !== undefined ? data.hasParapet : true;
    this.hasFascia = data.hasFascia || false;
    this.hasGutter = data.hasGutter || false;
    this.material = data.material || 'concrete';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      roof_type: this.roof_type,
      slope: this.slope,
      overhang: this.overhang,
      thickness: this.thickness,
      ridgeHeight: this.ridgeHeight,
      parapetHeight: this.parapetHeight,
      hasParapet: this.hasParapet,
      hasFascia: this.hasFascia,
      hasGutter: this.hasGutter,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// ROOM
// ═══════════════════════════════════════════════════════════════
export class BIMRoom extends BIMElement {
  constructor(data = {}) {
    super({ ...data, category: BIM_CATEGORIES.ROOM });
    this.room_type = data.room_type || ROOM_TYPES.LIVING;
    this.name = data.name || 'Room';
    this.number = data.number || '';
    this.boundary = data.boundary || []; // array of {x, y} points in mm
    this.wallIds = data.wallIds || [];
    this.floorFinish = data.floorFinish || 'vitrified_tile';
    this.wallFinish = data.wallFinish || 'paint_white';
    this.ceilingFinish = data.ceilingFinish || 'paint_white';
    this.ceilingHeight = data.ceilingHeight || 3000;
    this.hasFalseCeiling = data.hasFalseCeiling || false;
    this.falseCeilingDrop = data.falseCeilingDrop || 200;
  }

  get areaSqmm() {
    if (this.boundary.length < 3) return 0;
    let area = 0;
    const n = this.boundary.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += this.boundary[i].x * this.boundary[j].y;
      area -= this.boundary[j].x * this.boundary[i].y;
    }
    return Math.abs(area) / 2;
  }

  get areaSqm() { return this.areaSqmm / 1e6; }
  get areaSqft() { return this.areaSqm * 10.764; }

  get perimeter() {
    if (this.boundary.length < 2) return 0;
    let p = 0;
    for (let i = 0; i < this.boundary.length; i++) {
      const j = (i + 1) % this.boundary.length;
      const dx = this.boundary[j].x - this.boundary[i].x;
      const dy = this.boundary[j].y - this.boundary[i].y;
      p += Math.sqrt(dx * dx + dy * dy);
    }
    return p;
  }

  get centroid() {
    if (this.boundary.length === 0) return { x: 0, y: 0 };
    const sx = this.boundary.reduce((s, p) => s + p.x, 0) / this.boundary.length;
    const sy = this.boundary.reduce((s, p) => s + p.y, 0) / this.boundary.length;
    return { x: sx, y: sy };
  }

  get wallArea() { return this.perimeter * this.ceilingHeight; }
  get floorArea() { return this.areaSqmm; }
  get ceilingArea() { return this.areaSqmm; }

  toJSON() {
    return {
      ...super.toJSON(),
      room_type: this.room_type,
      number: this.number,
      boundary: this.boundary.map(p => ({ ...p })),
      wallIds: [...this.wallIds],
      floorFinish: this.floorFinish,
      wallFinish: this.wallFinish,
      ceilingFinish: this.ceilingFinish,
      ceilingHeight: this.ceilingHeight,
      hasFalseCeiling: this.hasFalseCeiling,
      falseCeilingDrop: this.falseCeilingDrop,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// FURNITURE
// ═══════════════════════════════════════════════════════════════
export class BIMFurniture extends BIMElement {
  constructor(data = {}) {
    super({ ...data, category: BIM_CATEGORIES.FURNITURE });
    this.furnitureType = data.furnitureType || data.type || 'generic';
    this.subcategory = data.subcategory || data.category || 'general';
    this.manufacturer = data.manufacturer || '';
    this.model = data.model || '';
    this.assetPath = data.assetPath || null; // path to GLTF/GLB model
    this.roomId = data.roomId || null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      furnitureType: this.furnitureType,
      subcategory: this.subcategory,
      manufacturer: this.manufacturer,
      model: this.model,
      assetPath: this.assetPath,
      roomId: this.roomId,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// LEVEL (Floor)
// ═══════════════════════════════════════════════════════════════
export class BIMLevel {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this._id = data._id || null;
    this.name = data.name || 'Ground Floor';
    this.number = data.number || 0;
    this.elevation = data.elevation || 0; // mm from ground
    this.floorToFloor = data.floorToFloor || 3000; // mm
    this.slabThickness = data.slabThickness || 150; // mm
    this.visible = data.visible !== undefined ? data.visible : true;
    this.locked = data.locked || false;
    this.active = data.active || false;

    // Elements on this level
    this.elements = {
      walls: data.elements?.walls || [],
      doors: data.elements?.doors || [],
      windows: data.elements?.windows || [],
      columns: data.elements?.columns || [],
      beams: data.elements?.beams || [],
      stairs: data.elements?.stairs || [],
      rooms: data.elements?.rooms || [],
      furniture: data.elements?.furniture || [],
      fixtures: data.elements?.fixtures || [],
      electrical: data.elements?.electrical || [],
      plumbing: data.elements?.plumbing || [],
      hvac: data.elements?.hvac || [],
    };
  }

  getAllElements() {
    const all = [];
    Object.values(this.elements).forEach(arr => {
      if (Array.isArray(arr)) all.push(...arr);
    });
    return all;
  }

  getElementCount() {
    return Object.values(this.elements).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }

  addElement(category, element) {
    const key = this._getCategoryKey(category);
    if (this.elements[key]) {
      this.elements[key].push(element);
    }
  }

  removeElement(category, elementId) {
    const key = this._getCategoryKey(category);
    if (this.elements[key]) {
      this.elements[key] = this.elements[key].filter(e => (e.id || e._id || e.canvas_id) !== elementId);
    }
  }

  findElement(elementId) {
    for (const [key, arr] of Object.entries(this.elements)) {
      const el = arr.find(e => (e.id || e._id || e.canvas_id) === elementId);
      if (el) return { element: el, category: key };
    }
    return null;
  }

  _getCategoryKey(category) {
    switch (category) {
      case BIM_CATEGORIES.WALL: return 'walls';
      case BIM_CATEGORIES.DOOR: return 'doors';
      case BIM_CATEGORIES.WINDOW: return 'windows';
      case BIM_CATEGORIES.COLUMN: return 'columns';
      case BIM_CATEGORIES.BEAM: return 'beams';
      case BIM_CATEGORIES.STAIR: return 'stairs';
      case BIM_CATEGORIES.ROOM: return 'rooms';
      case BIM_CATEGORIES.FURNITURE: return 'furniture';
      case BIM_CATEGORIES.FIXTURE: return 'fixtures';
      case BIM_CATEGORIES.ELECTRICAL: return 'electrical';
      case BIM_CATEGORIES.PLUMBING: return 'plumbing';
      case BIM_CATEGORIES.HVAC: return 'hvac';
      default: return 'furniture';
    }
  }

  duplicate(newName) {
    const data = this.toJSON();
    data.id = uuidv4();
    data._id = null;
    data.name = newName || `${this.name} (Copy)`;
    data.number = this.number + 1;
    data.elevation = this.elevation + this.floorToFloor;
    // Deep clone all elements with new IDs
    Object.keys(data.elements).forEach(key => {
      data.elements[key] = data.elements[key].map(el => {
        const cloned = { ...el };
        cloned.id = uuidv4();
        cloned.canvas_id = cloned.id;
        cloned._id = null;
        cloned.levelId = data.id;
        return cloned;
      });
    });
    return new BIMLevel(data);
  }

  toJSON() {
    return {
      id: this.id,
      _id: this._id,
      name: this.name,
      number: this.number,
      elevation: this.elevation,
      floorToFloor: this.floorToFloor,
      slabThickness: this.slabThickness,
      visible: this.visible,
      locked: this.locked,
      elements: Object.fromEntries(
        Object.entries(this.elements).map(([key, arr]) => [
          key,
          arr.map(el => (typeof el.toJSON === 'function' ? el.toJSON() : { ...el })),
        ])
      ),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// BUILDING
// ═══════════════════════════════════════════════════════════════
export class BIMBuilding {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this._id = data._id || null;
    this.name = data.name || 'Main Building';
    this.levels = (data.levels || []).map(l => l instanceof BIMLevel ? l : new BIMLevel(l));
    this.roof = data.roof ? new BIMRoof(data.roof) : null;
    this.style = data.style || 'modern';
    this.footprint = data.footprint || []; // plot boundary
  }

  addLevel(level) {
    this.levels.push(level instanceof BIMLevel ? level : new BIMLevel(level));
    this.levels.sort((a, b) => a.number - b.number);
  }

  removeLevel(levelId) {
    this.levels = this.levels.filter(l => l.id !== levelId);
  }

  getLevel(levelId) {
    return this.levels.find(l => l.id === levelId);
  }

  getLevelByNumber(num) {
    return this.levels.find(l => l.number === num);
  }

  toJSON() {
    return {
      id: this.id,
      _id: this._id,
      name: this.name,
      levels: this.levels.map(l => l.toJSON()),
      roof: this.roof?.toJSON() || null,
      style: this.style,
      footprint: this.footprint.map(p => ({ ...p })),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SITE
// ═══════════════════════════════════════════════════════════════
export class BIMSite {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.plotWidth = data.plotWidth || 12192; // 40ft in mm
    this.plotDepth = data.plotDepth || 18288; // 60ft in mm
    this.facing = data.facing || 'North';
    this.setbacks = data.setbacks || { front: 1500, rear: 1000, left: 900, right: 900 };
    this.terrain = data.terrain || { type: 'flat', elevation: 0 };
    this.landscape = data.landscape || [];
    this.compoundWall = data.compoundWall || { height: 1500, thickness: 230, material: 'brick' };
    this.gate = data.gate || { width: 3000, height: 2100, type: 'swing' };
    this.driveway = data.driveway || { width: 3000, material: 'concrete' };
    this.parking = data.parking || [];
  }

  get plotArea() { return this.plotWidth * this.plotDepth; }
  get plotAreaSqm() { return this.plotArea / 1e6; }
  get plotAreaSqft() { return this.plotAreaSqm * 10.764; }

  get buildableArea() {
    const bw = this.plotWidth - this.setbacks.left - this.setbacks.right;
    const bd = this.plotDepth - this.setbacks.front - this.setbacks.rear;
    return bw * bd;
  }

  toJSON() {
    return {
      id: this.id,
      plotWidth: this.plotWidth,
      plotDepth: this.plotDepth,
      facing: this.facing,
      setbacks: { ...this.setbacks },
      terrain: { ...this.terrain },
      landscape: this.landscape.map(l => ({ ...l })),
      compoundWall: { ...this.compoundWall },
      gate: { ...this.gate },
      driveway: { ...this.driveway },
      parking: this.parking.map(p => ({ ...p })),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// BIM PROJECT (top-level)
// ═══════════════════════════════════════════════════════════════
export class BIMProjectModel {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this._id = data._id || null;
    this.name = data.name || 'New Project';
    this.description = data.description || '';
    this.status = data.status || 'draft';
    this.unitSystem = data.unitSystem || UNIT_SYSTEMS.METRIC;
    this.displayUnit = data.displayUnit || DISPLAY_UNITS.MM;
    this.gridSpacing = data.gridSpacing || 100; // mm
    this.snapEnabled = data.snapEnabled !== undefined ? data.snapEnabled : true;

    this.site = data.site ? new BIMSite(data.site) : new BIMSite();
    this.buildings = (data.buildings || []).map(b => b instanceof BIMBuilding ? b : new BIMBuilding(b));

    if (this.buildings.length === 0) {
      const building = new BIMBuilding({ name: 'Main Building' });
      building.addLevel(new BIMLevel({ name: 'Ground Floor', number: 0, elevation: 0 }));
      this.buildings.push(building);
    }

    this.cameraState = data.cameraState || null;
    this.designSettings = data.designSettings || {
      wallHeight: 3000,
      floorToFloor: 3000,
      defaultWallThickness: 230,
      defaultSlabThickness: 150,
    };
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  getActiveBuilding() {
    return this.buildings[0];
  }

  getActiveLevel(levelId) {
    for (const building of this.buildings) {
      const level = building.getLevel(levelId);
      if (level) return level;
    }
    return this.buildings[0]?.levels[0] || null;
  }

  toJSON() {
    return {
      id: this.id,
      _id: this._id,
      name: this.name,
      description: this.description,
      status: this.status,
      unitSystem: this.unitSystem,
      displayUnit: this.displayUnit,
      gridSpacing: this.gridSpacing,
      snapEnabled: this.snapEnabled,
      site: this.site.toJSON(),
      buildings: this.buildings.map(b => b.toJSON()),
      cameraState: this.cameraState,
      designSettings: { ...this.designSettings },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(json) {
    return new BIMProjectModel(json);
  }

  // Convert from existing Redux element format to BIM model
  static fromLegacyElements(elements, projectData = {}) {
    const project = new BIMProjectModel(projectData);
    const building = project.getActiveBuilding();
    const level = building.levels[0];

    if (elements.walls) level.elements.walls = elements.walls;
    if (elements.doors) level.elements.doors = elements.doors;
    if (elements.windows) level.elements.windows = elements.windows;
    if (elements.columns) level.elements.columns = elements.columns;
    if (elements.beams) level.elements.beams = elements.beams;
    if (elements.stairs) level.elements.stairs = elements.stairs;
    if (elements.rooms) level.elements.rooms = elements.rooms;
    if (elements.furniture) level.elements.furniture = elements.furniture;

    return project;
  }
}

export default BIMProjectModel;
