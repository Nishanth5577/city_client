import { getInitials } from '../../utils/helpers';
import { Phone, MapPin, Briefcase } from 'lucide-react';

const availabilityColors = {
  available: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  assigned: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  on_leave: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
};

export default function WorkerCard({ worker, onClick }) {
  return (
    <div onClick={onClick} className="glass-card p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {getInitials(worker.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-surface-900 dark:text-white text-sm truncate">{worker.name}</h4>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-lg capitalize ${availabilityColors[worker.availability] || availabilityColors.available}`}>
            {worker.availability?.replace(/_/g, ' ') || 'Available'}
          </span>
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-surface-500">
        <div className="flex items-center gap-2">
          <Briefcase className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{worker.skill || 'General Labor'}</span>
        </div>
        {worker.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span>{worker.phone}</span>
          </div>
        )}
        {worker.assigned_project?.project_name && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{worker.assigned_project.project_name}</span>
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs text-surface-400">
        <span>{worker.experience || 0} yrs exp</span>
        <span>Attendance: {worker.attendance?.length || 0} days</span>
      </div>
    </div>
  );
}
