import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { useModalBackdrop } from './ModalBackdrop';

export interface ProfitabilitySettings {
  gpusPerMW: {
    b200: number;
    gb300: number;
  };
  upfrontGpuCost: {
    b200: number;
    gb300: number;
  };
  gpuPowerConsumption: {
    b200: number; // kW per GPU
    gb300: number; // kW per GPU
  };
  interestRate: number; // 9% for first 3 years
  electricityCost: number; // per kWh
  installationCost: number; // per GPU
  datacenterOverhead: number; // per GPU per month
  electricalOverhead: number; // PUE multiplier
  utilizationRate: number; // percentage
  gpuHourRate: number; // $ per GPU hour
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProfitabilitySettings;
  onSave: (settings: ProfitabilitySettings) => void;
  highlightField?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, highlightField }) => {
  const [formData, setFormData] = useState<ProfitabilitySettings>(settings);

  // Function to get highlight classes for pulsing effect
  const getHighlightClass = (fieldName: string) => {
    if (highlightField === fieldName) {
      return "animate-pulse bg-yellow-200 border-yellow-400";
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const updateNestedField = (path: string[], value: number) => {
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

  useModalBackdrop(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-16 z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[75vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center">
            <Settings className="mr-2" size={20} />
            Profitability Settings
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GPU Density */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-3">Number of GPUs/MW</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  B200s
                </label>
                <input
                  type="number"
                  value={formData.gpusPerMW.b200}
                  onChange={(e) => updateNestedField(['gpusPerMW', 'b200'], parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GB300s
                </label>
                <input
                  type="number"
                  value={formData.gpusPerMW.gb300}
                  onChange={(e) => updateNestedField(['gpusPerMW', 'gb300'], parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>



          {/* GPU Power Consumption */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-3">GPU Power Consumption (kW per GPU)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  B200
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.gpuPowerConsumption.b200}
                  onChange={(e) => updateNestedField(['gpuPowerConsumption', 'b200'], parseFloat(e.target.value))}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('gpuPowerConsumption.b200')}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GB300
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.gpuPowerConsumption.gb300}
                  onChange={(e) => updateNestedField(['gpuPowerConsumption', 'gb300'], parseFloat(e.target.value))}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('gpuPowerConsumption.gb300')}`}
                />
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-3">Costs</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Upfront GPU Cost</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">B200</label>
                    <input
                      type="number"
                      value={formData.upfrontGpuCost.b200}
                      onChange={(e) => updateNestedField(['upfrontGpuCost', 'b200'], parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">GB300 (liquid cooled)</label>
                    <input
                      type="number"
                      value={formData.upfrontGpuCost.gb300}
                      onChange={(e) => updateNestedField(['upfrontGpuCost', 'gb300'], parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (first 3 years) %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({...formData, interestRate: parseFloat(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Electricity Cost ($/kWh)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.electricityCost}
                    onChange={(e) => setFormData({...formData, electricityCost: parseFloat(e.target.value)})}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('electricityCost')}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Installation Cost (per GPU)
                  </label>
                  <input
                    type="number"
                    value={formData.installationCost}
                    onChange={(e) => setFormData({...formData, installationCost: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datacenter Overhead (per GPU per month)
                  </label>
                  <input
                    type="number"
                    value={formData.datacenterOverhead}
                    onChange={(e) => setFormData({...formData, datacenterOverhead: parseInt(e.target.value)})}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('datacenterOverhead')}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Electrical Overhead (PUE multiplier)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.electricalOverhead}
                  onChange={(e) => setFormData({...formData, electricalOverhead: parseFloat(e.target.value)})}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('electricalOverhead')}`}
                />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div>
            <h3 className="text-lg font-medium mb-3">Revenue</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilization Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.utilizationRate}
                  onChange={(e) => setFormData({...formData, utilizationRate: parseInt(e.target.value)})}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('utilizationRate')}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GPU Hour Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.gpuHourRate}
                  onChange={(e) => setFormData({...formData, gpuHourRate: parseFloat(e.target.value)})}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('gpuHourRate')}`}
                />
              </div>
            </div>
          </div>

        </form>
        </div>
        <div className="border-t border-gray-200 p-6">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
