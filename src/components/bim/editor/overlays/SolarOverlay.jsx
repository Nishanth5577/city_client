import { Group, Rect, Line, Text } from 'react-konva';
import { useSelector, useDispatch } from 'react-redux';
import { selectElement } from '../../../../redux/slices/bimSlice';
import { SCALE_FACTOR } from '../../../../utils/bimConstants';

export default function SolarOverlay({ elements = [], zoom = 1 }) {
  const dispatch = useDispatch();
  const { selectedElementIds } = useSelector(s => s.bim);
  const s = SCALE_FACTOR;

  const handleClick = (id, e) => {
    e.cancelBubble = true;
    dispatch(selectElement({ id, type: 'solar', multi: e.evt?.shiftKey }));
  };

  return (
    <Group>
      {elements.map((solar, i) => {
        const id = solar._id || solar.canvas_id;
        const isSelected = selectedElementIds.includes(id);

        // Render panel array
        if (solar.panels_layout?.length > 0) {
          return (
            <Group key={id || i}>
              {solar.panels_layout.map((panel, pi) => {
                const px = (panel.x || 0) * s;
                const py = (panel.y || 0) * s;
                const pw = (panel.width || 1000) * s;
                const ph = (panel.height || 1700) * s;
                return (
                  <Rect key={pi} x={px} y={py} width={pw} height={ph}
                    fill={isSelected ? '#FF6B3520' : '#1565C020'}
                    stroke={isSelected ? '#FF6B35' : '#1565C0'}
                    strokeWidth={1 / zoom} rotation={panel.rotation || 0}
                    onClick={(e) => handleClick(id, e)} />
                );
              })}
              {/* System label */}
              <Text x={(solar.panels_layout[0]?.x || 0) * s}
                y={(solar.panels_layout[0]?.y || 0) * s - 14 / zoom}
                text={`☀ ${solar.total_capacity_kw || 0} kWp | ${solar.num_panels || 0} panels`}
                fontSize={9 / zoom} fill="#1565C0" fontStyle="bold" />
            </Group>
          );
        }

        // Fallback: single solar system marker
        if (solar.position) {
          const x = solar.position.x * s;
          const y = solar.position.y * s;
          return (
            <Group key={id || i} x={x} y={y} onClick={(e) => handleClick(id, e)}>
              <Rect x={-20 / zoom} y={-15 / zoom} width={40 / zoom} height={30 / zoom}
                fill={isSelected ? '#FF6B3520' : '#FFA72620'} stroke={isSelected ? '#FF6B35' : '#FFA726'}
                strokeWidth={1.5 / zoom} cornerRadius={3 / zoom} />
              {/* Solar cell grid */}
              <Line points={[-10 / zoom, -15 / zoom, -10 / zoom, 15 / zoom]} stroke="#FFA72680" strokeWidth={0.5 / zoom} />
              <Line points={[0, -15 / zoom, 0, 15 / zoom]} stroke="#FFA72680" strokeWidth={0.5 / zoom} />
              <Line points={[10 / zoom, -15 / zoom, 10 / zoom, 15 / zoom]} stroke="#FFA72680" strokeWidth={0.5 / zoom} />
              <Line points={[-20 / zoom, 0, 20 / zoom, 0]} stroke="#FFA72680" strokeWidth={0.5 / zoom} />
              <Text x={-20 / zoom} y={-6 / zoom} width={40 / zoom} text="☀"
                fontSize={10 / zoom} fill="#FFA726" align="center" />
              <Text x={-20 / zoom} y={16 / zoom} width={40 / zoom}
                text={`${solar.total_capacity_kw || 0}kW`}
                fontSize={7 / zoom} fill="#FFA726" align="center" fontStyle="bold" />
            </Group>
          );
        }
        return null;
      })}
    </Group>
  );
}
