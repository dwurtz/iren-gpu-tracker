import React, { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';
import { useModalBackdrop } from './ModalBackdrop';

export interface ProfitabilitySettings {
  gpusPerMW: {
    b200: number;
    b300: number;
    gb300: number;
    'gb200 nvl72': number;
    'gb300 nvl72': number;
    h100: number;
    h200: number;
    mi350x: number;
  };
  upfrontGpuCost: {
    b200: number;
    b300: number;
    gb300: number;
    'gb200 nvl72': number;
    'gb300 nvl72': number;
    h100: number;
    h200: number;
    mi350x: number;
  };
  effectiveGpuCost: {
    b200: number;
    b300: number;
    gb300: number;
    'gb200 nvl72': number;
    'gb300 nvl72': number;
    h100: number;
    h200: number;
    mi350x: number;
  };
  installationCost: {
    b200: number; // per GPU
    b300: number; // per GPU
    gb300: number; // per GPU
    'gb200 nvl72': number; // per GPU
    'gb300 nvl72': number; // per GPU
    h100: number; // per GPU
    h200: number; // per GPU
    mi350x: number; // per GPU
  };
  gpuHourRate: {
    b200: number; // $ per GPU hour
    b300: number; // $ per GPU hour
    gb300: number; // $ per GPU hour
    'gb200 nvl72': number; // $ per GPU hour
    'gb300 nvl72': number; // $ per GPU hour
    h100: number; // $ per GPU hour
    h200: number; // $ per GPU hour
    mi350x: number; // $ per GPU hour
  };
  electricityCost: number; // per kWh
  datacenterOverhead: number; // per GPU per month
  electricalOverhead: number; // PUE multiplier
  utilizationRate: number; // percentage
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProfitabilitySettings;
  defaultSettings: ProfitabilitySettings;
  mode: 'default' | 'custom';
  onSave: (settings: ProfitabilitySettings, mode: 'default' | 'custom') => void;
  highlightField?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, defaultSettings, mode, onSave, highlightField }) => {
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  const [currentMode, setCurrentMode] = useState<'default' | 'custom'>(mode);
  const [formData, setFormData] = useState<ProfitabilitySettings>(settings);
  
  // Reset form data when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(mode);
      setFormData(mode === 'default' ? defaultSettings : settings);
    }
  }, [isOpen, mode, settings, defaultSettings]);

  // Function to get highlight classes for pulsing effect
  const getHighlightClass = (fieldName: string) => {
    if (highlightField === fieldName) {
      return "animate-pulse bg-yellow-200 border-yellow-400";
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, currentMode);
    onClose();
  };

  const updateNestedField = (path: string[], value: number) => {
    // Automatically switch to custom mode when user makes edits
    if (currentMode === 'default') {
      setCurrentMode('custom');
    }
    
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };
  
  const handleResetToDefault = () => {
    setCurrentMode('default');
    setFormData(defaultSettings);
  };
  
  const handleModeToggle = (newMode: 'default' | 'custom') => {
    setCurrentMode(newMode);
    if (newMode === 'default') {
      setFormData(defaultSettings);
    } else {
      setFormData(settings);
    }
  };

  useModalBackdrop(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-16 z-[10003]">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[85vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Settings className="mr-2" size={20} />
              Settings
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                type="button"
                onClick={() => handleModeToggle('default')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  currentMode === 'default'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Default
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('custom')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  currentMode === 'custom'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Custom
              </button>
            </div>
            
            {currentMode === 'custom' && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-sm text-emerald-600 hover:text-emerald-700 underline"
              >
                Reset to default
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">

        <form onSubmit={handleSubmit} className="space-y-6">



          {/* GPU Settings Table */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-3">GPU Settings</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">Chip Type</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">GPUs/MW</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">Upfront Cost ($/GPU)</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">Installation ($/GPU)</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">Hour Rate ($/hr)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">B200</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.gpusPerMW.b200}
                        onChange={(e) => updateNestedField(['gpusPerMW', 'b200'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpusPerMW.b200')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.upfrontGpuCost.b200}
                        onChange={(e) => updateNestedField(['upfrontGpuCost', 'b200'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('upfrontGpuCost.b200')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.installationCost.b200}
                        onChange={(e) => updateNestedField(['installationCost', 'b200'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('installationCost.b200')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpuHourRate.b200}
                        onChange={(e) => updateNestedField(['gpuHourRate', 'b200'], parseFloat(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpuHourRate.b200')}`}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">B300</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.gpusPerMW.b300}
                        onChange={(e) => updateNestedField(['gpusPerMW', 'b300'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpusPerMW.b300')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.upfrontGpuCost.b300}
                        onChange={(e) => updateNestedField(['upfrontGpuCost', 'b300'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('upfrontGpuCost.b300')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.installationCost.b300}
                        onChange={(e) => updateNestedField(['installationCost', 'b300'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('installationCost.b300')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpuHourRate.b300}
                        onChange={(e) => updateNestedField(['gpuHourRate', 'b300'], parseFloat(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpuHourRate.b300')}`}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">GB300</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.gpusPerMW.gb300}
                        onChange={(e) => updateNestedField(['gpusPerMW', 'gb300'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpusPerMW.gb300')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.upfrontGpuCost.gb300}
                        onChange={(e) => updateNestedField(['upfrontGpuCost', 'gb300'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('upfrontGpuCost.gb300')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.installationCost.gb300}
                        onChange={(e) => updateNestedField(['installationCost', 'gb300'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('installationCost.gb300')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpuHourRate.gb300}
                        onChange={(e) => updateNestedField(['gpuHourRate', 'gb300'], parseFloat(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpuHourRate.gb300')}`}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">GB200 NVL72</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.gpusPerMW['gb200 nvl72']}
                        onChange={(e) => updateNestedField(['gpusPerMW', 'gb200 nvl72'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpusPerMW.gb200 nvl72')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.upfrontGpuCost['gb200 nvl72']}
                        onChange={(e) => updateNestedField(['upfrontGpuCost', 'gb200 nvl72'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('upfrontGpuCost.gb200 nvl72')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.installationCost['gb200 nvl72']}
                        onChange={(e) => updateNestedField(['installationCost', 'gb200 nvl72'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('installationCost.gb200 nvl72')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpuHourRate['gb200 nvl72']}
                        onChange={(e) => updateNestedField(['gpuHourRate', 'gb200 nvl72'], parseFloat(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpuHourRate.gb200 nvl72')}`}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">GB300 NVL72</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.gpusPerMW['gb300 nvl72']}
                        onChange={(e) => updateNestedField(['gpusPerMW', 'gb300 nvl72'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpusPerMW.gb300 nvl72')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.upfrontGpuCost['gb300 nvl72']}
                        onChange={(e) => updateNestedField(['upfrontGpuCost', 'gb300 nvl72'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('upfrontGpuCost.gb300 nvl72')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.installationCost['gb300 nvl72']}
                        onChange={(e) => updateNestedField(['installationCost', 'gb300 nvl72'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('installationCost.gb300 nvl72')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpuHourRate['gb300 nvl72']}
                        onChange={(e) => updateNestedField(['gpuHourRate', 'gb300 nvl72'], parseFloat(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpuHourRate.gb300 nvl72')}`}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">H100</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.gpusPerMW.h100}
                        onChange={(e) => updateNestedField(['gpusPerMW', 'h100'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpusPerMW.h100')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.upfrontGpuCost.h100}
                        onChange={(e) => updateNestedField(['upfrontGpuCost', 'h100'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('upfrontGpuCost.h100')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.installationCost.h100}
                        onChange={(e) => updateNestedField(['installationCost', 'h100'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('installationCost.h100')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpuHourRate.h100}
                        onChange={(e) => updateNestedField(['gpuHourRate', 'h100'], parseFloat(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpuHourRate.h100')}`}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">H200</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.gpusPerMW.h200}
                        onChange={(e) => updateNestedField(['gpusPerMW', 'h200'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpusPerMW.h200')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.upfrontGpuCost.h200}
                        onChange={(e) => updateNestedField(['upfrontGpuCost', 'h200'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('upfrontGpuCost.h200')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.installationCost.h200}
                        onChange={(e) => updateNestedField(['installationCost', 'h200'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('installationCost.h200')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpuHourRate.h200}
                        onChange={(e) => updateNestedField(['gpuHourRate', 'h200'], parseFloat(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpuHourRate.h200')}`}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 font-medium">MI350X</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.gpusPerMW.mi350x}
                        onChange={(e) => updateNestedField(['gpusPerMW', 'mi350x'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpusPerMW.mi350x')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.upfrontGpuCost.mi350x}
                        onChange={(e) => updateNestedField(['upfrontGpuCost', 'mi350x'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('upfrontGpuCost.mi350x')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={formData.installationCost.mi350x}
                        onChange={(e) => updateNestedField(['installationCost', 'mi350x'], parseInt(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('installationCost.mi350x')}`}
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpuHourRate.mi350x}
                        onChange={(e) => updateNestedField(['gpuHourRate', 'mi350x'], parseFloat(e.target.value))}
                        className={`w-full border-0 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${getHighlightClass('gpuHourRate.mi350x')}`}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Shared Settings */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Shared Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Electricity Cost ($/kWh)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.electricityCost}
                    onChange={(e) => {
                      if (currentMode === 'default') setCurrentMode('custom');
                      setFormData({...formData, electricityCost: parseFloat(e.target.value)});
                    }}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('electricityCost')}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datacenter Overhead ($ per GPU per month)
                  </label>
                  <input
                    type="number"
                    value={formData.datacenterOverhead}
                    onChange={(e) => {
                      if (currentMode === 'default') setCurrentMode('custom');
                      setFormData({...formData, datacenterOverhead: parseInt(e.target.value)});
                    }}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('datacenterOverhead')}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Electrical Overhead (PUE multiplier)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.electricalOverhead}
                    onChange={(e) => {
                      if (currentMode === 'default') setCurrentMode('custom');
                      setFormData({...formData, electricalOverhead: parseFloat(e.target.value)});
                    }}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('electricalOverhead')}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilization Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.utilizationRate}
                  onChange={(e) => {
                    if (currentMode === 'default') setCurrentMode('custom');
                    setFormData({...formData, utilizationRate: parseInt(e.target.value)});
                  }}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('utilizationRate')}`}
                />
              </div>
            </div>
          </div>

        </form>
        </div>
        <div className="p-6">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-400 text-white rounded-md hover:bg-green-500"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
