import { useSelector, useDispatch } from 'react-redux';
import { undo } from '../../../redux/slices/bimSlice';
import { Clock, RotateCcw, Plus, Trash2, Edit3, Move } from 'lucide-react';

const ACTION_ICONS = {
  add: Plus,
  delete: Trash2,
  update: Edit3,
  move: Move,
};

const ACTION_COLORS = {
  add: 'text-green-400',
  delete: 'text-red-400',
  update: 'text-blue-400',
  move: 'text-amber-400',
};

export default function HistoryPanel() {
  const dispatch = useDispatch();
  const { undoStack, redoStack } = useSelector(s => s.bim);

  const allHistory = [
    ...undoStack.map((item, i) => ({ ...item, index: i, source: 'undo' })),
  ].reverse();

  const handleUndoTo = (index) => {
    const steps = undoStack.length - index;
    for (let i = 0; i < steps; i++) {
      dispatch(undo());
    }
  };

  return (
    <div className="flex-1 overflow-y-auto text-[11px]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-surface-800/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-surface-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium">Action History</span>
        </div>
        <span className="text-[9px] text-surface-600">{undoStack.length} actions</span>
      </div>

      {/* Current State */}
      <div className="px-3 py-1.5 border-b border-surface-800/30">
        <div className="flex items-center gap-1.5 text-primary-400">
          <div className="w-2 h-2 rounded-full bg-primary-500" />
          <span className="font-semibold text-[10px]">Current State</span>
        </div>
      </div>

      {/* History Items */}
      <div className="py-1">
        {allHistory.length === 0 ? (
          <div className="text-center py-8 text-surface-500 text-xs">
            <RotateCcw className="w-8 h-8 mx-auto mb-2 text-surface-700" />
            No history yet.<br />Start drawing to see actions.
          </div>
        ) : (
          allHistory.map((item, i) => {
            const Icon = ACTION_ICONS[item.type] || Edit3;
            const color = ACTION_COLORS[item.type] || 'text-surface-400';

            return (
              <button
                key={i}
                onClick={() => handleUndoTo(item.index)}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-surface-800/30 transition-colors text-left group"
              >
                <div className="relative">
                  <div className="w-px h-full absolute left-[5px] top-4 bg-surface-800" />
                  <Icon className={`w-2.5 h-2.5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-surface-300 capitalize">{item.type || 'action'}</span>
                </div>
                <span className="text-[9px] text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Undo to here
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Redo Stack */}
      {redoStack.length > 0 && (
        <>
          <div className="px-3 py-1.5 border-t border-surface-800/50">
            <span className="text-[9px] text-surface-600 font-medium">
              {redoStack.length} redoable action{redoStack.length > 1 ? 's' : ''}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
