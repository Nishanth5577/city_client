// ═══════════════════════════════════════════════════════════════
// Enhanced Roof Generator — Multiple roof types
// Flat, Terrace, Gable, Hip, Shed, Mansard
// With parapets, fascia, gutters, ridge tiles
// ═══════════════════════════════════════════════════════════════
import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { getProceduralMaterial } from './ProceduralTextures';

const S = 0.001;

// ─── Roof Material ─────────────────────────────────────────────
function useRoofMaterial(material, renderMode) {
  return useMemo(() => {
    if (renderMode === 'wireframe') return { color: '#909090', wireframe: true };
    if (renderMode === 'xray') return { color: '#909090', transparent: true, opacity: 0.1 };

    switch (material) {
      case 'tile':
        return { color: '#A65D3F', roughness: 0.8, metalness: 0 };
      case 'metal':
        return { color: '#708090', roughness: 0.3, metalness: 0.7 };
      case 'slate':
        return { color: '#4A5568', roughness: 0.7, metalness: 0.05 };
      case 'thatch':
        return { color: '#B8A070', roughness: 0.95, metalness: 0 };
      default: // concrete
        return { color: '#C8C0B8', roughness: 0.75, metalness: 0.05 };
    }
  }, [material, renderMode]);
}

// ─── Parapet Wall ──────────────────────────────────────────────
function Parapet({ points, height, thickness, wallHeight, renderMode }) {
  if (renderMode === 'wireframe' || renderMode === 'xray' || !points || points.length < 3) return null;
  const h = height * S;
  const t = thickness * S;
  const baseY = wallHeight * S;

  return (
    <group>
      {points.map((pt, i) => {
        const next = points[(i + 1) % points.length];
        const dx = (next.x - pt.x) * S;
        const dz = (next.y - pt.y) * S;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.01) return null;
        const mx = (pt.x + next.x) / 2 * S;
        const mz = (pt.y + next.y) / 2 * S;
        const angle = Math.atan2(dx, dz);

        return (
          <group key={i}>
            {/* Parapet body */}
            <mesh
              position={[mx, baseY + h / 2, mz]}
              rotation={[0, angle, 0]}
              castShadow
            >
              <boxGeometry args={[t, h, len]} />
              <meshStandardMaterial color="#D8D0C8" roughness={0.7} />
            </mesh>
            {/* Parapet cap */}
            <mesh
              position={[mx, baseY + h, mz]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[t + 0.03, 0.03, len + 0.02]} />
              <meshStandardMaterial color="#B0A898" roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// FLAT / TERRACE ROOF
// ═══════════════════════════════════════════════════════════════
function FlatRoof({ points, wallHeight, thickness, hasParapet, parapetHeight, renderMode, material }) {
  const matProps = useRoofMaterial(material, renderMode);

  // Create slab from points
  const slabGeo = useMemo(() => {
    if (!points || points.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x * S, points[0].y * S);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x * S, points[i].y * S);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: (thickness || 150) * S, bevelEnabled: false });
  }, [points, thickness]);

  if (!slabGeo) return null;
  const slabY = (wallHeight || 3000) * S;

  return (
    <group>
      {/* Slab */}
      <mesh
        geometry={slabGeo}
        position={[0, slabY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Waterproofing layer on top */}
      {renderMode !== 'wireframe' && renderMode !== 'xray' && (
        <mesh
          geometry={slabGeo}
          position={[0, slabY + (thickness || 150) * S + 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#4A4A4A" roughness={0.9} />
        </mesh>
      )}

      {/* Parapet */}
      {hasParapet && (
        <Parapet
          points={points}
          height={parapetHeight || 900}
          thickness={115}
          wallHeight={wallHeight || 3000}
          renderMode={renderMode}
        />
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// GABLE ROOF
// ═══════════════════════════════════════════════════════════════
function GableRoof({ points, wallHeight, slope, ridgeHeight, overhang, thickness, renderMode, material }) {
  const matProps = useRoofMaterial(material || 'tile', renderMode);

  return useMemo(() => {
    if (!points || points.length < 3) return null;

    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x * S);
      maxX = Math.max(maxX, p.x * S);
      minZ = Math.min(minZ, p.y * S);
      maxZ = Math.max(maxZ, p.y * S);
    });

    const oh = (overhang || 300) * S;
    const wh = (wallHeight || 3000) * S;
    const rh = (ridgeHeight || 1500) * S;
    const t = (thickness || 100) * S;

    const width = maxX - minX + oh * 2;
    const depth = maxZ - minZ + oh * 2;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    // Two sloped planes meeting at ridge
    const halfW = width / 2;
    const slopeLength = Math.sqrt(halfW * halfW + rh * rh);

    return (
      <group>
        {/* Left slope */}
        <mesh
          position={[cx - halfW / 2, wh + rh / 2, cz]}
          rotation={[0, 0, Math.atan2(rh, halfW)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[slopeLength, t, depth]} />
          <meshStandardMaterial {...matProps} />
        </mesh>

        {/* Right slope */}
        <mesh
          position={[cx + halfW / 2, wh + rh / 2, cz]}
          rotation={[0, 0, -Math.atan2(rh, halfW)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[slopeLength, t, depth]} />
          <meshStandardMaterial {...matProps} />
        </mesh>

        {/* Ridge cap */}
        {renderMode !== 'wireframe' && renderMode !== 'xray' && (
          <mesh position={[cx, wh + rh, cz]}>
            <boxGeometry args={[0.06, 0.05, depth + 0.04]} />
            <meshStandardMaterial color="#8B6914" roughness={0.5} />
          </mesh>
        )}

        {/* Gable walls (triangular ends) */}
        {renderMode !== 'wireframe' && renderMode !== 'xray' && (
          <>
            <mesh position={[cx, wh + rh / 2, minZ - oh]}>
              <bufferGeometry>
                {(() => {
                  const triGeo = new THREE.BufferGeometry();
                  const verts = new Float32Array([
                    -halfW, 0, 0,  halfW, 0, 0,  0, rh, 0,
                  ]);
                  triGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
                  triGeo.computeVertexNormals();
                  return triGeo;
                })()}
              </bufferGeometry>
              <meshStandardMaterial color="#D8D0C8" roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[cx, wh + rh / 2, maxZ + oh]}>
              <bufferGeometry>
                {(() => {
                  const triGeo = new THREE.BufferGeometry();
                  const verts = new Float32Array([
                    -halfW, 0, 0,  halfW, 0, 0,  0, rh, 0,
                  ]);
                  triGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
                  triGeo.computeVertexNormals();
                  return triGeo;
                })()}
              </bufferGeometry>
              <meshStandardMaterial color="#D8D0C8" roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
          </>
        )}

        {/* Fascia boards */}
        {renderMode !== 'wireframe' && renderMode !== 'xray' && (
          <>
            <mesh position={[cx - halfW, wh + 0.04, cz]}>
              <boxGeometry args={[0.025, 0.12, depth + 0.04]} />
              <meshStandardMaterial color="#F5F0E8" roughness={0.4} />
            </mesh>
            <mesh position={[cx + halfW, wh + 0.04, cz]}>
              <boxGeometry args={[0.025, 0.12, depth + 0.04]} />
              <meshStandardMaterial color="#F5F0E8" roughness={0.4} />
            </mesh>
          </>
        )}
      </group>
    );
  }, [points, wallHeight, slope, ridgeHeight, overhang, thickness, renderMode, matProps]);
}

// ═══════════════════════════════════════════════════════════════
// HIP ROOF
// ═══════════════════════════════════════════════════════════════
function HipRoof({ points, wallHeight, ridgeHeight, overhang, thickness, renderMode, material }) {
  const matProps = useRoofMaterial(material || 'tile', renderMode);

  return useMemo(() => {
    if (!points || points.length < 3) return null;

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x * S);
      maxX = Math.max(maxX, p.x * S);
      minZ = Math.min(minZ, p.y * S);
      maxZ = Math.max(maxZ, p.y * S);
    });

    const oh = (overhang || 300) * S;
    const wh = (wallHeight || 3000) * S;
    const rh = (ridgeHeight || 1200) * S;

    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const halfW = (maxX - minX) / 2 + oh;
    const halfD = (maxZ - minZ) / 2 + oh;

    // Hip roof: 4 triangular faces meeting at a ridge line (shorter than gable)
    const ridgeLen = Math.max(0, (maxX - minX) - (maxZ - minZ)) * 0.3;

    const ridgeStart = [cx - ridgeLen / 2, wh + rh, cz];
    const ridgeEnd = [cx + ridgeLen / 2, wh + rh, cz];

    // 4 roof faces as triangles/quads
    const faces = [
      // Front face
      { verts: [
        [cx - halfW, wh, cz - halfD],
        [cx + halfW, wh, cz - halfD],
        ridgeEnd,
        ridgeStart,
      ]},
      // Back face
      { verts: [
        [cx + halfW, wh, cz + halfD],
        [cx - halfW, wh, cz + halfD],
        ridgeStart,
        ridgeEnd,
      ]},
      // Left face
      { verts: [
        [cx - halfW, wh, cz + halfD],
        [cx - halfW, wh, cz - halfD],
        ridgeStart,
      ]},
      // Right face
      { verts: [
        [cx + halfW, wh, cz - halfD],
        [cx + halfW, wh, cz + halfD],
        ridgeEnd,
      ]},
    ];

    return (
      <group>
        {faces.map((face, i) => {
          const geo = new THREE.BufferGeometry();
          const indices = [];
          const positions = [];
          face.verts.forEach(v => positions.push(...v));
          if (face.verts.length === 4) {
            indices.push(0, 1, 2, 0, 2, 3);
          } else {
            indices.push(0, 1, 2);
          }
          geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          geo.setIndex(indices);
          geo.computeVertexNormals();
          return (
            <mesh key={i} geometry={geo} castShadow receiveShadow>
              <meshStandardMaterial {...matProps} side={THREE.DoubleSide} />
            </mesh>
          );
        })}

        {/* Ridge cap */}
        {renderMode !== 'wireframe' && renderMode !== 'xray' && ridgeLen > 0.05 && (
          <mesh position={[cx, wh + rh + 0.01, cz]}>
            <boxGeometry args={[ridgeLen + 0.04, 0.04, 0.06]} />
            <meshStandardMaterial color="#8B6914" roughness={0.5} />
          </mesh>
        )}
      </group>
    );
  }, [points, wallHeight, ridgeHeight, overhang, thickness, renderMode, matProps]);
}

// ═══════════════════════════════════════════════════════════════
// SHED ROOF (single slope)
// ═══════════════════════════════════════════════════════════════
function ShedRoof({ points, wallHeight, ridgeHeight, overhang, thickness, renderMode, material }) {
  const matProps = useRoofMaterial(material || 'metal', renderMode);

  return useMemo(() => {
    if (!points || points.length < 3) return null;

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x * S);
      maxX = Math.max(maxX, p.x * S);
      minZ = Math.min(minZ, p.y * S);
      maxZ = Math.max(maxZ, p.y * S);
    });

    const oh = (overhang || 300) * S;
    const wh = (wallHeight || 3000) * S;
    const rh = (ridgeHeight || 800) * S;
    const t = (thickness || 80) * S;

    const width = maxX - minX + oh * 2;
    const depth = maxZ - minZ + oh * 2;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    const slopeAngle = Math.atan2(rh, width);

    return (
      <group>
        <mesh
          position={[cx, wh + rh / 2, cz]}
          rotation={[0, 0, slopeAngle]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width / Math.cos(slopeAngle), t, depth]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      </group>
    );
  }, [points, wallHeight, ridgeHeight, overhang, thickness, renderMode, matProps]);
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENHANCED ROOF COMPONENT
// ═══════════════════════════════════════════════════════════════
const EnhancedRoof = memo(function EnhancedRoof({
  points,
  roofType = 'flat',
  wallHeight = 3000,
  slope = 30,
  ridgeHeight = 1200,
  overhang = 300,
  thickness = 150,
  hasParapet = true,
  parapetHeight = 900,
  renderMode = 'realistic',
  material = 'concrete',
}) {
  if (!points || points.length < 3) return null;

  switch (roofType) {
    case 'gable':
      return <GableRoof points={points} wallHeight={wallHeight} slope={slope} ridgeHeight={ridgeHeight} overhang={overhang} thickness={thickness} renderMode={renderMode} material={material} />;
    case 'hip':
      return <HipRoof points={points} wallHeight={wallHeight} ridgeHeight={ridgeHeight} overhang={overhang} thickness={thickness} renderMode={renderMode} material={material} />;
    case 'shed':
      return <ShedRoof points={points} wallHeight={wallHeight} ridgeHeight={ridgeHeight} overhang={overhang} thickness={thickness} renderMode={renderMode} material={material} />;
    case 'mansard':
      // Mansard = lower steep slope + upper shallow slope — approximate with hip
      return <HipRoof points={points} wallHeight={wallHeight} ridgeHeight={ridgeHeight * 1.5} overhang={overhang} thickness={thickness} renderMode={renderMode} material={material} />;
    case 'terrace':
      return <FlatRoof points={points} wallHeight={wallHeight} thickness={thickness} hasParapet={true} parapetHeight={parapetHeight || 1100} renderMode={renderMode} material={material} />;
    case 'flat':
    default:
      return <FlatRoof points={points} wallHeight={wallHeight} thickness={thickness} hasParapet={hasParapet} parapetHeight={parapetHeight} renderMode={renderMode} material={material} />;
  }
});

export default EnhancedRoof;
