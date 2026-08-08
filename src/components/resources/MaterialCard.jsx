import { formatCurrency } from '../../utils/helpers';
import { Package, AlertTriangle } from 'lucide-react';

export default function MaterialCard({ material, onClick }) {
  const stockPercent = material.quantity > 0 ? Math.round((material.available_stock / material.quantity) * 100) : 0;
  const isLowStock = material.available_stock <= (material.low_stock_threshold || 10);

  return (
    <div onClick={onClick} className="glass-card p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-600" />
          <span className="text-xs font-medium text-surface-400 capitalize">{material.category || 'General'}</span>
        </div>
        {isLowStock && <AlertTriangle className="w-4 h-4 text-amber-500" />}
      </div>
      <h4 className="font-medium text-surface-900 dark:text-white text-sm mb-1 truncate">{material.material_name}</h4>
      <p className="text-xs text-surface-500 mb-3">{material.supplier || 'No supplier'}</p>
      <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(stockPercent, 100)}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-surface-400">
        <span>{material.available_stock} / {material.quantity} {material.unit}</span>
        <span>{formatCurrency(material.cost)}</span>
      </div>
    </div>
  );
}
