const C = {
  active:    { bg:'#ECFDF5', c:'#059669', b:'#D1FAE5', l:'Active' },
  planning:  { bg:'#EFF6FF', c:'#2563EB', b:'#DBEAFE', l:'Planning' },
  completed: { bg:'#ECFDF5', c:'#059669', b:'#D1FAE5', l:'Completed' },
  delayed:   { bg:'#FEF2F2', c:'#DC2626', b:'#FECACA', l:'Delayed' },
  on_hold:   { bg:'#FFFBEB', c:'#D97706', b:'#FEF3C7', l:'On Hold' },
  cancelled: { bg:'#F5F5F0', c:'#78756E', b:'#E8E5E0', l:'Cancelled' },
  pending:   { bg:'#FFFBEB', c:'#D97706', b:'#FEF3C7', l:'Pending' },
  approved:  { bg:'#ECFDF5', c:'#059669', b:'#D1FAE5', l:'Approved' },
  rejected:  { bg:'#FEF2F2', c:'#DC2626', b:'#FECACA', l:'Rejected' },
  available: { bg:'#ECFDF5', c:'#059669', b:'#D1FAE5', l:'Available' },
  assigned:  { bg:'#EFF6FF', c:'#2563EB', b:'#DBEAFE', l:'Assigned' },
  on_leave:  { bg:'#FFFBEB', c:'#D97706', b:'#FEF3C7', l:'On Leave' },
  inactive:  { bg:'#F5F5F0', c:'#78756E', b:'#E8E5E0', l:'Inactive' },
  low:       { bg:'#ECFDF5', c:'#059669', b:'#D1FAE5', l:'Low Risk' },
  medium:    { bg:'#FFFBEB', c:'#D97706', b:'#FEF3C7', l:'Medium Risk' },
  high:      { bg:'#FEF2F2', c:'#DC2626', b:'#FECACA', l:'High Risk' },
  urgent:    { bg:'#FEF2F2', c:'#DC2626', b:'#FECACA', l:'Urgent' },
  normal:    { bg:'#EFF6FF', c:'#2563EB', b:'#DBEAFE', l:'Normal' },
  default:   { bg:'#F5F5F0', c:'#78756E', b:'#E8E5E0', l:'' },
};

export default function StatusBadge({ status, label, className = '' }) {
  const cfg = C[status?.toLowerCase()] || C.default;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md ${className}`}
      style={{ fontSize:'11px', fontWeight:600, background:cfg.bg, color:cfg.c, border:`1px solid ${cfg.b}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background:cfg.c, boxShadow:`0 0 4px ${cfg.c}30` }} />
      {label || cfg.l || status || 'Unknown'}
    </span>
  );
}
