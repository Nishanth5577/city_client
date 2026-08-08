// ═══════════════════════════════════════════════════════════════
// Electrical Engineering Calculations — IS 732, IS 3043
// ═══════════════════════════════════════════════════════════════

// Standard wattages for common items
const FIXTURE_WATTAGES = {
  tube_light_led: 18,
  tube_light_fl: 36,
  bulb_led: 9,
  bulb_cfl: 23,
  bulb_incandescent: 60,
  ceiling_fan: 75,
  exhaust_fan: 40,
  ac_split_1ton: 1200,
  ac_split_1_5ton: 1800,
  ac_split_2ton: 2400,
  ac_window_1_5ton: 2000,
  geyser: 2000,
  washing_machine: 500,
  refrigerator: 200,
  microwave: 1200,
  iron: 1000,
  tv_led: 100,
  computer: 300,
  water_pump_0_5hp: 373,
  water_pump_1hp: 746,
  switch_socket_5a: 100,
  switch_socket_15a: 1000,
  switch_socket_20a: 2000,
};

// IS 732 — Cable current carrying capacity (Amps)
// For PVC insulated copper cables in conduit at 40°C ambient
const CABLE_RATINGS = [
  { size_sqmm: 1.0, amps: 11, usage: 'Lighting sub-circuit' },
  { size_sqmm: 1.5, amps: 14, usage: 'Lighting sub-circuit' },
  { size_sqmm: 2.5, amps: 19, usage: 'Power socket 5A circuit' },
  { size_sqmm: 4.0, amps: 26, usage: 'Power socket 15A circuit' },
  { size_sqmm: 6.0, amps: 33, usage: 'AC/Geyser circuit' },
  { size_sqmm: 10.0, amps: 46, usage: 'Sub-main / heavy loads' },
  { size_sqmm: 16.0, amps: 61, usage: 'Sub-main' },
  { size_sqmm: 25.0, amps: 80, usage: 'Main supply' },
  { size_sqmm: 35.0, amps: 100, usage: 'Main supply' },
  { size_sqmm: 50.0, amps: 125, usage: 'Main supply / HT' },
  { size_sqmm: 70.0, amps: 155, usage: 'Main supply / HT' },
  { size_sqmm: 95.0, amps: 190, usage: 'Main supply / HT' },
];

// MCB Ratings (Amps)
const MCB_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63];

// Diversity factors (IS 732)
const DIVERSITY_FACTORS = {
  residential_lighting: 0.7,
  residential_power: 0.5,
  commercial_lighting: 0.9,
  commercial_power: 0.7,
  industrial: 0.8,
};

/**
 * Calculate connected load for a list of elements
 */
export function connectedLoad(elements) {
  return elements.reduce((sum, el) => sum + (el.wattage || 0), 0);
}

/**
 * Calculate demand load with diversity factor
 */
export function demandLoad(connected_watts, buildingType = 'residential', circuitType = 'power') {
  const key = `${buildingType}_${circuitType}`;
  const df = DIVERSITY_FACTORS[key] || 0.7;
  return { connected: connected_watts, diversity: df, demand: connected_watts * df };
}

/**
 * Calculate current from power
 * Single phase: I = P / (V × PF)
 * Three phase: I = P / (√3 × V × PF)
 */
export function currentFromPower(watts, voltage = 230, powerFactor = 0.85, threePhase = false) {
  if (threePhase) {
    return watts / (Math.sqrt(3) * voltage * powerFactor);
  }
  return watts / (voltage * powerFactor);
}

/**
 * Select cable size based on current
 */
export function selectCableSize(current_amps) {
  const cable = CABLE_RATINGS.find(c => c.amps >= current_amps * 1.25); // 25% margin
  return cable || CABLE_RATINGS[CABLE_RATINGS.length - 1];
}

/**
 * Select MCB rating
 */
export function selectMCB(current_amps) {
  const rating = MCB_RATINGS.find(r => r >= current_amps * 1.25);
  return rating || MCB_RATINGS[MCB_RATINGS.length - 1];
}

/**
 * Voltage drop calculation
 * Vd = (2 × I × L × ρ) / A
 * ρ for copper = 0.0175 Ω·mm²/m
 */
export function voltageDrop(current_amps, length_m, cableSize_sqmm, voltage = 230) {
  const rho = 0.0175; // copper resistivity
  const vd = (2 * current_amps * length_m * rho) / cableSize_sqmm;
  const vdPercent = (vd / voltage) * 100;
  return { drop_volts: Math.round(vd * 100) / 100, drop_percent: Math.round(vdPercent * 100) / 100, acceptable: vdPercent <= 3 };
}

/**
 * Cable length estimation from wire route coordinates
 */
export function estimateCableLength(wireRoute) {
  if (!wireRoute || wireRoute.length < 2) return 0;
  let length = 0;
  for (let i = 1; i < wireRoute.length; i++) {
    const dx = wireRoute[i].x - wireRoute[i - 1].x;
    const dy = wireRoute[i].y - wireRoute[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length; // in mm
}

/**
 * Circuit load analysis — group elements by circuit
 */
export function circuitAnalysis(elements) {
  const circuits = {};
  elements.forEach(el => {
    const circuit = el.circuit_number || 'unassigned';
    if (!circuits[circuit]) {
      circuits[circuit] = { elements: [], totalWatts: 0, current: 0, cable: null, mcb: null };
    }
    circuits[circuit].elements.push(el);
    circuits[circuit].totalWatts += el.wattage || 0;
  });

  Object.keys(circuits).forEach(key => {
    const c = circuits[key];
    c.current = currentFromPower(c.totalWatts);
    c.cable = selectCableSize(c.current);
    c.mcb = selectMCB(c.current);
  });

  return circuits;
}

/**
 * Total electrical summary for a floor
 */
export function floorElectricalSummary(elements, buildingType = 'residential') {
  const total = connectedLoad(elements);
  const demand = demandLoad(total, buildingType);
  const current = currentFromPower(demand.demand);
  const mainCable = selectCableSize(current);
  const mainMCB = selectMCB(current);
  const circuits = circuitAnalysis(elements);

  return {
    connectedLoad_W: total,
    connectedLoad_kW: Math.round(total / 100) / 10,
    demandLoad_W: demand.demand,
    demandLoad_kW: Math.round(demand.demand / 100) / 10,
    diversityFactor: demand.diversity,
    totalCurrent_A: Math.round(current * 10) / 10,
    mainCable: mainCable,
    mainMCB: mainMCB,
    numCircuits: Object.keys(circuits).length,
    circuits,
    elementCount: elements.length,
  };
}

export { FIXTURE_WATTAGES, CABLE_RATINGS, MCB_RATINGS, DIVERSITY_FACTORS };
