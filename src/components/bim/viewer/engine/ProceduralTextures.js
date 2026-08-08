// ═══════════════════════════════════════════════════════════════
// Procedural PBR Texture Generator
// Generates albedo + normal + roughness maps via Canvas2D
// No external image files required — works entirely offline
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';

const TEX_SIZE = 512;
const cache = new Map();

// ─── Core Helpers ──────────────────────────────────────────────
function createCanvas(w = TEX_SIZE, h = TEX_SIZE) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function noise(ctx, w, h, alpha = 0.06) {
  const id = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = (Math.random() - 0.5) * 255 * alpha;
    id.data[i] += v; id.data[i + 1] += v; id.data[i + 2] += v;
  }
  ctx.putImageData(id, 0, 0);
}

function toTexture(canvas, repeat = [4, 4]) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.needsUpdate = true;
  return tex;
}

function generateNormalFromHeight(canvas, strength = 1.5) {
  const w = canvas.width, h = canvas.height;
  const srcCtx = canvas.getContext('2d');
  const src = srcCtx.getImageData(0, 0, w, h).data;
  const nCanvas = createCanvas(w, h);
  const nCtx = nCanvas.getContext('2d');
  const nImg = nCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const l = src[((y * w + ((x - 1 + w) % w)) * 4)] / 255;
      const r = src[((y * w + ((x + 1) % w)) * 4)] / 255;
      const t = src[((((y - 1 + h) % h) * w + x) * 4)] / 255;
      const b = src[((((y + 1) % h) * w + x) * 4)] / 255;
      const dx = (l - r) * strength;
      const dy = (t - b) * strength;
      nImg.data[idx] = ((dx + 1) * 0.5) * 255;
      nImg.data[idx + 1] = ((dy + 1) * 0.5) * 255;
      nImg.data[idx + 2] = 255;
      nImg.data[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);
  return nCanvas;
}

// ─── Brick Texture ─────────────────────────────────────────────
function genBrick() {
  const s = TEX_SIZE;
  // Albedo
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  // Mortar background
  ax.fillStyle = '#A09080';
  ax.fillRect(0, 0, s, s);

  const brickW = s / 4, brickH = s / 8, mortarW = 4;
  const colors = ['#B85C38', '#C76B4A', '#A0503A', '#D47B5A', '#8E4430', '#C26842'];

  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 5; col++) {
      const bx = col * brickW + offset + mortarW / 2;
      const by = row * brickH + mortarW / 2;
      const bw = brickW - mortarW;
      const bh = brickH - mortarW;
      ax.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ax.fillRect(bx, by, bw, bh);
      // Subtle variation
      ax.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
      ax.fillRect(bx, by, bw, bh);
    }
  }
  noise(ax, s, s, 0.04);

  // Roughness (bricks smooth-ish, mortar rough)
  const rc = createCanvas(s, s);
  const rx = rc.getContext('2d');
  rx.fillStyle = '#FFFFFF'; // mortar = rough
  rx.fillRect(0, 0, s, s);
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 5; col++) {
      rx.fillStyle = '#B0B0B0'; // brick = less rough
      rx.fillRect(col * brickW + offset + mortarW / 2, row * brickH + mortarW / 2, brickW - mortarW, brickH - mortarW);
    }
  }

  const nc = generateNormalFromHeight(ac, 2.0);

  return {
    map: toTexture(ac, [3, 3]),
    normalMap: toTexture(nc, [3, 3]),
    roughnessMap: toTexture(rc, [3, 3]),
    roughness: 0.85,
    metalness: 0.0,
  };
}

// ─── Concrete Texture ──────────────────────────────────────────
function genConcrete() {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  ax.fillStyle = '#B8B0A8';
  ax.fillRect(0, 0, s, s);
  // Surface variation
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const r = Math.random() * 3 + 0.5;
    ax.fillStyle = `rgba(${120 + Math.random() * 40}, ${110 + Math.random() * 40}, ${100 + Math.random() * 40}, 0.3)`;
    ax.beginPath(); ax.arc(x, y, r, 0, Math.PI * 2); ax.fill();
  }
  noise(ax, s, s, 0.05);

  // Subtle form lines
  for (let i = 0; i < 5; i++) {
    const y = Math.random() * s;
    ax.strokeStyle = `rgba(0,0,0,0.03)`;
    ax.lineWidth = 1;
    ax.beginPath(); ax.moveTo(0, y); ax.lineTo(s, y + (Math.random() - 0.5) * 10); ax.stroke();
  }

  const nc = generateNormalFromHeight(ac, 0.8);

  return {
    map: toTexture(ac, [2, 2]),
    normalMap: toTexture(nc, [2, 2]),
    roughness: 0.92,
    metalness: 0.0,
  };
}

// ─── Wood Texture ──────────────────────────────────────────────
function genWood(variant = 'oak') {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');

  const baseColors = {
    oak: [160, 120, 70],
    walnut: [90, 60, 35],
    teak: [140, 95, 50],
    pine: [190, 160, 110],
  };
  const [br, bg, bb] = baseColors[variant] || baseColors.oak;

  ax.fillStyle = `rgb(${br},${bg},${bb})`;
  ax.fillRect(0, 0, s, s);

  // Wood grain lines
  for (let i = 0; i < 60; i++) {
    const y = (i / 60) * s + (Math.random() - 0.5) * 8;
    const variation = Math.random() * 0.15 - 0.075;
    ax.strokeStyle = `rgba(${br * (0.7 + variation)}, ${bg * (0.7 + variation)}, ${bb * (0.7 + variation)}, 0.4)`;
    ax.lineWidth = 1 + Math.random() * 2;
    ax.beginPath();
    ax.moveTo(0, y);
    for (let x = 0; x < s; x += 10) {
      ax.lineTo(x, y + Math.sin(x * 0.02 + i) * 3 + (Math.random() - 0.5) * 2);
    }
    ax.stroke();
  }

  // Knot patterns
  for (let k = 0; k < 2; k++) {
    const kx = Math.random() * s, ky = Math.random() * s;
    for (let r = 15; r > 0; r -= 2) {
      ax.fillStyle = `rgba(${br * 0.5}, ${bg * 0.5}, ${bb * 0.5}, ${0.15 - r * 0.008})`;
      ax.beginPath(); ax.arc(kx, ky, r, 0, Math.PI * 2); ax.fill();
    }
  }

  noise(ax, s, s, 0.03);
  const nc = generateNormalFromHeight(ac, 1.0);

  return {
    map: toTexture(ac, [3, 2]),
    normalMap: toTexture(nc, [3, 2]),
    roughness: 0.55,
    metalness: 0.0,
  };
}

// ─── Tile Texture ──────────────────────────────────────────────
function genTiles(tileColor = '#E8E0D8', groutColor = '#A09890', tilesX = 4, tilesY = 4) {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  const groutW = 6;

  ax.fillStyle = groutColor;
  ax.fillRect(0, 0, s, s);

  const tW = s / tilesX, tH = s / tilesY;
  for (let r = 0; r < tilesY; r++) {
    for (let c = 0; c < tilesX; c++) {
      // Slight color variation per tile
      const variation = (Math.random() - 0.5) * 15;
      const tc = tileColor.replace(/[0-9a-f]{2}/gi, (hex) => {
        const v = Math.min(255, Math.max(0, parseInt(hex, 16) + variation));
        return Math.round(v).toString(16).padStart(2, '0');
      });
      ax.fillStyle = tc;
      ax.fillRect(c * tW + groutW / 2, r * tH + groutW / 2, tW - groutW, tH - groutW);
    }
  }
  noise(ax, s, s, 0.02);
  const nc = generateNormalFromHeight(ac, 1.2);

  const rc = createCanvas(s, s);
  const rx = rc.getContext('2d');
  rx.fillStyle = '#E0E0E0'; // grout = rough
  rx.fillRect(0, 0, s, s);
  for (let r = 0; r < tilesY; r++) {
    for (let c = 0; c < tilesX; c++) {
      rx.fillStyle = '#606060'; // tiles = smoother
      rx.fillRect(c * tW + groutW / 2, r * tH + groutW / 2, tW - groutW, tH - groutW);
    }
  }

  return {
    map: toTexture(ac, [2, 2]),
    normalMap: toTexture(nc, [2, 2]),
    roughnessMap: toTexture(rc, [2, 2]),
    roughness: 0.35,
    metalness: 0.05,
  };
}

// ─── Marble Texture ────────────────────────────────────────────
function genMarble(baseColor = '#F0EDE8', veinColor = '#8B8070') {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');

  ax.fillStyle = baseColor;
  ax.fillRect(0, 0, s, s);

  // Veins
  for (let v = 0; v < 12; v++) {
    ax.strokeStyle = `${veinColor}${Math.floor(40 + Math.random() * 30).toString(16)}`;
    ax.lineWidth = 0.5 + Math.random() * 2;
    ax.beginPath();
    let x = Math.random() * s, y = 0;
    ax.moveTo(x, y);
    for (let step = 0; step < s; step += 5) {
      x += (Math.random() - 0.5) * 15;
      y += 5;
      ax.lineTo(x, y);
    }
    ax.stroke();
  }

  // Secondary veins
  for (let v = 0; v < 20; v++) {
    ax.strokeStyle = `${veinColor}20`;
    ax.lineWidth = 0.5 + Math.random();
    ax.beginPath();
    let x = 0, y = Math.random() * s;
    ax.moveTo(x, y);
    for (let step = 0; step < s; step += 8) {
      x += 8;
      y += (Math.random() - 0.5) * 10;
      ax.lineTo(x, y);
    }
    ax.stroke();
  }

  noise(ax, s, s, 0.015);
  const nc = generateNormalFromHeight(ac, 0.5);

  return {
    map: toTexture(ac, [2, 2]),
    normalMap: toTexture(nc, [2, 2]),
    roughness: 0.15,
    metalness: 0.05,
  };
}

// ─── Granite Texture ───────────────────────────────────────────
function genGranite() {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  ax.fillStyle = '#606060';
  ax.fillRect(0, 0, s, s);

  const speckleColors = ['#404040', '#707070', '#808080', '#505050', '#909090', '#353535', '#B0A090'];
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const r = 0.5 + Math.random() * 2.5;
    ax.fillStyle = speckleColors[Math.floor(Math.random() * speckleColors.length)];
    ax.beginPath(); ax.arc(x, y, r, 0, Math.PI * 2); ax.fill();
  }
  noise(ax, s, s, 0.03);
  const nc = generateNormalFromHeight(ac, 0.6);

  return {
    map: toTexture(ac, [2, 2]),
    normalMap: toTexture(nc, [2, 2]),
    roughness: 0.2,
    metalness: 0.08,
  };
}

// ─── Glass Texture ─────────────────────────────────────────────
function genGlass() {
  const s = 128; // Glass doesn't need high res
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  const grd = ax.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.7);
  grd.addColorStop(0, '#D4EAF7');
  grd.addColorStop(1, '#A8D0E6');
  ax.fillStyle = grd;
  ax.fillRect(0, 0, s, s);

  return {
    map: toTexture(ac, [1, 1]),
    roughness: 0.0,
    metalness: 0.1,
    transparent: true,
    opacity: 0.35,
  };
}

// ─── Steel Texture ─────────────────────────────────────────────
function genSteel() {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  ax.fillStyle = '#C0C0C8';
  ax.fillRect(0, 0, s, s);

  // Brushed lines
  for (let i = 0; i < 300; i++) {
    const y = Math.random() * s;
    ax.strokeStyle = `rgba(180,180,190,${0.1 + Math.random() * 0.15})`;
    ax.lineWidth = 0.5;
    ax.beginPath(); ax.moveTo(0, y); ax.lineTo(s, y + (Math.random() - 0.5) * 2); ax.stroke();
  }
  noise(ax, s, s, 0.02);

  return {
    map: toTexture(ac, [2, 2]),
    roughness: 0.25,
    metalness: 0.85,
  };
}

// ─── Grass Texture ─────────────────────────────────────────────
function genGrass() {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  ax.fillStyle = '#3D7A3D';
  ax.fillRect(0, 0, s, s);

  // Grass blades
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const h = 3 + Math.random() * 8;
    const g = 40 + Math.random() * 80;
    ax.strokeStyle = `rgba(${30 + Math.random() * 40}, ${g + 50}, ${20 + Math.random() * 30}, 0.6)`;
    ax.lineWidth = 0.5 + Math.random();
    ax.beginPath();
    ax.moveTo(x, y);
    ax.lineTo(x + (Math.random() - 0.5) * 4, y - h);
    ax.stroke();
  }
  noise(ax, s, s, 0.03);
  const nc = generateNormalFromHeight(ac, 1.0);

  return {
    map: toTexture(ac, [8, 8]),
    normalMap: toTexture(nc, [8, 8]),
    roughness: 0.95,
    metalness: 0.0,
  };
}

// ─── Asphalt Texture ───────────────────────────────────────────
function genAsphalt() {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  ax.fillStyle = '#3A3A3A';
  ax.fillRect(0, 0, s, s);

  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const r = 0.3 + Math.random() * 1.5;
    const v = 30 + Math.random() * 50;
    ax.fillStyle = `rgba(${v},${v},${v},0.4)`;
    ax.beginPath(); ax.arc(x, y, r, 0, Math.PI * 2); ax.fill();
  }
  noise(ax, s, s, 0.04);
  const nc = generateNormalFromHeight(ac, 1.5);

  return {
    map: toTexture(ac, [4, 4]),
    normalMap: toTexture(nc, [4, 4]),
    roughness: 0.95,
    metalness: 0.0,
  };
}

// ─── Plaster / White Wall ──────────────────────────────────────
function genPlaster(color = '#F5F0E8') {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  ax.fillStyle = color;
  ax.fillRect(0, 0, s, s);

  // Subtle texture bumps
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const r = 0.5 + Math.random() * 2;
    ax.fillStyle = `rgba(200,195,185,${Math.random() * 0.06})`;
    ax.beginPath(); ax.arc(x, y, r, 0, Math.PI * 2); ax.fill();
  }
  noise(ax, s, s, 0.02);
  const nc = generateNormalFromHeight(ac, 0.4);

  return {
    map: toTexture(ac, [3, 3]),
    normalMap: toTexture(nc, [3, 3]),
    roughness: 0.85,
    metalness: 0.0,
  };
}

// ─── Paint ─────────────────────────────────────────────────────
function genPaint(color = '#F0EDE5') {
  const s = 256;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  ax.fillStyle = color;
  ax.fillRect(0, 0, s, s);
  // Subtle roller texture
  for (let y = 0; y < s; y += 2) {
    ax.strokeStyle = `rgba(0,0,0,${Math.random() * 0.015})`;
    ax.lineWidth = 1;
    ax.beginPath(); ax.moveTo(0, y); ax.lineTo(s, y); ax.stroke();
  }
  noise(ax, s, s, 0.01);

  return {
    map: toTexture(ac, [4, 4]),
    roughness: 0.7,
    metalness: 0.0,
  };
}

// ─── Ceramic (Bathroom) ────────────────────────────────────────
function genCeramic() {
  return {
    ...genTiles('#FFFFFF', '#E0E0E0', 1, 1),
    roughness: 0.1,
    metalness: 0.05,
  };
}

// ─── Fabric ────────────────────────────────────────────────────
function genFabric(color = '#6B5B4F') {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  ax.fillStyle = color;
  ax.fillRect(0, 0, s, s);

  // Weave pattern
  for (let y = 0; y < s; y += 3) {
    for (let x = 0; x < s; x += 3) {
      const isDark = ((x + y) / 3) % 2 === 0;
      ax.fillStyle = isDark ? `rgba(0,0,0,0.06)` : `rgba(255,255,255,0.04)`;
      ax.fillRect(x, y, 2, 2);
    }
  }
  noise(ax, s, s, 0.03);
  const nc = generateNormalFromHeight(ac, 0.6);

  return {
    map: toTexture(ac, [4, 4]),
    normalMap: toTexture(nc, [4, 4]),
    roughness: 0.9,
    metalness: 0.0,
  };
}

// ─── Roof Tile ─────────────────────────────────────────────────
function genRoofTile() {
  const s = TEX_SIZE;
  const ac = createCanvas(s, s);
  const ax = ac.getContext('2d');
  ax.fillStyle = '#8B4513';
  ax.fillRect(0, 0, s, s);

  const tileH = s / 6;
  for (let row = 0; row < 6; row++) {
    const offset = (row % 2) * (s / 4);
    for (let col = -1; col < 5; col++) {
      const tx = col * (s / 3) + offset;
      const ty = row * tileH;
      // Tile curve
      const grd = ax.createLinearGradient(tx, ty, tx, ty + tileH);
      grd.addColorStop(0, `rgba(0,0,0,0.15)`);
      grd.addColorStop(0.5, `rgba(0,0,0,0)`);
      grd.addColorStop(1, `rgba(0,0,0,0.1)`);
      ax.fillStyle = grd;
      ax.fillRect(tx, ty, s / 3, tileH);
      // Variation
      ax.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0},0,0,${Math.random() * 0.04})`;
      ax.fillRect(tx + 2, ty + 2, s / 3 - 4, tileH - 4);
    }
  }
  noise(ax, s, s, 0.04);
  const nc = generateNormalFromHeight(ac, 2.0);

  return {
    map: toTexture(ac, [4, 4]),
    normalMap: toTexture(nc, [4, 4]),
    roughness: 0.8,
    metalness: 0.0,
  };
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

const GENERATORS = {
  brick: genBrick,
  concrete: genConcrete,
  wood: () => genWood('oak'),
  wood_oak: () => genWood('oak'),
  wood_walnut: () => genWood('walnut'),
  wood_teak: () => genWood('teak'),
  wood_pine: () => genWood('pine'),
  tiles: () => genTiles('#E8E0D8', '#A09890', 4, 4),
  tiles_white: () => genTiles('#FFFFFF', '#E0E0E0', 4, 4),
  tiles_bathroom: () => genTiles('#D0E8F0', '#90A0A8', 6, 6),
  tiles_kitchen: () => genTiles('#F0E8D8', '#B0A090', 3, 3),
  marble: () => genMarble(),
  marble_white: () => genMarble('#FAFAFA', '#C0B8B0'),
  marble_black: () => genMarble('#2A2A2A', '#404040'),
  granite: genGranite,
  glass: genGlass,
  steel: genSteel,
  grass: genGrass,
  asphalt: genAsphalt,
  plaster: () => genPlaster('#F5F0E8'),
  plaster_white: () => genPlaster('#FFFFFF'),
  plaster_cream: () => genPlaster('#FFF8E8'),
  paint_white: () => genPaint('#FFFFFF'),
  paint_cream: () => genPaint('#FFF8E1'),
  paint_grey: () => genPaint('#E0E0E0'),
  paint_blue: () => genPaint('#D0E4F0'),
  paint_green: () => genPaint('#D8E8D0'),
  paint_peach: () => genPaint('#FFE8D8'),
  ceramic: genCeramic,
  fabric_brown: () => genFabric('#6B5B4F'),
  fabric_grey: () => genFabric('#707070'),
  fabric_blue: () => genFabric('#4A6080'),
  fabric_beige: () => genFabric('#C8B898'),
  roof_tile: genRoofTile,
};

/**
 * Get PBR material properties for a named texture.
 * Returns { map, normalMap, roughnessMap?, roughness, metalness, ... }
 * Results are cached — call as many times as needed.
 */
export function getProceduralMaterial(name) {
  if (cache.has(name)) return cache.get(name);
  const gen = GENERATORS[name];
  if (!gen) return null;
  const result = gen();
  cache.set(name, result);
  return result;
}

/**
 * Get list of all available texture names.
 */
export function getTextureNames() {
  return Object.keys(GENERATORS);
}

/**
 * Pre-warm cache for commonly used textures.
 */
export function preloadTextures(names) {
  (names || ['brick', 'concrete', 'plaster', 'tiles', 'wood', 'glass', 'grass']).forEach(n => getProceduralMaterial(n));
}

/**
 * Clear texture cache (for memory management).
 */
export function clearTextureCache() {
  cache.forEach(entry => {
    if (entry.map) entry.map.dispose();
    if (entry.normalMap) entry.normalMap.dispose();
    if (entry.roughnessMap) entry.roughnessMap.dispose();
  });
  cache.clear();
}

export default { getProceduralMaterial, getTextureNames, preloadTextures, clearTextureCache };
