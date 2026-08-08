import { formatCurrency, formatDate } from '../../utils/helpers';
import { Wrench, Calendar } from 'lucide-react';

const conditionColors = {
  good: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  fair: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  needs_repair: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  out_of_service: 'text-surface-500 bg-surface-100 dark:bg-surface-800',
};

export default function EquipmentCard({ equipment, onClick }) {
  const condStyle = conditionColors[equipment.condition] || conditionColors.fair;

  return (
    <div onClick={onClick} className="glass-card p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary-600" />
          <span className="text-xs font-medium text-surface-400 capitalize">{equipment.type || 'General'}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg capitalize ${condStyle}`}>
          {equipment.condition?.replace(/_/g, ' ') || 'Unknown'}
        </span>
      </div>
      <h4 className="font-medium text-surface-900 dark:text-white text-sm mb-1 truncate">{equipment.equipment_name}</h4>
      <p className="text-xs text-surface-500 mb-3">{equipment.assigned_project?.project_name || 'Unassigned'}</p>
      <div className="flex items-center justify-between text-xs text-surface-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {equipment.maintenance_date ? formatDate(equipment.maintenance_date) : 'No date'}
        </span>
        <span>{formatCurrency(equipment.cost_per_day)}/day</span>
      </div>
    </div>
  );
}
