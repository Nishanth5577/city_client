// ═══════════════════════════════════════════════════════════════
// ProceduralPBR — Canvas-based PBR texture generation
// Generates diffuse, roughness, and normal maps procedurally
// Zero external dependencies — works immediately
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';

const TEX_SIZE = 512;
const textureCache = new Map();

// ─── Noise Helpers ─────────────────────────────────────────────
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function noise2D(x, y, seed = 42) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, y, seed = 42) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const n00 = noise2D(ix, iy, seed);
  const n10 = noise2D(ix + 1, iy, seed);
  const n01 = noise2D(ix, iy + 1, seed);
  const n11 = noise2D(ix + 1, iy + 1, seed);
  return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy;
}

function fbm(x, y, octaves = 4, seed = 42) {
  let value = 0, amplitude = 0.5, frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency, seed + i * 100);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

// ─── Canvas Texture Creator ────────────────────────────────────
function createCanvasTexture(width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

// ═══════════════════════════════════════════════════════════════
//                 TEXTURE GENERATORS
// ═══════════════════════════════════════════════════════════════

export function createConcreteTextures(seed = 1) {
  const key = `concrete_${seed}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const map = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    ctx.fillStyle = '#B8B0A8';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const n = fbm(x / 60, y / 60, 5, seed);
        const v = Math.floor(168 + n * 40 - 20);
        ctx.fillStyle = `rgb(${v},${v - 5},${v - 10})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    // Form lines
    const rng = seededRandom(seed);
    for (let i = 0; i < 8; i++) {
      const lx = rng() * w;
      const ly = rng() * h;
      ctx.strokeStyle = 'rgba(100,95,90,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + (rng() - 0.5) * 80, ly + (rng() - 0.5) * 80);
      ctx.stroke();
    }
  });

  const roughnessMap = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const n = fbm(x / 40, y / 40, 4, seed + 50);
        const v = Math.floor(180 + n * 60);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  });

  const result = { map, roughnessMap, roughness: 0.85, metalness: 0.0 };
  textureCache.set(key, result);
  return result;
}

export function createBrickTextures(seed = 2) {
  const key = `brick_${seed}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const brickW = 60, brickH = 25, mortarW = 3;
  const map = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    // Mortar background
    ctx.fillStyle = '#C8C0B8';
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(seed);
    for (let row = 0; row < Math.ceil(h / (brickH + mortarW)); row++) {
      const offset = (row % 2) * (brickW / 2 + mortarW / 2);
      for (let col = -1; col < Math.ceil(w / (brickW + mortarW)) + 1; col++) {
        const bx = col * (brickW + mortarW) + offset;
        const by = row * (brickH + mortarW);
        const r = 160 + rng() * 40;
        const g = 60 + rng() * 30;
        const b = 40 + rng() * 20;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(bx, by, brickW, brickH);
        // Subtle texture on brick
        for (let i = 0; i < 5; i++) {
          const nx = bx + rng() * brickW;
          const ny = by + rng() * brickH;
          ctx.fillStyle = `rgba(${r + 20},${g + 10},${b + 10},0.3)`;
          ctx.fillRect(nx, ny, 3, 2);
        }
      }
    }
  });

  const result = { map, roughness: 0.9, metalness: 0.0 };
  textureCache.set(key, result);
  return result;
}

export function createWoodTextures(seed = 3, hue = 30) {
  const key = `wood_${seed}_${hue}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const map = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    // Base wood color
    ctx.fillStyle = `hsl(${hue}, 40%, 35%)`;
    ctx.fillRect(0, 0, w, h);

    // Wood grain lines
    for (let y = 0; y < h; y++) {
      const n = fbm(0.5, y / 15, 3, seed) * 20;
      const v = 70 + smoothNoise(n, y / 8, seed) * 50;
      const lightness = 30 + v * 0.15;
      ctx.fillStyle = `hsl(${hue}, ${35 + smoothNoise(0, y / 30, seed) * 15}%, ${lightness}%)`;
      ctx.fillRect(0, y, w, 1);
    }

    // Grain detail
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 4) {
        const n = smoothNoise(x / 50, y / 8, seed + 10);
        if (n > 0.6) {
          ctx.fillStyle = `hsla(${hue}, 30%, ${25 + n * 10}%, 0.3)`;
          ctx.fillRect(x, y, 4, 1);
        }
      }
    }
  });

  const result = { map, roughness: 0.6, metalness: 0.0 };
  textureCache.set(key, result);
  return result;
}

export function createTileTextures(seed = 4, tileColor = '#E8E4E0', groutColor = '#C0B8B0', tileSize = 80) {
  const key = `tile_${seed}_${tileColor}_${tileSize}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const groutW = 3;
  const map = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    ctx.fillStyle = groutColor;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(seed);
    for (let row = 0; row < Math.ceil(h / (tileSize + groutW)); row++) {
      for (let col = 0; col < Math.ceil(w / (tileSize + groutW)); col++) {
        const tx = col * (tileSize + groutW);
        const ty = row * (tileSize + groutW);
        // Slight color variation per tile
        const variation = (rng() - 0.5) * 10;
        const c = new THREE.Color(tileColor);
        c.r = Math.max(0, Math.min(1, c.r + variation / 255));
        c.g = Math.max(0, Math.min(1, c.g + variation / 255));
        c.b = Math.max(0, Math.min(1, c.b + variation / 255));
        ctx.fillStyle = `rgb(${Math.floor(c.r * 255)},${Math.floor(c.g * 255)},${Math.floor(c.b * 255)})`;
        ctx.fillRect(tx, ty, tileSize, tileSize);
      }
    }
  });

  const roughnessMap = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    // Tiles are smooth, grout is rough
    ctx.fillStyle = '#E0E0E0'; // rough grout
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < Math.ceil(h / (tileSize + groutW)); row++) {
      for (let col = 0; col < Math.ceil(w / (tileSize + groutW)); col++) {
        ctx.fillStyle = '#404040'; // smooth tile
        ctx.fillRect(col * (tileSize + groutW), row * (tileSize + groutW), tileSize, tileSize);
      }
    }
  });

  const result = { map, roughnessMap, roughness: 0.2, metalness: 0.05 };
  textureCache.set(key, result);
  return result;
}

export function createMarbleTextures(seed = 5, baseColor = '#F0ECE8') {
  const key = `marble_${seed}_${baseColor}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const base = new THREE.Color(baseColor);
  const map = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    const r = Math.floor(base.r * 255), g = Math.floor(base.g * 255), b = Math.floor(base.b * 255);
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Marble veins
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const n1 = fbm(x / 80, y / 80, 5, seed);
        const n2 = fbm(x / 40 + 100, y / 40 + 100, 4, seed + 30);
        const vein = Math.sin(x / 30 + n1 * 8) * 0.5 + 0.5;
        const vein2 = Math.sin(y / 20 + n2 * 6) * 0.5 + 0.5;
        const combined = vein * vein2;
        if (combined > 0.7) {
          const intensity = (combined - 0.7) * 3.3;
          ctx.fillStyle = `rgba(${r - 80},${g - 80},${b - 70},${intensity * 0.3})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  const result = { map, roughness: 0.15, metalness: 0.05 };
  textureCache.set(key, result);
  return result;
}

export function createPlasterTextures(seed = 6, color = '#F5F0EB') {
  const key = `plaster_${seed}_${color}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const map = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    const base = new THREE.Color(color);
    const r = Math.floor(base.r * 255), g = Math.floor(base.g * 255), b = Math.floor(base.b * 255);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const n = fbm(x / 30, y / 30, 3, seed);
        const variation = (n - 0.5) * 15;
        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r + variation))},${Math.max(0, Math.min(255, g + variation))},${Math.max(0, Math.min(255, b + variation))})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  });

  const result = { map, roughness: 0.95, metalness: 0.0 };
  textureCache.set(key, result);
  return result;
}

export function createGrassTextures(seed = 7) {
  const key = `grass_${seed}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const map = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    ctx.fillStyle = '#3D7A3E';
    ctx.fillRect(0, 0, w, h);
    const rng = seededRandom(seed);
    // Grass blades
    for (let i = 0; i < 8000; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const g = 80 + rng() * 80;
      const r = 40 + rng() * 30;
      ctx.strokeStyle = `rgb(${r},${g},${Math.floor(r * 0.6)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rng() - 0.5) * 4, y - 3 - rng() * 5);
      ctx.stroke();
    }
  });

  const result = { map, roughness: 0.95, metalness: 0.0 };
  textureCache.set(key, result);
  return result;
}

export function createAsphaltTextures(seed = 8) {
  const key = `asphalt_${seed}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const map = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const n = fbm(x / 20, y / 20, 4, seed);
        const v = Math.floor(50 + n * 40);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  });

  const result = { map, roughness: 0.85, metalness: 0.0 };
  textureCache.set(key, result);
  return result;
}

export function createStoneTextures(seed = 9, baseColor = '#A09890') {
  const key = `stone_${seed}_${baseColor}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const base = new THREE.Color(baseColor);
  const map = createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    const r = Math.floor(base.r * 255), g = Math.floor(base.g * 255), b = Math.floor(base.b * 255);
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const n = fbm(x / 35, y / 35, 5, seed);
        const variation = (n - 0.5) * 50;
        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r + variation))},${Math.max(0, Math.min(255, g + variation - 5))},${Math.max(0, Math.min(255, b + variation - 10))})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    // Stone joints
    const rng = seededRandom(seed);
    for (let i = 0; i < 15; i++) {
      ctx.strokeStyle = 'rgba(60,55,50,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const sx = rng() * w, sy = rng() * h;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 5; j++) {
        ctx.lineTo(sx + (rng() - 0.3) * 100, sy + (rng() - 0.5) * 30 + j * 20);
      }
      ctx.stroke();
    }
  });

  const result = { map, roughness: 0.8, metalness: 0.0 };
  textureCache.set(key, result);
  return result;
}

export function createWaterTextures() {
  const key = 'water';
  if (textureCache.has(key)) return textureCache.get(key);
  const result = {
    color: '#1565C0',
    roughness: 0.0,
    metalness: 0.2,
    transparent: true,
    opacity: 0.6,
  };
  textureCache.set(key, result);
  return result;
}

// ═══════════════════════════════════════════════════════════════
//              MATERIAL FACTORY
// ═══════════════════════════════════════════════════════════════

const materialCache = new Map();

/**
 * Get a PBR material for a given material type.
 * Returns cached Three.js MeshStandardMaterial with procedural textures.
 */
export function getPBRMaterial(materialType, options = {}) {
  const cacheKey = `${materialType}_${JSON.stringify(options)}`;
  if (materialCache.has(cacheKey)) return materialCache.get(cacheKey);

  let mat;
  const type = materialType?.toLowerCase() || 'concrete';
  const { scale = 1, color: overrideColor } = options;

  switch (type) {
    case 'concrete':
    case 'rcc': {
      const tex = createConcreteTextures();
      tex.map.repeat.set(scale, scale);
      if (tex.roughnessMap) tex.roughnessMap.repeat.set(scale, scale);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughnessMap: tex.roughnessMap,
        roughness: tex.roughness, metalness: tex.metalness,
        color: overrideColor || '#C8C0B8',
      });
      break;
    }
    case 'brick': {
      const tex = createBrickTextures();
      tex.map.repeat.set(scale * 2, scale * 2);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'wood_oak':
    case 'wood': {
      const tex = createWoodTextures(3, 28);
      tex.map.repeat.set(scale, scale * 3);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'wood_pine': {
      const tex = createWoodTextures(4, 38);
      tex.map.repeat.set(scale, scale * 3);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'tile_white':
    case 'tiles': {
      const tex = createTileTextures(4, '#E8E4E0', '#C0B8B0', 80);
      tex.map.repeat.set(scale * 3, scale * 3);
      if (tex.roughnessMap) tex.roughnessMap.repeat.set(scale * 3, scale * 3);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughnessMap: tex.roughnessMap,
        roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'tile_grey': {
      const tex = createTileTextures(5, '#BDBDBD', '#A0A0A0', 60);
      tex.map.repeat.set(scale * 3, scale * 3);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'marble_white':
    case 'marble': {
      const tex = createMarbleTextures(5, '#F0ECE8');
      tex.map.repeat.set(scale, scale);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'marble_black': {
      const tex = createMarbleTextures(6, '#2C2C2C');
      tex.map.repeat.set(scale, scale);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: 0.1, metalness: 0.1,
      });
      break;
    }
    case 'plaster':
    case 'paint_white': {
      const tex = createPlasterTextures(6, '#F5F0EB');
      tex.map.repeat.set(scale, scale);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'paint_cream': {
      const tex = createPlasterTextures(7, '#FFF8E1');
      tex.map.repeat.set(scale, scale);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: 0.95, metalness: 0.0,
      });
      break;
    }
    case 'stone':
    case 'stone_cladding': {
      const tex = createStoneTextures(9, '#A09890');
      tex.map.repeat.set(scale * 2, scale * 2);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'granite': {
      const tex = createStoneTextures(10, '#808080');
      tex.map.repeat.set(scale, scale);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: 0.5, metalness: 0.05,
      });
      break;
    }
    case 'grass': {
      const tex = createGrassTextures();
      tex.map.repeat.set(scale * 8, scale * 8);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'asphalt': {
      const tex = createAsphaltTextures();
      tex.map.repeat.set(scale * 4, scale * 4);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: tex.roughness, metalness: tex.metalness,
      });
      break;
    }
    case 'glass_clear':
    case 'glass': {
      mat = new THREE.MeshPhysicalMaterial({
        color: overrideColor || '#E8F4F8',
        roughness: 0.05,
        metalness: 0.0,
        transmission: 0.9,
        transparent: true,
        opacity: 0.3,
        ior: 1.5,
        thickness: 0.01,
        envMapIntensity: 1.5,
      });
      break;
    }
    case 'glass_tinted': {
      mat = new THREE.MeshPhysicalMaterial({
        color: '#1A3A5C',
        roughness: 0.05,
        metalness: 0.0,
        transmission: 0.7,
        transparent: true,
        opacity: 0.4,
        ior: 1.5,
        envMapIntensity: 1.2,
      });
      break;
    }
    case 'steel': {
      mat = new THREE.MeshStandardMaterial({
        color: overrideColor || '#B0B0B0',
        roughness: 0.3,
        metalness: 0.9,
      });
      break;
    }
    case 'aluminium':
    case 'aluminum': {
      mat = new THREE.MeshStandardMaterial({
        color: overrideColor || '#2C2C2C',
        roughness: 0.25,
        metalness: 0.9,
      });
      break;
    }
    case 'roof_tile': {
      const tex = createBrickTextures(20);
      tex.map.repeat.set(scale * 4, scale * 4);
      mat = new THREE.MeshStandardMaterial({
        map: tex.map, roughness: 0.85, metalness: 0.0,
        color: '#8B4513',
      });
      break;
    }
    case 'soil': {
      mat = new THREE.MeshStandardMaterial({
        color: '#795548', roughness: 0.9, metalness: 0.0,
      });
      break;
    }
    case 'water': {
      mat = new THREE.MeshPhysicalMaterial({
        color: '#1565C0',
        roughness: 0.0,
        metalness: 0.2,
        transmission: 0.6,
        transparent: true,
        opacity: 0.7,
        ior: 1.33,
      });
      break;
    }
    default: {
      mat = new THREE.MeshStandardMaterial({
        color: overrideColor || '#C0C0C0',
        roughness: 0.7,
        metalness: 0.0,
      });
    }
  }

  materialCache.set(cacheKey, mat);
  return mat;
}

/**
 * Clear cached textures and materials (for cleanup)
 */
export function clearPBRCache() {
  for (const [, tex] of textureCache) {
    if (tex.map) tex.map.dispose();
    if (tex.roughnessMap) tex.roughnessMap.dispose();
  }
  for (const [, mat] of materialCache) {
    mat.dispose();
  }
  textureCache.clear();
  materialCache.clear();
}
