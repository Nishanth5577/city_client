// ═══════════════════════════════════════════════════════════════
// Structural Engineering Calculations — IS 456, IS 875, IS 1893
// ═══════════════════════════════════════════════════════════════

// IS 875 Part 2 — Live Load (kN/m²)
const LIVE_LOADS = {
  residential: 2.0,
  residential_balcony: 3.0,
  commercial_office: 2.5,
  commercial_retail: 4.0,
  commercial_assembly: 5.0,
  industrial_light: 5.0,
  industrial_heavy: 10.0,
  hospital: 3.0,
  educational: 3.0,
  parking: 5.0,
  staircase: 5.0,
  roof_accessible: 1.5,
  roof_inaccessible: 0.75,
};

// IS 1893 — Seismic Zones
const SEISMIC_ZONES = {
  II: { factor: 0.10, desc: 'Low Damage Risk' },
  III: { factor: 0.16, desc: 'Moderate Damage Risk' },
  IV: { factor: 0.24, desc: 'Severe Damage Risk' },
  V: { factor: 0.36, desc: 'Very Severe Damage Risk' },
};

// IS 875 Part 3 — Basic Wind Speed (m/s) by zone
const WIND_SPEED_ZONES = {
  1: 33, 2: 39, 3: 44, 4: 47, 5: 50, 6: 55,
};

// Concrete grades — fck (MPa)
const CONCRETE_GRADES = {
  M15: 15, M20: 20, M25: 25, M30: 30, M35: 35, M40: 40, M45: 45, M50: 50,
};

// Steel grades — fy (MPa)
const STEEL_GRADES = {
  Fe415: 415, Fe500: 500, Fe550: 550,
};

// Unit weights (kN/m³) — IS 875 Part 1
const UNIT_WEIGHTS = {
  rcc: 25,
  pcc: 24,
  brick: 20,
  brick_wall_230: 4.6, // kN/m² per wall
  brick_wall_115: 2.3,
  steel: 78.5,
  soil_dry: 16,
  soil_wet: 18,
  water: 9.81,
  floor_finish: 1.5, // kN/m² assumed
  partition_load: 1.5, // kN/m² — IS 875 additional
  ceiling_plaster: 0.5, // kN/m²
};

/**
 * Calculate dead load on a slab (kN/m²)
 */
export function slabDeadLoad(thickness_mm, floorFinish = true) {
  const slabWeight = (thickness_mm / 1000) * UNIT_WEIGHTS.rcc;
  const finish = floorFinish ? UNIT_WEIGHTS.floor_finish : 0;
  const plaster = UNIT_WEIGHTS.ceiling_plaster;
  return slabWeight + finish + plaster;
}

/**
 * Calculate wall load per meter run (kN/m)
 */
export function wallLoadPerMeter(height_mm, thickness_mm) {
  const h = height_mm / 1000;
  const t = thickness_mm / 1000;
  return h * t * UNIT_WEIGHTS.brick;
}

/**
 * Total floor load (kN/m²) = Dead + Live + Partition
 */
export function totalFloorLoad(slabThickness_mm, buildingType = 'residential') {
  const dead = slabDeadLoad(slabThickness_mm);
  const live = LIVE_LOADS[buildingType] || 2.0;
  const partition = UNIT_WEIGHTS.partition_load;
  return { dead, live, partition, total: dead + live + partition };
}

/**
 * Column axial load calculation
 * Tributary area method — column carries load from its tributary floor area
 */
export function columnAxialLoad(tributaryArea_sqm, numFloors, floorLoad_kNm2) {
  return tributaryArea_sqm * numFloors * floorLoad_kNm2;
}

/**
 * Seismic base shear — IS 1893
 * V = Ah × W
 * Ah = (Z/2) × (I/R) × (Sa/g)
 * Simplified: using Sa/g = 2.5 for short period buildings
 */
export function seismicBaseShear(totalWeight_kN, zone = 'III', importanceFactor = 1.0, responseFactor = 5.0) {
  const Z = SEISMIC_ZONES[zone]?.factor || 0.16;
  const Sa_g = 2.5; // Short period
  const Ah = (Z / 2) * (importanceFactor / responseFactor) * Sa_g;
  return { Ah, baseShear: Ah * totalWeight_kN, zone: SEISMIC_ZONES[zone]?.desc };
}

/**
 * Wind load — IS 875 Part 3
 * F = Cf × A × pd
 * pd = 0.6 × Vz²
 * Vz = Vb × k1 × k2 × k3
 */
export function windPressure(basicWindSpeed_ms, height_m, terrain = 2) {
  const k1 = 1.0; // Risk coefficient
  const k2_table = { 1: 1.05, 2: 1.0, 3: 0.91, 4: 0.8 };
  const k2 = k2_table[terrain] || 1.0;
  const k3 = 1.0; // Topography
  const Vz = basicWindSpeed_ms * k1 * k2 * k3;
  const pd = 0.6 * Vz * Vz; // N/m² → kN/m² by /1000
  return { Vz, pd_Nm2: pd, pd_kNm2: pd / 1000 };
}

/**
 * Required footing area — Isolated footing
 * A = P / (SBC × FOS_reduction)
 * Practical: A = P / (0.8 × SBC)  [20% reduction for self-weight + soil weight]
 */
export function footingArea(axialLoad_kN, soilBearingCapacity_kNm2 = 200) {
  const effectiveSBC = soilBearingCapacity_kNm2 * 0.8;
  const area = axialLoad_kN / effectiveSBC;
  const side = Math.sqrt(area);
  return {
    area_sqm: Math.round(area * 100) / 100,
    side_mm: Math.ceil(side * 1000 / 50) * 50, // Round up to 50mm
    effectiveSBC,
  };
}

/**
 * Beam sizing — Approximate rule of thumb
 * Depth = span/12 (simply supported), span/16 (continuous)
 * Width = depth/2 to depth/3
 */
export function beamSizing(span_mm, type = 'simply_supported') {
  const factor = type === 'continuous' ? 16 : 12;
  const depth = Math.ceil(span_mm / factor / 25) * 25;
  const width = Math.ceil(depth / 2 / 25) * 25;
  return { depth_mm: depth, width_mm: width, span_mm };
}

/**
 * Column sizing — Approximate
 * Axial capacity of short column: Pu = 0.4 × fck × Ac + 0.67 × fy × Asc
 * Simplified: For preliminary design, Ag = P / (0.4 × fck + 0.67 × fy × p/100)
 * where p = 1-2% reinforcement
 */
export function columnSizing(axialLoad_kN, concreteGrade = 'M25', steelGrade = 'Fe500', reinfPercent = 1.5) {
  const fck = CONCRETE_GRADES[concreteGrade] || 25;
  const fy = STEEL_GRADES[steelGrade] || 500;
  const p = reinfPercent / 100;
  const capacity_per_mm2 = (0.4 * fck * (1 - p) + 0.67 * fy * p) / 1000; // kN/mm²
  const area_mm2 = axialLoad_kN / capacity_per_mm2;
  const side = Math.ceil(Math.sqrt(area_mm2) / 25) * 25;
  return { area_mm2: Math.round(area_mm2), side_mm: Math.max(230, side), grade: concreteGrade };
}

/**
 * Generate full structural summary from building data
 */
export function generateStructuralSummary(building) {
  const numFloors = building.floors?.length || 1;
  const floorHeight = building.floor_height || 3000;
  const buildingType = building.building_type || 'residential';
  const slabThickness = 150;

  const floorLoad = totalFloorLoad(slabThickness, buildingType);
  const seismic = seismicBaseShear(floorLoad.total * 100 * numFloors, 'III');
  const wind = windPressure(39, (numFloors * floorHeight) / 1000);

  return {
    buildingType,
    numFloors,
    floorHeight,
    slabThickness,
    loads: floorLoad,
    seismic,
    wind,
    concreteGrade: 'M25',
    steelGrade: 'Fe500',
  };
}

export {
  LIVE_LOADS, SEISMIC_ZONES, WIND_SPEED_ZONES,
  CONCRETE_GRADES, STEEL_GRADES, UNIT_WEIGHTS,
};
