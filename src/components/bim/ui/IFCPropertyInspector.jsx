// ═══════════════════════════════════════════════════════════════
// IFCPropertyInspector — Displays IFC property sets for elements
// Shows Pset_*, Qto_* data, material associations, and classification
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react';
import {
  ChevronDown, ChevronRight, List, Hash, Ruler, Box,
  Layers, Tag, Info, Database,
} from 'lucide-react';

export default function IFCPropertyInspector({ element, ifcProperties }) {
  const [expandedSets, setExpandedSets] = useState({});

  if (!element && !ifcProperties) {
    return (
      <div className="p-4 text-center text-surface-500 text-xs">
        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Select an element to view its IFC properties</p>
      </div>
    );
  }

  const properties = ifcProperties || element?.properties || {};
  const psetEntries = Object.entries(properties);

  const toggleSet = (name) => {
    setExpandedSets(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const getValueDisplay = (value) => {
    if (value === null || value === undefined) return <span className="text-surface-500 italic">null</span>;
    if (typeof value === 'boolean') return (
      <span className={value ? 'text-emerald-400' : 'text-red-400'}>
        {value ? 'Yes' : 'No'}
      </span>
    );
    if (typeof value === 'number') return <span className="text-blue-400">{value.toLocaleString()}</span>;
    return <span className="text-surface-200">{String(value)}</span>;
  };

  const getSetIcon = (name) => {
    if (name.startsWith('Qto_')) return Ruler;
    if (name.startsWith('Pset_')) return Tag;
    return List;
  };

  return (
    <div className="space-y-2">
      {/* Element Header */}
      {element && (
        <div className="bg-surface-800/50 rounded-xl p-3 border border-surface-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Box className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-semibold text-white">{element.name || 'Element'}</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {element.ifc_guid && (
              <div className="col-span-2">
                <span className="text-surface-500">GUID: </span>
                <span className="text-surface-300 font-mono text-[9px]">{element.ifc_guid}</span>
              </div>
            )}
            {element.source === 'ifc_import' && (
              <div className="col-span-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px]">
                  <Layers className="w-2.5 h-2.5" /> Imported from IFC
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property Sets */}
      {psetEntries.length === 0 ? (
        <div className="text-center py-6 text-surface-500 text-[11px]">
          <Info className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
          No IFC property sets available
        </div>
      ) : (
        psetEntries.map(([setName, setProps]) => {
          const Icon = getSetIcon(setName);
          const isExpanded = expandedSets[setName] !== false; // Default expanded
          const propEntries = typeof setProps === 'object' ? Object.entries(setProps) : [];

          return (
            <div key={setName} className="bg-surface-800/50 rounded-xl border border-surface-700/30 overflow-hidden">
              <button
                onClick={() => toggleSet(setName)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-surface-400" />
                  <span className="text-[11px] font-medium text-white">{setName}</span>
                  <span className="text-[9px] text-surface-500">({propEntries.length})</span>
                </div>
                {isExpanded ? <ChevronDown className="w-3 h-3 text-surface-400" /> : <ChevronRight className="w-3 h-3 text-surface-400" />}
              </button>

              {isExpanded && (
                <div className="border-t border-surface-700/30 px-3 py-2 space-y-1">
                  {propEntries.map(([propName, propValue]) => (
                    <div key={propName} className="flex items-center justify-between py-0.5 text-[10px]">
                      <span className="text-surface-400 truncate mr-2">{propName}</span>
                      {getValueDisplay(propValue)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
