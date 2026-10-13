// ═══════════════════════════════════════════════════════════════
// BIMElements3D — Enhanced Room, Column, Beam, Furniture, Landscape
// Professional architectural quality with PBR materials
// ═══════════════════════════════════════════════════════════════
import { useMemo, memo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { MM_TO_M, ROOM_COLORS, ROOM_TYPE_LABELS } from '../../../../stores/bimTypes';
import { getPBRMaterial } from '../../../../bim/core/ProceduralPBR';

// ─── Room3D — Floor fill + ceiling + labels ──────────────────────
export const Room3D = memo(function Room3D({ room, floorElevation = 0, showLabels = true, onClick }) {
  const S = MM_TO_M;
  const { boundary = [], ceilingHeight = 3200, roomType, name, area, color, floorMaterial = 'tile_white' } = room;

  const floorGeom = useMemo(() => {
    if (boundary.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(boundary[0].x * S, boundary[0].y * S);
    for (let i = 1; i < boundary.length; i++) {
      shape.lineTo(boundary[i].x * S, boundary[i].y * S);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [boundary]);

  const center = useMemo(() => {
    if (boundary.length === 0) return [0, 0, 0];
    const cx = boundary.reduce((s, p) => s + p.x, 0) / boundary.length * S;
    const cy = boundary.reduce((s, p) => s + p.y, 0) / boundary.length * S;
    return [cx, floorElevation * S + 0.02, cy];
  }, [boundary, floorElevation]);

  const floorMat = useMemo(() => {
    return getPBRMaterial(floorMaterial || 'tile_white', { scale: 2 });
  }, [floorMaterial]);

  if (!floorGeom) return null;
  const roomColor = color || ROOM_COLORS[roomType] || '#4FC3F7';
  const elev = floorElevation * S;

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick?.(room); }}>
      {/* Room floor surface with material */}
      <mesh geometry={floorGeom} position={[0, elev + 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]} receiveShadow
        material={floorMat}
      />

      {/* Room floor tint overlay */}
      <mesh geometry={floorGeom} position={[0, elev + 0.016, 0]}
        rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={roomColor} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* Ceiling plane */}
      <mesh geometry={floorGeom} position={[0, elev + ceilingHeight * S - 0.01, 0]}
        rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#F8F8F8" roughness={0.95} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>

      {/* Room label */}
      {showLabels && (
        <Html position={center} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'var(--overlay-bg)', borderRadius: 8, padding: '5px 12px',
            textAlign: 'center', whiteSpace: 'nowrap', backdropFilter: 'blur(6px)',
            border: `1px solid ${roomColor}40`,
          }}>
            <div style={{ color: roomColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>
              {name || ROOM_TYPE_LABELS[roomType] || 'Room'}
            </div>
            {area > 0 && (
              <div style={{ color: '#aaa', fontSize: 9, marginTop: 2 }}>
                {area} m²
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
});

// ─── Column3D — Concrete/Steel structural column ──────────────────
export const Column3D = memo(function Column3D({ column, floorElevation = 0, selected, onClick }) {
  const S = MM_TO_M;
  const { position = { x: 0, y: 0 }, width = 300, depth = 300, height = 3200, shape = 'rectangular', material = 'concrete' } = column;
  const px = position.x * S, pz = position.y * S;
  const h = height * S;
  const elev = floorElevation * S;

  const colMat = useMemo(() => {
    if (selected) return new THREE.MeshStandardMaterial({ color: '#4FC3F7', roughness: 0.5 });
    return getPBRMaterial(material);
  }, [material, selected]);

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick?.(column); }}>
      <mesh position={[px, elev + h / 2, pz]} castShadow material={colMat}>
        {shape === 'circular' ? (
          <cylinderGeometry args={[width * S / 2, width * S / 2, h, 16]} />
        ) : (
          <boxGeometry args={[width * S, h, depth * S]} />
        )}
      </mesh>
      {/* Column base plate */}
      <mesh position={[px, elev + 0.005, pz]} castShadow>
        <boxGeometry args={[(width + 40) * S, 0.01, (depth + 40) * S]} />
        <meshStandardMaterial color="#808080" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Column capital */}
      <mesh position={[px, elev + h - 0.005, pz]} castShadow>
        <boxGeometry args={[(width + 40) * S, 0.01, (depth + 40) * S]} />
        <meshStandardMaterial color="#808080" roughness={0.4} metalness={0.5} />
      </mesh>
      {selected && (
        <mesh position={[px, elev + h / 2, pz]}>
          <boxGeometry args={[(width + 60) * S, h + 0.05, (depth + 60) * S]} />
          <meshBasicMaterial color="#2196F3" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
});

// ─── Beam3D — Structural beam ────────────────────────────────────
export const Beam3D = memo(function Beam3D({ beam, floorElevation = 0, selected, onClick }) {
  const S = MM_TO_M;
  const { start = { x: 0, y: 0 }, end = { x: 3000, y: 0 }, width = 230, depth = 450, height = 3200 } = beam;
  if (!start || !end) return null;

  const sx = start.x * S, sy = start.y * S;
  const ex = end.x * S, ey = end.y * S;
  const dx = ex - sx, dy = ey - sy;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const elev = floorElevation * S + (height || 3200) * S - depth * S / 2;

  const beamMat = useMemo(() => {
    if (selected) return new THREE.MeshStandardMaterial({ color: '#4FC3F7', roughness: 0.5 });
    return getPBRMaterial('concrete');
  }, [selected]);

  return (
    <mesh position={[(sx + ex) / 2, elev, (sy + ey) / 2]}
      rotation={[0, -angle, 0]} castShadow material={beamMat}
      onClick={(e) => { e.stopPropagation(); onClick?.(beam); }}>
      <boxGeometry args={[length, depth * S, width * S]} />
    </mesh>
  );
});

// ─── Furniture3D — Enhanced procedural furniture ─────────────────
export const Furniture3D = memo(function Furniture3D({ furniture: furn, floorElevation = 0, selected, hovered, onClick }) {
  const S = MM_TO_M;
  const {
    position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 },
    width = 1000, depth = 1000, height = 750, color = '#D2B48C', name = '',
    category = 'seating', itemId = '',
  } = furn;

  const px = position.x * S, pz = (position.y || 0) * S;
  const elev = floorElevation * S + (position.z || 0) * S;
  const w = width * S, d = depth * S, h = height * S;
  const isSelected = selected || hovered;
  const col = isSelected ? '#4FC3F7' : color;

  // Render different shapes based on category/itemId
  const renderFurniture = () => {
    // Sofa
    if (itemId?.includes('sofa') || category === 'seating' && (name?.toLowerCase().includes('sofa'))) {
      const seatH = h * 0.4, backH = h * 0.6, armW = w * 0.1;
      return (
        <group>
          {/* Seat */}
          <mesh position={[0, seatH / 2, 0]} castShadow>
            <boxGeometry args={[w, seatH, d]} />
            <meshStandardMaterial color={col} roughness={0.7} />
          </mesh>
          {/* Backrest */}
          <mesh position={[0, seatH + backH / 2, -d / 2 + 0.04]} castShadow>
            <boxGeometry args={[w, backH, 0.08]} />
            <meshStandardMaterial color={col} roughness={0.7} />
          </mesh>
          {/* Arms */}
          <mesh position={[-w / 2 + armW / 2, seatH + 0.1, 0]} castShadow>
            <boxGeometry args={[armW, 0.2, d]} />
            <meshStandardMaterial color={col} roughness={0.7} />
          </mesh>
          <mesh position={[w / 2 - armW / 2, seatH + 0.1, 0]} castShadow>
            <boxGeometry args={[armW, 0.2, d]} />
            <meshStandardMaterial color={col} roughness={0.7} />
          </mesh>
        </group>
      );
    }

    // Bed
    if (itemId?.includes('bed') || category === 'beds') {
      const mattH = h * 0.35, frameH = h * 0.25, headH = h * 0.5;
      return (
        <group>
          {/* Frame */}
          <mesh position={[0, frameH / 2, 0]} castShadow>
            <boxGeometry args={[w, frameH, d]} />
            <meshStandardMaterial color="#5D4037" roughness={0.6} />
          </mesh>
          {/* Mattress */}
          <mesh position={[0, frameH + mattH / 2, 0]} castShadow>
            <boxGeometry args={[w - 0.04, mattH, d - 0.04]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.9} />
          </mesh>
          {/* Headboard */}
          <mesh position={[0, frameH + headH / 2, -d / 2 + 0.03]} castShadow>
            <boxGeometry args={[w, headH, 0.06]} />
            <meshStandardMaterial color="#5D4037" roughness={0.5} />
          </mesh>
          {/* Pillows */}
          <mesh position={[-w * 0.25, frameH + mattH + 0.05, -d * 0.35]} castShadow>
            <boxGeometry args={[w * 0.3, 0.1, 0.2]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
          </mesh>
          <mesh position={[w * 0.25, frameH + mattH + 0.05, -d * 0.35]} castShadow>
            <boxGeometry args={[w * 0.3, 0.1, 0.2]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
          </mesh>
        </group>
      );
    }

    // Table
    if (itemId?.includes('table') || itemId?.includes('desk') || category === 'tables') {
      const topH = 0.03, legW = 0.04;
      return (
        <group>
          {/* Tabletop */}
          <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, topH, d]} />
            <meshStandardMaterial color={col} roughness={0.4} />
          </mesh>
          {/* 4 Legs */}
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([lx, lz], i) => (
            <mesh key={i} position={[lx * (w / 2 - legW), (h - topH) / 2, lz * (d / 2 - legW)]} castShadow>
              <boxGeometry args={[legW, h - topH, legW]} />
              <meshStandardMaterial color={col} roughness={0.5} />
            </mesh>
          ))}
        </group>
      );
    }

    // Wardrobe / Storage
    if (itemId?.includes('wardrobe') || itemId?.includes('cabinet') || category === 'storage') {
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={col} roughness={0.5} />
          </mesh>
          {/* Doors line */}
          <mesh position={[0, h / 2, d / 2 + 0.002]}>
            <boxGeometry args={[0.002, h * 0.9, 0.001]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          {/* Handles */}
          <mesh position={[-0.03, h / 2, d / 2 + 0.01]} castShadow>
            <boxGeometry args={[0.02, 0.08, 0.01]} />
            <meshStandardMaterial color="#B0B0B0" roughness={0.2} metalness={0.9} />
          </mesh>
          <mesh position={[0.03, h / 2, d / 2 + 0.01]} castShadow>
            <boxGeometry args={[0.02, 0.08, 0.01]} />
            <meshStandardMaterial color="#B0B0B0" roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      );
    }

    // Kitchen counter
    if (itemId?.includes('kitchen_counter') || category === 'kitchen') {
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#E0E0E0" roughness={0.3} />
          </mesh>
          {/* Countertop */}
          <mesh position={[0, h + 0.01, 0]} castShadow>
            <boxGeometry args={[w + 0.02, 0.02, d + 0.02]} />
            <meshStandardMaterial color="#404040" roughness={0.2} metalness={0.1} />
          </mesh>
        </group>
      );
    }

    // Toilet
    if (itemId === 'toilet') {
      return (
        <group>
          {/* Bowl base */}
          <mesh position={[0, h * 0.25, 0.05]} castShadow>
            <cylinderGeometry args={[w * S * 0.4, w * S * 0.35, h * 0.5, 12]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </mesh>
          {/* Tank */}
          <mesh position={[0, h * 0.5, -d / 2 + 0.08]} castShadow>
            <boxGeometry args={[w * 0.7, h * 0.5, 0.12]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </mesh>
        </group>
      );
    }

    // Default: simple box
    return (
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={col} roughness={0.6} />
      </mesh>
    );
  };

  return (
    <group
      position={[px, elev, pz]}
      rotation={[rotation.x || 0, (rotation.y || 0) * Math.PI / 180, rotation.z || 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.(furn); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {renderFurniture()}

      {isSelected && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.04, h + 0.04, d + 0.04]} />
          <meshBasicMaterial color="#2196F3" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
});

// ─── Landscape3D — Trees, plants, pool, driveway, boundary ───────
export const Landscape3D = memo(function Landscape3D({ item, onClick }) {
  const S = MM_TO_M;
  const { position = { x: 0, y: 0, z: 0 }, category = 'vegetation', dimensions = {}, scale = 1, itemId = '' } = item;
  const px = position.x * S, pz = position.y * S;

  // Trees
  if (category === 'vegetation') {
    const r = (dimensions.radius || 1500) * S * scale;
    const h = (dimensions.height || 5000) * S * scale;
    const isPalm = itemId?.includes('palm');

    if (isPalm) {
      return (
        <group position={[px, 0, pz]} onClick={(e) => { e.stopPropagation(); onClick?.(item); }}>
          {/* Palm trunk — slightly curved */}
          <mesh position={[0, h * 0.45, 0]} castShadow>
            <cylinderGeometry args={[r * 0.06, r * 0.1, h * 0.9, 8]} />
            <meshStandardMaterial color="#8D6E3C" roughness={0.9} />
          </mesh>
          {/* Palm fronds — simplified as sphere */}
          <mesh position={[0, h * 0.85, 0]} castShadow>
            <sphereGeometry args={[r * 0.8, 8, 6]} />
            <meshStandardMaterial color="#2E7D32" roughness={0.95} />
          </mesh>
          {/* Lower frond layer */}
          <mesh position={[0, h * 0.75, 0]} castShadow>
            <sphereGeometry args={[r * 1.0, 6, 4]} />
            <meshStandardMaterial color="#388E3C" roughness={0.95} transparent opacity={0.8} />
          </mesh>
        </group>
      );
    }

    return (
      <group position={[px, 0, pz]} onClick={(e) => { e.stopPropagation(); onClick?.(item); }}>
        {/* Trunk */}
        <mesh position={[0, h * 0.28, 0]} castShadow>
          <cylinderGeometry args={[r * 0.06, r * 0.1, h * 0.56, 8]} />
          <meshStandardMaterial color="#5D4037" roughness={0.9} />
        </mesh>
        {/* Canopy — multiple spheres for natural look */}
        <mesh position={[0, h * 0.65, 0]} castShadow>
          <sphereGeometry args={[r * 0.9, 8, 6]} />
          <meshStandardMaterial color="#2E7D32" roughness={0.95} />
        </mesh>
        <mesh position={[r * 0.3, h * 0.72, r * 0.2]} castShadow>
          <sphereGeometry args={[r * 0.6, 6, 5]} />
          <meshStandardMaterial color="#388E3C" roughness={0.95} />
        </mesh>
        <mesh position={[-r * 0.25, h * 0.7, -r * 0.2]} castShadow>
          <sphereGeometry args={[r * 0.5, 6, 5]} />
          <meshStandardMaterial color="#1B5E20" roughness={0.95} />
        </mesh>
      </group>
    );
  }

  // Water features (pool, fountain)
  if (category === 'water') {
    const w = (dimensions.width || 8000) * S;
    const d = (dimensions.depth || 4000) * S;
    const ph = (dimensions.height || 1500) * S;
    return (
      <group position={[px, 0, pz]} onClick={(e) => { e.stopPropagation(); onClick?.(item); }}>
        {/* Pool edge/coping */}
        <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[w + 0.2, 0.06, d + 0.2]} />
          <meshStandardMaterial color="#E0E0E0" roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Pool interior */}
        <mesh position={[0, -ph / 2, 0]}>
          <boxGeometry args={[w, ph, d]} />
          <meshStandardMaterial color="#1565C0" roughness={0.1} metalness={0.0} />
        </mesh>
        {/* Water surface */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[w - 0.05, 0.02, d - 0.05]} />
          <meshPhysicalMaterial
            color="#2196F3"
            transparent opacity={0.5}
            roughness={0.0} metalness={0.1}
            transmission={0.4}
          />
        </mesh>
      </group>
    );
  }

  // Hardscape (driveway, parking)
  if (category === 'hardscape') {
    const w = (dimensions.width || 3000) * S;
    const d = (dimensions.depth || 5000) * S;
    return (
      <mesh position={[px, 0.01, pz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow
        onClick={(e) => { e.stopPropagation(); onClick?.(item); }}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#757575" roughness={0.8} metalness={0.0} />
      </mesh>
    );
  }

  // Boundary wall
  if (category === 'boundary' && itemId?.includes('wall')) {
    const bh = (dimensions.height || 1800) * S;
    const bt = (dimensions.thickness || 200) * S;
    const bw = (dimensions.width || 1000) * S;
    return (
      <mesh position={[px, bh / 2, pz]} castShadow receiveShadow
        onClick={(e) => { e.stopPropagation(); onClick?.(item); }}>
        <boxGeometry args={[bw, bh, bt]} />
        <meshStandardMaterial color="#C0B8A8" roughness={0.8} />
      </mesh>
    );
  }

  // Gate
  if (category === 'boundary' && itemId?.includes('gate')) {
    const gw = (dimensions.width || 3000) * S;
    const gh = (dimensions.height || 2000) * S;
    return (
      <group position={[px, 0, pz]}
        onClick={(e) => { e.stopPropagation(); onClick?.(item); }}>
        {/* Gate posts */}
        <mesh position={[-gw / 2, gh / 2 + 0.1, 0]} castShadow>
          <boxGeometry args={[0.2, gh + 0.2, 0.2]} />
          <meshStandardMaterial color="#808080" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[gw / 2, gh / 2 + 0.1, 0]} castShadow>
          <boxGeometry args={[0.2, gh + 0.2, 0.2]} />
          <meshStandardMaterial color="#808080" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Gate bars (horizontal) */}
        {[0.2, 0.5, 0.8].map((t, i) => (
          <mesh key={i} position={[0, gh * t, 0]} castShadow>
            <boxGeometry args={[gw - 0.25, 0.04, 0.04]} />
            <meshStandardMaterial color="#2C2C2C" roughness={0.3} metalness={0.85} />
          </mesh>
        ))}
        {/* Gate bars (vertical) */}
        {Array.from({ length: Math.floor(gw / 0.15) }).map((_, i) => (
          <mesh key={`v${i}`} position={[-gw / 2 + 0.15 + i * 0.15, gh / 2, 0]} castShadow>
            <boxGeometry args={[0.02, gh * 0.7, 0.02]} />
            <meshStandardMaterial color="#2C2C2C" roughness={0.3} metalness={0.85} />
          </mesh>
        ))}
      </group>
    );
  }

  // Garden elements
  if (category === 'garden') {
    const w = (dimensions.width || 2000) * S;
    const d = (dimensions.depth || 800) * S;
    const gh = (dimensions.height || 300) * S;
    return (
      <mesh position={[px, gh / 2, pz]} receiveShadow
        onClick={(e) => { e.stopPropagation(); onClick?.(item); }}>
        <boxGeometry args={[w, gh, d]} />
        <meshStandardMaterial color="#4CAF50" roughness={0.95} />
      </mesh>
    );
  }

  // Default
  const w = (dimensions.width || 3000) * S;
  const d = (dimensions.depth || 3000) * S;
  return (
    <mesh position={[px, 0.01, pz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow
      onClick={(e) => { e.stopPropagation(); onClick?.(item); }}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#7CB342" roughness={0.95} />
    </mesh>
  );
});

export default { Room3D, Column3D, Beam3D, Furniture3D, Landscape3D };
