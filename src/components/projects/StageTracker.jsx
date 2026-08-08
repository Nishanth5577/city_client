import { getProgressColor } from '../../utils/helpers';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const statusIcons = {
  completed: CheckCircle2,
  in_progress: Clock,
  not_started: AlertCircle,
};

const statusColors = {
  completed: 'text-emerald-500',
  in_progress: 'text-cyan-500',
  not_started: 'text-surface-400',
};

export default function StageTracker({ stages = [] }) {
  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const Icon = statusIcons[stage.status] || AlertCircle;
        const color = statusColors[stage.status] || 'text-surface-400';

        return (
          <div key={stage._id || i} className="flex items-center gap-4 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
            <div className="relative flex flex-col items-center">
              <Icon className={`w-5 h-5 ${color}`} />
              {i < stages.length - 1 && (
                <div className={`absolute top-6 w-0.5 h-6 ${stage.status === 'completed' ? 'bg-emerald-300' : 'bg-surface-200 dark:bg-surface-700'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-900 dark:text-white text-sm">{stage.stage_name?.replace(/_/g, ' ')}</p>
              <p className="text-xs text-surface-400 capitalize">{stage.status?.replace(/_/g, ' ')}</p>
            </div>
            <div className="w-20">
              <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(stage.completion_percentage || 0)}`} style={{ width: `${stage.completion_percentage || 0}%` }} />
              </div>
              <p className="text-[10px] text-surface-400 text-right mt-0.5">{stage.completion_percentage || 0}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
