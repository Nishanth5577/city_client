export const ROLES = { ADMIN: 'admin', PROJECT_MANAGER: 'project_manager', ENGINEER: 'engineer', SUPERVISOR: 'supervisor', WORKER: 'worker' };
export const PROJECT_STATUS_MAP = {
  planning: { label: 'Planning', color: 'badge-info' },
  active: { label: 'Active', color: 'badge-success' },
  on_hold: { label: 'On Hold', color: 'badge-warning' },
  delayed: { label: 'Delayed', color: 'badge-danger' },
  completed: { label: 'Completed', color: 'badge-success' },
  cancelled: { label: 'Cancelled', color: 'badge-neutral' },
};
export const TASK_STATUS_MAP = {
  pending: { label: 'Pending', color: 'badge-neutral' },
  in_progress: { label: 'In Progress', color: 'badge-info' },
  completed: { label: 'Completed', color: 'badge-success' },
  on_hold: { label: 'On Hold', color: 'badge-warning' },
  cancelled: { label: 'Cancelled', color: 'badge-danger' },
};
export const PRIORITY_MAP = {
  low: { label: 'Low', color: 'text-surface-500' },
  medium: { label: 'Medium', color: 'text-blue-500' },
  high: { label: 'High', color: 'text-orange-500' },
  critical: { label: 'Critical', color: 'text-red-500' },
};
export const CONSTRUCTION_STAGES = ['Planning', 'Foundation', 'Structure', 'Electrical', 'Plumbing', 'Interior', 'Finishing', 'Completed'];
export const EXPENSE_CATEGORIES = ['Material', 'Labor', 'Equipment', 'Transport', 'Subcontractor', 'Permits', 'Utilities', 'Miscellaneous'];
