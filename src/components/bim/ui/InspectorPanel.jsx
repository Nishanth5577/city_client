import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Layers, Box, Clock, Palette, GitBranch, MessageSquare } from 'lucide-react';
import PropertiesPanel from './PropertiesPanel';
import LayerPanel from './LayerPanel';
import ObjectTree from './ObjectTree';
import HistoryPanel from './HistoryPanel';
import MaterialBrowser from './MaterialBrowser';

const TABS = [
  { id: 'properties', label: 'Properties', icon: Box },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'materials', label: 'Materials', icon: Palette },
  { id: 'tree', label: 'Tree', icon: GitBranch },
  { id: 'history', label: 'History', icon: Clock },
];

export default function InspectorPanel() {
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-surface-800/50 bg-surface-900/50">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`flex-1 flex items-center justify-center py-2 transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400 bg-surface-800/30'
                  : 'border-transparent text-surface-500 hover:text-surface-300 hover:bg-surface-800/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'properties' && <PropertiesPanel />}
        {activeTab === 'layers' && <LayerPanel />}
        {activeTab === 'materials' && <MaterialBrowser />}
        {activeTab === 'tree' && <ObjectTree />}
        {activeTab === 'history' && <HistoryPanel />}
      </div>
    </div>
  );
}
