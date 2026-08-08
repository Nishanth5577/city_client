// ═══════════════════════════════════════════════════════════════
// HVAC Engineering Calculations
// ═══════════════════════════════════════════════════════════════

// Cooling load factors (BTU/hr per sqft)
const COOLING_LOAD_FACTORS = {
  residential_bedroom: 500,
  residential_living: 600,
  residential_kitchen: 700,
  commercial_office: 650,
  commercial_retail: 800,
  commercial_server_room: 2000,
  commercial_conference: 900,
  hospital_ward: 600,
  hospital_ot: 1200,
  restaurant: 1000,
  industrial: 500,
};

// AC types with specifications
const AC_SPECIFICATIONS = {
  split_1ton: { capacity_btu: 12000, tonnage: 1.0, power_kw: 1.2, airflow_cfm: 400, indoor_noise_db: 38 },
  split_1_5ton: { capacity_btu: 18000, tonnage: 1.5, power_kw: 1.8, airflow_cfm: 550, indoor_noise_db: 40 },
  split_2ton: { capacity_btu: 24000, tonnage: 2.0, power_kw: 2.4, airflow_cfm: 700, indoor_noise_db: 42 },
  split_3ton: { capacity_btu: 36000, tonnage: 3.0, power_kw: 3.5, airflow_cfm: 1000, indoor_noise_db: 45 },
  cassette_2ton: { capacity_btu: 24000, tonnage: 2.0, power_kw: 2.5, airflow_cfm: 750, indoor_noise_db: 40 },
  cassette_3ton: { capacity_btu: 36000, tonnage: 3.0, power_kw: 3.6, airflow_cfm: 1050, indoor_noise_db: 42 },
  ductable_5ton: { capacity_btu: 60000, tonnage: 5.0, power_kw: 5.5, airflow_cfm: 1800, indoor_noise_db: 45 },
  ductable_8_5ton: { capacity_btu: 102000, tonnage: 8.5, power_kw: 9.5, airflow_cfm: 3200, indoor_noise_db: 48 },
  vrf_unit: { capacity_btu: 48000, tonnage: 4.0, power_kw: 4.0, airflow_cfm: 1500, indoor_noise_db: 35 },
};

// Air changes per hour (ACH) by room type
const ACH_REQUIREMENTS = {
  bedroom: 4,
  living_room: 6,
  kitchen: 15,
  bathroom: 8,
  toilet: 10,
  office: 6,
  conference: 8,
  lobby: 4,
  corridor: 4,
  store: 4,
  server_room: 15,
  parking: 6,
};

// Duct velocity recommendations (fpm)
const DUCT_VELOCITY = {
  main_supply: 1200,
  branch_supply: 800,
  main_return: 1000,
  branch_return: 700,
  exhaust: 1500,
  fresh_air: 600,
};

/**
 * Calculate cooling load for a room
 * Q = Area (sqft) × Load Factor (BTU/hr/sqft) + Occupant load + Equipment load
 */
export function coolingLoad(area_sqft, roomType = 'residential_bedroom', occupants = 2, equipmentLoad_btu = 0) {
  const factor = COOLING_LOAD_FACTORS[roomType] || 600;
  const occupantLoad = occupants * 400; // ~400 BTU/person (sensible)
  const totalBTU = area_sqft * factor + occupantLoad + equipmentLoad_btu;
  const tonnage = totalBTU / 12000;

  return {
    area_sqft,
    loadFactor: factor,
    roomLoad_btu: area_sqft * factor,
    occupantLoad_btu: occupantLoad,
    equipmentLoad_btu: equipmentLoad_btu,
    totalLoad_btu: Math.round(totalBTU),
    tonnage: Math.round(tonnage * 100) / 100,
    tonnage_rounded: Math.ceil(tonnage * 2) / 2, // Round up to 0.5 TR
  };
}

/**
 * Select AC unit based on tonnage
 */
export function selectACUnit(tonnage, preferType = 'split') {
  const sorted = Object.entries(AC_SPECIFICATIONS)
    .filter(([k]) => k.includes(preferType))
    .sort((a, b) => a[1].tonnage - b[1].tonnage);

  const selected = sorted.find(([, v]) => v.tonnage >= tonnage);
  if (selected) return { type: selected[0], ...selected[1] };

  // If no match, recommend multiple units
  const largest = sorted[sorted.length - 1];
  if (largest) {
    const count = Math.ceil(tonnage / largest[1].tonnage);
    return { type: largest[0], ...largest[1], count, note: `${count} units required` };
  }
  return null;
}

/**
 * Calculate required CFM for a room
 * CFM = (Volume × ACH) / 60
 */
export function requiredCFM(area_sqft, ceilingHeight_ft = 10, roomType = 'bedroom') {
  const ach = ACH_REQUIREMENTS[roomType] || 6;
  const volume = area_sqft * ceilingHeight_ft;
  const cfm = (volume * ach) / 60;
  return { volume_cft: volume, ach, cfm: Math.round(cfm) };
}

/**
 * Duct sizing from CFM (velocity method)
 * Area = CFM / Velocity (sqft)
 * For rectangular: W × H = Area, typically W:H = 2:1 or 3:1
 * For circular: D = sqrt(4A/π)
 */
export function ductSizing(cfm, ductType = 'main_supply', shape = 'rectangular') {
  const velocity = DUCT_VELOCITY[ductType] || 1000;
  const area_sqft = cfm / velocity;
  const area_sqin = area_sqft * 144;

  if (shape === 'circular') {
    const d_in = Math.sqrt((4 * area_sqin) / Math.PI);
    return {
      cfm, velocity,
      area_sqin: Math.round(area_sqin),
      diameter_in: Math.ceil(d_in),
      diameter_mm: Math.ceil(d_in * 25.4 / 25) * 25,
    };
  }

  // Rectangular duct with 2:1 aspect ratio
  const h_in = Math.sqrt(area_sqin / 2);
  const w_in = h_in * 2;
  return {
    cfm, velocity,
    area_sqin: Math.round(area_sqin),
    width_in: Math.ceil(w_in),
    height_in: Math.ceil(h_in),
    width_mm: Math.ceil(w_in * 25.4 / 25) * 25,
    height_mm: Math.ceil(h_in * 25.4 / 25) * 25,
  };
}

/**
 * Number of vents/diffusers required
 * Each vent typically handles 100-150 CFM
 */
export function ventCount(cfm, cfmPerVent = 100) {
  return Math.ceil(cfm / cfmPerVent);
}

/**
 * Total HVAC power load
 */
export function totalHVACPower(acUnits) {
  return acUnits.reduce((sum, unit) => {
    const spec = AC_SPECIFICATIONS[unit.ac_type] || { power_kw: 1.5 };
    return sum + spec.power_kw;
  }, 0);
}

/**
 * Generate complete HVAC summary for a floor
 */
export function floorHVACSummary(rooms, hvacElements) {
  const roomAnalysis = rooms.map(room => {
    const area_sqft = (room.area || 0) * 10.764; // m² to sqft
    const roomType = `residential_${room.room_type || 'bedroom'}`;
    const load = coolingLoad(area_sqft, roomType, room.occupants || 2);
    const cfm = requiredCFM(area_sqft, 10, room.room_type || 'bedroom');
    const ac = selectACUnit(load.tonnage_rounded);
    const mainDuct = ductSizing(cfm.cfm);
    const vents = ventCount(cfm.cfm);

    return {
      roomName: room.name || room.room_type,
      area_sqft: Math.round(area_sqft),
      ...load,
      cfm: cfm.cfm,
      recommended_ac: ac,
      duct: mainDuct,
      ventCount: vents,
    };
  });

  const totalTonnage = roomAnalysis.reduce((sum, r) => sum + r.tonnage, 0);
  const totalCFM = roomAnalysis.reduce((sum, r) => sum + r.cfm, 0);
  const totalPower = totalHVACPower(hvacElements.filter(e => e.element_type === 'ac_unit'));

  return {
    rooms: roomAnalysis,
    totalTonnage: Math.round(totalTonnage * 100) / 100,
    totalCFM: Math.round(totalCFM),
    totalPower_kW: Math.round(totalPower * 100) / 100,
    hvacElementCount: hvacElements.length,
  };
}

export { COOLING_LOAD_FACTORS, AC_SPECIFICATIONS, ACH_REQUIREMENTS, DUCT_VELOCITY };
