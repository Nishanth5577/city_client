import { Group, Circle, Rect, Line, Text, RegularPolygon } from 'react-konva';
import { useSelector, useDispatch } from 'react-redux';
import { selectElement } from '../../../../redux/slices/bimSlice';
import { SCALE_FACTOR } from '../../../../utils/bimConstants';

const ELEC_COLORS = {
  switch: '#FFD700',
  socket: '#FF8C00',
  light: '#FFFF00',
  fan: '#87CEEB',
  distribution_board: '#FF4444',
  main_panel: '#CC0000',
  fire_alarm: '#FF0000',
  smoke_detector: '#FF6347',
  cctv: '#4169E1',
  internet_point: '#00CED1',
  conduit: '#A0A0A0',
  wire: '#FFD700',
};

const ELEC_ICONS = {
  switch: 'S',
  socket: '⏚',
  light: '💡',
  fan: 'F',
  distribution_board: 'DB',
  main_panel: 'MP',
  fire_alarm: '🔥',
  smoke_detector: 'SD',
  cctv: '📷',
  internet_point: 'NET',
};

export default function ElectricalOverlay({ elements = [], zoom = 1 }) {
  const dispatch = useDispatch();
  const { selectedElementIds } = useSelector(s => s.bim);
  const s = SCALE_FACTOR;

  const handleClick = (id, e) => {
    e.cancelBubble = true;
    dispatch(selectElement({ id, type: 'electrical', multi: e.evt?.shiftKey }));
  };

  return (
    <Group>
      {/* Wire routes first (behind elements) */}
      {elements.filter(el => el.wire_route?.length > 1).map((el, i) => {
        const id = el._id || el.canvas_id;
        const points = el.wire_route.flatMap(p => [p.x * s, p.y * s]);
        const circuitColors = ['#FFD700', '#FF6B35', '#4ECDC4', '#E74C3C', '#9B59B6', '#2ECC71', '#3498DB', '#F39C12'];
        const circuitIdx = parseInt(el.circuit_number?.replace(/\D/g, '') || '0') % circuitColors.length;
        return (
          <Line key={`wire-${id || i}`} points={points}
            stroke={circuitColors[circuitIdx]} strokeWidth={1.5 / zoom}
            dash={[4 / zoom, 2 / zoom]} lineCap="round" lineJoin="round"
            onClick={(e) => handleClick(id, e)} />
        );
      })}

      {/* Elements */}
      {elements.map((el, i) => {
        const id = el._id || el.canvas_id;
        const x = (el.position?.x || 0) * s;
        const y = (el.position?.y || 0) * s;
        const isSelected = selectedElementIds.includes(id);
        const color = isSelected ? '#FF6B35' : ELEC_COLORS[el.element_type] || '#FFD700';
        const label = ELEC_ICONS[el.element_type] || 'E';
        const size = el.element_type === 'distribution_board' || el.element_type === 'main_panel' ? 14 : 8;

        if (el.element_type === 'distribution_board' || el.element_type === 'main_panel') {
          return (
            <Group key={id || i} x={x} y={y} onClick={(e) => handleClick(id, e)}>
              <Rect x={-size / zoom} y={-size / zoom} width={size * 2 / zoom} height={size * 2 / zoom}
                fill={color} stroke={isSelected ? '#FFF' : '#333'} strokeWidth={1.5 / zoom} cornerRadius={2 / zoom} />
              <Text x={-size / zoom} y={-5 / zoom} width={size * 2 / zoom} text={label}
                fontSize={8 / zoom} fill="#FFF" align="center" fontStyle="bold" />
            </Group>
          );
        }

        if (el.element_type === 'light') {
          return (
            <Group key={id || i} x={x} y={y} onClick={(e) => handleClick(id, e)}>
              <Circle radius={6 / zoom} fill={color + '40'} stroke={color} strokeWidth={1.5 / zoom} />
              <Line points={[-4 / zoom, 0, 4 / zoom, 0]} stroke={color} strokeWidth={1 / zoom} />
              <Line points={[0, -4 / zoom, 0, 4 / zoom]} stroke={color} strokeWidth={1 / zoom} />
            </Group>
          );
        }

        return (
          <Group key={id || i} x={x} y={y} onClick={(e) => handleClick(id, e)}>
            <Circle radius={size / zoom} fill={color + '30'} stroke={color} strokeWidth={1.5 / zoom} />
            <Text x={-size / zoom} y={-4 / zoom} width={size * 2 / zoom} text={label}
              fontSize={7 / zoom} fill={color} align="center" fontStyle="bold" />
          </Group>
        );
      })}
    </Group>
  );
}
