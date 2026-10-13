import { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Group, Text, Arrow } from 'react-konva';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {
  setActiveTool, selectElement, clearSelection, addElementLocal, updateElementLocal,
  removeElementLocal, pushUndo, setZoom, setPanOffset, startDrawing, endDrawing,
} from '../../../redux/slices/bimSlice';
import { TOOLS, WALL_PRESETS, COLUMN_PRESETS, DOOR_PRESETS, WINDOW_PRESETS, FURNITURE_CATALOG, COLORS, SCALE_FACTOR, STAIR_PRESETS } from '../../../utils/bimConstants';
import { snapToGrid, distance, formatMeasurement, wallOffsetPoints } from '../../../utils/geometryUtils';
import ElectricalOverlay from './overlays/ElectricalOverlay';
import PlumbingOverlay from './overlays/PlumbingOverlay';
import HVACOverlay from './overlays/HVACOverlay';
import SolarOverlay from './overlays/SolarOverlay';

export default function FloorPlanCanvas({ onCursorMove }) {
  const dispatch = useDispatch();
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [drawStart, setDrawStart] = useState(null);
  const [drawEnd, setDrawEnd] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  const {
    elements, selectedElementIds, activeTool, toolSettings, zoom, panOffset,
    layers, isDrawing, viewMode,
    electricalElements, plumbingElements, hvacElements, solarElements
  } = useSelector(s => s.bim);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setStageSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const toWorld = useCallback((pos) => ({
    x: (pos.x - panOffset.x) / zoom / SCALE_FACTOR,
    y: (pos.y - panOffset.y) / zoom / SCALE_FACTOR,
  }), [zoom, panOffset]);

  const toScreen = useCallback((pos) => ({
    x: pos.x * SCALE_FACTOR * zoom + panOffset.x,
    y: pos.y * SCALE_FACTOR * zoom + panOffset.y,
  }), [zoom, panOffset]);

  const getSnappedPos = useCallback((pos) => {
    if (!toolSettings.snapEnabled) return pos;
    return {
      x: snapToGrid(pos.x, toolSettings.gridSize),
      y: snapToGrid(pos.y, toolSettings.gridSize),
    };
  }, [toolSettings.snapEnabled, toolSettings.gridSize]);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const worldPos = getSnappedPos(toWorld(pos));

    if (activeTool === TOOLS.PAN || e.evt.button === 1) {
      setDragStart({ x: pos.x - panOffset.x, y: pos.y - panOffset.y });
      return;
    }

    if (activeTool === TOOLS.WALL || activeTool === TOOLS.BEAM) {
      setDrawStart(worldPos);
      setDrawEnd(worldPos);
      dispatch(startDrawing(worldPos));
      return;
    }

    if (activeTool === TOOLS.COLUMN) {
      const preset = COLUMN_PRESETS[toolSettings.columnPreset] || COLUMN_PRESETS[0];
      const element = {
        canvas_id: uuidv4(),
        position: worldPos,
        shape: preset.shape,
        width: preset.width,
        depth: preset.depth || preset.width,
        diameter: preset.diameter || preset.width,
        height: 3000,
        color: COLORS.column,
        material: 'rcc',
        layer: 'structural',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'column', element }));
      return;
    }

    if (activeTool === TOOLS.DOOR) {
      const preset = DOOR_PRESETS[toolSettings.doorPreset] || DOOR_PRESETS[0];
      const element = {
        canvas_id: uuidv4(),
        position: worldPos,
        rotation: 0,
        door_type: preset.type,
        width: preset.width,
        height: preset.height,
        swing_direction: 'left',
        swing_angle: 90,
        color: COLORS.door,
        material: 'wood',
        layer: 'architectural',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'door', element }));
      return;
    }

    if (activeTool === TOOLS.WINDOW) {
      const preset = WINDOW_PRESETS[toolSettings.windowPreset] || WINDOW_PRESETS[0];
      const element = {
        canvas_id: uuidv4(),
        position: worldPos,
        rotation: 0,
        window_type: preset.type,
        width: preset.width,
        height: preset.height,
        sill_height: 900,
        color: COLORS.window,
        layer: 'architectural',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'window', element }));
      return;
    }

    if (activeTool === TOOLS.FURNITURE) {
      const preset = FURNITURE_CATALOG[toolSettings.furniturePreset] || FURNITURE_CATALOG[0];
      const element = {
        canvas_id: uuidv4(),
        furniture_type: preset.type,
        name: preset.name,
        position: worldPos,
        rotation: 0,
        dimensions: { width: preset.width, depth: preset.depth, height: preset.height },
        color: preset.color,
        material: 'wood',
        layer: 'furniture',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'furniture', element }));
      return;
    }

    if (activeTool === TOOLS.STAIR) {
      const element = {
        canvas_id: uuidv4(),
        position: worldPos,
        rotation: 0,
        stair_type: 'straight',
        width: 1200,
        total_height: 3000,
        num_risers: 18,
        riser_height: 167,
        tread_depth: 270,
        color: COLORS.stair,
        layer: 'architectural',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'stair', element }));
      return;
    }

    // Slab tool — click to place a rectangular slab
    if (activeTool === TOOLS.SLAB) {
      const element = {
        canvas_id: uuidv4(),
        position: worldPos,
        rotation: 0,
        width: 4000,
        depth: 4000,
        thickness: 150,
        slab_type: 'solid',
        color: COLORS.slab || '#C8C8C8',
        material: 'rcc',
        layer: 'structural',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'slab', element }));
      return;
    }

    // Roof tool — click to place a roof element
    if (activeTool === TOOLS.ROOF) {
      const element = {
        canvas_id: uuidv4(),
        position: worldPos,
        rotation: 0,
        width: 5000,
        depth: 5000,
        thickness: 150,
        roof_type: toolSettings.roofType || 'flat',
        slope: 30,
        color: COLORS.roof || '#8B6914',
        material: 'concrete',
        layer: 'structural',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'roof', element }));
      return;
    }

    // Foundation tool
    if (activeTool === TOOLS.FOUNDATION) {
      const element = {
        canvas_id: uuidv4(),
        position: worldPos,
        rotation: 0,
        width: 1500,
        depth: 1500,
        thickness: 600,
        foundation_type: 'isolated',
        color: COLORS.foundation || '#696969',
        material: 'rcc',
        layer: 'structural',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'foundation', element }));
      return;
    }

    // Ceiling tool
    if (activeTool === TOOLS.CEILING) {
      const element = {
        canvas_id: uuidv4(),
        position: worldPos,
        rotation: 0,
        width: 4000,
        depth: 4000,
        thickness: 12,
        ceiling_type: 'gypsum',
        color: '#F0F0F0',
        material: 'gypsum',
        layer: 'architectural',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'ceiling', element }));
      return;
    }

    // Railing tool
    if (activeTool === TOOLS.RAILING) {
      setDrawStart(worldPos);
      setDrawEnd(worldPos);
      dispatch(startDrawing(worldPos));
      return;
    }

    // Room tool — click to place a room label
    if (activeTool === TOOLS.ROOM) {
      const element = {
        canvas_id: uuidv4(),
        position: worldPos,
        rotation: 0,
        width: 4000,
        depth: 3000,
        name: 'Room',
        room_type: 'general',
        color: COLORS.room_fill || '#F0F8FF20',
        border_color: COLORS.room_border || '#4A90D9',
        layer: 'architectural',
        bim: {},
      };
      dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
      dispatch(addElementLocal({ element_type: 'room', element }));
      return;
    }

    // Select tool — check if clicked on element
    if (activeTool === TOOLS.SELECT) {
      if (e.target === stage || e.target.getParent() === stage) {
        dispatch(clearSelection());
      }
    }
  }, [activeTool, toolSettings, zoom, panOffset, elements, dispatch, toWorld, getSnappedPos]);

  const handleMouseMove = useCallback((e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const worldPos = getSnappedPos(toWorld(pos));
    onCursorMove?.(worldPos);

    // Panning
    if (dragStart) {
      dispatch(setPanOffset({ x: pos.x - dragStart.x, y: pos.y - dragStart.y }));
      return;
    }

    // Drawing preview
    if (drawStart && (activeTool === TOOLS.WALL || activeTool === TOOLS.BEAM || activeTool === TOOLS.RAILING)) {
      setDrawEnd(worldPos);
    }
  }, [activeTool, drawStart, dragStart, toWorld, getSnappedPos, dispatch, onCursorMove]);

  const handleMouseUp = useCallback((e) => {
    // End panning
    if (dragStart) {
      setDragStart(null);
      return;
    }

    // Finish wall/beam/railing drawing
    if (drawStart && drawEnd && (activeTool === TOOLS.WALL || activeTool === TOOLS.BEAM || activeTool === TOOLS.RAILING)) {
      const len = distance(drawStart, drawEnd);
      if (len > 50) { // Minimum length
        dispatch(pushUndo({ type: 'add', data: JSON.parse(JSON.stringify(elements)) }));
        if (activeTool === TOOLS.WALL) {
          const wallPreset = WALL_PRESETS.find(p => p.thickness === toolSettings.wallThickness) || WALL_PRESETS[0];
          dispatch(addElementLocal({
            element_type: 'wall',
            element: {
              canvas_id: uuidv4(),
              start_point: drawStart,
              end_point: drawEnd,
              thickness: toolSettings.wallThickness,
              height: 3000,
              wall_type: toolSettings.wallType,
              color: wallPreset.color,
              material: 'brick',
              layer: 'architectural',
              is_structural: toolSettings.wallType === 'shear',
              bim: {},
            }
          }));
        } else if (activeTool === TOOLS.BEAM) {
          dispatch(addElementLocal({
            element_type: 'beam',
            element: {
              canvas_id: uuidv4(),
              start_point: drawStart,
              end_point: drawEnd,
              width: 230,
              depth: 450,
              beam_type: 'main',
              color: COLORS.beam,
              material: 'rcc',
              layer: 'structural',
              bim: {},
            }
          }));
        } else if (activeTool === TOOLS.RAILING) {
          dispatch(addElementLocal({
            element_type: 'railing',
            element: {
              canvas_id: uuidv4(),
              start_point: drawStart,
              end_point: drawEnd,
              height: 1000,
              railing_type: 'metal',
              color: COLORS.railing || '#A0A0A0',
              material: 'steel',
              layer: 'architectural',
              bim: {},
            }
          }));
        }
      }
      setDrawStart(null);
      setDrawEnd(null);
      dispatch(endDrawing());
    }
  }, [activeTool, drawStart, drawEnd, dragStart, toolSettings, elements, dispatch]);

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.1;
    const newZoom = e.evt.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
    const clampedZoom = Math.max(0.05, Math.min(10, newZoom));

    // Zoom towards pointer
    const mousePointTo = { x: (pointer.x - panOffset.x) / zoom, y: (pointer.y - panOffset.y) / zoom };
    const newPos = { x: pointer.x - mousePointTo.x * clampedZoom, y: pointer.y - mousePointTo.y * clampedZoom };

    dispatch(setZoom(clampedZoom));
    dispatch(setPanOffset(newPos));
  }, [zoom, panOffset, dispatch]);

  const handleElementClick = useCallback((id, type, e) => {
    e.cancelBubble = true;
    dispatch(selectElement({ id, type, multi: e.evt?.shiftKey }));
  }, [dispatch]);

  // Grid visibility check
  const gridLayer = layers.find(l => l.id === 'grid');
  const archLayer = layers.find(l => l.id === 'architectural');
  const structLayer = layers.find(l => l.id === 'structural');
  const furnLayer = layers.find(l => l.id === 'furniture');
  const dimLayer = layers.find(l => l.id === 'dimensions');
  const elecLayer = layers.find(l => l.id === 'electrical');
  const plumbLayer = layers.find(l => l.id === 'plumbing');
  const hvacLayer = layers.find(l => l.id === 'hvac');
  const solarLayer = layers.find(l => l.id === 'solar');

  // Render grid lines
  const renderGrid = () => {
    if (!gridLayer?.visible) return null;
    const gridSize = toolSettings.gridSize * SCALE_FACTOR;
    const lines = [];
    const gridWidth = stageSize.width / zoom + Math.abs(panOffset.x) / zoom;
    const gridHeight = stageSize.height / zoom + Math.abs(panOffset.y) / zoom;
    const startX = -Math.ceil(Math.abs(panOffset.x / zoom) / gridSize) * gridSize;
    const startY = -Math.ceil(Math.abs(panOffset.y / zoom) / gridSize) * gridSize;

    for (let x = startX; x < gridWidth + gridSize; x += gridSize) {
      lines.push(<Line key={`gv${x}`} points={[x, startY, x, gridHeight + gridSize]} stroke={COLORS.grid_minor} strokeWidth={0.5 / zoom} />);
    }
    for (let y = startY; y < gridHeight + gridSize; y += gridSize) {
      lines.push(<Line key={`gh${y}`} points={[startX, y, gridWidth + gridSize, y]} stroke={COLORS.grid_minor} strokeWidth={0.5 / zoom} />);
    }
    // Major grid (every 10)
    const majorSize = gridSize * 10;
    for (let x = startX; x < gridWidth + majorSize; x += majorSize) {
      lines.push(<Line key={`gmv${x}`} points={[x, startY, x, gridHeight + majorSize]} stroke={COLORS.grid_major} strokeWidth={1 / zoom} />);
    }
    for (let y = startY; y < gridHeight + majorSize; y += majorSize) {
      lines.push(<Line key={`gmh${y}`} points={[startX, y, gridWidth + majorSize, y]} stroke={COLORS.grid_major} strokeWidth={1 / zoom} />);
    }
    return lines;
  };

  // Render wall
  const renderWall = (wall) => {
    if (!wall?.start_point || !wall?.end_point) return null;
    const s = SCALE_FACTOR;
    const sp = { x: wall.start_point.x * s, y: wall.start_point.y * s };
    const ep = { x: wall.end_point.x * s, y: wall.end_point.y * s };
    const t = (wall.thickness || 230) * s;
    const offset = wallOffsetPoints(
      { x: wall.start_point.x, y: wall.start_point.y },
      { x: wall.end_point.x, y: wall.end_point.y },
      wall.thickness || 230
    );
    const id = wall._id || wall.canvas_id;
    const isSelected = selectedElementIds.includes(id);

    return (
      <Group key={id} onClick={(e) => handleElementClick(id, 'wall', e)}>
        <Line
          points={[
            offset.topLeft.x * s, offset.topLeft.y * s,
            offset.topRight.x * s, offset.topRight.y * s,
            offset.bottomRight.x * s, offset.bottomRight.y * s,
            offset.bottomLeft.x * s, offset.bottomLeft.y * s,
          ]}
          closed fill={isSelected ? COLORS.wall_selected : wall.color || COLORS.wall}
          stroke={isSelected ? '#FF6B35' : '#00000040'}
          strokeWidth={1 / zoom} opacity={0.9}
        />
        {/* Dimension text */}
        {dimLayer?.visible && (
          <Text
            x={(sp.x + ep.x) / 2} y={(sp.y + ep.y) / 2 - 12 / zoom}
            text={formatMeasurement(distance(wall.start_point, wall.end_point))}
            fontSize={10 / zoom} fill={COLORS.dimension} align="center"
            offsetX={20 / zoom}
          />
        )}
      </Group>
    );
  };

  // Render column
  const renderColumn = (col) => {
    if (!col?.position) return null;
    const s = SCALE_FACTOR;
    const id = col._id || col.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = col.position.x * s;
    const y = col.position.y * s;

    if (col.shape === 'circular') {
      return (
        <Circle key={id} x={x} y={y} radius={(col.diameter || 300) * s / 2}
          fill={isSelected ? COLORS.column_selected : col.color || COLORS.column}
          stroke={isSelected ? '#FF6B35' : '#555'} strokeWidth={1 / zoom}
          onClick={(e) => handleElementClick(id, 'column', e)}
        />
      );
    }
    return (
      <Rect key={id}
        x={x - (col.width || 300) * s / 2} y={y - (col.depth || 300) * s / 2}
        width={(col.width || 300) * s} height={(col.depth || 300) * s}
        fill={isSelected ? COLORS.column_selected : col.color || COLORS.column}
        stroke={isSelected ? '#FF6B35' : '#555'} strokeWidth={1 / zoom}
        rotation={col.rotation || 0}
        onClick={(e) => handleElementClick(id, 'column', e)}
      />
    );
  };

  // Render door
  const renderDoor = (door) => {
    if (!door?.position) return null;
    const s = SCALE_FACTOR;
    const id = door._id || door.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = door.position.x * s;
    const y = door.position.y * s;
    const w = (door.width || 900) * s;

    return (
      <Group key={id} x={x} y={y} rotation={door.rotation || 0}
        onClick={(e) => handleElementClick(id, 'door', e)}>
        {/* Door opening line */}
        <Line points={[0, 0, w, 0]} stroke={isSelected ? '#FF6B35' : door.color || COLORS.door}
          strokeWidth={3 / zoom} />
        {/* Swing arc */}
        <Line
          points={[0, 0, 0, -w * 0.7, w * 0.3, -w * 0.5]}
          stroke={COLORS.door_arc} strokeWidth={1 / zoom} tension={0.5}
          dash={[4 / zoom, 2 / zoom]}
        />
      </Group>
    );
  };

  // Render window
  const renderWindow = (win) => {
    if (!win?.position) return null;
    const s = SCALE_FACTOR;
    const id = win._id || win.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = win.position.x * s;
    const y = win.position.y * s;
    const w = (win.width || 1200) * s;

    return (
      <Group key={id} x={x} y={y} rotation={win.rotation || 0}
        onClick={(e) => handleElementClick(id, 'window', e)}>
        {/* Window frame */}
        <Line points={[0, -3 / zoom, w, -3 / zoom]} stroke={COLORS.window_frame} strokeWidth={6 / zoom} />
        {/* Glass */}
        <Line points={[0, 0, w, 0]} stroke={isSelected ? '#FF6B35' : COLORS.window} strokeWidth={2 / zoom} />
        {/* Center mullion */}
        <Line points={[w / 2, -4 / zoom, w / 2, 4 / zoom]} stroke={COLORS.window_frame} strokeWidth={1 / zoom} />
      </Group>
    );
  };

  // Render furniture
  const renderFurniture = (fur) => {
    if (!fur?.position) return null;
    const s = SCALE_FACTOR;
    const id = fur._id || fur.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = fur.position.x * s;
    const y = fur.position.y * s;
    const w = (fur.dimensions?.width || 600) * s;
    const d = (fur.dimensions?.depth || 600) * s;

    return (
      <Group key={id} x={x} y={y} rotation={fur.rotation || 0}
        onClick={(e) => handleElementClick(id, 'furniture', e)}>
        <Rect x={-w / 2} y={-d / 2} width={w} height={d}
          fill={isSelected ? '#FF6B3530' : fur.color || '#DEB887'}
          stroke={isSelected ? '#FF6B35' : '#00000030'} strokeWidth={1 / zoom}
          cornerRadius={2 / zoom} opacity={0.8}
        />
        <Text x={-w / 2} y={-6 / zoom} width={w} text={fur.name || fur.furniture_type || ''}
          fontSize={8 / zoom} fill="#666" align="center" />
      </Group>
    );
  };

  // Render stair
  const renderStair = (stair) => {
    if (!stair?.position) return null;
    const s = SCALE_FACTOR;
    const id = stair._id || stair.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = stair.position.x * s;
    const y = stair.position.y * s;
    const w = (stair.width || 1200) * s;
    const numSteps = Math.min(stair.num_risers || 18, 20);
    const treadD = (stair.tread_depth || 270) * s;
    const totalLen = numSteps * treadD;
    const treads = [];

    for (let i = 0; i < numSteps; i++) {
      treads.push(
        <Line key={i} points={[0, i * treadD, w, i * treadD]}
          stroke="#777" strokeWidth={0.5 / zoom} />
      );
    }

    return (
      <Group key={id} x={x} y={y} rotation={stair.rotation || 0}
        onClick={(e) => handleElementClick(id, 'stair', e)}>
        <Rect x={0} y={0} width={w} height={totalLen}
          fill={isSelected ? '#FF6B3520' : '#E0E0E020'}
          stroke={isSelected ? '#FF6B35' : '#888'} strokeWidth={1 / zoom}
        />
        {treads}
        {/* Direction arrow */}
        <Arrow points={[w / 2, totalLen * 0.8, w / 2, totalLen * 0.2]}
          stroke="#555" strokeWidth={1.5 / zoom} pointerLength={6 / zoom} pointerWidth={4 / zoom} />
      </Group>
    );
  };

  // Drawing preview
  const renderDrawPreview = () => {
    if (!drawStart || !drawEnd) return null;
    const s = SCALE_FACTOR;
    const len = distance(drawStart, drawEnd);
    if (len < 10) return null;

    if (activeTool === TOOLS.WALL) {
      const offset = wallOffsetPoints(drawStart, drawEnd, toolSettings.wallThickness);
      return (
        <Group>
          <Line
            points={[
              offset.topLeft.x * s, offset.topLeft.y * s,
              offset.topRight.x * s, offset.topRight.y * s,
              offset.bottomRight.x * s, offset.bottomRight.y * s,
              offset.bottomLeft.x * s, offset.bottomLeft.y * s,
            ]}
            closed fill="#0D948840" stroke="#0D9488" strokeWidth={1.5 / zoom}
            dash={[6 / zoom, 3 / zoom]}
          />
          <Text
            x={(drawStart.x + drawEnd.x) * s / 2}
            y={(drawStart.y + drawEnd.y) * s / 2 - 16 / zoom}
            text={formatMeasurement(len)} fontSize={11 / zoom}
            fill="#0D9488" fontStyle="bold" align="center" offsetX={30 / zoom}
          />
        </Group>
      );
    }
    if (activeTool === TOOLS.BEAM) {
      return (
        <Group>
          <Line
            points={[drawStart.x * s, drawStart.y * s, drawEnd.x * s, drawEnd.y * s]}
            stroke="#0D9488" strokeWidth={230 * s} lineCap="round"
            opacity={0.4}
            dash={[8 / zoom, 4 / zoom]}
          />
          <Text
            x={(drawStart.x + drawEnd.x) * s / 2}
            y={(drawStart.y + drawEnd.y) * s / 2 - 16 / zoom}
            text={formatMeasurement(len)} fontSize={11 / zoom}
            fill="#0D9488" fontStyle="bold" align="center" offsetX={30 / zoom}
          />
        </Group>
      );
    }
    if (activeTool === TOOLS.RAILING) {
      return (
        <Group>
          <Line
            points={[drawStart.x * s, drawStart.y * s, drawEnd.x * s, drawEnd.y * s]}
            stroke="#0D9488" strokeWidth={2 / zoom}
            dash={[6 / zoom, 3 / zoom]}
          />
          <Text
            x={(drawStart.x + drawEnd.x) * s / 2}
            y={(drawStart.y + drawEnd.y) * s / 2 - 16 / zoom}
            text={formatMeasurement(len)} fontSize={11 / zoom}
            fill="#0D9488" fontStyle="bold" align="center" offsetX={30 / zoom}
          />
        </Group>
      );
    }
    return null;
  };

  // Render slab
  const renderSlab = (slab) => {
    if (!slab?.position) return null;
    const s = SCALE_FACTOR;
    const id = slab._id || slab.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = slab.position.x * s;
    const y = slab.position.y * s;
    const w = (slab.width || 4000) * s;
    const d = (slab.depth || 4000) * s;
    return (
      <Group key={id} x={x} y={y} rotation={slab.rotation || 0}
        onClick={(e) => handleElementClick(id, 'slab', e)}>
        <Rect x={-w / 2} y={-d / 2} width={w} height={d}
          fill={isSelected ? '#FF6B3520' : (slab.color || '#C8C8C8') + '30'}
          stroke={isSelected ? '#FF6B35' : slab.color || '#C8C8C8'}
          strokeWidth={1.5 / zoom} dash={[6 / zoom, 3 / zoom]}
        />
        <Text x={-w / 2} y={-8 / zoom} width={w} text={`Slab ${slab.thickness || 150}mm`}
          fontSize={9 / zoom} fill="#888" align="center" />
      </Group>
    );
  };

  // Render roof
  const renderRoof = (roof) => {
    if (!roof?.position) return null;
    const s = SCALE_FACTOR;
    const id = roof._id || roof.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = roof.position.x * s;
    const y = roof.position.y * s;
    const w = (roof.width || 5000) * s;
    const d = (roof.depth || 5000) * s;
    return (
      <Group key={id} x={x} y={y} rotation={roof.rotation || 0}
        onClick={(e) => handleElementClick(id, 'roof', e)}>
        <Rect x={-w / 2} y={-d / 2} width={w} height={d}
          fill={isSelected ? '#FF6B3520' : (roof.color || '#8B6914') + '25'}
          stroke={isSelected ? '#FF6B35' : roof.color || '#8B6914'}
          strokeWidth={1.5 / zoom}
        />
        {/* Diagonal lines to indicate roof */}
        <Line points={[-w / 2, -d / 2, w / 2, d / 2]} stroke={(roof.color || '#8B6914') + '40'} strokeWidth={0.5 / zoom} />
        <Line points={[w / 2, -d / 2, -w / 2, d / 2]} stroke={(roof.color || '#8B6914') + '40'} strokeWidth={0.5 / zoom} />
        <Text x={-w / 2} y={-8 / zoom} width={w} text={`Roof (${roof.roof_type || 'flat'})`}
          fontSize={9 / zoom} fill="#8B6914" align="center" />
      </Group>
    );
  };

  // Render foundation
  const renderFoundation = (fdn) => {
    if (!fdn?.position) return null;
    const s = SCALE_FACTOR;
    const id = fdn._id || fdn.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = fdn.position.x * s;
    const y = fdn.position.y * s;
    const w = (fdn.width || 1500) * s;
    const d = (fdn.depth || 1500) * s;
    return (
      <Group key={id} x={x} y={y} rotation={fdn.rotation || 0}
        onClick={(e) => handleElementClick(id, 'foundation', e)}>
        <Rect x={-w / 2} y={-d / 2} width={w} height={d}
          fill={isSelected ? '#FF6B3520' : (fdn.color || '#696969') + '35'}
          stroke={isSelected ? '#FF6B35' : fdn.color || '#696969'}
          strokeWidth={1.5 / zoom}
        />
        <Text x={-w / 2} y={-8 / zoom} width={w} text={`FDN ${fdn.foundation_type || ''}`}
          fontSize={9 / zoom} fill="#696969" align="center" />
      </Group>
    );
  };

  // Render railing
  const renderRailing = (rail) => {
    if (!rail?.start_point || !rail?.end_point) return null;
    const s = SCALE_FACTOR;
    const id = rail._id || rail.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    return (
      <Group key={id} onClick={(e) => handleElementClick(id, 'railing', e)}>
        <Line
          points={[rail.start_point.x * s, rail.start_point.y * s, rail.end_point.x * s, rail.end_point.y * s]}
          stroke={isSelected ? '#FF6B35' : rail.color || '#A0A0A0'}
          strokeWidth={3 / zoom} lineCap="round"
        />
        {/* Balusters */}
        {(() => {
          const dots = [];
          const dx = rail.end_point.x - rail.start_point.x;
          const dy = rail.end_point.y - rail.start_point.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const spacing = 300;
          const count = Math.floor(len / spacing);
          for (let i = 1; i <= count; i++) {
            const t = i / (count + 1);
            dots.push(
              <Circle key={i}
                x={(rail.start_point.x + dx * t) * s}
                y={(rail.start_point.y + dy * t) * s}
                radius={2 / zoom}
                fill={rail.color || '#A0A0A0'}
              />
            );
          }
          return dots;
        })()}
      </Group>
    );
  };

  // Render ceiling
  const renderCeiling = (ceil) => {
    if (!ceil?.position) return null;
    const s = SCALE_FACTOR;
    const id = ceil._id || ceil.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = ceil.position.x * s;
    const y = ceil.position.y * s;
    const w = (ceil.width || 4000) * s;
    const d = (ceil.depth || 4000) * s;
    return (
      <Group key={id} x={x} y={y} rotation={ceil.rotation || 0}
        onClick={(e) => handleElementClick(id, 'ceiling', e)}>
        <Rect x={-w / 2} y={-d / 2} width={w} height={d}
          fill={isSelected ? '#FF6B3520' : '#F0F0F015'}
          stroke={isSelected ? '#FF6B35' : '#D0D0D0'}
          strokeWidth={1 / zoom} dash={[4 / zoom, 4 / zoom]}
        />
        <Text x={-w / 2} y={-8 / zoom} width={w} text={`Ceiling (${ceil.ceiling_type || 'gypsum'})`}
          fontSize={9 / zoom} fill="#AAAAAA" align="center" />
      </Group>
    );
  };

  // Render room
  const renderRoom = (room) => {
    if (!room?.position) return null;
    const s = SCALE_FACTOR;
    const id = room._id || room.canvas_id;
    const isSelected = selectedElementIds.includes(id);
    const x = room.position.x * s;
    const y = room.position.y * s;
    const w = (room.width || 4000) * s;
    const d = (room.depth || 3000) * s;
    return (
      <Group key={id} x={x} y={y} rotation={room.rotation || 0}
        onClick={(e) => handleElementClick(id, 'room', e)}>
        <Rect x={-w / 2} y={-d / 2} width={w} height={d}
          fill={isSelected ? '#3B82F620' : room.color || '#F0F8FF20'}
          stroke={isSelected ? '#FF6B35' : room.border_color || '#4A90D9'}
          strokeWidth={1.5 / zoom} dash={[8 / zoom, 4 / zoom]}
        />
        <Text x={-w / 2} y={-d / 2 + 8 / zoom} width={w}
          text={room.name || 'Room'}
          fontSize={12 / zoom} fill={room.border_color || '#4A90D9'}
          align="center" fontStyle="bold"
        />
        {room.width && room.depth && (
          <Text x={-w / 2} y={8 / zoom} width={w}
            text={`${(room.width / 1000).toFixed(1)}m × ${(room.depth / 1000).toFixed(1)}m`}
            fontSize={9 / zoom} fill="#888" align="center"
          />
        )}
      </Group>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-surface-950"
      style={{ cursor: activeTool === TOOLS.PAN ? 'grab' : activeTool === TOOLS.SELECT ? 'default' : 'crosshair' }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panOffset.x}
        y={panOffset.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        {/* Grid Layer */}
        <Layer listening={false}>{renderGrid()}</Layer>

        {/* Elements Layer */}
        <Layer>
          {/* Walls */}
          {archLayer?.visible && elements.walls?.map(renderWall)}

          {/* Columns */}
          {structLayer?.visible && elements.columns?.map(renderColumn)}

          {/* Beams */}
          {structLayer?.visible && elements.beams?.map(beam => {
            if (!beam?.start_point || !beam?.end_point) return null;
            const s = SCALE_FACTOR;
            const id = beam._id || beam.canvas_id;
            const isSelected = selectedElementIds.includes(id);
            return (
              <Line key={id}
                points={[beam.start_point.x * s, beam.start_point.y * s, beam.end_point.x * s, beam.end_point.y * s]}
                stroke={isSelected ? '#FF6B35' : '#90909080'}
                strokeWidth={(beam.width || 230) * s} lineCap="round"
                dash={[8 / zoom, 4 / zoom]}
                onClick={(e) => handleElementClick(id, 'beam', e)}
              />
            );
          })}

          {/* Doors */}
          {archLayer?.visible && elements.doors?.map(renderDoor)}

          {/* Windows */}
          {archLayer?.visible && elements.windows?.map(renderWindow)}

          {/* Stairs */}
          {archLayer?.visible && elements.stairs?.map(renderStair)}

          {/* Furniture */}
          {furnLayer?.visible && elements.furniture?.map(renderFurniture)}

          {/* Slabs */}
          {structLayer?.visible && elements.slabs?.map(renderSlab)}

          {/* Roofs */}
          {structLayer?.visible && elements.roofs?.map(renderRoof)}

          {/* Foundations */}
          {structLayer?.visible && elements.foundations?.map(renderFoundation)}

          {/* Railings */}
          {archLayer?.visible && elements.railings?.map(renderRailing)}

          {/* Ceilings */}
          {archLayer?.visible && elements.ceilings?.map(renderCeiling)}

          {/* Rooms */}
          {archLayer?.visible && elements.rooms?.map(renderRoom)}

          {/* MEP Overlays */}
          {elecLayer?.visible && <ElectricalOverlay elements={electricalElements} zoom={zoom} />}
          {plumbLayer?.visible && <PlumbingOverlay elements={plumbingElements} zoom={zoom} />}
          {hvacLayer?.visible && <HVACOverlay elements={hvacElements} zoom={zoom} />}
          {solarLayer?.visible && <SolarOverlay elements={solarElements} zoom={zoom} />}
          {/* Drawing preview */}
          {renderDrawPreview()}
        </Layer>
      </Stage>
    </div>
  );
}
