// ═══════════════════════════════════════════════════════════════
// Solar System Calculations
// ═══════════════════════════════════════════════════════════════

// Peak Sun Hours by Indian city (kWh/m²/day annual average)
const PEAK_SUN_HOURS = {
  chennai: 5.5,
  mumbai: 5.2,
  delhi: 5.6,
  bangalore: 5.4,
  hyderabad: 5.8,
  pune: 5.5,
  ahmedabad: 5.9,
  kolkata: 4.8,
  jaipur: 6.0,
  lucknow: 5.2,
  coimbatore: 5.6,
  kochi: 5.0,
  visakhapatnam: 5.5,
  bhopal: 5.7,
  nagpur: 5.8,
  default: 5.5,
};

// Standard panel specifications
const PANEL_SPECS = {
  standard_330: { wattage: 330, efficiency: 0.195, area_sqm: 1.7, voltage: 40.5, current: 8.15, weight_kg: 18, cost_inr: 12000 },
  standard_400: { wattage: 400, efficiency: 0.205, area_sqm: 1.95, voltage: 41.2, current: 9.71, weight_kg: 21, cost_inr: 14000 },
  standard_440: { wattage: 440, efficiency: 0.21, area_sqm: 2.1, voltage: 41.5, current: 10.6, weight_kg: 23, cost_inr: 15500 },
  standard_540: { wattage: 540, efficiency: 0.21, area_sqm: 2.57, voltage: 42.0, current: 12.86, weight_kg: 28, cost_inr: 18000 },
  bifacial_440: { wattage: 440, efficiency: 0.22, area_sqm: 2.1, voltage: 41.5, current: 10.6, weight_kg: 25, cost_inr: 18000 },
  bifacial_540: { wattage: 540, efficiency: 0.22, area_sqm: 2.57, voltage: 42.0, current: 12.86, weight_kg: 30, cost_inr: 22000 },
};

// System losses
const SYSTEM_LOSSES = {
  soiling: 0.02,
  shading: 0.03,
  wiring: 0.02,
  connection: 0.005,
  mismatch: 0.02,
  inverter_efficiency: 0.04,
  temperature: 0.05,
  degradation_year1: 0.02,
  degradation_annual: 0.005,
  total_first_year: 0.165, // ~16.5% total losses
};

// Electricity tariff (₹/kWh) by type
const ELECTRICITY_TARIFFS = {
  residential: 7.5,
  commercial: 10.0,
  industrial: 8.5,
};

/**
 * Calculate maximum panel count from roof area
 */
export function maxPanelCount(roofArea_sqm, panelType = 'standard_440', usablePercent = 0.65) {
  const panel = PANEL_SPECS[panelType] || PANEL_SPECS.standard_440;
  const usableArea = roofArea_sqm * usablePercent; // Account for setbacks, shadows, obstructions
  return Math.floor(usableArea / panel.area_sqm);
}

/**
 * System capacity
 */
export function systemCapacity(panelCount, panelType = 'standard_440') {
  const panel = PANEL_SPECS[panelType] || PANEL_SPECS.standard_440;
  const totalWp = panelCount * panel.wattage;
  return {
    totalWp,
    totalKWp: Math.round(totalWp / 100) / 10,
    panelArea_sqm: Math.round(panelCount * panel.area_sqm * 100) / 100,
    totalWeight_kg: panelCount * panel.weight_kg,
  };
}

/**
 * Annual energy generation estimate
 * E = P × PSH × 365 × (1 - losses)
 */
export function annualGeneration(systemKWp, city = 'chennai') {
  const psh = PEAK_SUN_HOURS[city.toLowerCase()] || PEAK_SUN_HOURS.default;
  const losses = SYSTEM_LOSSES.total_first_year;
  const dailyKWh = systemKWp * psh * (1 - losses);
  const annualKWh = dailyKWh * 365;
  const monthlyKWh = annualKWh / 12;

  return {
    psh,
    losses_percent: Math.round(losses * 100),
    daily_kWh: Math.round(dailyKWh * 10) / 10,
    monthly_kWh: Math.round(monthlyKWh),
    annual_kWh: Math.round(annualKWh),
    specific_yield: Math.round(annualKWh / systemKWp), // kWh/kWp/year
  };
}

/**
 * 25-year generation projection with annual degradation
 */
export function generationProjection(systemKWp, city = 'chennai', years = 25) {
  const psh = PEAK_SUN_HOURS[city.toLowerCase()] || PEAK_SUN_HOURS.default;
  const baseLosses = SYSTEM_LOSSES.total_first_year;
  const annualDeg = SYSTEM_LOSSES.degradation_annual;
  const projection = [];
  let cumulative = 0;

  for (let y = 1; y <= years; y++) {
    const degradation = y === 1 ? SYSTEM_LOSSES.degradation_year1 : annualDeg;
    const effectiveCapacity = systemKWp * Math.pow(1 - annualDeg, y - 1);
    const annual = effectiveCapacity * psh * (1 - baseLosses + SYSTEM_LOSSES.degradation_year1) * 365;
    cumulative += annual;
    projection.push({ year: y, annual_kWh: Math.round(annual), cumulative_kWh: Math.round(cumulative), capacity_kWp: Math.round(effectiveCapacity * 100) / 100 });
  }

  return projection;
}

/**
 * Inverter sizing
 * Inverter capacity = System kWp × 1.0 to 1.2
 */
export function inverterSizing(systemKWp) {
  const minSize = systemKWp * 1.0;
  const recommendedSize = systemKWp * 1.1;
  // Standard inverter sizes
  const standardSizes = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25, 30, 50, 100];
  const selected = standardSizes.find(s => s >= recommendedSize) || standardSizes[standardSizes.length - 1];

  return {
    min_kW: Math.round(minSize * 10) / 10,
    recommended_kW: Math.round(recommendedSize * 10) / 10,
    selected_kW: selected,
    type: selected <= 5 ? 'String Inverter' : selected <= 25 ? 'String Inverter (3-phase)' : 'Central Inverter',
  };
}

/**
 * Battery sizing (for off-grid / hybrid)
 * Battery kWh = Daily consumption × Backup days × DoD
 */
export function batterySizing(dailyConsumption_kWh, backupDays = 1, depthOfDischarge = 0.8) {
  const capacity = (dailyConsumption_kWh * backupDays) / depthOfDischarge;
  return {
    capacity_kWh: Math.round(capacity * 10) / 10,
    dod: depthOfDischarge,
    backupDays,
    battery_48V_Ah: Math.round(capacity * 1000 / 48), // 48V system
    estimated_cost: Math.round(capacity * 10000), // ~₹10,000/kWh for lithium
  };
}

/**
 * Financial analysis — ROI, payback, savings
 */
export function financialAnalysis(systemKWp, annualGeneration_kWh, panelCount, panelType = 'standard_440', buildingType = 'residential') {
  const panel = PANEL_SPECS[panelType] || PANEL_SPECS.standard_440;
  const tariff = ELECTRICITY_TARIFFS[buildingType] || 7.5;
  const tariffEscalation = 0.05; // 5% annual increase

  // System cost breakdown
  const panelCost = panelCount * panel.cost_inr;
  const inverterCost = systemKWp * 5000; // ₹5000/kWp
  const structureCost = systemKWp * 4000; // ₹4000/kWp
  const wiringCost = systemKWp * 2000;
  const installationCost = systemKWp * 3000;
  const totalCost = panelCost + inverterCost + structureCost + wiringCost + installationCost;
  const costPerWp = Math.round(totalCost / (systemKWp * 1000) * 100) / 100;

  // Annual savings
  const annualSavings = annualGeneration_kWh * tariff;
  const paybackYears = totalCost / annualSavings;

  // 25-year savings with tariff escalation
  let totalSavings25 = 0;
  for (let y = 0; y < 25; y++) {
    totalSavings25 += annualGeneration_kWh * tariff * Math.pow(1 + tariffEscalation, y);
  }

  // CO₂ offset
  const co2_offset_kg = annualGeneration_kWh * 0.82; // India grid factor

  return {
    cost: {
      panels: panelCost,
      inverter: inverterCost,
      structure: structureCost,
      wiring: wiringCost,
      installation: installationCost,
      total: totalCost,
      perWp: costPerWp,
    },
    savings: {
      annual_inr: Math.round(annualSavings),
      monthly_inr: Math.round(annualSavings / 12),
      total_25yr_inr: Math.round(totalSavings25),
      roi_percent: Math.round((totalSavings25 - totalCost) / totalCost * 100),
    },
    payback_years: Math.round(paybackYears * 10) / 10,
    co2_offset_kg_year: Math.round(co2_offset_kg),
    co2_offset_tons_25yr: Math.round(co2_offset_kg * 25 / 1000 * 10) / 10,
    trees_equivalent: Math.round(co2_offset_kg / 22), // ~22kg CO₂ per tree per year
  };
}

/**
 * Complete solar system design summary
 */
export function solarSystemSummary(roofArea_sqm, city = 'chennai', panelType = 'standard_440', buildingType = 'residential') {
  const panels = maxPanelCount(roofArea_sqm, panelType);
  const capacity = systemCapacity(panels, panelType);
  const gen = annualGeneration(capacity.totalKWp, city);
  const inverter = inverterSizing(capacity.totalKWp);
  const financial = financialAnalysis(capacity.totalKWp, gen.annual_kWh, panels, panelType, buildingType);

  return {
    roofArea_sqm,
    usableArea_sqm: Math.round(roofArea_sqm * 0.65 * 100) / 100,
    panelCount: panels,
    panelType,
    ...capacity,
    generation: gen,
    inverter,
    financial,
  };
}

export { PEAK_SUN_HOURS, PANEL_SPECS, SYSTEM_LOSSES, ELECTRICITY_TARIFFS };
