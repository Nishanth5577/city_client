import { Group, Rect, Line, Circle, Text, Arrow } from 'react-konva';
import { useSelector, useDispatch } from 'react-redux';
import { selectElement } from '../../../../redux/slices/bimSlice';
import { SCALE_FACTOR } from '../../../../utils/bimConstants';

const HVAC_COLORS = {
  ac_unit: '#2196F3',
  duct: '#90CAF9',
  vent: '#64B5F6',
  exhaust_fan: '#FF7043',
  diffuser: '#4DB6AC',
  thermostat: '#AB47BC',
  air_handler: '#1565C0',
  cooling_unit: '#0D47A1',
  heating_unit: '#E53935',
};

export default function HVACOverlay({ elements = [], zoom = 1 }) {
  const dispatch = useDispatch();
  const { selectedElementIds } = useSelector(s => s.bim);
  const s = SCALE_FACTOR;

  const handleClick = (id, e) => {
    e.cancelBubble = true;
    dispatch(selectElement({ id, type: 'hvac', multi: e.evt?.shiftKey }));
  };

  // Ducts first, then units
  const ducts = elements.filter(el => el.element_type === 'duct');
  const units = elements.filter(el => el.element_type !== 'duct');

  return (
    <Group>
      {/* Duct routes */}
      {ducts.map((duct, i) => {
        const id = duct._id || duct.canvas_id;
        const isSelected = selectedElementIds.includes(id);
        const isSupply = duct.duct_type !== 'return';
        const color = isSelected ? '#FF6B35' : isSupply ? '#42A5F5' : '#EF5350';

        if (duct.duct_route?.length > 1) {
          const points = duct.duct_route.flatMap(p => [p.x * s, p.y * s]);
          const width = (duct.duct_width || 300) / 30;
          return (
            <Group key={id || i}>
              <Line points={points} stroke={color + '60'} strokeWidth={width / zoom}
                lineCap="round" lineJoin="round"
                onClick={(e) => handleClick(id, e)} />
              <Line points={points} stroke={color} strokeWidth={1 / zoom}
                dash={[6 / zoom, 3 / zoom]} />
              {/* Duct label */}
              {points.length >= 4 && (
                <Text x={points[0] + 3 / zoom} y={points[1] - 10 / zoom}
                  text={`${duct.duct_width || 300}×${duct.duct_height || 200}`}
                  fontSize={6 / zoom} fill={color} />
              )}
            </Group>
          );
        }
        return null;
      })}

      {/* HVAC units */}
      {units.map((unit, i) => {
        const id = unit._id || unit.canvas_id;
        const x = (unit.position?.x || 0) * s;
        const y = (unit.position?.y || 0) * s;
        const isSelected = selectedElementIds.includes(id);
        const color = isSelected ? '#FF6B35' : HVAC_COLORS[unit.element_type] || '#2196F3';

        if (unit.element_type === 'ac_unit') {
          return (
            <Group key={id || i} x={x} y={y} rotation={unit.rotation || 0}
              onClick={(e) => handleClick(id, e)}>
              <Rect x={-16 / zoom} y={-10 / zoom} width={32 / zoom} height={20 / zoom}
                fill={color + '25'} stroke={color} strokeWidth={1.5 / zoom} cornerRadius={3 / zoom} />
              <Text x={-16 / zoom} y={-6 / zoom} width={32 / zoom} text="AC"
                fontSize={9 / zoom} fill={color} align="center" fontStyle="bold" />
              {/* Capacity label */}
              <Text x={-16 / zoom} y={12 / zoom} width={32 / zoom}
                text={`${unit.capacity_btu ? (unit.capacity_btu / 12000).toFixed(1) : '?'}T`}
                fontSize={6 / zoom} fill={color} align="center" />
            </Group>
          );
        }

        if (unit.element_type === 'vent' || unit.element_type === 'diffuser') {
          return (
            <Group key={id || i} x={x} y={y} onClick={(e) => handleClick(id, e)}>
              <Circle radius={6 / zoom} fill={color + '20'} stroke={color} strokeWidth={1 / zoom} />
              <Line points={[-3 / zoom, 0, 3 / zoom, 0]} stroke={color} strokeWidth={0.8 / zoom} />
              <Line points={[0, -3 / zoom, 0, 3 / zoom]} stroke={color} strokeWidth={0.8 / zoom} />
            </Group>
          );
        }

        if (unit.element_type === 'exhaust_fan') {
          return (
            <Group key={id || i} x={x} y={y} onClick={(e) => handleClick(id, e)}>
              <Circle radius={8 / zoom} fill={color + '20'} stroke={color} strokeWidth={1.5 / zoom} />
              <Text x={-8 / zoom} y={-4 / zoom} width={16 / zoom} text="EF"
                fontSize={7 / zoom} fill={color} align="center" fontStyle="bold" />
            </Group>
          );
        }

        // Generic HVAC element
        return (
          <Group key={id || i} x={x} y={y} onClick={(e) => handleClick(id, e)}>
            <Rect x={-10 / zoom} y={-10 / zoom} width={20 / zoom} height={20 / zoom}
              fill={color + '20'} stroke={color} strokeWidth={1 / zoom} cornerRadius={2 / zoom} />
            <Text x={-10 / zoom} y={-4 / zoom} width={20 / zoom}
              text={unit.element_type?.charAt(0).toUpperCase() || 'H'}
              fontSize={8 / zoom} fill={color} align="center" fontStyle="bold" />
          </Group>
        );
      })}
    </Group>
  );
}
