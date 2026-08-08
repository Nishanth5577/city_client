// ═══════════════════════════════════════════════════════════════
// Plumbing Engineering Calculations — IS 2065
// ═══════════════════════════════════════════════════════════════

// Fixture Units (as per IS 2065 / Uniform Plumbing Code)
const FIXTURE_UNITS = {
  toilet: { fu_supply: 3, fu_drain: 4, hot: false },
  sink_kitchen: { fu_supply: 2, fu_drain: 2, hot: true },
  sink_wash: { fu_supply: 1, fu_drain: 1, hot: true },
  wash_basin: { fu_supply: 1, fu_drain: 1, hot: true },
  bathtub: { fu_supply: 3, fu_drain: 2, hot: true },
  shower: { fu_supply: 2, fu_drain: 2, hot: true },
  washing_machine: { fu_supply: 3, fu_drain: 2, hot: true },
  dishwasher: { fu_supply: 2, fu_drain: 2, hot: true },
  urinal: { fu_supply: 2, fu_drain: 4, hot: false },
  floor_trap: { fu_supply: 0, fu_drain: 2, hot: false },
  bidet: { fu_supply: 1, fu_drain: 1, hot: true },
  water_cooler: { fu_supply: 1, fu_drain: 1, hot: false },
};

// Pipe diameter selection from total fixture units (mm)
const PIPE_SIZE_TABLE = {
  supply: [
    { maxFU: 3, diameter: 15 },
    { maxFU: 6, diameter: 20 },
    { maxFU: 12, diameter: 25 },
    { maxFU: 25, diameter: 32 },
    { maxFU: 50, diameter: 40 },
    { maxFU: 100, diameter: 50 },
    { maxFU: 200, diameter: 65 },
    { maxFU: 500, diameter: 80 },
    { maxFU: 1000, diameter: 100 },
  ],
  drain: [
    { maxFU: 6, diameter: 40 },
    { maxFU: 12, diameter: 50 },
    { maxFU: 20, diameter: 75 },
    { maxFU: 100, diameter: 100 },
    { maxFU: 350, diameter: 150 },
    { maxFU: 1000, diameter: 200 },
  ],
};

// Water demand per capita (liters per capita per day) — IS 1172
const WATER_DEMAND = {
  residential: 135,
  residential_luxury: 200,
  commercial_office: 45,
  commercial_retail: 40,
  hospital: 340,
  hotel: 180,
  school: 45,
  hostel: 135,
  industrial: 45,
};

// Pipe materials
const PIPE_MATERIALS = {
  cpvc: { roughness: 0.0015, cost_per_m: 120, max_temp: 93, pressure_class: 'SDR 11' },
  upvc: { roughness: 0.0015, cost_per_m: 80, max_temp: 60, pressure_class: 'Class 1' },
  ppr: { roughness: 0.007, cost_per_m: 150, max_temp: 95, pressure_class: 'PN 20' },
  gi: { roughness: 0.15, cost_per_m: 200, max_temp: 100, pressure_class: 'Medium' },
  ci: { roughness: 0.26, cost_per_m: 350, max_temp: 100, pressure_class: 'Class LA' },
  hdpe: { roughness: 0.007, cost_per_m: 100, max_temp: 60, pressure_class: 'PE 100' },
};

/**
 * Calculate total fixture units for a floor
 */
export function totalFixtureUnits(fixtures) {
  return fixtures.reduce((sum, f) => {
    const fu = FIXTURE_UNITS[f.element_type] || { fu_supply: 1, fu_drain: 1 };
    return {
      supply: sum.supply + fu.fu_supply,
      drain: sum.drain + fu.fu_drain,
      count: sum.count + 1,
      hot: sum.hot + (fu.hot ? 1 : 0),
    };
  }, { supply: 0, drain: 0, count: 0, hot: 0 });
}

/**
 * Select pipe diameter based on fixture units
 */
export function selectPipeSize(fixtureUnits, type = 'supply') {
  const table = PIPE_SIZE_TABLE[type] || PIPE_SIZE_TABLE.supply;
  const entry = table.find(e => e.maxFU >= fixtureUnits);
  return entry ? entry.diameter : table[table.length - 1].diameter;
}

/**
 * Water demand calculation
 */
export function waterDemand(occupants, buildingType = 'residential') {
  const lpcd = WATER_DEMAND[buildingType] || 135;
  const dailyDemand = occupants * lpcd;
  return {
    lpcd,
    daily_liters: dailyDemand,
    daily_kl: Math.round(dailyDemand / 100) / 10,
    monthly_kl: Math.round(dailyDemand * 30 / 100) / 10,
  };
}

/**
 * Overhead tank sizing
 * Capacity = daily demand × storage factor (1.5 days for residential)
 */
export function tankSizing(dailyDemand_liters, storageFactor = 1.5) {
  const capacity = dailyDemand_liters * storageFactor;
  // Standard tank dimensions (approx. cuboid)
  const volume_m3 = capacity / 1000;
  const side = Math.cbrt(volume_m3);
  return {
    capacity_liters: Math.round(capacity),
    capacity_kl: Math.round(capacity / 100) / 10,
    volume_m3: Math.round(volume_m3 * 100) / 100,
    suggested_dims: {
      length_m: Math.round(side * 1.5 * 10) / 10,
      width_m: Math.round(side * 10) / 10,
      depth_m: Math.round(side * 10) / 10,
    },
  };
}

/**
 * Sump tank sizing (underground)
 * Typically 2x overhead tank capacity
 */
export function sumpSizing(dailyDemand_liters) {
  return tankSizing(dailyDemand_liters, 2.0);
}

/**
 * Septic tank sizing — IS 2470
 * Capacity = A + B × P
 * A = 1000 liters (sludge space)
 * B = 130 liters per person (liquid volume)
 */
export function septicTankSizing(occupants) {
  const capacity = 1000 + 130 * occupants;
  const volume_m3 = capacity / 1000;
  return {
    capacity_liters: Math.round(capacity),
    volume_m3: Math.round(volume_m3 * 100) / 100,
    length_m: Math.round(Math.cbrt(volume_m3) * 2 * 10) / 10,
    width_m: Math.round(Math.cbrt(volume_m3) * 10) / 10,
    depth_m: Math.round(Math.cbrt(volume_m3) * 1.2 * 10) / 10,
    desludging_interval: '2 years',
  };
}

/**
 * Pressure drop estimation (Hazen-Williams)
 * h = (10.67 × Q^1.852 × L) / (C^1.852 × D^4.87)
 * Simplified for typical residential use
 */
export function pressureDrop(flow_lps, pipe_diameter_mm, length_m, material = 'cpvc') {
  const C = { cpvc: 150, upvc: 150, ppr: 140, gi: 120, ci: 100 }[material] || 140;
  const D = pipe_diameter_mm / 1000; // to meters
  const Q = flow_lps / 1000; // to m³/s
  const h = (10.67 * Math.pow(Q, 1.852) * length_m) / (Math.pow(C, 1.852) * Math.pow(D, 4.87));
  return { drop_m: Math.round(h * 100) / 100, drop_per_100m: Math.round(h / length_m * 100 * 100) / 100 };
}

/**
 * Pump head calculation
 * Total head = static head + friction head + residual pressure
 */
export function pumpHead(buildingHeight_m, pipeLength_m, pipeDiameter_mm, flow_lps) {
  const staticHead = buildingHeight_m + 3; // +3m for tank above roof
  const frictionHead = pressureDrop(flow_lps, pipeDiameter_mm, pipeLength_m).drop_m;
  const residualPressure = 7; // 7m minimum at top floor
  const totalHead = staticHead + frictionHead + residualPressure;
  // Pump power: P = (Q × H × ρ × g) / (η × 1000)
  const efficiency = 0.6;
  const power_kW = (flow_lps * totalHead * 9.81) / (efficiency * 1000);
  const power_HP = power_kW / 0.746;

  return {
    static_head_m: Math.round(staticHead * 10) / 10,
    friction_head_m: Math.round(frictionHead * 10) / 10,
    residual_m: residualPressure,
    total_head_m: Math.round(totalHead * 10) / 10,
    power_kW: Math.round(power_kW * 100) / 100,
    power_HP: Math.ceil(power_HP * 2) / 2, // Round up to nearest 0.5 HP
  };
}

/**
 * Generate complete plumbing summary for a floor
 */
export function floorPlumbingSummary(fixtures, occupants, buildingType = 'residential', buildingHeight_m = 9) {
  const fu = totalFixtureUnits(fixtures);
  const supplyPipe = selectPipeSize(fu.supply, 'supply');
  const drainPipe = selectPipeSize(fu.drain, 'drain');
  const demand = waterDemand(occupants, buildingType);
  const oht = tankSizing(demand.daily_liters);
  const sump = sumpSizing(demand.daily_liters);
  const septic = septicTankSizing(occupants);
  const pump = pumpHead(buildingHeight_m, buildingHeight_m * 3, supplyPipe, 0.5);

  return {
    fixtureUnits: fu,
    mainSupplyPipe_mm: supplyPipe,
    mainDrainPipe_mm: drainPipe,
    waterDemand: demand,
    overheadTank: oht,
    sumpTank: sump,
    septicTank: septic,
    pumpSpec: pump,
    fixtureCount: fixtures.length,
    hotWaterFixtures: fu.hot,
  };
}

export { FIXTURE_UNITS, PIPE_SIZE_TABLE, WATER_DEMAND, PIPE_MATERIALS };
