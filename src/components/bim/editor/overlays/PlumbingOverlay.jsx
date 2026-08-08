import { Group, Circle, Rect, Line, Text, Arrow } from 'react-konva';
import { useSelector, useDispatch } from 'react-redux';
import { selectElement } from '../../../../redux/slices/bimSlice';
import { SCALE_FACTOR } from '../../../../utils/bimConstants';

const PLUMB_COLORS = {
  water_pipe: '#2196F3',
  drain_pipe: '#4CAF50',
  sewage_pipe: '#795548',
  rain_water_pipe: '#00BCD4',
  toilet: '#9E9E9E',
  sink: '#607D8B',
  shower: '#03A9F4',
  bathtub: '#0288D1',
  wash_basin: '#78909C',
  water_tank: '#1565C0',
  pump: '#F44336',
  septic_tank: '#5D4037',
  valve: '#FF9800',
  water_heater: '#E91E63',
};

const PLUMB_ICONS = {
  toilet: 'WC', sink: '🚰', shower: '🚿', bathtub: '🛁',
  wash_basin: 'WB', water_tank: 'OHT', pump: 'P',
  septic_tank: 'ST', valve: 'V', water_heater: 'GY',
};

export default function PlumbingOverlay({ elements = [], zoom = 1 }) {
  const dispatch = useDispatch();
  const { selectedElementIds } = useSelector(s => s.bim);
  const s = SCALE_FACTOR;

  const handleClick = (id, e) => {
    e.cancelBubble = true;
    dispatch(selectElement({ id, type: 'plumbing', multi: e.evt?.shiftKey }));
  };

  // Separate pipes and fixtures
  const pipes = elements.filter(el => el.element_type?.includes('pipe'));
  const fixtures = elements.filter(el => !el.element_type?.includes('pipe'));

  return (
    <Group>
      {/* Pipes */}
      {pipes.map((pipe, i) => {
        const id = pipe._id || pipe.canvas_id;
        const isSelected = selectedElementIds.includes(id);
        const color = isSelected ? '#FF6B35' : PLUMB_COLORS[pipe.element_type] || '#2196F3';

        if (pipe.pipe_route?.length > 1) {
          const points = pipe.pipe_route.flatMap(p => [p.x * s, p.y * s]);
          const diameter = (pipe.pipe_diameter || 20) / 10;
          return (
            <Group key={id || i}>
              <Line points={points} stroke={color} strokeWidth={diameter / zoom}
                lineCap="round" lineJoin="round" opacity={0.7}
                onClick={(e) => handleClick(id, e)} />
              {/* Flow direction arrow at midpoint */}
              {points.length >= 4 && (
                <Text x={points[Math.floor(points.length / 2) - 1]}
                  y={points[Math.floor(points.length / 2)] - 10 / zoom}
                  text={`Ø${pipe.pipe_diameter || 20}`}
                  fontSize={7 / zoom} fill={color} />
              )}
            </Group>
          );
        }

        if (pipe.position) {
          return (
            <Circle key={id || i} x={pipe.position.x * s} y={pipe.position.y * s}
              radius={5 / zoom} fill={color + '40'} stroke={color} strokeWidth={1.5 / zoom}
              onClick={(e) => handleClick(id, e)} />
          );
        }
        return null;
      })}

      {/* Fixtures */}
      {fixtures.map((fix, i) => {
        const id = fix._id || fix.canvas_id;
        const x = (fix.position?.x || 0) * s;
        const y = (fix.position?.y || 0) * s;
        const isSelected = selectedElementIds.includes(id);
        const color = isSelected ? '#FF6B35' : PLUMB_COLORS[fix.element_type] || '#607D8B';
        const label = PLUMB_ICONS[fix.element_type] || 'PL';
        const isLarge = ['water_tank', 'septic_tank', 'pump'].includes(fix.element_type);
        const size = isLarge ? 14 : 9;

        return (
          <Group key={id || i} x={x} y={y} rotation={fix.rotation || 0}
            onClick={(e) => handleClick(id, e)}>
            {isLarge ? (
              <Rect x={-size / zoom} y={-size / zoom} width={size * 2 / zoom} height={size * 2 / zoom}
                fill={color + '30'} stroke={color} strokeWidth={1.5 / zoom} cornerRadius={2 / zoom} />
            ) : (
              <Circle radius={size / zoom} fill={color + '25'} stroke={color} strokeWidth={1.5 / zoom} />
            )}
            <Text x={-size / zoom} y={-4 / zoom} width={size * 2 / zoom} text={label}
              fontSize={7 / zoom} fill={color} align="center" fontStyle="bold" />
          </Group>
        );
      })}
    </Group>
  );
}
